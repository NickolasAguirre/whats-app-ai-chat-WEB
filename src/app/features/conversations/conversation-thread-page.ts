import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, timer } from 'rxjs';
import { APP_PATHS } from '../../app-paths';
import { ConversationMessage, MessagesQuery } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { Avatar } from '../../shared/avatar';
import { BackLink } from '../../shared/back-link';
import { StatusMessage } from '../../shared/status-message';

const POLL_INTERVAL_MS = 5000;
/** The first load takes the whole range of today (up to the server maximum); older pages are smaller. */
const FIRST_PAGE_SIZE = 100;
const OLDER_PAGE_SIZE = 30;
const MAX_CASE_SUMMARY = 500;

interface DateFilter {
  from: string;
  to: string;
}

interface Paging {
  /** Cursor of the oldest message loaded so far. */
  cursor: string | null;
  /** True while the next page still has to stay inside the first range (today, or the applied filter). */
  bounded: boolean;
  /** True when there is nothing older to load. */
  exhausted: boolean;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** `YYYY-MM-DD` from a date input, read as the start of that day in the browser's time zone. */
function parseDay(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The range the filter asks for; "Hasta" is inclusive, so it ends at the start of the next day. */
function filterRange(filter: DateFilter): Pick<MessagesQuery, 'from' | 'to'> {
  const from = parseDay(filter.from);
  const lastDay = parseDay(filter.to);
  const to = lastDay ? new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1) : undefined;
  return { from, to };
}

@Component({
  selector: 'app-conversation-thread-page',
  imports: [DatePipe, FormField, RouterLink, Avatar, BackLink, StatusMessage],
  template: `
    <app-back-link [to]="paths.conversations" label="Volver a conversaciones" />

    @if (person.value(); as current) {
      <header class="mb-6 flex items-center gap-4">
        <app-avatar [name]="current.name ?? current.phoneNumber" [large]="true" />
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-semibold">{{ current.name ?? current.phoneNumber }}</h1>
          @if (current.name) {
            <p class="tabular-nums text-muted">{{ current.phoneNumber }}</p>
          }
        </div>
      </header>
    }

    <section class="mb-5" aria-label="Registrar caso para el call center">
      @if (registeredCaseId(); as caseId) {
        <p role="status" class="text-sm text-primary">
          Caso registrado.
          <a class="font-medium underline" [routerLink]="[paths.cases, caseId]">Ver el caso</a>
        </p>
      } @else if (!registering()) {
        <button
          type="button"
          class="min-h-11 rounded-lg border border-line px-4 font-medium"
          (click)="registering.set(true)"
        >
          Registrar caso
        </button>
      } @else {
        <form class="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-panel" (submit)="registerCase($event)">
          <label for="case-summary" class="text-sm font-medium">¿Qué debe resolver el call center?</label>
          <input
            id="case-summary"
            type="text"
            autocomplete="off"
            class="min-h-11 rounded-lg border border-line bg-surface px-3"
            [formField]="caseForm.summary"
          />
          @if (caseError(); as problem) {
            <p role="alert" class="text-sm text-danger">{{ problem }}</p>
          }
          <div class="flex gap-2">
            <button
              type="submit"
              class="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-fg disabled:opacity-60"
              [disabled]="savingCase()"
            >
              {{ savingCase() ? 'Guardando…' : 'Guardar caso' }}
            </button>
            <button type="button" class="min-h-11 rounded-lg border border-line px-4 font-medium" (click)="cancelCase()">
              Cancelar
            </button>
          </div>
        </form>
      }
    </section>

    <form class="mb-5 flex flex-wrap items-end gap-3" (submit)="applyFilter($event)" aria-label="Filtrar mensajes por fecha">
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
      {{ isFiltered() ? 'Mostrando los mensajes del rango elegido.' : 'Mostrando los mensajes de hoy.' }}
    </p>

    @if (firstPage.isLoading()) {
      <app-status-message kind="loading" text="Cargando mensajes" [count]="3" />
    } @else if (firstPage.error()) {
      <app-status-message
        kind="error"
        text="No se pudieron cargar los mensajes"
        hint="Revisa tu conexión e inténtalo de nuevo."
        [retryable]="true"
        (retry)="firstPage.reload()"
      />
    } @else {
      @if (!paging().exhausted) {
        <div class="mb-3 flex flex-col items-center gap-2">
          <button
            type="button"
            class="min-h-11 rounded-lg border border-line px-4 font-medium disabled:opacity-60"
            [disabled]="loadingMore()"
            (click)="loadEarlier()"
          >
            {{ loadingMore() ? 'Cargando…' : 'Cargar mensajes anteriores' }}
          </button>
          @if (loadMoreFailed()) {
            <p role="alert" class="text-sm text-danger">No se pudieron cargar los mensajes anteriores. Inténtalo de nuevo.</p>
          }
        </div>
      }

      @if (messages().length === 0) {
        <app-status-message
          kind="empty"
          [text]="isFiltered() ? 'No hay mensajes en ese rango' : 'No hay mensajes de hoy'"
          [hint]="paging().exhausted ? '' : 'Puedes cargar los mensajes anteriores o elegir otras fechas.'"
        />
      } @else {
        <ol class="flex flex-col gap-4 rounded-xl bg-sunken p-4 sm:p-6" aria-label="Mensajes de la conversación">
          @for (message of messages(); track message.id) {
            <li class="flex flex-col gap-1" [class]="message.role === 'assistant' ? 'items-end' : 'items-start'">
              <div
                class="max-w-[88%] px-4 py-2.5 leading-relaxed sm:max-w-[70%]"
                [class]="
                  message.role === 'assistant'
                    ? 'rounded-2xl rounded-br-md bg-primary text-primary-fg'
                    : 'rounded-2xl rounded-bl-md bg-surface shadow-panel'
                "
              >
                <span class="sr-only">{{ message.role === 'assistant' ? 'Bot:' : 'Cliente:' }}</span>
                {{ message.text }}
              </div>
              <time class="px-1 text-xs tabular-nums text-muted" [attr.datetime]="message.timestamp.toISOString()">
                {{ message.timestamp | date: 'short' }}
              </time>
            </li>
          }
        </ol>
      }
    }
  `,
})
export class ConversationThreadPage {
  private readonly api = inject(ConversationsApi);
  private readonly casesApi = inject(CasesApi);

