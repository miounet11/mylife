/**
 * Lightweight local store for World Yi era-hypothesis revisit scores.
 * Mirrors prediction outcome pattern (localStorage-first; no server required).
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
  return next;
}

export function clearEraHypothesisScore(hypothesisId: string): void {
  writeAll(readAll().filter((r) => r.hypothesisId !== hypothesisId));
}

export type EraHypothesisWithScore = EraHypothesis & {
  score: EraHypothesisScore | null;
};

export function listEraHypothesesWithScores(): EraHypothesisWithScore[] {
  const scores = readAll();
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
  const hit = scores.filter((s) => s.outcome === 'hit').length;
  const partial = scores.filter((s) => s.outcome === 'partial').length;
  const miss = scores.filter((s) => s.outcome === 'miss').length;
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
