import { Component, computed, input } from '@angular/core';
import { Delta } from '../delta';
import { Icon, IconName } from '../icon';

@Component({
  selector: 'app-stat-tile',
  imports: [Icon],
  host: { class: 'flex' },
  template: `
    <div
      class="flex w-full flex-col gap-2 rounded-xl bg-surface p-4 shadow-panel sm:p-5"
      [class]="hero() ? 'justify-between gap-6 sm:p-6' : ''"
    >
      <p class="text-sm text-muted">{{ label() }}</p>
      <p class="font-semibold leading-none tracking-tight" [class]="hero() ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl'">
        {{ value() }}
      </p>
      @if (delta(); as change) {
        <p class="inline-flex items-center gap-1 text-sm font-medium" [class]="toneClass()">
          <app-icon [name]="deltaIcon()" size="size-4" />
          {{ change.text }}
        </p>
      }
      @if (hint()) {
        <p class="text-sm text-muted">{{ hint() }}</p>
      }
    </div>
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly delta = input<Delta | null>(null);
  readonly hint = input('');
  readonly hero = input(false);

  protected readonly toneClass = computed(() => {
    const tone = this.delta()?.tone;
    return tone === 'good' ? 'text-primary' : tone === 'bad' ? 'text-danger' : 'text-muted';
  });

  protected readonly deltaIcon = computed<IconName>(() => {
    const direction = this.delta()?.direction;
    return direction === 'up' ? 'arrow-up' : direction === 'down' ? 'arrow-down' : 'minus';
  });
}
