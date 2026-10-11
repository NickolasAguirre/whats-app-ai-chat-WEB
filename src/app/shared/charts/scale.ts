export interface NiceScale {
  max: number;
  ticks: number[];
}

/** Rounds the top of an axis to a clean number and returns evenly spaced integer ticks from 0. */
export function niceScale(maxValue: number, tickCount = 4): NiceScale {
  if (maxValue <= 0) return { max: 1, ticks: [0, 1] };
  const raw = maxValue / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(1, factor * magnitude);
  const max = Math.ceil(maxValue / step) * step;
  const ticks: number[] = [];
  for (let tick = 0; tick <= max; tick += step) ticks.push(tick);
  return { max, ticks };
}
