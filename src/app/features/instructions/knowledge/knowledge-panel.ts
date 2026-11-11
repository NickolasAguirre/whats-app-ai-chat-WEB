import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, ignoreElements, mergeMap, tap } from 'rxjs';
import { Rejection, validateFiles } from '../../../core/domain/knowledge/file-rules';
import { KnowledgeItem, KnowledgeKind, NoteInput } from '../../../core/domain/models/models';
import { KnowledgeApi } from '../../../core/domain/ports/knowledge-api.port';
import { formatBytes } from '../../../shared/format-bytes';
import { Icon, IconName } from '../../../shared/icon';
import { StatusMessage } from '../../../shared/status-message';
import { NoteForm } from './note-form';
import { UploadZone } from './upload-zone';

const MAX_PARALLEL_UPLOADS = 3;
const POLL_INTERVAL_MS = 3000;

interface UploadTask {
  id: number;
  file: File;
  percent: number;
  state: 'uploading' | 'error';
  message?: string;
}

const KIND_ICON: Record<KnowledgeKind, IconName> = {
  pdf: 'file',
  spreadsheet: 'table',
  image: 'image',
  text: 'file',
  note: 'note',
};

const KIND_LABEL: Record<KnowledgeKind, string> = {
  pdf: 'PDF',
  spreadsheet: 'Hoja de cálculo',
  image: 'Imagen',
  text: 'Texto',
  note: 'Nota',
};

