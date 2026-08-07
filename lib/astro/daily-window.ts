/** Rolling civil date helpers for sitemap / SSG windows. */

export function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  if (y < 1900 || y > 2100) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function shiftIsoDate(date: string, deltaDays: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function todayIsoLocal(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Inclusive window: today - before … today + after */
export function rollingIsoDates(before = 30, after = 30, now = new Date()): string[] {
  const today = todayIsoLocal(now);
  const out: string[] = [];
  for (let i = -before; i <= after; i++) {
    out.push(shiftIsoDate(today, i));
  }
  return out;
}

export function formatZhDate(date: string): string {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return date;
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
}