  protected readonly paths = APP_PATHS;

  readonly personId = input.required<string>();

  protected readonly person = rxResource({
    params: () => this.personId(),
    stream: ({ params }) => this.api.getPerson(params),
  });

  private readonly filterModel = signal<DateFilter>({ from: '', to: '' });
  protected readonly filterForm = form(this.filterModel);
  /** The filter that is actually applied; the form may hold something the user has not submitted yet. */
  private readonly appliedFilter = signal<DateFilter>({ from: '', to: '' });
  protected readonly filterError = signal('');
  protected readonly isFiltered = computed(() => !!(this.appliedFilter().from || this.appliedFilter().to));

  /** Today's messages, or the filtered range. Reloads when the person or the filter changes. */
  protected readonly firstPage = rxResource({
    params: () => ({ personId: this.personId(), filter: this.appliedFilter() }),
    stream: ({ params }) =>
      this.api.listMessages(params.personId, { ...this.rangeFor(params.filter), limit: FIRST_PAGE_SIZE }),
  });

  protected readonly messages = linkedSignal<ConversationMessage[]>(() => this.firstPage.value()?.items ?? []);

  protected readonly paging = linkedSignal<Paging>(() => {
    const page = this.firstPage.value();
    if (!page) return { cursor: null, bounded: true, exhausted: false };
    // Filtered: the range is all there is. Today: when today is complete, older days may still exist.
    return this.isFiltered()
      ? { cursor: page.cursor, bounded: true, exhausted: !page.hasMore }
      : { cursor: page.cursor, bounded: page.hasMore, exhausted: false };
  });

  // Everything about "Registrar caso" belongs to the open conversation: opening another person starts it clean.
  protected readonly registering = linkedSignal(() => {
    this.personId();
    return false;
  });
  private readonly caseModel = linkedSignal(() => {
    this.personId();
    return { summary: '' };
  });
  protected readonly caseForm = form(this.caseModel);
  protected readonly savingCase = linkedSignal(() => {
    this.personId();
    return false;
  });
  protected readonly caseError = linkedSignal(() => {
    this.personId();
    return '';
  });
  protected readonly registeredCaseId = linkedSignal<string | null>(() => {
    this.personId();
    return null;
  });

  protected readonly loadingMore = signal(false);
  protected readonly loadMoreFailed = signal(false);

