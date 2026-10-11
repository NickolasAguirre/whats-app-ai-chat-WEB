import { Component, computed, input, signal } from '@angular/core';
import { StatsPoint } from '../../core/domain/models/models';
import { formatInt } from '../format-number';
import { ChartCard } from './chart-card';
import { niceScale } from './scale';

const TARGET_LABELS = 8;

@Component({
  selector: 'app-column-chart',
  imports: [ChartCard],
  template: `
    <app-chart-card [title]="title()" [subtitle]="subtitle()">
      <div chart>
        <div class="mt-6 flex">
          <div class="relative h-48 w-9 shrink-0 text-xs tabular-nums text-muted sm:h-60 sm:w-11" aria-hidden="true">
            @for (tick of scale().ticks; track tick) {
              <span class="absolute right-2 -translate-y-1/2" [style.bottom.%]="(tick / scale().max) * 100">{{ format(tick) }}</span>
            }
          </div>

          <div class="relative h-48 min-w-0 flex-1 sm:h-60">
            @for (tick of scale().ticks; track tick) {
              <div class="absolute inset-x-0 border-t border-line" [style.bottom.%]="(tick / scale().max) * 100"></div>
            }

            <div class="absolute inset-0 flex items-end" role="group" [attr.aria-label]="ariaLabel()">
              @for (point of points(); track $index; let index = $index) {
                <div
                  class="group relative flex h-full flex-1 items-end justify-center px-px outline-offset-0"
                  role="img"
                  tabindex="0"
                  [attr.aria-label]="point.description + ': ' + format(point.value) + ' ' + unit()"
                  (pointerenter)="active.set(index)"
                  (pointerleave)="active.set(null)"
                  (focus)="active.set(index)"
                  (blur)="active.set(null)"
                >
                  <div
                    class="relative w-full max-w-6 rounded-t-[4px] bg-primary transition-opacity"
                    [class]="active() !== null && active() !== index ? 'opacity-50' : ''"
                    [style.height.%]="(point.value / scale().max) * 100"
                  >
                    @if (index === peakIndex()) {
                      <span class="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium tabular-nums">
                        {{ format(point.value) }}
                      </span>
                    }
                  </div>
                </div>
              }

              @if (activePoint(); as point) {
                <div
                  class="pointer-events-none absolute top-0 z-10 w-max max-w-48 -translate-y-full rounded-lg bg-fg px-3 py-2 text-xs text-canvas shadow-panel"
                  [style.left.%]="tooltipLeft()"
                  [class]="tooltipAlign()"
                  role="presentation"
                >
                  <p class="text-base font-semibold leading-tight">{{ format(point.value) }}</p>
                  <p class="opacity-80">{{ point.description }}</p>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="ml-9 flex sm:ml-11" aria-hidden="true">
          @for (point of points(); track $index; let index = $index) {
            <span class="flex-1 pt-2 text-center text-xs tabular-nums text-muted">
              @if (index % labelEvery() === 0) { {{ point.label }} }
            </span>
          }
        </div>
      </div>

      <div table class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">{{ ariaLabel() }}</caption>
          <thead>
            <tr class="border-b border-line text-muted">
              <th scope="col" class="py-2 pr-4 font-medium">{{ columnHeader() }}</th>
              <th scope="col" class="py-2 text-right font-medium">Mensajes</th>
            </tr>
          </thead>
          <tbody>
            @for (point of points(); track $index) {
              <tr class="border-b border-line last:border-0">
                <th scope="row" class="py-2 pr-4 font-normal">{{ point.description }}</th>
                <td class="py-2 text-right tabular-nums">{{ format(point.value) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-chart-card>
  `,
})
export class ColumnChart {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly points = input.required<readonly StatsPoint[]>();
  readonly ariaLabel = input.required<string>();
  readonly columnHeader = input('Periodo');
  readonly unit = input('mensajes');

  protected readonly active = signal<number | null>(null);
  protected readonly format = formatInt;

  protected readonly scale = computed(() => niceScale(Math.max(0, ...this.points().map((point) => point.value))));
  protected readonly labelEvery = computed(() => Math.max(1, Math.ceil(this.points().length / TARGET_LABELS)));
  protected readonly peakIndex = computed(() => {
    const values = this.points().map((point) => point.value);
    const max = Math.max(0, ...values);
    return max > 0 ? values.indexOf(max) : -1;
  });
  protected readonly activePoint = computed(() => {
    const index = this.active();
    return index === null ? null : (this.points()[index] ?? null);
  });
  protected readonly tooltipLeft = computed(() => ((this.active() ?? 0) + 0.5) / this.points().length * 100);
  protected readonly tooltipAlign = computed(() => {
    const ratio = this.tooltipLeft();
    return ratio < 15 ? 'translate-x-[-10%]' : ratio > 85 ? 'translate-x-[-90%]' : 'translate-x-[-50%]';
  });
}