@Component({
  selector: 'app-knowledge-panel',
  imports: [DatePipe, Icon, NoteForm, StatusMessage, UploadZone],
  template: `
    <div class="flex flex-col gap-6">
      <p class="max-w-[65ch] text-muted">
        El bot consulta estos archivos y notas para responder. Los PDF, las hojas de cálculo y el texto de las imágenes se leen automáticamente.
      </p>

      <app-upload-zone (filesSelected)="onFiles($event)" />

      <p class="sr-only" role="status" aria-live="polite">{{ announcement() }}</p>

      @if (rejections().length > 0) {
        <div class="flex flex-col gap-2 rounded-xl bg-danger-soft p-4" role="alert">
          <div class="flex items-center justify-between gap-3">
            <p class="font-semibold text-danger">No se pudieron agregar estos archivos</p>
            <button
              type="button"
              class="min-h-11 rounded-lg px-3 text-sm font-medium text-danger transition hover:bg-surface/60"
              (click)="rejections.set([])"
            >
              Cerrar
            </button>
          </div>
          <ul class="flex flex-col gap-1 text-sm">
            @for (rejection of rejections(); track rejection.name) {
              <li><span class="font-medium">{{ rejection.name }}:</span> {{ rejection.reason }}</li>
            }
          </ul>
        </div>
      }

      @if (queue().length > 0) {
        <ul class="flex flex-col gap-2" aria-label="Archivos en subida">
          @for (task of queue(); track task.id) {
            <li class="flex flex-col gap-2 rounded-xl bg-surface p-4 shadow-panel">
              <div class="flex items-baseline justify-between gap-3">
                <span class="truncate font-medium">{{ task.file.name }}</span>
                <span class="shrink-0 text-sm tabular-nums" [class]="task.state === 'error' ? 'font-medium text-danger' : 'text-muted'">
                  {{ task.state === 'error' ? 'No se pudo subir' : task.percent + '%' }}
                </span>
              </div>
              <div
                class="h-2 overflow-hidden rounded-full bg-sunken"
                role="progressbar"
                [attr.aria-label]="'Subiendo ' + task.file.name"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-valuenow]="task.percent"
              >
                <div
                  class="h-full rounded-full transition-[width] duration-150"
                  [class]="task.state === 'error' ? 'bg-danger' : 'bg-primary'"
                  [style.width.%]="task.percent"
                ></div>
              </div>
              @if (task.state === 'error') {
                @if (task.message) {
                  <p class="text-sm text-danger">{{ task.message }}</p>
                }
                <button
                  type="button"
                  class="min-h-11 self-start rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-primary-soft hover:text-fg"
                  (click)="dismissTask(task.id)"
                >
                  Quitar de la lista
                </button>
              }
            </li>
          }
        </ul>
      }

      <section aria-labelledby="knowledge-title" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 id="knowledge-title" class="text-lg font-semibold">Tu base de conocimiento</h2>
          @if (!showNewNote()) {
            <button
              type="button"
              class="-ml-3 inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-3 font-medium text-primary transition hover:bg-primary-soft active:scale-[0.98] sm:ml-0"
              (click)="startNewNote()"
            >
              <app-icon name="plus" size="size-4" /> Nueva nota
            </button>
          }
        </div>

        @if (showNewNote()) {
          <app-note-form [saving]="noteSaving()" [error]="noteError()" (submitted)="createNote($event)" (cancelled)="closeNoteForms()" />
        }

        @if (items.status() === 'loading') {
          <app-status-message kind="loading" text="Cargando base de conocimiento" [count]="3" />
        } @else if (items.status() === 'error') {
          <app-status-message
            kind="error"
            text="No se pudo cargar la base de conocimiento"
            hint="Revisa tu conexión e inténtalo de nuevo."
            [retryable]="true"
            (retry)="items.reload()"
          />
        } @else if (items.value()?.length === 0) {
          <app-status-message
            kind="empty"
            text="Todavía no hay archivos ni notas"
            hint="Sube un PDF con tu catálogo o escribe una nota con tus horarios para empezar."
          />
        } @else {
          <ul class="divide-y divide-line overflow-hidden rounded-xl bg-surface shadow-panel">
            @for (item of items.value(); track item.id) {
              <li class="p-4 sm:px-6">
                @if (editingId() === item.id) {
                  <app-note-form
                    [initial]="{ title: item.title, content: item.content ?? '' }"
                    [saving]="noteSaving()"
                    [error]="noteError()"
                    (submitted)="updateNote(item.id, $event)"
                    (cancelled)="closeNoteForms()"
                  />
                } @else {
                  <div class="flex items-start gap-4">
                    <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <app-icon [name]="iconOf(item)" />
                    </span>
                    <div class="flex min-w-0 flex-1 flex-col gap-1">
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span class="truncate font-semibold">{{ item.title }}</span>
                        <span class="rounded-md px-2 py-0.5 text-xs font-medium" [class]="badgeClass(item)">{{ statusLabel(item) }}</span>
                      </div>
                      <p class="text-sm text-muted">
                        {{ labelOf(item) }}, @if (item.sizeBytes) { {{ sizeOf(item) }}, }
                        {{ item.createdAt | date: 'mediumDate' }}
                      </p>
                      @if (item.kind === 'note' && item.content) {
                        <p class="line-clamp-2 text-sm">{{ item.content }}</p>
                      }
                      @if (item.status === 'failed' && item.errorMessage) {
                        <p class="text-sm font-medium text-danger">{{ item.errorMessage }}</p>
                      }
                    </div>

                    @if (confirmingId() !== item.id) {
                      <div class="flex shrink-0 gap-1">
                        @if (item.kind === 'note') {
                          <button
                            type="button"
                            class="inline-flex size-11 items-center justify-center rounded-lg text-muted transition hover:bg-primary-soft hover:text-fg active:scale-[0.96]"
                            [attr.aria-label]="'Editar ' + item.title"
                            (click)="startEdit(item.id)"
                          >
                            <app-icon name="pencil" />
                          </button>
                        }
                        <button
                          type="button"
                          class="inline-flex size-11 items-center justify-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger active:scale-[0.96]"
                          [attr.aria-label]="'Eliminar ' + item.title"
                          (click)="confirmingId.set(item.id)"
                        >
                          <app-icon name="trash" />
                        </button>
                      </div>
                    }
                  </div>

                  @if (confirmingId() === item.id) {
                    <div class="mt-3 flex flex-col gap-2 rounded-lg bg-danger-soft p-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
                      <p class="text-sm font-medium text-danger">¿Eliminar "{{ item.title }}"? El bot dejará de usarlo.</p>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          class="min-h-11 rounded-lg px-4 font-medium transition hover:bg-surface/60"
                          (click)="confirmingId.set(null)"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          class="min-h-11 rounded-lg bg-danger px-4 font-medium text-canvas transition hover:opacity-90 active:scale-[0.98]"
                          (click)="remove(item)"
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    </div>
                  }
                }
              </li>
            }
          </ul>
        }
      </section>
    </div>
  `,
})
export class KnowledgePanel {
  private readonly api = inject(KnowledgeApi);
  private readonly uploads = new Subject<UploadTask>();
  private nextTaskId = 0;

  protected readonly items = rxResource({ stream: () => this.api.list() });
  protected readonly queue = signal<UploadTask[]>([]);
  protected readonly rejections = signal<Rejection[]>([]);
  protected readonly announcement = signal('');

