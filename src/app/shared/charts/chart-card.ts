import { Component, input, signal } from '@angular/core';

let nextCardId = 0;

/** Card with a title and a chart/table view toggle. Project the chart with `chart` and its table with `table`. */
@Component({
  selector: 'app-chart-card',
  template: `
    <section class="rounded-xl bg-surface p-4 shadow-panel sm:p-6" [attr.aria-labelledby]="uid">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <h2 [id]="uid" class="font-semibold">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="text-sm text-muted">{{ subtitle() }}</p>
          }
        </div>
        <button
          type="button"
          class="-mr-2 min-h-11 rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-primary-soft hover:text-fg active:scale-[0.98]"
          [attr.aria-pressed]="showTable()"
          (click)="showTable.set(!showTable())"
        >
          {{ showTable() ? 'Ver gráfico' : 'Ver tabla' }}
        </button>
      </div>

      @if (showTable()) {
        <ng-content select="[table]" />
      } @else {
        <ng-content select="[chart]" />
      }
    </section>
  `,
})
export class ChartCard {
  protected readonly uid = `chart-card-${nextCardId++}`;
  protected readonly showTable = signal(false);

  readonly title = input.required<string>();
  readonly subtitle = input('');
}
