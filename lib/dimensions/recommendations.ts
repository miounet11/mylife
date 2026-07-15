import { DIMENSIONS, MVP_DIMENSION_SLUGS } from './config';
import type { DimensionDefinition, DimensionSlug } from './types';
import type { ProfileIntent } from '@/lib/profile-settings-types';

export interface DimensionRecommendation {
  slug: DimensionSlug;
  title: string;
  question: string;
  icon: string;
  reason: string;
  score: number;
  progress: number;
}

export interface RecommendDimensionsInput {
  intent?: ProfileIntent | null;
  learningProgress?: Record<string, number>;
  /** Recent dimension slugs from LifeProfile (newest first) */
  recentDimensionSlugs?: string[];
  dimensionVisitCounts?: Record<string, number>;
  limit?: number;
}

const INTENT_LABEL: Record<ProfileIntent, string> = {
  career: '事业发展',
  wealth: '财运规划',
  relationship: '婚恋关系',
  yearly: '年度流年',
};

const INTENT_PRIORITY: Record<ProfileIntent, DimensionSlug[]> = {
  career: ['career-industry', 'study-career', 'partnership', 'fortune-rhythm', 'timing-selection', 'investment'],
  wealth: ['investment', 'fortune-rhythm', 'timing-selection', 'career-industry', 'partnership'],
  relationship: ['marriage', 'partnership', 'fortune-rhythm', 'living-environment', 'timing-selection'],
  yearly: ['fortune-rhythm', 'timing-selection', 'health', 'living-environment', 'naming', 'investment'],
};

const DEFAULT_INTENT: ProfileIntent = 'yearly';

function dimensionProgress(learningProgress: Record<string, number> | undefined, slug: DimensionSlug): number {
  return Math.max(0, Math.min(100, learningProgress?.[`dimension:${slug}`] || 0));
}

function buildReason(
  dimension: DimensionDefinition,
  intent: ProfileIntent,
  progress: number,
): string {
  if (progress >= 100) return '已完成首轮研判，建议同步预测回访验证命中情况';
  if (progress >= 40) return `已探索 ${progress}%，可继续深化或切换相邻维度`;
  if (dimension.relatedIntent === intent) {
    return `与当前「${INTENT_LABEL[intent]}」关注点高度匹配`;
  }
  return '窄场景研判，结论带时间窗与可验证预测';
}

function scoreDimension(
  dimension: DimensionDefinition,
  intent: ProfileIntent,
  learningProgress?: Record<string, number>,
  recentDimensionSlugs?: string[],
  dimensionVisitCounts?: Record<string, number>,
): number {
  let score = 0;
  const progress = dimensionProgress(learningProgress, dimension.slug);

  if (dimension.relatedIntent === intent) {
    score += 52;
  }

  const priority = INTENT_PRIORITY[intent];
  const priorityIndex = priority.indexOf(dimension.slug);
  if (priorityIndex >= 0) {
    score += (priority.length - priorityIndex) * 9;
  }

  const recentIndex = recentDimensionSlugs?.indexOf(dimension.slug) ?? -1;
  if (recentIndex === 0) score += 8;
  else if (recentIndex > 0 && recentIndex < 4) score += 4;

  const visits = dimensionVisitCounts?.[dimension.slug] || 0;
  if (visits > 0 && progress < 100) score += Math.min(visits * 2, 10);

  if (progress >= 100) {
    // Fully explored: push below unexplored peers (ignore priority boost)
    score -= 40;
  } else if (progress > 0) {
    score -= progress * 0.18;
    if (dimension.priority === 'p0') score += 10;
    else if (dimension.priority === 'p1') score += 4;
  } else {
    // Prefer product P0 deep-polish when scores are close
    if (dimension.priority === 'p0') score += 14;
    else if (dimension.priority === 'p1') score += 6;
  }

  score += Math.max(0, 12 - dimension.order);

  return score;
}

export function recommendDimensions(input: RecommendDimensionsInput = {}): DimensionRecommendation[] {
  const intent = input.intent || DEFAULT_INTENT;
  const limit = input.limit ?? 3;
  const learningProgress = input.learningProgress || {};
  const recentDimensionSlugs = input.recentDimensionSlugs || [];
  const dimensionVisitCounts = input.dimensionVisitCounts || {};

  const ranked = MVP_DIMENSION_SLUGS
    .map((slug) => DIMENSIONS.find((item) => item.slug === slug))
    .filter((item): item is DimensionDefinition => Boolean(item))
    .map((dimension) => {
      const progress = dimensionProgress(learningProgress, dimension.slug);
      return {
        slug: dimension.slug,
        title: dimension.title,
        question: dimension.question,
        icon: dimension.icon,
        reason: buildReason(dimension, intent, progress),
        score: scoreDimension(
          dimension,
          intent,
          learningProgress,
          recentDimensionSlugs,
          dimensionVisitCounts,
        ),
        progress,
      };
    })
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

  return ranked.slice(0, limit);
}

export function resolveRecommendationIntent(
  fortuneIntent?: string | null,
  fallback?: ProfileIntent | null,
): ProfileIntent {
  const candidates = [fortuneIntent, fallback] as const;
  for (const value of candidates) {
    if (value === 'career' || value === 'wealth' || value === 'relationship' || value === 'yearly') {
      return value;
    }
  }
  return DEFAULT_INTENT;
}

export function mergeLearningProgress(
  profiles: Array<{ learningProgress?: Record<string, number> }>,
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const profile of profiles) {
    for (const [key, value] of Object.entries(profile.learningProgress || {})) {
      const current = merged[key] || 0;
      merged[key] = Math.max(current, value);
    }
  }
  return merged;
}