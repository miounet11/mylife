import type {
  LifeEvent,
  LifeProfile,
  PredictionOutcomeSummary,
} from './types';
import { recalibrateKlineWeights } from './recalibrate';

const STORAGE_KEY = 'lk_life_profiles';
const LIFE_PROFILE_UPDATED_EVENT = 'lk-life-profile-updated';

type ProfileStore = Record<string, LifeProfile>;

function readStore(): ProfileStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProfileStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProfileStore): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function mergeProfiles(local: ProfileStore, remote: LifeProfile[]): ProfileStore {
  const merged = { ...local };
  for (const profile of remote) {
    if (!profile?.birthSignature) continue;
    const existing = merged[profile.birthSignature];
    if (!existing) {
      merged[profile.birthSignature] = profile;
      continue;
    }
    const existingUpdated = Date.parse(existing.updatedAt || '') || 0;
    const remoteUpdated = Date.parse(profile.updatedAt || '') || 0;
    merged[profile.birthSignature] = remoteUpdated >= existingUpdated ? profile : existing;
  }
  return merged;
}

async function pushProfileToServer(profile: LifeProfile): Promise<void> {
  if (!profile?.birthSignature || typeof window === 'undefined') return;
  try {
    await fetch('/api/life-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });
  } catch {
    // 离线或未登录时保留本地缓存
  }
}

export async function hydrateLifeProfilesFromServer(): Promise<LifeProfile[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/life-profile', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.profiles) || !data.authenticated) {
      return Object.values(readStore());
    }
    const merged = mergeProfiles(readStore(), data.profiles as LifeProfile[]);
    writeStore(merged);
    return Object.values(merged);
  } catch {
    return Object.values(readStore());
  }
}

function emitProfileUpdated(birthSignature: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(LIFE_PROFILE_UPDATED_EVENT, { detail: { birthSignature } }),
  );
}

function createEmptyProfile(birthSignature: string): LifeProfile {
  const now = new Date().toISOString();
  return {
    birthSignature,
    yongShen: null,
    pattern: '正格',
    keyEvents: [],
    predictionOutcomes: [],
    calibrationScore: 0,
    calibrationByCategory: {},
    learningProgress: {},
    lastReportId: '',
    reportCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function createEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeCalibrationScore(profile: LifeProfile): number {
  const outcomes = profile.predictionOutcomes;
  if (outcomes.length) {
    const weighted = outcomes.reduce(
      (acc, item) => {
        const resolved = item.total - item.pending;
        if (!resolved) return acc;
        acc.weighted += item.hitRate * resolved;
        acc.count += resolved;
        return acc;
      },
      { weighted: 0, count: 0 },
    );
    if (weighted.count > 0) {
      return Math.min(1, Math.max(0, weighted.weighted / weighted.count));
    }
  }

  const eventBoost = Math.min(profile.keyEvents.length * 0.03, 0.15);
  const feedbackEvents = profile.keyEvents.filter((item) => item.impact?.trim()).length;
  const feedbackBoost = Math.min(feedbackEvents * 0.02, 0.1);
  return Math.min(0.35 + eventBoost + feedbackBoost, 0.85);
}

function buildCalibrationByCategory(outcomes: PredictionOutcomeSummary[]): Record<string, number> {
  return outcomes.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = item.hitRate;
    return acc;
  }, {});
}

export function getProfile(birthSignature: string): LifeProfile | null {
  if (!birthSignature) return null;
  const store = readStore();
  return store[birthSignature] || null;
}

export function getOrCreateProfile(birthSignature: string): LifeProfile {
  const existing = getProfile(birthSignature);
  if (existing) return existing;
  return createEmptyProfile(birthSignature);
}

export function updateProfile(
  birthSignature: string,
  patch: Partial<Omit<LifeProfile, 'birthSignature' | 'createdAt'>>,
): LifeProfile {
  const store = readStore();
  const current = store[birthSignature] || createEmptyProfile(birthSignature);
  const next: LifeProfile = {
    ...current,
    ...patch,
    birthSignature,
    updatedAt: new Date().toISOString(),
  };

  if (patch.predictionOutcomes) {
    next.calibrationByCategory = buildCalibrationByCategory(patch.predictionOutcomes);
    next.calibrationScore = computeCalibrationScore(next);
  } else if (patch.keyEvents) {
    next.calibrationScore = computeCalibrationScore(next);
  }

  store[birthSignature] = next;
  writeStore(store);
  void pushProfileToServer(next);
  emitProfileUpdated(birthSignature);
  return next;
}

