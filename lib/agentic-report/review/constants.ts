export const REVIEW_SCORE_THRESHOLD = 80;

export const VERIFY_RULES = [
  'score_bounds',
  'anchor_trend_consistency',
  'element_consistency',
  'pipeline_consistency',
  'temporal_context_consistency',
  'geo_climate_consistency',
  'macro_cycle_alignment',
] as const;

export type VerifyRule = (typeof VERIFY_RULES)[number];
