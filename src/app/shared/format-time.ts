const DAY_MS = 86_400_000;
const time = new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' });
const weekday = new Intl.DateTimeFormat('es', { weekday: 'short' });
const dayMonth = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Short label for a message list: the hour today, "ayer", the weekday this week, otherwise day and month. */
export function formatMessageTime(date: Date, now: Date = new Date()): string {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (daysAgo <= 0) return time.format(date);
  if (daysAgo === 1) return 'ayer';
  if (daysAgo < 7) return weekday.format(date).replace('.', '');
  return dayMonth.format(date).replace('.', '');
}
