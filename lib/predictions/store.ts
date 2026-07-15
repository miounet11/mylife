import type { Prediction, PredictionAccuracyStats, PredictionOutcome } from './types';

const STORAGE_KEY = 'lk_predictions';

function readAll(): Prediction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Prediction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(predictions: Prediction[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
}

function isPending(prediction: Prediction): boolean {
  return !prediction.outcome || prediction.outcome === 'pending';
}

function parseDate(value: string): Date {
  return new Date(`${value}T23:59:59`);
}

function mergePredictions(existing: Prediction[], incoming: Prediction[]): Prediction[] {
  const mergedById = new Map<string, Prediction>();
  for (const item of [...existing, ...incoming]) {
    const previous = mergedById.get(item.id);
    if (previous?.outcome && previous.outcome !== 'pending' && isPending(item)) {
      mergedById.set(item.id, {
        ...item,
        outcome: previous.outcome,
        userFeedback: previous.userFeedback,
      });
    } else {
      mergedById.set(item.id, item);
    }
  }
  return Array.from(mergedById.values());
}

async function pushToServer(predictions: Prediction[]): Promise<void> {
  if (!predictions.length || typeof window === 'undefined') return;
  try {
    await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ predictions }),
    });
  } catch {
    // 离线或未登录时保留本地缓存
  }
}

export async function hydratePredictionsFromServer(): Promise<Prediction[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/predictions', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.predictions) || !data.authenticated) {
      return readAll();
    }
    const merged = mergePredictions(readAll(), data.predictions as Prediction[]);
    writeAll(merged);
    return merged.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } catch {
    return readAll();
  }
}

export function savePredictions(predictions: Prediction[]): void {
  if (!predictions.length) return;
  const existing = readAll();
  const reportIds = new Set(predictions.map((item) => item.reportId));
  const preserved = existing.filter((item) => !reportIds.has(item.reportId));
  const merged = mergePredictions(preserved, predictions);
  writeAll(merged);
  void pushToServer(merged.filter((item) => reportIds.has(item.reportId)));
}

export function getAllPredictions(): Prediction[] {
  return readAll().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getPredictionsForReport(reportId: string): Prediction[] {
  return readAll()
    .filter((item) => item.reportId === reportId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getDuePredictions(beforeDate = new Date()): Prediction[] {
  const cutoff = new Date(beforeDate);
  cutoff.setHours(0, 0, 0, 0);
  const cutoffMs = cutoff.getTime();
  return readAll()
    .filter((item) => isPending(item) && parseDate(item.dueDate).getTime() < cutoffMs)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getUpcomingPredictions(withinDays = 7): Prediction[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + withinDays);
  const startMs = start.getTime();
  const endMs = end.getTime();

  return readAll()
    .filter((item) => {
      if (!isPending(item)) return false;
      const dueMs = parseDate(item.dueDate).getTime();
      return dueMs >= startMs && dueMs <= endMs;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function updatePredictionOutcome(
  id: string,
  outcome: PredictionOutcome,
  feedback?: string,
): Promise<Prediction | null> {
  const all = readAll();
  const index = all.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const next: Prediction = {
    ...all[index],
    outcome,
    userFeedback: feedback?.trim() || all[index].userFeedback,
  };
  all[index] = next;
  writeAll(all);

  try {
    const res = await fetch(`/api/predictions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, feedback }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.prediction) {
      all[index] = {
        ...(data.prediction as Prediction),
        // preserve client-only dimension metadata if server omits it
        dimensionSlug: (data.prediction as Prediction).dimensionSlug || next.dimensionSlug,
        source: (data.prediction as Prediction).source || next.source,
      };
      writeAll(all);
    }
  } catch {
    // 保留本地反馈
  }

  // Keep LifeProfile calibration in sync for annual review / agent memory
  try {
    if (next.birthSignature) {
      const { syncPredictionOutcomesFromList } = await import('@/lib/life-profile/store');
      syncPredictionOutcomesFromList(next.birthSignature, readAll());
    }
  } catch {
    // non-blocking
  }

  return readAll().find((item) => item.id === id) || next;
}

export function getAccuracyStats(): PredictionAccuracyStats {
  const resolved = readAll().filter(
    (item) => item.outcome && item.outcome !== 'pending',
  );

  const total = resolved.length;
  const fulfilled = resolved.filter((item) => item.outcome === 'fulfilled').length;
  const hitRate = total ? fulfilled / total : 0;

  const byCategory: Record<string, number> = {};
  const grouped = resolved.reduce<Record<string, Prediction[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  for (const [category, items] of Object.entries(grouped)) {
    const hits = items.filter((item) => item.outcome === 'fulfilled').length;
    byCategory[category] = items.length ? hits / items.length : 0;
  }

  return { total, hitRate, byCategory };
}