import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { APP_PATHS } from '../../app-paths';
import { WhatsAppNumbersApi } from '../../core/domain/ports/whatsapp-numbers-api.port';
import { BackLink } from '../../shared/back-link';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';

@Component({
  selector: 'app-number-detail-page',
  imports: [BackLink, PageHeader, StatusMessage],
  template: `
    <app-back-link [to]="paths.numbers" label="Volver a números" />

    @if (number.isLoading()) {
      <app-status-message kind="loading" text="Cargando número" [count]="2" />
    } @else if (number.error()) {
      <app-status-message
        kind="error"
        text="No se pudo cargar el número"
        hint="Es posible que ya no exista. Vuelve a la lista e inténtalo de nuevo."
        [retryable]="true"
        (retry)="number.reload()"
      />
    } @else if (number.value(); as current) {
      <app-page-header [title]="current.label" [subtitle]="current.phoneNumber" />
      <dl class="grid gap-x-8 gap-y-6 rounded-xl bg-surface p-4 shadow-panel sm:grid-cols-2 sm:p-6">
        <div>
          <dt class="text-sm text-muted">Número</dt>
          <dd class="mt-1 font-medium tabular-nums">{{ current.phoneNumber }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Estado</dt>
          <dd class="mt-1">
            <span
              class="inline-block rounded-md px-2.5 py-1 text-sm font-medium"
              [class]="current.active ? 'bg-primary-soft text-primary' : 'bg-sunken text-muted'"
            >
              {{ current.active ? 'Activo' : 'Inactivo' }}
            </span>
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm text-muted">Cuenta de WhatsApp Business (WABA)</dt>
          <dd class="mt-1 font-mono text-sm">{{ current.wabaId }}</dd>
        </div>
      </dl>
    }
  `,
})
export class NumberDetailPage {
  protected readonly paths = APP_PATHS;
  private readonly api = inject(WhatsAppNumbersApi);

  readonly id = input.required<string>();

  protected readonly number = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.getById(params),
  });
}
