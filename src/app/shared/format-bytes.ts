const UNITS = ['B', 'KB', 'MB'] as const;

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = unit === 0 ? value.toFixed(0) : value.toFixed(1).replace('.', ',');
  return `${rounded} ${UNITS[unit]}`;
}
