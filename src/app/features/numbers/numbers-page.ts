import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { WhatsAppNumbersApi } from '../../core/domain/ports/whatsapp-numbers-api.port';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';

@Component({
  selector: 'app-numbers-page',
  imports: [RouterLink, Icon, PageHeader, StatusMessage],
  template: `
    <app-page-header title="Números de WhatsApp" subtitle="Las líneas conectadas al bot de tu negocio." />

    @if (numbers.isLoading()) {
      <app-status-message kind="loading" text="Cargando números" [count]="3" />
    } @else if (numbers.error()) {
      <app-status-message
        kind="error"
        text="No se pudieron cargar los números"
        hint="Revisa tu conexión e inténtalo de nuevo."
        [retryable]="true"
        (retry)="numbers.reload()"
      />
    } @else if (numbers.value()?.length === 0) {
      <app-status-message
        kind="empty"
        text="Todavía no hay números conectados"
        hint="Cuando conectes una línea de WhatsApp aparecerá aquí."
      />
    } @else {
      <ul class="divide-y divide-line overflow-hidden rounded-xl bg-surface shadow-panel">
        @for (number of numbers.value(); track number.id) {
          <li>
            <a
              [routerLink]="[number.id]"
              class="flex min-h-16 items-center gap-4 p-4 transition hover:bg-primary-soft/60 active:bg-primary-soft sm:px-6"
            >
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <app-icon name="phone" />
              </span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate font-semibold">{{ number.label }}</span>
                <span class="tabular-nums text-sm text-muted">{{ number.phoneNumber }}</span>
              </span>
              <span
                class="shrink-0 rounded-md px-2.5 py-1 text-sm font-medium"
                [class]="number.active ? 'bg-primary-soft text-primary' : 'bg-sunken text-muted'"
              >
                {{ number.active ? 'Activo' : 'Inactivo' }}
              </span>
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class NumbersPage {
  private readonly api = inject(WhatsAppNumbersApi);
  protected readonly numbers = rxResource({ stream: () => this.api.list() });
}
