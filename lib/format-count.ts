export function formatCompactCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '0';
  }

  if (value >= 10_000) {
    const wan = value / 10_000;
    const rounded = Math.round(wan * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}万` : `${rounded.toFixed(1).replace(/\.0$/, '')}万`;
  }

  return String(Math.round(value));
}