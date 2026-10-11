import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { InstructionsApi } from '../../core/domain/ports/instructions-api.port';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';

const MAX_LENGTH = 4000;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-instructions-page',
  imports: [DatePipe, FormField, Icon, PageHeader, StatusMessage],
  template: `
    <app-page-header
      title="Instrucciones del bot"
      subtitle="Escribe cómo debe atender el asistente a tus clientes. Los cambios se aplican a las próximas conversaciones."
    />

    @if (instructions.isLoading()) {
      <app-status-message kind="loading" text="Cargando instrucciones" [count]="3" />
    } @else if (instructions.error()) {
      <app-status-message
        kind="error"
        text="No se pudieron cargar las instrucciones"
        hint="Revisa tu conexión e inténtalo de nuevo."
        [retryable]="true"
        (retry)="instructions.reload()"
      />
    } @else {
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <form class="flex flex-col gap-5 rounded-xl bg-surface p-4 shadow-panel sm:p-6" (submit)="onSubmit($event)" novalidate>
          <div class="flex flex-col gap-2">
            <label for="content" class="font-medium">Instrucciones</label>
            <textarea
              id="content"
              rows="14"
              class="w-full resize-y rounded-lg border border-line bg-canvas p-3 leading-relaxed"
              [formField]="instructionsForm.content"
              [attr.aria-invalid]="showError() ? 'true' : null"
              aria-describedby="content-help content-error"
            ></textarea>
            <div class="flex justify-between gap-3 text-sm text-muted">
              <p id="content-help">Se envía al modelo en cada conversación.</p>
              <p class="tabular-nums">{{ length() }} / {{ maxLength }}</p>
            </div>
            <p id="content-error" class="min-h-5 text-sm font-medium text-danger" role="alert">
              @if (showError()) {
                @if (length() === 0) { Escribe las instrucciones antes de guardar. } @else { Supera el máximo de {{ maxLength }} caracteres. }
              }
            </p>
          </div>

          <div class="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-muted" role="status">
              @switch (saveState()) {
                @case ('saved') {
                  <span class="inline-flex items-center gap-1.5 font-medium text-primary">
                    <app-icon name="check" size="size-4" /> Cambios guardados
                  </span>
                }
                @case ('error') { <span class="font-medium text-danger">No se pudo guardar. Inténtalo de nuevo.</span> }
                @default {
                  @if (instructions.value(); as current) { Última actualización: {{ current.updatedAt | date: 'medium' }} }
                }
              }
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                class="min-h-11 flex-1 rounded-lg px-4 font-medium text-muted transition hover:bg-primary-soft hover:text-fg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
                [disabled]="!dirty() || saveState() === 'saving'"
                (click)="discard()"
              >
                Descartar
              </button>
              <button
                type="submit"
                class="min-h-11 flex-1 rounded-lg bg-primary px-5 font-medium text-primary-fg transition hover:bg-primary-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
                [disabled]="!dirty() || saveState() === 'saving'"
              >
                {{ saveState() === 'saving' ? 'Guardando' : 'Guardar cambios' }}
              </button>
            </div>
          </div>
        </form>

        <aside class="rounded-xl bg-sunken p-5" aria-labelledby="tips-title">
          <h2 id="tips-title" class="font-semibold">Para escribir mejores instrucciones</h2>
          <ul class="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted marker:text-primary">
            <li>Indica quién es el asistente y a qué negocio representa.</li>
            <li>Define el tono: formal, cercano o breve.</li>
            <li>Di qué debe hacer cuando no sepa una respuesta.</li>
            <li>Incluye horarios, precios y políticas que los clientes preguntan seguido.</li>
          </ul>
        </aside>
      </div>
    }
  `,
})
export class InstructionsPage {
  private readonly api = inject(InstructionsApi);

  protected readonly maxLength = MAX_LENGTH;
  protected readonly instructions = rxResource({ stream: () => this.api.get() });

  private readonly model = linkedSignal(() => ({ content: this.instructions.value()?.content ?? '' }));

  protected readonly instructionsForm = form(this.model, (path) => {
    required(path.content);
    maxLength(path.content, MAX_LENGTH);
  });

  protected readonly saveState = signal<SaveState>('idle');
  protected readonly length = computed(() => this.model().content.length);
  protected readonly dirty = computed(() => this.model().content !== (this.instructions.value()?.content ?? ''));
  protected readonly showError = computed(
    () => this.instructionsForm.content().touched() && this.instructionsForm.content().invalid(),
  );

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.saveState.set('saving');
    void submit(this.instructionsForm, async () => {
      try {
        await firstValueFrom(this.api.save(this.model().content));
        this.instructions.reload();
        this.saveState.set('saved');
      } catch {
        this.saveState.set('error');
      }
      return undefined;
    }).then((submitted) => {
      if (!submitted) this.saveState.set('idle');
    });
  }

  protected discard(): void {
    this.model.set({ content: this.instructions.value()?.content ?? '' });
    this.saveState.set('idle');
  }
}
