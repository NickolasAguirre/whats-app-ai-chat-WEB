import { niceScale } from './scale';

describe('niceScale', () => {
  it('rounds the axis top to a clean number with integer ticks from zero', () => {
    const { max, ticks } = niceScale(87);
    expect(max).toBeGreaterThanOrEqual(87);
    expect(ticks[0]).toBe(0);
    expect(ticks.at(-1)).toBe(max);
    expect(ticks.every(Number.isInteger)).toBe(true);
  });

  it('keeps small values on whole-number ticks', () => {
    const { max, ticks } = niceScale(3);
    expect(max).toBe(3);
    expect(ticks).toEqual([0, 1, 2, 3]);
  });

  it('handles an empty series', () => {
    expect(niceScale(0)).toEqual({ max: 1, ticks: [0, 1] });
  });
});
