import { firstValueFrom } from 'rxjs';
import { StatsPeriod } from '../../core/domain/models/models';
import { MockStatsApi } from './mock-stats-api';

describe('MockStatsApi', () => {
  const expectedPoints: Record<StatsPeriod, number> = { day: 24, week: 7, month: 30 };

  it.each(['day', 'week', 'month'] as const)('returns consistent numbers for %s', async (period) => {
    const stats = await firstValueFrom(new MockStatsApi().get(period));

    expect(stats.series).toHaveLength(expectedPoints[period]);
    expect(stats.summary.answered).toBe(stats.series.reduce((total, point) => total + point.value, 0));
    expect(stats.byNumber.reduce((total, entry) => total + entry.answered, 0)).toBe(stats.summary.answered);
    expect(stats.summary.received).toBeGreaterThanOrEqual(stats.summary.answered);
    expect(stats.summary.newPeople).toBeLessThanOrEqual(stats.summary.people);
  });

  it('returns a 7 by 8 heatmap and only failures inside the period window', async () => {
    const api = new MockStatsApi();
    const day = await firstValueFrom(api.get('day'));
    const month = await firstValueFrom(api.get('month'));

    expect(day.heatmap).toHaveLength(7);
    expect(day.heatmap.every((row) => row.length === 8)).toBe(true);
    expect(day.failedMessages.length).toBeLessThan(month.failedMessages.length);
    expect(day.failedMessages.every((failure) => Date.now() - failure.at.getTime() <= 86_400_000 + 1000)).toBe(true);
  });
});
