import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { Avatar } from '../../shared/avatar';
import { DateFilter, EMPTY_DATE_FILTER, isFilterActive, rangeOf } from '../../shared/date-range';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-conversations-page',
  imports: [DatePipe, FormField, RouterLink, Avatar, Icon, PageHeader, StatusMessage],
  template: `
    <app-page-header
      title="Conversaciones"
      subtitle="Las personas que han escrito a tu bot, de la más reciente a la más antigua."
    />

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

    <form class="mb-5 flex flex-wrap items-end gap-3" (submit)="applyFilter($event)" aria-label="Filtrar conversaciones por fecha">
      <div class="flex flex-col gap-1">
        <label for="from" class="text-sm font-medium">Desde</label>
        <input id="from" type="date" class="min-h-11 rounded-lg border border-line bg-surface px-3" [formField]="filterForm.from" />
      </div>
      <div class="flex flex-col gap-1">
        <label for="to" class="text-sm font-medium">Hasta</label>
        <input id="to" type="date" class="min-h-11 rounded-lg border border-line bg-surface px-3" [formField]="filterForm.to" />
      </div>
      <button type="submit" class="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-fg">Filtrar</button>
      @if (isFiltered()) {
        <button type="button" class="min-h-11 rounded-lg border border-line px-4 font-medium" (click)="clearFilter()">
          Ver solo hoy
        </button>
      }
    </form>

    @if (filterError(); as problem) {
      <p role="alert" class="mb-4 text-sm text-danger">{{ problem }}</p>
    }

    <p class="mb-3 text-sm text-muted">
      {{ isFiltered() ? 'Mostrando las conversaciones con mensajes en el rango elegido.' : 'Mostrando las conversaciones con mensajes de hoy.' }}
    </p>

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
        [text]="isFiltered() ? 'No hay conversaciones en ese rango' : 'Hoy todavía no hay conversaciones'"
        [hint]="
          term()
            ? 'Prueba con otro nombre o número de teléfono.'
            : isFiltered()
              ? 'Prueba con otras fechas.'
              : 'Elige otras fechas con Desde y Hasta para ver conversaciones anteriores.'
        "
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
                    {{ person.lastMessageAt | date: (isFiltered() ? 'short' : 'shortTime') }}
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

  protected readonly term = toSignal(
    toObservable(computed(() => this.model().term)).pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly filterModel = signal<DateFilter>({ ...EMPTY_DATE_FILTER });
  protected readonly filterForm = form(this.filterModel);
  /** The filter that is actually applied; the form may hold something the user has not submitted yet. */
  private readonly appliedFilter = signal<DateFilter>({ ...EMPTY_DATE_FILTER });
  protected readonly filterError = signal('');
  protected readonly isFiltered = computed(() => isFilterActive(this.appliedFilter()));

  /** Conversations with messages today, or inside the chosen range. */
  protected readonly people = rxResource({
    params: () => ({ term: this.term(), filter: this.appliedFilter() }),
    stream: ({ params }) => this.api.listPeople(params.term, rangeOf(params.filter)),
  });

  protected applyFilter(event: Event): void {
    event.preventDefault();
    const { from, to } = this.filterModel();
    if (from && to && from > to) {
      this.filterError.set('La fecha "Desde" debe ser anterior o igual a "Hasta".');
      return;
    }
    this.filterError.set('');
    const applied = this.appliedFilter();
    if (applied.from === from && applied.to === to) return;
    this.appliedFilter.set({ from, to });
  }

  protected clearFilter(): void {
    this.filterError.set('');
    this.filterModel.set({ ...EMPTY_DATE_FILTER });
    this.appliedFilter.set({ ...EMPTY_DATE_FILTER });
  }
}
