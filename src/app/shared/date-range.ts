/** A date range as typed in two `<input type="date">` fields (`YYYY-MM-DD`); an empty string means "no limit". */
export interface DateFilter {
  from: string;
  to: string;
}

export const EMPTY_DATE_FILTER: DateFilter = { from: '', to: '' };

export function isFilterActive(filter: DateFilter): boolean {
  return !!(filter.from || filter.to);
}

/** Midnight at the start of today, in the browser's time zone. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** `YYYY-MM-DD` from a date input, read as the start of that day in the browser's time zone. */
export function parseDay(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * The instants a filter asks for. "Hasta" is inclusive, so it ends at the start of the next day.
 * Without any filter the range is today, so screens open on what is happening now.
 */
export function rangeOf(filter: DateFilter): { from?: Date; to?: Date } {
  if (!isFilterActive(filter)) return { from: startOfToday() };

  const lastDay = parseDay(filter.to);
  return {
    from: parseDay(filter.from),
    to: lastDay ? new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1) : undefined,
  };
}
