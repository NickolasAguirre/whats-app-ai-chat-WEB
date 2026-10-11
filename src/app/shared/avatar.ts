import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  host: { 'aria-hidden': 'true', class: 'inline-flex shrink-0' },
  template: `
    <span
      class="inline-flex items-center justify-center rounded-xl bg-primary-soft font-semibold text-primary"
      [class]="large() ? 'size-12 text-lg' : 'size-10 text-sm'"
    >
      {{ initials() }}
    </span>
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly large = input(false);

  protected readonly initials = computed(() => {
    const parts = this.name().replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '#';
    const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
    return letters.toUpperCase();
  });
}