  protected readonly showNewNote = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly confirmingId = signal<string | null>(null);
  protected readonly noteSaving = signal(false);
  protected readonly noteError = signal('');

  private readonly fileCount = computed(
    () => (this.items.value() ?? []).filter((item) => item.kind !== 'note').length + this.queue().length,
  );

  constructor() {
    this.uploads
      .pipe(
        mergeMap(
          (task) =>
            this.api.upload(task.file).pipe(
              tap((event) => (event.type === 'progress' ? this.patchTask(task.id, { percent: event.percent }) : this.finishTask(task))),
              ignoreElements(),
              catchError((error: unknown) => {
                this.patchTask(task.id, { state: 'error', message: error instanceof Error ? error.message : undefined });
                return EMPTY;
              }),
            ),
          MAX_PARALLEL_UPLOADS,
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    // Depends on the list itself (a new array per reload), so it re-arms after every poll until nothing is processing.
    effect((onCleanup) => {
      if (!this.items.value()?.some((item) => item.status === 'processing')) return;
      const timer = setTimeout(() => this.items.reload(), POLL_INTERVAL_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onFiles(files: File[]): void {
    const { accepted, rejected } = validateFiles(files, this.fileCount());
    this.rejections.set(rejected);
    for (const file of accepted) {
      const task: UploadTask = { id: this.nextTaskId++, file, percent: 0, state: 'uploading' };
      this.queue.update((current) => [...current, task]);
      this.uploads.next(task);
    }
    if (accepted.length > 0) this.announcement.set(`Subiendo ${accepted.length} archivo${accepted.length === 1 ? '' : 's'}.`);
  }

  protected dismissTask(id: number): void {
    this.queue.update((current) => current.filter((task) => task.id !== id));
  }

  protected startNewNote(): void {
    this.closeNoteForms();
    this.showNewNote.set(true);
  }

  protected startEdit(id: string): void {
    this.closeNoteForms();
    this.editingId.set(id);
  }

  protected closeNoteForms(): void {
    this.showNewNote.set(false);
    this.editingId.set(null);
    this.noteError.set('');
  }

  protected createNote(input: NoteInput): void {
    this.saveNote(this.api.createNote(input), 'Nota creada.');
  }

  protected updateNote(id: string, input: NoteInput): void {
    this.saveNote(this.api.updateNote(id, input), 'Nota actualizada.');
  }

  protected remove(item: KnowledgeItem): void {
    this.confirmingId.set(null);
    this.api.remove(item.id).subscribe({
      next: () => {
        this.items.reload();
        this.announcement.set(`Se eliminó ${item.title}.`);
      },
      error: () => this.announcement.set(`No se pudo eliminar ${item.title}.`),
    });
  }

  protected iconOf(item: KnowledgeItem): IconName {
    return KIND_ICON[item.kind];
  }

  protected labelOf(item: KnowledgeItem): string {
    return KIND_LABEL[item.kind];
  }

  protected sizeOf(item: KnowledgeItem): string {
    return formatBytes(item.sizeBytes ?? 0);
  }

  protected statusLabel(item: KnowledgeItem): string {
    return { processing: 'Procesando', ready: 'Listo', failed: 'Error' }[item.status];
  }

  protected badgeClass(item: KnowledgeItem): string {
    return {
      processing: 'bg-sunken text-muted',
      ready: 'bg-primary-soft text-primary',
      failed: 'bg-danger-soft text-danger',
    }[item.status];
  }

  private saveNote(request: ReturnType<KnowledgeApi['createNote']>, successMessage: string): void {
    this.noteSaving.set(true);
    this.noteError.set('');
    request.subscribe({
      next: () => {
        this.noteSaving.set(false);
        this.closeNoteForms();
        this.items.reload();
        this.announcement.set(successMessage);
      },
      error: (error: unknown) => {
        this.noteSaving.set(false);
        this.noteError.set(error instanceof Error && error.message ? error.message : 'No se pudo guardar la nota. Inténtalo de nuevo.');
      },
    });
  }

  private patchTask(id: number, patch: Partial<UploadTask>): void {
    this.queue.update((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  private finishTask(task: UploadTask): void {
    this.dismissTask(task.id);
    this.items.reload();
    this.announcement.set(`Se subió ${task.file.name}. Se está procesando.`);
  }
}
