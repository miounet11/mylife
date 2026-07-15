import type { YongShenResult } from '@/lib/bazi-analyzer';

export type LifeEventCategory =
  | 'job_change'
  | 'marriage'
  | 'birth'
  | 'move'
  | 'illness'
  | 'entrepreneurship'
  | 'study'
  | 'other';

export interface LifeEvent {
  id: string;
  category: LifeEventCategory;
  title: string;
  date: string;
  description?: string;
  impact?: string;
  createdAt: string;
}

export interface PredictionOutcomeSummary {
  category: string;
  total: number;
  fulfilled: number;
  partial: number;
  missed: number;
  pending: number;
  hitRate: number;
}

export type LifeProfileTone = 'direct' | 'gentle' | 'analytical';

export interface LifeProfile {
  birthSignature: string;
  yongShen: YongShenResult | null;
  pattern: string;
  keyEvents: LifeEvent[];
  predictionOutcomes: PredictionOutcomeSummary[];
  calibrationScore: number;
  calibrationByCategory: Record<string, number>;
  preferredTone?: LifeProfileTone;
  learningProgress: Record<string, number>;
  /** Most recent dimension slugs (newest first, capped) */
  recentDimensionSlugs?: string[];
  /** Visit / run counts per dimension slug */
  dimensionVisitCounts?: Record<string, number>;
  lastDimensionSlug?: string;
  lastDimensionAt?: string;
  lastReportId: string;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

export const LIFE_EVENT_CATEGORY_OPTIONS: Array<{ key: LifeEventCategory; label: string }> = [
  { key: 'job_change', label: '换工作' },
  { key: 'marriage', label: '结婚' },
  { key: 'birth', label: '生子' },
  { key: 'move', label: '搬家' },
  { key: 'illness', label: '生病' },
  { key: 'entrepreneurship', label: '创业' },
  { key: 'study', label: '升学/进修' },
  { key: 'other', label: '其他' },
];