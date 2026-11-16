import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, timer } from 'rxjs';
import { APP_PATHS } from '../../app-paths';
import { ConversationMessage } from '../../core/domain/models/models';
import { CasesApi } from '../../core/domain/ports/cases-api.port';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { Avatar } from '../../shared/avatar';
import { BackLink } from '../../shared/back-link';
import { startOfToday } from '../../shared/date-range';
import { StatusMessage } from '../../shared/status-message';

const POLL_INTERVAL_MS = 5000;
/** The first load takes the whole of today (up to the server maximum); older pages are smaller. */
const FIRST_PAGE_SIZE = 100;
const OLDER_PAGE_SIZE = 30;
const MAX_CASE_SUMMARY = 500;

interface Paging {
  /** Cursor of the oldest message loaded so far. */
  cursor: string | null;
  /** True while the next page still has to stay inside today (today has more than the first page held). */
  bounded: boolean;
  /** True when there is nothing older to load. */
  exhausted: boolean;
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

    <p class="mb-3 text-sm text-muted">Mostrando los mensajes de hoy.</p>

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
          text="No hay mensajes de hoy"
          [hint]="paging().exhausted ? '' : 'Carga los mensajes anteriores para ver el resto de la conversación.'"
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

  /** Today's messages. Reloads when another person is opened. */
  protected readonly firstPage = rxResource({
    params: () => this.personId(),
    stream: ({ params }) => this.api.listMessages(params, { from: startOfToday(), limit: FIRST_PAGE_SIZE }),
  });

  protected readonly messages = linkedSignal<ConversationMessage[]>(() => this.firstPage.value()?.items ?? []);

  protected readonly paging = linkedSignal<Paging>(() => {
    const page = this.firstPage.value();
    if (!page) return { cursor: null, bounded: true, exhausted: false };
    // When today is complete, older days may still exist: the next click goes to them.
    return { cursor: page.cursor, bounded: page.hasMore, exhausted: false };
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
    // Poll only the newest messages, so a conversation that is happening keeps updating.
    toObservable(this.personId)
      .pipe(
        switchMap((personId) =>
          timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS).pipe(
            switchMap(() => this.pollNewest(personId)),
            map((items) => ({ personId, items })),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(({ personId, items }) => {
        // A poll that was in flight when another person was opened must not leak into the new view.
        if (personId === this.personId()) this.appendNew(items);
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

  protected loadEarlier(): void {
    const state = this.paging();
    const personId = this.personId();
    const base = this.firstPage.value();
    if (this.loadingMore() || state.exhausted) return;

    // The page is stale when another person or a reload replaced the list this request was built on.
    const isStale = () => personId !== this.personId() || base !== this.firstPage.value();
    this.loadingMore.set(true);
    this.loadMoreFailed.set(false);

    this.api
      .listMessages(personId, {
        // While today still has more, stay inside it; afterwards go to older days.
        from: state.bounded ? startOfToday() : undefined,
        before: state.cursor ?? undefined,
        limit: OLDER_PAGE_SIZE,
      })
      .subscribe({
        next: (page) => {
          this.loadingMore.set(false);
          if (isStale()) return;
          this.messages.update((current) => [...page.items, ...current]);
          const cursor = page.cursor ?? state.cursor;
          if (state.bounded) {
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
