import { Component, computed, input } from '@angular/core';
import { formatInt } from '../format-number';
import { ChartCard } from './chart-card';

export interface BarItem {
  id: string;
  label: string;
  detail: string;
  value: number;
}

@Component({
  selector: 'app-bar-list-chart',
  imports: [ChartCard],
  template: `
    <app-chart-card [title]="title()" [subtitle]="subtitle()">
      <ul chart class="flex flex-col gap-5" [attr.aria-label]="ariaLabel()">
        @for (item of items(); track item.id) {
          <li class="flex flex-col gap-2">
            <div class="flex items-baseline justify-between gap-3">
              <span class="min-w-0 truncate">
                <span class="font-medium">{{ item.label }}</span>
                <span class="ml-2 text-sm tabular-nums text-muted">{{ item.detail }}</span>
              </span>
              <span class="shrink-0 font-semibold tabular-nums">{{ format(item.value) }}</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-primary-soft" role="presentation">
              <div class="h-full rounded-full bg-primary" [style.width.%]="(item.value / max()) * 100"></div>
            </div>
          </li>
        }
      </ul>

      <div table class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">{{ ariaLabel() }}</caption>
          <thead>
            <tr class="border-b border-line text-muted">
              <th scope="col" class="py-2 pr-4 font-medium">Número</th>
              <th scope="col" class="py-2 text-right font-medium">Mensajes</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr class="border-b border-line last:border-0">
                <th scope="row" class="py-2 pr-4 font-normal">{{ item.label }} ({{ item.detail }})</th>
                <td class="py-2 text-right tabular-nums">{{ format(item.value) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </app-chart-card>
  `,
})
export class BarListChart {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly items = input.required<readonly BarItem[]>();
  readonly ariaLabel = input.required<string>();

  protected readonly format = formatInt;
  protected readonly max = computed(() => Math.max(1, ...this.items().map((item) => item.value)));
}
