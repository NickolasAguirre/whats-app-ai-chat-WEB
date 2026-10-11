import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DashboardStats, StatsPeriod } from '../../core/domain/models/models';
import { StatsApi } from '../../core/domain/ports/stats-api.port';
import { BarListChart } from '../../shared/charts/bar-list-chart';
import { ColumnChart } from '../../shared/charts/column-chart';
import { HeatmapChart } from '../../shared/charts/heatmap-chart';
import { StatTile } from '../../shared/charts/stat-tile';
import { makeDelta } from '../../shared/delta';
import { formatDuration, formatInt, formatPercent } from '../../shared/format-number';
import { Icon } from '../../shared/icon';
import { PageHeader } from '../../shared/page-header';
import { StatusMessage } from '../../shared/status-message';

interface PeriodOption {
  id: StatsPeriod;
  label: string;
  description: string;
  comparedTo: string;
  chartTitle: string;
  columnHeader: string;
}

const PERIODS: readonly PeriodOption[] = [
  { id: 'day', label: 'Hoy', description: 'Lo que ha pasado hoy, hora por hora.', comparedTo: 'ayer', chartTitle: 'Mensajes respondidos por hora', columnHeader: 'Hora' },
  { id: 'week', label: 'Semana', description: 'Los últimos 7 días.', comparedTo: 'semana anterior', chartTitle: 'Mensajes respondidos por día', columnHeader: 'Día' },
  { id: 'month', label: 'Mes', description: 'Los últimos 30 días.', comparedTo: 'mes anterior', chartTitle: 'Mensajes respondidos por día', columnHeader: 'Día' },
];

@Component({
  selector: 'app-dashboard-page',
  imports: [DatePipe, BarListChart, ColumnChart, HeatmapChart, Icon, PageHeader, StatTile, StatusMessage],
  template: `
    <app-page-header title="Resumen" [subtitle]="option().description" />

    <div role="group" aria-label="Periodo" class="mb-6 inline-flex rounded-lg bg-sunken p-1">
      @for (item of periods; track item.id) {
        <button
          type="button"
          class="min-h-11 rounded-md px-4 text-sm font-medium transition active:scale-[0.97]"
          [class]="period() === item.id ? 'bg-surface text-fg shadow-panel' : 'text-muted hover:text-fg'"
          [attr.aria-pressed]="period() === item.id"
          (click)="period.set(item.id)"
        >
          {{ item.label }}
        </button>
      }
    </div>

    @if (!stats()) {
      @if (resource.error()) {
        <app-status-message
          kind="error"
          text="No se pudo cargar el resumen"
          hint="Revisa tu conexión e inténtalo de nuevo."
          [retryable]="true"
          (retry)="resource.reload()"
        />
      } @else {
        <app-status-message kind="loading" text="Cargando el resumen" [count]="3" />
      }
    } @else {
      <div class="flex flex-col gap-6 transition-opacity" [class]="resource.isLoading() ? 'opacity-60' : ''" [attr.aria-busy]="resource.isLoading()">
        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <app-stat-tile
            class="col-span-2 lg:row-span-2"
            label="Mensajes respondidos"
            [value]="kpis().answered"
            [delta]="kpis().answeredDelta"
            [hint]="kpis().answeredHint"
            [hero]="true"
          />
          <app-stat-tile label="Personas atendidas" [value]="kpis().people" [delta]="kpis().peopleDelta" [hint]="kpis().peopleHint" />
          <app-stat-tile label="Tiempo de respuesta" [value]="kpis().response" [delta]="kpis().responseDelta" hint="Promedio por mensaje" />
          <app-stat-tile label="Tasa de respuesta" [value]="kpis().rate" [hint]="kpis().rateHint" />
          <app-stat-tile label="Sin respuesta" [value]="kpis().failed" [delta]="kpis().failedDelta" hint="Mensajes que fallaron" />
        </div>

        <app-column-chart
          [title]="option().chartTitle"
          [subtitle]="option().description"
          [points]="stats()!.series"
          [ariaLabel]="option().chartTitle + '. ' + option().description"
          [columnHeader]="option().columnHeader"
        />

        <div class="grid gap-6 lg:grid-cols-2">
          <app-heatmap-chart
            title="Horas pico"
            subtitle="Últimas 4 semanas, no cambia con el periodo."
            [values]="stats()!.heatmap"
            ariaLabel="Mensajes respondidos por día de la semana y franja de 3 horas"
          />
          <app-bar-list-chart
            title="Por número de WhatsApp"
            [subtitle]="option().description"
            [items]="numberItems()"
            ariaLabel="Mensajes respondidos por número de WhatsApp"
          />
        </div>

        <section class="rounded-xl bg-surface p-4 shadow-panel sm:p-6" aria-labelledby="failed-title">
          <h2 id="failed-title" class="font-semibold">Mensajes sin respuesta</h2>
          <p class="mb-4 text-sm text-muted">Los últimos que el bot no pudo contestar en este periodo.</p>

          @if (stats()!.failedMessages.length === 0) {
            <p class="rounded-lg bg-primary-soft p-4 text-sm font-medium text-primary">Todos los mensajes de este periodo se respondieron.</p>
          } @else {
            <ul class="divide-y divide-line">
              @for (failure of stats()!.failedMessages; track failure.id) {
                <li class="flex items-start gap-3 py-3">
                  <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                    <app-icon name="alert" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span class="truncate font-medium">{{ failure.personName }}</span>
                      <time class="shrink-0 text-xs tabular-nums text-muted" [attr.datetime]="failure.at.toISOString()">
                        {{ failure.at | date: 'short' }}
                      </time>
                    </p>
                    <p class="text-sm text-muted">{{ failure.reason }}</p>
                  </div>
                </li>
              }
            </ul>
          }
        </section>
      </div>
    }
  `,
})
export class DashboardPage {
  private readonly api = inject(StatsApi);

