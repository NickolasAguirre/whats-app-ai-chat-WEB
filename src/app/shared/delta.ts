export type DeltaTone = 'good' | 'bad' | 'neutral';
export type DeltaDirection = 'up' | 'down' | 'flat';

export interface Delta {
  text: string;
  direction: DeltaDirection;
  tone: DeltaTone;
}

/**
 * Signed change against the previous period. `goodWhen` says which direction is an improvement
 * (more answers is good, a longer response time is not). Returns null when there is nothing to compare.
 */
export function makeDelta(current: number, previous: number, goodWhen: 'up' | 'down', comparedTo: string): Delta | null {
  if (previous <= 0) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { text: `Sin cambios vs. ${comparedTo}`, direction: 'flat', tone: 'neutral' };
  const direction: DeltaDirection = percent > 0 ? 'up' : 'down';
  const sign = percent > 0 ? '+' : '-';
  return {
    text: `${sign}${Math.abs(percent)} % vs. ${comparedTo}`,
    direction,
    tone: direction === goodWhen ? 'good' : 'bad',
  };
}
