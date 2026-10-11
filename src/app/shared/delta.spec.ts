import { makeDelta } from './delta';

describe('makeDelta', () => {
  it('marks an increase as good when up is good', () => {
    expect(makeDelta(112, 100, 'up', 'ayer')).toEqual({ text: '+12 % vs. ayer', direction: 'up', tone: 'good' });
  });

  it('marks a decrease as good when down is good', () => {
    expect(makeDelta(3.1, 3.6, 'down', 'ayer')).toMatchObject({ direction: 'down', tone: 'good' });
  });

  it('marks a worsening change as bad', () => {
    expect(makeDelta(14, 10, 'down', 'semana anterior')).toMatchObject({ direction: 'up', tone: 'bad' });
  });

  it('reports no change and skips comparison without a previous value', () => {
    expect(makeDelta(100, 100, 'up', 'ayer')).toMatchObject({ direction: 'flat', tone: 'neutral' });
    expect(makeDelta(5, 0, 'up', 'ayer')).toBeNull();
  });
});
