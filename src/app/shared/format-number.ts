const numberFormat = new Intl.NumberFormat('es');
const decimalFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 });

export function formatInt(value: number): string {
  return numberFormat.format(Math.round(value));
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${decimalFormat.format(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

export function formatPercent(ratio: number): string {
  return `${decimalFormat.format(ratio * 100)} %`;
}
