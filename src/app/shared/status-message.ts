import { Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';

export type StatusKind = 'loading' | 'error' | 'empty';

@Component({
  selector: 'app-status-message',
  imports: [Icon],
  template: `
    @if (kind() === 'loading') {
      <div role="status" aria-live="polite" class="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-panel">
        <span class="sr-only">{{ text() }}</span>
        @for (row of rows(); track row) {
          <div class="flex items-center gap-3" aria-hidden="true">
            <span class="skeleton size-10 shrink-0 rounded-xl"></span>
            <span class="flex flex-1 flex-col gap-2">
              <span class="skeleton h-3.5 w-2/5 rounded-md"></span>
              <span class="skeleton h-3 w-4/5 rounded-md"></span>
            </span>
          </div>
        }
      </div>
    } @else {
      <div
        class="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-12 text-center shadow-panel"
        [attr.role]="kind() === 'error' ? 'alert' : 'status'"
      >
        <span
          class="inline-flex size-12 items-center justify-center rounded-xl"
          [class]="kind() === 'error' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary'"
        >
          <app-icon [name]="kind() === 'error' ? 'alert' : 'inbox'" size="size-6" />
        </span>
        <p class="font-semibold">{{ text() }}</p>
        @if (hint()) {
          <p class="max-w-[48ch] text-sm text-muted">{{ hint() }}</p>
        }
        @if (kind() === 'error' && retryable()) {
          <button
            type="button"
            class="mt-1 min-h-11 rounded-lg bg-primary px-5 font-medium text-primary-fg transition hover:bg-primary-hover active:scale-[0.98]"
            (click)="retry.emit()"
          >
            Reintentar
          </button>
        }
      </div>
    }
  `,
})
export class StatusMessage {
  readonly kind = input.required<StatusKind>();
  readonly text = input.required<string>();
  readonly hint = input('');
  readonly retryable = input(false);
  readonly count = input(4);
  readonly retry = output<void>();

  protected readonly rows = computed(() => Array.from({ length: this.count() }, (_, index) => index));
}
