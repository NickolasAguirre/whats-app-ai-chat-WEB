import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { APP_PATHS } from '../../app-paths';
import { CaseStatus } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { BackLink } from '../../shared/back-link';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';
import { CASE_SOURCE_LABEL, CASE_STATUS_BADGE, CASE_STATUS_LABEL, CASE_STATUSES } from './case-status';

const MAX_NOTE = 2000;
const MAX_ASSIGNEE = 100;

@Component({
  selector: 'app-case-detail-page',
  imports: [DatePipe, FormField, RouterLink, BackLink, PageHeader, StatusMessage],
  template: `
    <app-back-link [to]="paths.cases" label="Volver a casos" />

    @if (item.isLoading()) {
      <app-status-message kind="loading" text="Cargando el caso" [count]="2" />
    } @else if (item.error()) {
      <app-status-message
        kind="error"
        text="No se pudo cargar el caso"
        hint="Revisa tu conexión e inténtalo de nuevo."
        [retryable]="true"
        (retry)="item.reload()"
      />
    } @else if (item.value(); as current) {
      <app-page-header [title]="current.summary" [subtitle]="current.personName ?? current.personPhone" />

      <dl class="mb-6 grid gap-4 rounded-xl bg-surface p-4 shadow-panel sm:grid-cols-2 sm:p-6">
        <div>
          <dt class="text-sm text-muted">Estado</dt>
          <dd class="mt-1">
            <span class="inline-block rounded-md px-2.5 py-1 text-sm font-medium" [class]="badge[current.status]">
              {{ statusLabel[current.status] }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Origen</dt>
          <dd class="mt-1 font-medium">{{ sourceLabel[current.source] }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Abierto</dt>
          <dd class="mt-1 tabular-nums">{{ current.createdAt | date: 'medium' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Resuelto</dt>
          <dd class="mt-1 tabular-nums">{{ current.resolvedAt ? (current.resolvedAt | date: 'medium') : 'Todavía no' }}</dd>
        </div>
        <div class="sm:col-span-2">
          <a
            [routerLink]="[paths.conversations, current.personId]"
            class="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary-soft"
          >
            Ver la conversación
          </a>
        </div>
      </dl>

      <form class="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-panel sm:p-6" (submit)="save($event)">
        <div class="flex flex-col gap-1">
          <label for="status" class="text-sm font-medium">Estado</label>
          <select id="status" class="min-h-11 rounded-lg border border-line bg-surface px-3" [formField]="editForm.status">
            @for (status of statuses; track status) {
              <option [value]="status">{{ statusLabel[status] }}</option>
            }
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label for="assignee" class="text-sm font-medium">Atendido por</label>
          <input
            id="assignee"
            type="text"
            autocomplete="off"
            class="min-h-11 rounded-lg border border-line bg-surface px-3"
            [formField]="editForm.assignee"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="note" class="text-sm font-medium">Nota de resolución</label>
          <textarea
            id="note"
            rows="5"
            class="rounded-lg border border-line bg-surface px-3 py-2"
            [formField]="editForm.note"
          ></textarea>
        </div>

        @if (saveError(); as problem) {
          <p role="alert" class="text-sm text-danger">{{ problem }}</p>
        }
        @if (saved()) {
          <p role="status" class="text-sm text-primary">Cambios guardados.</p>
        }

        <div>
          <button
            type="submit"
            class="min-h-11 rounded-lg bg-primary px-5 font-medium text-primary-fg disabled:opacity-60"
            [disabled]="saving()"
          >
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class CaseDetailPage {
  private readonly api = inject(CasesApi);

  protected readonly paths = APP_PATHS;
  protected readonly statusLabel = CASE_STATUS_LABEL;
  protected readonly badge = CASE_STATUS_BADGE;
  protected readonly sourceLabel = CASE_SOURCE_LABEL;
  protected readonly statuses = CASE_STATUSES;

  readonly id = input.required<string>();

  protected readonly item = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.get(params),
  });

  private readonly editModel = signal<{ status: CaseStatus; assignee: string; note: string }>({
    status: 'open',
    assignee: '',
    note: '',
  });
  protected readonly editForm = form(this.editModel);

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly saveError = signal('');

  /** Which version of which case the form was last filled from, so a plain reload does not erase what is being typed. */
  private seededFrom = '';

  constructor() {
    // The form starts from the loaded case, and again when another case opens or the case is saved.
    effect(() => {
      // `value()` throws while the resource is in error, so only read it when there is one.
      const current = this.item.hasValue() ? this.item.value() : undefined;
      if (!current) return;
      const version = `${current.id}|${current.updatedAt.getTime()}`;
      if (version === this.seededFrom) return;
      this.seededFrom = version;
      this.editModel.set({ status: current.status, assignee: current.assignee ?? '', note: current.note ?? '' });
    });

    // Opening another case clears the previous save message.
    effect(() => {
      this.id();
      this.saved.set(false);
      this.saveError.set('');
    });
  }

  protected save(event: Event): void {
    event.preventDefault();
    if (this.saving()) return;

    const { status, assignee, note } = this.editModel();
    if (note.length > MAX_NOTE || assignee.length > MAX_ASSIGNEE) {
      this.saved.set(false);
      this.saveError.set(`La nota admite hasta ${MAX_NOTE} caracteres y "Atendido por" hasta ${MAX_ASSIGNEE}.`);
      return;
    }

    const id = this.id();
    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set('');

    this.api.update(id, { status, assignee, note }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        // Another case was opened while saving: do not paint this answer over it.
        if (id !== this.id()) return;
        this.item.set(updated);
        this.saved.set(true);
      },
      error: (error: Error) => {
        this.saving.set(false);
        if (id === this.id()) this.saveError.set(error.message);
      },
    });
  }
}
