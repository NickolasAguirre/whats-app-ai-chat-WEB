import { Component, output, signal } from '@angular/core';
import { ACCEPT_ATTRIBUTE, MAX_FILE_BYTES } from '../../../core/domain/knowledge/file-rules';
import { Icon } from '../../../shared/icon';

@Component({
  selector: 'app-upload-zone',
  imports: [Icon],
  template: `
    <div
      class="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition"
      [class]="dragging() ? 'border-primary bg-primary-soft' : 'border-line bg-surface'"
      (dragover)="onDragOver($event)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <app-icon name="upload" size="size-6" />
      </span>
      <p class="font-semibold">Arrastra tus archivos aquí</p>
      <p class="max-w-[48ch] text-sm text-muted">
        PDF, Excel, imágenes con texto, TXT y MD. Hasta {{ maxMegabytes }} MB cada uno.
      </p>
      <button
        type="button"
        class="min-h-11 rounded-lg bg-primary px-5 font-medium text-primary-fg transition hover:bg-primary-hover active:scale-[0.98]"
        (click)="picker.click()"
      >
        Elegir archivos
      </button>
      <input
        #picker
        type="file"
        multiple
        class="sr-only"
        tabindex="-1"
        aria-hidden="true"
        [accept]="accept"
        (change)="onPick(picker)"
      />
    </div>
  `,
})
export class UploadZone {
  protected readonly accept = ACCEPT_ATTRIBUTE;
  protected readonly maxMegabytes = MAX_FILE_BYTES / (1024 * 1024);
  protected readonly dragging = signal(false);

  readonly filesSelected = output<File[]>();

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.emit(event.dataTransfer?.files);
  }

  protected onPick(input: HTMLInputElement): void {
    this.emit(input.files);
    input.value = '';
  }

  private emit(files: FileList | null | undefined): void {
    if (files && files.length > 0) this.filesSelected.emit(Array.from(files));
  }
}
