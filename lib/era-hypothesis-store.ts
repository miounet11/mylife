/**
 * Local + server sync for World Yi era-hypothesis revisit scores.
 * localStorage-first; hydrate/push mirrors predictions store.
 */

import type { EraHypothesis } from '@/lib/world-yi-era-timing';
import { ERA_HYPOTHESES } from '@/lib/world-yi-era-timing';

export type EraHypothesisOutcome = 'hit' | 'partial' | 'miss' | 'pending';

export type EraHypothesisScore = {
  hypothesisId: string;
  outcome: EraHypothesisOutcome;
  note?: string;
  scoredAt?: string;
  updatedAt: string;
};

const STORAGE_KEY = 'lk_era_hypothesis_scores_v1';

function readAll(): EraHypothesisScore[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EraHypothesisScore[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: EraHypothesisScore[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // quota / private mode
  }
}

function ts(value?: string): number {
  if (!value) return 0;
  const n = Date.parse(value);
  return Number.isFinite(n) ? n : 0;
}

/** Last-write-wins merge by updatedAt. */
export function mergeEraHypothesisScores(
  local: EraHypothesisScore[],
  remote: EraHypothesisScore[],
): EraHypothesisScore[] {
  const map = new Map<string, EraHypothesisScore>();
  for (const item of [...local, ...remote]) {
    const id = `${item.hypothesisId || ''}`.trim();
    if (!id) continue;
    const prev = map.get(id);
    if (!prev || ts(item.updatedAt) >= ts(prev.updatedAt)) {
      map.set(id, { ...item, hypothesisId: id });
    }
  }
  return Array.from(map.values()).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
}

async function pushToServer(scores: EraHypothesisScore[]): Promise<EraHypothesisScore[] | null> {
  if (typeof window === 'undefined' || !scores.length) return null;
  try {
    const res = await fetch('/api/era-hypotheses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) return null;
    if (Array.isArray(data.scores)) return data.scores as EraHypothesisScore[];
    return null;
  } catch {
    return null;
  }
}

export function listEraHypothesisScores(): EraHypothesisScore[] {
  return readAll();
}

export function getEraHypothesisScore(hypothesisId: string): EraHypothesisScore | null {
  return readAll().find((r) => r.hypothesisId === hypothesisId) || null;
}

export function saveEraHypothesisScore(input: {
  hypothesisId: string;
  outcome: Exclude<EraHypothesisOutcome, 'pending'>;
  note?: string;
}): EraHypothesisScore {
  const now = new Date().toISOString();
  const prev = getEraHypothesisScore(input.hypothesisId);
  const next: EraHypothesisScore = {
    hypothesisId: input.hypothesisId,
    outcome: input.outcome,
    note: `${input.note || ''}`.trim() || undefined,
    scoredAt: prev?.scoredAt || now,
    updatedAt: now,
  };
  const others = readAll().filter((r) => r.hypothesisId !== input.hypothesisId);
  writeAll([next, ...others]);
  // fire-and-forget server sync
  void pushToServer([next]).then((remote) => {
    if (!remote) return;
    writeAll(mergeEraHypothesisScores(readAll(), remote));
  });
  return next;
}

export function clearEraHypothesisScore(hypothesisId: string): void {
  writeAll(readAll().filter((r) => r.hypothesisId !== hypothesisId));
  if (typeof window === 'undefined') return;
  void fetch('/api/era-hypotheses', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hypothesisId }),
  }).catch(() => undefined);
}

export async function hydrateEraHypothesisScoresFromServer(): Promise<EraHypothesisScore[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/era-hypotheses', { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.success || !Array.isArray(data.scores)) {
      return readAll();
    }
    const merged = mergeEraHypothesisScores(readAll(), data.scores as EraHypothesisScore[]);
    writeAll(merged);
    // push local-only wins back so server catches up
    void pushToServer(merged);
    return merged;
  } catch {
    return readAll();
  }
}

export type EraHypothesisWithScore = EraHypothesis & {
  score: EraHypothesisScore | null;
};

export function listEraHypothesesWithScores(
  scores: EraHypothesisScore[] = readAll(),
): EraHypothesisWithScore[] {
  const byId = new Map(scores.map((s) => [s.hypothesisId, s]));
  return ERA_HYPOTHESES.map((h) => ({
    ...h,
    score: byId.get(h.id) || null,
  }));
}

export function summarizeEraHypothesisScores(scores: EraHypothesisScore[] = readAll()): {
  total: number;
  hit: number;
  partial: number;
  miss: number;
  pending: number;
  catalogSize: number;
} {
  const resolved = scores.filter((s) => s.outcome && s.outcome !== 'pending');
  const hit = resolved.filter((s) => s.outcome === 'hit').length;
  const partial = resolved.filter((s) => s.outcome === 'partial').length;
  const miss = resolved.filter((s) => s.outcome === 'miss').length;
  const catalogSize = ERA_HYPOTHESES.length;
  const scored = hit + partial + miss;
  return {
    total: scored,
    hit,
    partial,
    miss,
    pending: Math.max(0, catalogSize - scored),
    catalogSize,
  };
}
