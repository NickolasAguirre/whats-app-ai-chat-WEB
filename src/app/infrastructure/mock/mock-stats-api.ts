import { Injectable } from '@angular/core';
import { Observable, defer, of } from 'rxjs';
import { DashboardStats, FailedMessage, NumberStat, StatsPeriod, StatsPoint } from '../../core/domain/models/models';
import { StatsApi } from '../../core/domain/ports/stats-api.port';
import { withMockLatency } from './mock-latency';

const HOUR_CURVE = [1, 1, 1, 1, 1, 2, 4, 8, 14, 18, 20, 19, 16, 15, 17, 19, 18, 15, 11, 8, 5, 3, 2, 1];
const WEEKDAY_FACTOR = [1, 1.05, 1.1, 1, 1.15, 0.8, 0.5];
const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const WEEKDAY_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_SCALE = 2;
const NUMBER_SHARES = [0.55, 0.33];
const MINUTE_MS = 60_000;

const NUMBERS = [
  { numberId: 'num-1', label: 'Atención al cliente', phoneNumber: '+57 300 123 4567' },
  { numberId: 'num-2', label: 'Ventas', phoneNumber: '+57 310 765 4321' },
  { numberId: 'num-3', label: 'Soporte técnico', phoneNumber: '+57 320 111 2233' },
];

const FAILURES = [
  { minutesAgo: 12, personName: 'María Gómez', reason: 'El proveedor de IA no respondió a tiempo.' },
  { minutesAgo: 95, personName: '+57 302 555 0202', reason: 'No se pudo enviar la respuesta por WhatsApp.' },
  { minutesAgo: 340, personName: 'Carlos Ruiz', reason: 'El proveedor de IA no respondió a tiempo.' },
  { minutesAgo: 1500, personName: '+57 304 555 0404', reason: 'El mensaje no tenía texto que responder.' },
  { minutesAgo: 4200, personName: 'Laura Peña', reason: 'No se pudo enviar la respuesta por WhatsApp.' },
  { minutesAgo: 20000, personName: '+57 305 555 0505', reason: 'El proveedor de IA no respondió a tiempo.' },
];

const WINDOW_MINUTES: Record<StatsPeriod, number> = { day: 1440, week: 10_080, month: 43_200 };
const PEOPLE_DIVISOR: Record<StatsPeriod, number> = { day: 4.5, week: 9, month: 20 };

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

@Injectable()
export class MockStatsApi extends StatsApi {
  override get(period: StatsPeriod): Observable<DashboardStats> {
    return defer(() => of(this.build(period))).pipe(withMockLatency());
  }

  private build(period: StatsPeriod): DashboardStats {
    const now = new Date();
    const series = this.buildSeries(period, now);
    const answered = series.reduce((total, point) => total + point.value, 0);
    const failed = Math.max(1, Math.round(answered * 0.018));

    return {
      period,
      summary: {
        answered,
        received: answered + failed + Math.round(answered * 0.004),
        people: Math.round(answered / PEOPLE_DIVISOR[period]),
        newPeople: Math.round((answered / PEOPLE_DIVISOR[period]) * 0.35),
        avgResponseSeconds: 3.1,
        failed,
      },
      previous: {
        answered: Math.round(answered * 0.88),
        people: Math.round((answered / PEOPLE_DIVISOR[period]) * 0.93),
        avgResponseSeconds: 3.6,
        failed: Math.round(failed * 1.4),
      },
      series,
      byNumber: this.splitByNumber(answered),
      heatmap: this.buildHeatmap(),
      failedMessages: this.buildFailures(period, now),
    };
  }

  private buildSeries(period: StatsPeriod, now: Date): StatsPoint[] {
    const random = seeded(period === 'day' ? 11 : period === 'week' ? 22 : 33);

    if (period === 'day') {
      return HOUR_CURVE.map((weight, hour) => {
        const value = hour > now.getHours() ? 0 : Math.round(weight * DAY_SCALE * (0.85 + random() * 0.3));
        const label = `${hour}h`;
        return { label, description: `${hour}:00 a ${hour}:59`, value };
      });
    }

    const days = period === 'week' ? 7 : 30;
    const dayTotal = HOUR_CURVE.reduce((total, weight) => total + weight, 0) * DAY_SCALE;
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - 1 - index));
      const weekday = date.getDay();
      const factor = WEEKDAY_FACTOR[(weekday + 6) % 7];
      const value = Math.round(dayTotal * factor * (0.9 + random() * 0.2));
      const label = period === 'week' ? WEEKDAY_SHORT[weekday] : String(date.getDate());
      return { label, description: `${WEEKDAY_LONG[weekday]} ${date.getDate()}`, value };
    });
  }

  private splitByNumber(answered: number): NumberStat[] {
    const first = Math.round(answered * NUMBER_SHARES[0]);
    const second = Math.round(answered * NUMBER_SHARES[1]);
    const amounts = [first, second, answered - first - second];
    return NUMBERS.map((entry, index) => ({ ...entry, answered: amounts[index] }));
  }

  private buildHeatmap(): number[][] {
    const random = seeded(42);
    const blockWeight = Array.from({ length: 8 }, (_, block) =>
      HOUR_CURVE.slice(block * 3, block * 3 + 3).reduce((total, weight) => total + weight, 0),
    );
    return WEEKDAY_FACTOR.map((factor) =>
      blockWeight.map((weight) => Math.round(weight * factor * 4 * 2 * (0.85 + random() * 0.3))),
    );
  }

  private buildFailures(period: StatsPeriod, now: Date): FailedMessage[] {
    return FAILURES.filter((failure) => failure.minutesAgo <= WINDOW_MINUTES[period])
      .slice(0, 5)
      .map((failure, index) => ({
        id: `fail-${index}`,
        at: new Date(now.getTime() - failure.minutesAgo * MINUTE_MS),
        personName: failure.personName,
        reason: failure.reason,
      }));
  }
}
