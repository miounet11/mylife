export type PredictionCategory = 'career' | 'wealth' | 'marriage' | 'health' | 'timing';

export type PredictionOutcome = 'fulfilled' | 'partial' | 'missed' | 'pending';

export type PredictionSource = 'dimension' | 'report' | 'manual';

export interface Prediction {
  id: string;
  reportId: string;
  birthSignature: string;
  category: PredictionCategory;
  statement: string;
  confidence: number;
  dueDate: string;
  window?: string;
  evidence: string;
  verifyChecklist: string[];
  outcome?: PredictionOutcome;
  userFeedback?: string;
  createdAt: string;
  /** Ten-dimension slug when prediction comes from /dimensions/* */
  dimensionSlug?: string;
  source?: PredictionSource;
}

export interface PredictionAccuracyStats {
  total: number;
  hitRate: number;
  byCategory: Record<string, number>;
}