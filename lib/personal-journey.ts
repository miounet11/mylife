export type JourneyEntry = {
  href: string;
  title: string;
  kind: 'tool' | 'article' | 'report';
  visitedAt: string;
};

const STORAGE_KEY = 'lk_personal_journey';
const MAX_ENTRIES = 6;

export function readPersonalJourney(): JourneyEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JourneyEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordJourneyVisit(entry: Omit<JourneyEntry, 'visitedAt'>) {
  if (typeof window === 'undefined') return;
  const existing = readPersonalJourney().filter((item) => item.href !== entry.href);
  const next: JourneyEntry[] = [
    { ...entry, visitedAt: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_ENTRIES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}