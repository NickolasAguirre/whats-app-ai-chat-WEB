import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { switchMap, timer } from 'rxjs';
import { ConversationsApi } from '../../core/domain/ports/conversations-api.port';
import { Avatar } from '../../shared/avatar';
import { BackLink } from '../../shared/back-link';
import { StatusMessage } from '../../shared/status-message';

const POLL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-conversation-thread-page',
  imports: [DatePipe, Avatar, BackLink, StatusMessage],
  template: `
    <app-back-link to="/conversations" label="Volver a conversaciones" />

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

    @if (messages.isLoading()) {
      <app-status-message kind="loading" text="Cargando mensajes" [count]="3" />
    } @else if (messages.error()) {
      <app-status-message
        kind="error"
        text="No se pudieron cargar los mensajes"
        hint="Revisa tu conexión e inténtalo de nuevo."
        [retryable]="true"
        (retry)="messages.reload()"
      />
    } @else if (messages.value()?.length === 0) {
      <app-status-message kind="empty" text="Esta conversación todavía no tiene mensajes" />
    } @else {
      <ol class="flex flex-col gap-4 rounded-xl bg-sunken p-4 sm:p-6" aria-label="Mensajes de la conversación">
        @for (message of messages.value(); track message.id) {
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
  `,
})
export class ConversationThreadPage {
  private readonly api = inject(ConversationsApi);

  readonly personId = input.required<string>();

  protected readonly person = rxResource({
    params: () => this.personId(),
    stream: ({ params }) => this.api.getPerson(params),
  });

  protected readonly messages = rxResource({
    params: () => this.personId(),
    stream: ({ params }) => timer(0, POLL_INTERVAL_MS).pipe(switchMap(() => this.api.listMessages(params))),
  });
}
