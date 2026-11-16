import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, switchMap, timer } from 'rxjs';
import { APP_PATHS } from '../../app-paths';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { Avatar } from '../../shared/avatar';
import { formatMessageTime } from '../../shared/format-time';

const LIMIT = 6;
const POLL_INTERVAL_MS = 10_000;

@Component({
  selector: 'app-recent-conversations',
  imports: [RouterLink, Avatar],
  host: { class: 'flex' },
  template: `
    <section class="flex w-full flex-col rounded-xl bg-surface shadow-panel" aria-labelledby="recent-title">
      <div class="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <div>
          <h2 id="recent-title" class="font-semibold">Conversaciones recientes</h2>
          <p class="text-sm text-muted">Se actualiza sola.</p>
        </div>
        <a
          [routerLink]="paths.conversations"
          class="-mr-2 inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-primary transition hover:bg-primary-soft active:scale-[0.98]"
        >
          Ver todas
        </a>
      </div>

      @if (people.status() === 'loading') {
        <div class="flex flex-col gap-4 p-4 sm:p-6" role="status">
          <span class="sr-only">Cargando conversaciones</span>
          @for (row of placeholders; track row) {
            <div class="flex items-center gap-3" aria-hidden="true">
              <span class="skeleton size-10 shrink-0 rounded-xl"></span>
              <span class="flex flex-1 flex-col gap-2">
                <span class="skeleton h-3.5 w-2/5 rounded-md"></span>
                <span class="skeleton h-3 w-4/5 rounded-md"></span>
              </span>
            </div>
          }
        </div>
      } @else if (people.status() === 'error') {
        <div class="flex flex-col items-start gap-3 p-4 sm:p-6" role="alert">
          <p class="text-sm font-medium text-danger">No se pudieron cargar las conversaciones.</p>
          <button
            type="button"
            class="min-h-11 rounded-lg bg-primary px-4 font-medium text-primary-fg transition hover:bg-primary-hover active:scale-[0.98]"
            (click)="people.reload()"
          >
            Reintentar
          </button>
        </div>
      } @else if (people.value()?.length === 0) {
        <p class="p-4 text-sm text-muted sm:p-6">Todavía no hay conversaciones. Cuando un cliente escriba, aparecerá aquí.</p>
      } @else {
        <ul class="mt-2 max-h-[26rem] divide-y divide-line overflow-y-auto">
          @for (person of people.value(); track person.id) {
            <li>
              <a
                [routerLink]="[paths.conversations, person.id]"
                class="flex min-h-16 items-center gap-3 px-4 py-3 transition hover:bg-primary-soft/60 active:bg-primary-soft sm:px-6"
              >
                <app-avatar [name]="person.name ?? person.phoneNumber" />
                <span class="flex min-w-0 flex-1 flex-col">
                  <span class="flex items-baseline justify-between gap-3">
                    <span class="truncate font-medium">{{ person.name ?? person.phoneNumber }}</span>
                    <time class="shrink-0 text-xs tabular-nums text-muted" [attr.datetime]="person.lastMessageAt.toISOString()">
                      {{ timeOf(person.lastMessageAt) }}
                    </time>
                  </span>
                  <span class="truncate text-sm text-muted">{{ person.lastMessagePreview }}</span>
                </span>
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class RecentConversations {
  protected readonly paths = APP_PATHS;
  private readonly api = inject(ConversationsApi);

  protected readonly placeholders = [0, 1, 2, 3];
  protected readonly timeOf = (date: Date) => formatMessageTime(date);

  /** Refreshes in the background: the list stays on screen between polls, only the first load shows placeholders. */
  protected readonly people = rxResource({
    stream: () =>
      timer(0, POLL_INTERVAL_MS).pipe(
        switchMap(() => this.api.listPeople('')),
        map((people) => people.slice(0, LIMIT)),
      ),
  });
}