export function recordLifeEvent(
  birthSignature: string,
  event: Omit<LifeEvent, 'id' | 'createdAt'> & { id?: string },
): LifeProfile {
  const profile = getOrCreateProfile(birthSignature);
  const nextEvent: LifeEvent = {
    ...event,
    id: event.id || createEventId(),
    createdAt: new Date().toISOString(),
  };

  const existingIndex = profile.keyEvents.findIndex((item) => item.id === nextEvent.id);
  const keyEvents =
    existingIndex >= 0
      ? profile.keyEvents.map((item, index) => (index === existingIndex ? nextEvent : item))
      : [nextEvent, ...profile.keyEvents].sort((a, b) => b.date.localeCompare(a.date));

  const draft: LifeProfile = { ...profile, keyEvents };
  recalibrateKlineWeights(draft, nextEvent);

  return updateProfile(birthSignature, {
    keyEvents,
    calibrationScore: computeCalibrationScore({ ...draft }),
  });
}

export function deleteLifeEvent(birthSignature: string, eventId: string): LifeProfile | null {
  const profile = getProfile(birthSignature);
  if (!profile) return null;

  const keyEvents = profile.keyEvents.filter((item) => item.id !== eventId);
  return updateProfile(birthSignature, {
    keyEvents,
    calibrationScore: computeCalibrationScore({ ...profile, keyEvents }),
  });
}

export function getRecentEvents(birthSignature: string, limit = 5): LifeEvent[] {
  const profile = getProfile(birthSignature);
  if (!profile) return [];
  return [...profile.keyEvents]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function updateLearningProgress(
  birthSignature: string,
  trackKey: string,
  progress: number,
): LifeProfile {
  const profile = getOrCreateProfile(birthSignature);
  const bounded = Math.min(100, Math.max(0, Math.round(progress)));
  return updateProfile(birthSignature, {
    learningProgress: {
      ...profile.learningProgress,
      [trackKey]: bounded,
    },
  });
}

const MAX_RECENT_DIMENSIONS = 12;

/** Record a dimension page run / visit for recommendations and annual review. */
export function recordDimensionVisit(
  birthSignature: string,
  dimensionSlug: string,
): LifeProfile {
  const profile = getOrCreateProfile(birthSignature);
  const now = new Date().toISOString();
  const previous = (profile.recentDimensionSlugs || []).filter((item) => item !== dimensionSlug);
  const recentDimensionSlugs = [dimensionSlug, ...previous].slice(0, MAX_RECENT_DIMENSIONS);
  const dimensionVisitCounts = {
    ...(profile.dimensionVisitCounts || {}),
    [dimensionSlug]: (profile.dimensionVisitCounts?.[dimensionSlug] || 0) + 1,
  };
  const learningKey = `dimension:${dimensionSlug}`;
  const learningProgress = {
    ...profile.learningProgress,
    [learningKey]: Math.min(100, (profile.learningProgress[learningKey] || 0) + 20),
  };

  return updateProfile(birthSignature, {
    recentDimensionSlugs,
    dimensionVisitCounts,
    lastDimensionSlug: dimensionSlug,
    lastDimensionAt: now,
    learningProgress,
  });
}

/** Rebuild prediction outcome summaries from a flat prediction list. */
export function syncPredictionOutcomesFromList(
  birthSignature: string,
  predictions: Array<{
    category: string;
    outcome?: string | null;
    birthSignature?: string;
  }>,
): LifeProfile {
  const mine = predictions.filter(
    (item) => !item.birthSignature || item.birthSignature === birthSignature,
  );
  const byCategory = new Map<string, PredictionOutcomeSummary>();

  for (const item of mine) {
    const category = item.category || 'timing';
    const row = byCategory.get(category) || {
      category,
      total: 0,
      fulfilled: 0,
      partial: 0,
      missed: 0,
      pending: 0,
      hitRate: 0,
    };
    row.total += 1;
    const outcome = item.outcome || 'pending';
    if (outcome === 'fulfilled') row.fulfilled += 1;
    else if (outcome === 'partial') row.partial += 1;
    else if (outcome === 'missed') row.missed += 1;
    else row.pending += 1;
    byCategory.set(category, row);
  }

  const predictionOutcomes = [...byCategory.values()].map((row) => {
    const resolved = row.fulfilled + row.partial + row.missed;
    const hitRate = resolved ? (row.fulfilled + row.partial * 0.5) / resolved : 0;
    return { ...row, hitRate };
  });

  return updateProfile(birthSignature, { predictionOutcomes });
}

export function subscribeLifeProfileUpdates(
  handler: (birthSignature: string) => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ birthSignature?: string }>;
    if (custom.detail?.birthSignature) {
      handler(custom.detail.birthSignature);
    }
  };

  window.addEventListener(LIFE_PROFILE_UPDATED_EVENT, listener);
  return () => window.removeEventListener(LIFE_PROFILE_UPDATED_EVENT, listener);
}