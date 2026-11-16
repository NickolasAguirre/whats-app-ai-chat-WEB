import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CaseStatus } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';
import { CASE_SOURCE_LABEL, CASE_STATUS_BADGE, CASE_STATUS_LABEL, CASE_STATUSES } from './case-status';

type StatusFilter = CaseStatus | 'all';

@Component({
  selector: 'app-cases-page',
  imports: [DatePipe, RouterLink, PageHeader, StatusMessage],
  template: `
    <app-page-header
      title="Casos"
      subtitle="Consultas que el asistente no pudo resolver y que el call center atiende a mano."
    />

    <div class="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
      @for (option of filters; track option.value) {
        <button
          type="button"
          class="min-h-11 rounded-lg border px-4 text-sm font-medium"
          [class]="filter() === option.value ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface'"
          [attr.aria-pressed]="filter() === option.value"
          (click)="filter.set(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>

    @if (cases.isLoading()) {
      <app-status-message kind="loading" text="Cargando casos" [count]="3" />
    } @else if (cases.error()) {
      <app-status-message
        kind="error"
        text="No se pudieron cargar los casos"
        hint="Revisa tu conexión e inténtalo de nuevo."
        [retryable]="true"
        (retry)="cases.reload()"
      />
    } @else if (cases.value()?.length === 0) {
      <app-status-message
        kind="empty"
        text="No hay casos para mostrar"
        hint="Cuando el asistente no pueda resolver una consulta, o registres un caso desde una conversación, aparecerá aquí."
      />
    } @else {
      <ul class="divide-y divide-line overflow-hidden rounded-xl bg-surface shadow-panel">
        @for (item of cases.value(); track item.id) {
          <li>
            <a
              [routerLink]="[item.id]"
              class="flex min-h-16 flex-col gap-1 p-4 transition hover:bg-primary-soft/60 active:bg-primary-soft sm:px-6"
            >
              <span class="flex items-start justify-between gap-3">
                <span class="font-semibold">{{ item.summary }}</span>
                <span class="shrink-0 rounded-md px-2.5 py-1 text-sm font-medium" [class]="badge[item.status]">
                  {{ statusLabel[item.status] }}
                </span>
              </span>
              <span class="text-sm text-muted">
                {{ item.personName ?? item.personPhone }} · {{ sourceLabel[item.source] }} ·
                <time [attr.datetime]="item.createdAt.toISOString()">{{ item.createdAt | date: 'short' }}</time>
                @if (item.assignee) {
                  · Atiende {{ item.assignee }}
                }
                @if (item.resolvedAt; as resolvedAt) {
                  · Resuelto el
                  <time [attr.datetime]="resolvedAt.toISOString()">{{ resolvedAt | date: 'short' }}</time>
                }
              </span>
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class CasesPage {
  private readonly api = inject(CasesApi);

  protected readonly statusLabel = CASE_STATUS_LABEL;
  protected readonly badge = CASE_STATUS_BADGE;
  protected readonly sourceLabel = CASE_SOURCE_LABEL;
  protected readonly filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    ...CASE_STATUSES.map((value) => ({ value, label: CASE_STATUS_LABEL[value] })),
  ];

  protected readonly filter = signal<StatusFilter>('all');

  protected readonly cases = rxResource({
    params: () => this.filter(),
    stream: ({ params }) => this.api.list(params === 'all' ? undefined : params),
  });
}
