import type { Prediction } from '@/lib/predictions/types';
import type { BirthInput } from '@/lib/fortune-context-builder';

export type DimensionSlug =
  | 'naming'
  | 'career-industry'
  | 'health'
  | 'study-career'
  | 'investment'
  | 'marriage'
  | 'fortune-rhythm'
  | 'partnership'
  | 'living-environment'
  | 'timing-selection';

export type DimensionMaturity = 'mvp' | 'preview' | 'planned';

/** Product priority: p0 deep-polish, p1 available, p2 experimental thin MVP */
export type DimensionPriority = 'p0' | 'p1' | 'p2';

export interface DimensionDefinition {
  slug: DimensionSlug;
  order: number;
  title: string;
  question: string;
  description: string;
  icon: string;
  maturity: DimensionMaturity;
  priority: DimensionPriority;
  engineTags: string[];
  disclaimer?: string;
  relatedIntent?: 'career' | 'wealth' | 'relationship' | 'yearly';
}

export interface DimensionReportSection {
  key: string;
  title: string;
  items: string[];
  tone?: 'default' | 'positive' | 'warning' | 'muted';
}

export interface DimensionReport {
  slug: DimensionSlug;
  title: string;
  question: string;
  generatedAt: string;
  birthSignature: string;
  sections: DimensionReportSection[];
  predictions: Prediction[];
  disclaimers: string[];
  meta?: Record<string, string | number>;
}

export interface DimensionAdvisorInput extends BirthInput {
  reportId?: string;
}