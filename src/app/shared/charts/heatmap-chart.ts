import { Component, computed, input, signal } from '@angular/core';
import { formatInt } from '../format-number';
import { ChartCard } from './chart-card';

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const BLOCK_HOURS = 3;
const LEVELS = 5;

interface HoveredCell {
  weekday: number;
  block: number;
}

@Component({
  selector: 'app-heatmap-chart',
  imports: [ChartCard],
  template: `
    <app-chart-card [title]="title()" [subtitle]="subtitle()">
      <div chart class="flex flex-col gap-4">
        <p class="min-h-6 text-sm" role="status" aria-live="polite">
          @if (hoveredText(); as text) {
            <span class="font-medium">{{ text }}</span>
          } @else if (peakText(); as peak) {
            <span class="text-muted">{{ peak }}</span>
          }
        </p>

        <div class="grid grid-cols-[2.25rem_repeat(8,minmax(0,1fr))] gap-0.5 sm:grid-cols-[3rem_repeat(8,minmax(0,1fr))]" role="group" [attr.aria-label]="ariaLabel()">
          <span aria-hidden="true"></span>
          @for (block of blocks; track block) {
            <span class="pb-1 text-center text-xs tabular-nums text-muted" aria-hidden="true">{{ block * 3 }}h</span>
          }

          @for (row of rows(); track row.weekday) {
            <span class="flex items-center text-xs text-muted sm:text-sm" aria-hidden="true">{{ row.short }}</span>
            @for (cell of row.cells; track cell.block) {
              <div
                class="min-h-9 rounded-[4px] outline-offset-0 transition sm:min-h-10"
                [style.background-color]="cell.color"
                role="img"
                tabindex="0"
                [attr.aria-label]="cell.description"
                (pointerenter)="hovered.set({ weekday: row.weekday, block: cell.block })"
                (pointerleave)="hovered.set(null)"
                (focus)="hovered.set({ weekday: row.weekday, block: cell.block })"
                (blur)="hovered.set(null)"
              ></div>
            }
          }
        </div>

        <div class="flex items-center gap-2 text-xs text-muted" aria-hidden="true">
          <span>Menos</span>
          @for (swatch of swatches; track swatch) {
            <span class="h-3 w-6 rounded-[4px]" [style.background-color]="swatch"></span>
          }
          <span>Más</span>
        </div>
      </div>

      <div table class="overflow-x-auto">
        <table class="w-full min-w-[32rem] text-left text-sm">
          <caption class="sr-only">{{ ariaLabel() }}</caption>
          <thead>
            <tr class="border-b border-line text-muted">
              <th scope="col" class="py-2 pr-3 font-medium">Día</th>
              @for (block of blocks; track block) {
                <th scope="col" class="px-1 py-2 text-right font-medium tabular-nums">{{ block * 3 }}h</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.weekday) {
              <tr class="border-b border-line last:border-0">
                <th scope="row" class="py-2 pr-3 font-normal">{{ row.name }}</th>
                @for (cell of row.cells; track cell.block) {
                  <td class="px-1 py-2 text-right tabular-nums">{{ format(cell.value) }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-chart-card>
  `,
})
export class HeatmapChart {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  /** 7 weekdays (Monday first) by 8 blocks of 3 hours. */
  readonly values = input.required<readonly (readonly number[])[]>();
  readonly ariaLabel = input.required<string>();

  protected readonly blocks = Array.from({ length: 8 }, (_, block) => block);
  protected readonly format = formatInt;
  protected readonly hovered = signal<HoveredCell | null>(null);

  protected readonly swatches = Array.from({ length: LEVELS + 1 }, (_, level) => HeatmapChart.colorFor(level, LEVELS));

  private readonly max = computed(() => Math.max(0, ...this.values().flat()));

  protected readonly rows = computed(() =>
    this.values().map((cells, weekday) => ({
      weekday,
      name: WEEKDAYS[weekday],
      short: WEEKDAYS[weekday].slice(0, 3),
      cells: cells.map((value, block) => ({
        block,
        value,
        color: HeatmapChart.colorFor(this.level(value), LEVELS),
        description: this.describe(weekday, block, value),
      })),
    })),
  );

  protected readonly hoveredText = computed(() => {
    const cell = this.hovered();
    return cell ? this.describe(cell.weekday, cell.block, this.values()[cell.weekday][cell.block]) : '';
  });

  protected readonly peakText = computed(() => {
    let best = { weekday: 0, block: 0, value: -1 };
    this.values().forEach((cells, weekday) =>
      cells.forEach((value, block) => {
        if (value > best.value) best = { weekday, block, value };
      }),
    );
    return best.value > 0 ? `Tu hora pico: ${this.slot(best.weekday, best.block)}.` : '';
  });

  private level(value: number): number {
    const max = this.max();
    return value <= 0 || max <= 0 ? 0 : Math.max(1, Math.ceil((value / max) * LEVELS));
  }

  private slot(weekday: number, block: number): string {
    const from = block * BLOCK_HOURS;
    return `${WEEKDAYS[weekday].toLowerCase()} de ${from} a ${from + BLOCK_HOURS} h`;
  }

  private describe(weekday: number, block: number, value: number): string {
    return `${WEEKDAYS[weekday]}, ${block * BLOCK_HOURS} a ${block * BLOCK_HOURS + BLOCK_HOURS} h: ${formatInt(value)} mensajes`;
  }

  /** One hue, light to dark: level 0 is the empty track, the rest mix the accent into it. */
  private static colorFor(level: number, levels: number): string {
    if (level <= 0) return 'var(--surface-sunken)';
    const percent = 18 + Math.round((level / levels) * 82);
    return `color-mix(in srgb, var(--primary) ${percent}%, var(--surface-sunken))`;
  }
}