  protected readonly periods = PERIODS;
  protected readonly period = signal<StatsPeriod>('day');
  protected readonly option = computed(() => PERIODS.find((item) => item.id === this.period()) ?? PERIODS[0]);

  protected readonly resource = rxResource({
    params: () => this.period(),
    stream: ({ params }) => this.api.get(params),
  });

  /** Keeps the last loaded stats on screen while a new period loads, so the layout never jumps. */
  protected readonly stats = linkedSignal<DashboardStats | undefined, DashboardStats | undefined>({
    source: () => this.resource.value(),
    computation: (next, previous) => next ?? previous?.value,
  });

  protected readonly numberItems = computed(() =>
    (this.stats()?.byNumber ?? []).map((entry) => ({
      id: entry.numberId,
      label: entry.label,
      detail: entry.phoneNumber,
      value: entry.answered,
    })),
  );

  protected readonly kpis = computed(() => {
    const stats = this.stats();
    if (!stats) throw new Error('kpis read before stats loaded');
    const { summary, previous } = stats;
    const comparedTo = this.option().comparedTo;
    const returning = summary.people - summary.newPeople;

    return {
      answered: formatInt(summary.answered),
      answeredDelta: makeDelta(summary.answered, previous.answered, 'up', comparedTo),
      answeredHint: `De ${formatInt(summary.received)} mensajes recibidos`,
      people: formatInt(summary.people),
      peopleDelta: makeDelta(summary.people, previous.people, 'up', comparedTo),
      peopleHint: `${formatInt(summary.newPeople)} nuevas, ${formatInt(returning)} recurrentes`,
      response: formatDuration(summary.avgResponseSeconds),
      responseDelta: makeDelta(summary.avgResponseSeconds, previous.avgResponseSeconds, 'down', comparedTo),
      rate: formatPercent(summary.received > 0 ? summary.answered / summary.received : 0),
      rateHint: 'Respondidos sobre recibidos',
      failed: formatInt(summary.failed),
      failedDelta: makeDelta(summary.failed, previous.failed, 'down', comparedTo),
    };
  });
}
