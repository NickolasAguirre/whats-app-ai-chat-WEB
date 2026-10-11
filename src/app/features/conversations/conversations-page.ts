import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-conversations-page',
  imports: [DatePipe, FormField, RouterLink, Avatar, Icon, PageHeader, StatusMessage],
  template: `
    <app-page-header title="Conversaciones" subtitle="Las personas que han escrito a tu bot, de la más reciente a la más antigua." />

    <div class="mb-5 flex flex-col gap-2">
      <label for="search" class="text-sm font-medium">Buscar por nombre o teléfono</label>
      <div class="relative">
        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          <app-icon name="search" />
        </span>
        <input
          id="search"
          type="search"
          autocomplete="off"
          class="min-h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-3"
          [formField]="searchForm.term"
        />
      </div>
    </div>

    @if (people.isLoading()) {
      <app-status-message kind="loading" text="Cargando conversaciones" />
    } @else if (people.error()) {
      <app-status-message
        kind="error"
        text="No se pudieron cargar las conversaciones"
        hint="Revisa tu conexión e inténtalo de nuevo."
        [retryable]="true"
        (retry)="people.reload()"
      />
    } @else if (people.value()?.length === 0) {
      <app-status-message
        kind="empty"
        text="No hay conversaciones para mostrar"
        hint="Prueba con otro nombre o número de teléfono."
      />
    } @else {
      <ul class="divide-y divide-line overflow-hidden rounded-xl bg-surface shadow-panel">
        @for (person of people.value(); track person.id) {
          <li>
            <a
              [routerLink]="[person.id]"
              class="flex min-h-16 items-center gap-4 p-4 transition hover:bg-primary-soft/60 active:bg-primary-soft sm:px-6"
            >
              <app-avatar [name]="person.name ?? person.phoneNumber" />
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="flex items-baseline justify-between gap-3">
                  <span class="truncate font-semibold">{{ person.name ?? person.phoneNumber }}</span>
                  <time class="shrink-0 text-xs tabular-nums text-muted" [attr.datetime]="person.lastMessageAt.toISOString()">
                    {{ person.lastMessageAt | date: 'shortTime' }}
                  </time>
                </span>
                <span class="truncate text-sm text-muted">{{ person.lastMessagePreview }}</span>
              </span>
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class ConversationsPage {
  private readonly api = inject(ConversationsApi);

  private readonly model = signal({ term: '' });
  protected readonly searchForm = form(this.model);

  private readonly term = toSignal(
    toObservable(computed(() => this.model().term)).pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly people = rxResource({
    params: () => this.term(),
    stream: ({ params }) => this.api.listPeople(params),
  });
}
