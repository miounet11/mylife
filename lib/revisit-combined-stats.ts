/**
 * Merge personal prediction revisit stats with era-hypothesis scores
 * for annual review / predictions hub summary.
 */

import { summarizeEraHypothesisScores, type EraHypothesisScore } from '@/lib/era-hypothesis-store';
import {
  summarizePredictionRevisits,
  type PredictionRevisitStats,
} from '@/lib/predictions/revisit-stats';
import type { Prediction } from '@/lib/predictions/types';

export type CombinedRevisitStats = {
  predictions: PredictionRevisitStats & { catalog: number };
  era: {
    total: number;
    hit: number;
    partial: number;
    miss: number;
    pending: number;
    catalogSize: number;
  };
  combined: {
    resolved: number;
    hit: number;
    partial: number;
    miss: number;
    /** (hit + 0.5*partial) / resolved */
    hitRate: number;
  };
};

export function buildCombinedRevisitStats(input: {
  predictions?: Prediction[] | null;
  eraScores?: EraHypothesisScore[] | null;
}): CombinedRevisitStats {
  const predRows = (input.predictions || []).map((p) => ({
    outcome: p.outcome,
    status: p.outcome,
  }));
  const pred = summarizePredictionRevisits(predRows);
  const era = summarizeEraHypothesisScores(input.eraScores || []);

  const hit = pred.hitCount + era.hit;
  const partial = (pred.partialCount || 0) + era.partial;
  const miss = (pred.missCount || 0) + era.miss;
  const resolved = hit + partial + miss;
  const hitRate = resolved > 0 ? (hit + partial * 0.5) / resolved : 0;

  return {
    predictions: {
      ...pred,
      catalog: (input.predictions || []).length,
    },
    era,
    combined: {
      resolved,
      hit,
      partial,
      miss,
      hitRate,
    },
  };
}
