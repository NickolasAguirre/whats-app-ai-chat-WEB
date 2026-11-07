import { formatMessageTime } from './format-time';

describe('formatMessageTime', () => {
  const now = new Date(2026, 9, 14, 15, 30);

  it('shows the hour for today', () => {
    expect(formatMessageTime(new Date(2026, 9, 14, 9, 5), now)).toMatch(/^0?9:05/);
  });

  it('says "ayer" for yesterday', () => {
    expect(formatMessageTime(new Date(2026, 9, 13, 23, 59), now)).toBe('ayer');
  });

  it('shows the weekday within the last week', () => {
    expect(formatMessageTime(new Date(2026, 9, 10, 12, 0), now)).toMatch(/^s[aá]b/);
  });

  it('shows day and month for older messages', () => {
    expect(formatMessageTime(new Date(2026, 8, 20, 12, 0), now)).toBe('20 sept');
  });
});