  constructor() {
    // Poll only the newest messages, and only while looking at today (a filtered range does not change).
    toObservable(computed(() => ({ personId: this.personId(), live: !this.isFiltered() })))
      .pipe(
        switchMap(({ personId, live }) =>
          live
            ? timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS).pipe(
                switchMap(() => this.pollNewest(personId)),
                map((items) => ({ personId, items })),
              )
            : EMPTY,
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(({ personId, items }) => {
        // A poll that was in flight when the person or the filter changed must not leak into the new view.
        if (personId === this.personId() && !this.isFiltered()) this.appendNew(items);
      });
  }

  protected registerCase(event: Event): void {
    event.preventDefault();
    const summary = this.caseModel().summary.trim();
    if (!summary) {
      this.caseError.set('Describe qué debe resolver el call center.');
      return;
    }
    if (summary.length > MAX_CASE_SUMMARY) {
      this.caseError.set(`El resumen admite hasta ${MAX_CASE_SUMMARY} caracteres.`);
      return;
    }
    if (this.savingCase()) return;

    const personId = this.personId();
    this.savingCase.set(true);
    this.caseError.set('');
    this.casesApi.create(personId, summary).subscribe({
      next: (created) => {
        // The agent moved to another person while this was in flight: the case was saved, but this view is not its own.
        if (personId !== this.personId()) return;
        this.savingCase.set(false);
        this.registeredCaseId.set(created.id);
        this.registering.set(false);
        this.caseModel.set({ summary: '' });
      },
      error: (error: Error) => {
        if (personId !== this.personId()) return;
        this.savingCase.set(false);
        this.caseError.set(error.message);
      },
    });
  }

  protected cancelCase(): void {
    this.registering.set(false);
    this.caseError.set('');
    this.caseModel.set({ summary: '' });
  }

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
    this.loadMoreFailed.set(false);
    this.appliedFilter.set({ from, to });
  }

  protected clearFilter(): void {
    this.filterError.set('');
    this.loadMoreFailed.set(false);
    this.filterModel.set({ from: '', to: '' });
    this.appliedFilter.set({ from: '', to: '' });
  }

  protected loadEarlier(): void {
    const state = this.paging();
    const personId = this.personId();
    const base = this.firstPage.value();
    if (this.loadingMore() || state.exhausted) return;

    const range = this.rangeFor(this.appliedFilter());
    // The page is stale when the person, the filter or a reload replaced the list this request was built on.
    const isStale = () => personId !== this.personId() || base !== this.firstPage.value();
    this.loadingMore.set(true);
    this.loadMoreFailed.set(false);

    this.api
      .listMessages(personId, {
        from: state.bounded ? range.from : undefined,
        to: range.to,
        before: state.cursor ?? undefined,
        limit: OLDER_PAGE_SIZE,
      })
      .subscribe({
        next: (page) => {
          this.loadingMore.set(false);
          if (isStale()) return;
          this.messages.update((current) => [...page.items, ...current]);
          const cursor = page.cursor ?? state.cursor;
          if (this.isFiltered()) {
            this.paging.set({ cursor, bounded: true, exhausted: !page.hasMore });
          } else if (state.bounded) {
            // Finished today's range: the next click goes to older days.
            this.paging.set({ cursor, bounded: page.hasMore, exhausted: false });
          } else {
            this.paging.set({ cursor, bounded: false, exhausted: !page.hasMore });
          }
        },
        error: () => {
          this.loadingMore.set(false);
          if (!isStale()) this.loadMoreFailed.set(true);
        },
      });
  }

  private rangeFor(filter: DateFilter): Pick<MessagesQuery, 'from' | 'to'> {
    return filter.from || filter.to ? filterRange(filter) : { from: startOfToday() };
  }

  private pollNewest(personId: string) {
    if (this.firstPage.isLoading() || this.firstPage.error()) return EMPTY;
    const newest = this.messages().at(-1);
    return this.api.listMessages(personId, { from: newest?.timestamp ?? startOfToday(), limit: FIRST_PAGE_SIZE }).pipe(
      // A failed poll is silent: the next tick tries again.
      catchError(() => EMPTY),
      switchMap((page) => [page.items]),
    );
  }

  private appendNew(incoming: ConversationMessage[]): void {
    this.messages.update((current) => {
      const known = new Set(current.map((message) => message.id));
      const fresh = incoming.filter((message) => !known.has(message.id));
      return fresh.length ? [...current, ...fresh] : current;
    });
  }
}
