/**
 * Weekly right/wrong loop: events that already happened but were never marked.
 * This is the addiction mechanic — "last week you logged X, was it right?"
 */

export type WeeklyCalibrationItem = {
  id: string;
  title: string;
  date: string;
  daysAgo: number;
};

export type WeeklyCalibrationInput = {
  id: string;
  title?: string | null;
  date?: string | Date | null;
  userFeedback?: { wasAccurate?: boolean | null } | null;
};

export function pickWeeklyCalibrationItems(
  events: WeeklyCalibrationInput[],
  now = new Date(),
): WeeklyCalibrationItem[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const items: WeeklyCalibrationItem[] = [];

  for (const ev of events) {
    if (!ev?.id) continue;
    if (ev.userFeedback && typeof ev.userFeedback.wasAccurate === 'boolean') continue;
    const dateStr = normalizeDate(ev.date);
    if (!dateStr) continue;
    const t = new Date(`${dateStr}T00:00:00`).getTime();
    if (!Number.isFinite(t)) continue;
    const daysAgo = Math.floor((today - t) / 86_400_000);
    if (daysAgo < 3 || daysAgo > 21) continue;
    items.push({
      id: ev.id,
      title: `${ev.title || '未命名节点'}`.trim() || '未命名节点',
      date: dateStr,
      daysAgo,
    });
  }

  return items.sort((a, b) => b.daysAgo - a.daysAgo).slice(0, 3);
}

function normalizeDate(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  if (raw instanceof Date) {
    if (!Number.isFinite(raw.getTime())) return '';
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = `${raw}`.trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}
