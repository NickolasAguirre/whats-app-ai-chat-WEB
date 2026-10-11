import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { NoteInput } from '../../../core/domain/models/models';

const TITLE_MAX = 120;
const CONTENT_MAX = 4000;

let nextFormId = 0;

@Component({
  selector: 'app-note-form',
  imports: [FormField],
  template: `
    <form class="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-panel sm:p-5" (submit)="onSubmit($event)" novalidate>
      <div class="flex flex-col gap-2">
        <label [for]="uid + '-title'" class="font-medium">Título</label>
        <input
          [id]="uid + '-title'"
          type="text"
          autocomplete="off"
          class="min-h-11 w-full rounded-lg border border-line bg-canvas px-3"
          [formField]="noteForm.title"
          [attr.aria-invalid]="titleError() ? 'true' : null"
          [attr.aria-describedby]="uid + '-title-error'"
        />
        <p [id]="uid + '-title-error'" class="min-h-5 text-sm font-medium text-danger" role="alert">
          @if (titleError()) { Escribe un título de hasta {{ titleMax }} caracteres. }
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label [for]="uid + '-content'" class="font-medium">Contenido</label>
        <textarea
          [id]="uid + '-content'"
          rows="6"
          class="w-full resize-y rounded-lg border border-line bg-canvas p-3 leading-relaxed"
          [formField]="noteForm.content"
          [attr.aria-invalid]="contentError() ? 'true' : null"
          [attr.aria-describedby]="uid + '-content-error'"
        ></textarea>
        <p [id]="uid + '-content-error'" class="min-h-5 text-sm font-medium text-danger" role="alert">
          @if (contentError()) { Escribe el contenido de la nota (hasta {{ contentMax }} caracteres). }
        </p>
      </div>

      @if (error()) {
        <p class="text-sm font-medium text-danger" role="alert">{{ error() }}</p>
      }

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="min-h-11 rounded-lg px-4 font-medium text-muted transition hover:bg-primary-soft hover:text-fg active:scale-[0.98]"
          (click)="cancelled.emit()"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="min-h-11 rounded-lg bg-primary px-5 font-medium text-primary-fg transition hover:bg-primary-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          [disabled]="saving()"
        >
          {{ saving() ? 'Guardando' : 'Guardar nota' }}
        </button>
      </div>
    </form>
  `,
})
export class NoteForm {
  protected readonly uid = `note-form-${nextFormId++}`;
  protected readonly titleMax = TITLE_MAX;
  protected readonly contentMax = CONTENT_MAX;

  readonly initial = input<NoteInput>({ title: '', content: '' });
  readonly saving = input(false);
  readonly error = input('');

  readonly submitted = output<NoteInput>();
  readonly cancelled = output<void>();

  private readonly model = linkedSignal(() => ({ ...this.initial() }));

  protected readonly noteForm = form(this.model, (path) => {
    required(path.title);
    maxLength(path.title, TITLE_MAX);
    required(path.content);
    maxLength(path.content, CONTENT_MAX);
  });

  protected readonly titleError = computed(() => this.noteForm.title().touched() && this.noteForm.title().invalid());
  protected readonly contentError = computed(
    () => this.noteForm.content().touched() && this.noteForm.content().invalid(),
  );

  protected onSubmit(event: Event): void {
    event.preventDefault();
    void submit(this.noteForm, async () => {
      this.submitted.emit(this.model());
      return undefined;
    });
  }
}
