import type { LifeProfile } from '@/lib/life-profile/types';
import {
  dimensionLabel,
  resolvePredictionDimensionSlug,
} from '@/lib/predictions/dimension-source';
import type { Prediction } from '@/lib/predictions/types';

export interface AnnualReviewHighlight {
  id: string;
  category: string;
  statement: string;
  outcome: 'fulfilled' | 'partial' | 'missed';
  note?: string;
}

export interface DimensionReviewStat {
  slug: string;
  title: string;
  total: number;
  feedbackCount: number;
  hitRate: number;
  visits: number;
}

export interface AnnualReview {
  year: number;
  hitRate: number;
  hitRateByCategory: Record<string, number>;
  totalPredictions: number;
  feedbackCount: number;
  highlights: AnnualReviewHighlight[];
  misses: AnnualReviewHighlight[];
  adjustments: string[];
  dimensionStats: DimensionReviewStat[];
}

const CATEGORY_LABELS: Record<string, string> = {
  career: '事业',
  wealth: '财富',
  marriage: '关系',
  health: '健康',
  timing: '时序',
};

function yearFromDate(value: string): number | null {
  const year = Number.parseInt(value.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

function predictionsForYear(predictions: Prediction[], year: number): Prediction[] {
  return predictions.filter((item) => {
    const dueYear = yearFromDate(item.dueDate);
    const createdYear = yearFromDate(item.createdAt);
    return dueYear === year || createdYear === year;
  });
}

function buildDimensionStats(
  profile: LifeProfile,
  predictions: Prediction[],
): DimensionReviewStat[] {
  const buckets = new Map<string, Prediction[]>();
  for (const item of predictions) {
    const slug = resolvePredictionDimensionSlug(item);
    if (!slug) continue;
    const list = buckets.get(slug) || [];
    list.push(item);
    buckets.set(slug, list);
  }

  const visitCounts = profile.dimensionVisitCounts || {};
  const slugs = new Set([...buckets.keys(), ...Object.keys(visitCounts)]);

  return [...slugs]
    .map((slug) => {
      const items = buckets.get(slug) || [];
      const resolved = items.filter((item) => item.outcome && item.outcome !== 'pending');
      const fulfilled = resolved.filter((item) => item.outcome === 'fulfilled').length;
      const partial = resolved.filter((item) => item.outcome === 'partial').length;
      const hitRate = resolved.length ? (fulfilled + partial * 0.5) / resolved.length : 0;
      return {
        slug,
        title: dimensionLabel(slug),
        total: items.length,
        feedbackCount: resolved.length,
        hitRate,
        visits: visitCounts[slug] || 0,
      };
    })
    .filter((item) => item.total > 0 || item.visits > 0)
    .sort((a, b) => b.total - a.total || b.visits - a.visits);
}

export function buildAnnualReview(
  profile: LifeProfile,
  year: number,
  options?: { predictions?: Prediction[] },
): AnnualReview {
  const yearEvents = profile.keyEvents.filter((item) => yearFromDate(item.date) === year);
  const yearPredictions = predictionsForYear(options?.predictions || [], year);
  const outcomes = profile.predictionOutcomes;

  let totalPredictions = outcomes.reduce((sum, item) => sum + item.total, 0);
  let feedbackCount = outcomes.reduce(
    (sum, item) => sum + (item.total - item.pending),
    0,
  );

  let hitRateByCategory = outcomes.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = item.hitRate;
    return acc;
  }, {});

  // Prefer live prediction list when profile outcomes are empty / stale
  if (yearPredictions.length) {
    totalPredictions = yearPredictions.length;
    const resolved = yearPredictions.filter((item) => item.outcome && item.outcome !== 'pending');
    feedbackCount = resolved.length;
    const byCategory = new Map<string, { hit: number; total: number }>();
    for (const item of resolved) {
      const row = byCategory.get(item.category) || { hit: 0, total: 0 };
      row.total += 1;
      if (item.outcome === 'fulfilled') row.hit += 1;
      else if (item.outcome === 'partial') row.hit += 0.5;
      byCategory.set(item.category, row);
    }
    hitRateByCategory = Object.fromEntries(
      [...byCategory.entries()].map(([category, row]) => [
        category,
        row.total ? row.hit / row.total : 0,
      ]),
    );
  }

  const hitRateFromPredictions = (() => {
    if (!yearPredictions.length) return 0;
    const resolved = yearPredictions.filter((item) => item.outcome && item.outcome !== 'pending');
    if (!resolved.length) return 0;
    const score = resolved.reduce((sum, item) => {
      if (item.outcome === 'fulfilled') return sum + 1;
      if (item.outcome === 'partial') return sum + 0.5;
      return sum;
    }, 0);
    return score / resolved.length;
  })();

  const hitRate =
    hitRateFromPredictions ||
    profile.calibrationScore ||
    computeWeightedHitRate(outcomes);

  const dimensionStats = buildDimensionStats(profile, yearPredictions);

  const highlights: AnnualReviewHighlight[] = outcomes
    .flatMap((item) => {
      const fulfilled = Math.max(0, item.fulfilled);
      if (!fulfilled) return [];
      return Array.from({ length: Math.min(fulfilled, 1) }).map((_, index) => ({
        id: `${item.category}-hit-${index}`,
        category: formatCategory(item.category),
        statement: `${year} 年${formatCategory(item.category)}线预测命中率 ${Math.round(item.hitRate * 100)}%`,
        outcome: 'fulfilled' as const,
        note: item.total ? `共 ${item.total} 条预测，已反馈 ${item.total - item.pending} 条` : undefined,
      }));
    })
    .slice(0, 3);

  for (const dim of dimensionStats.filter((item) => item.hitRate >= 0.6 && item.feedbackCount > 0)) {
    if (highlights.length >= 3) break;
    highlights.push({
      id: `dim-hit-${dim.slug}`,
      category: dim.title,
      statement: `「${dim.title}」维度命中率 ${Math.round(dim.hitRate * 100)}%`,
      outcome: 'fulfilled',
      note: `${dim.feedbackCount} 条已反馈 · 访问 ${dim.visits} 次`,
    });
  }

  if (highlights.length < 3 && yearEvents.length) {
    for (const event of yearEvents.slice(0, 3 - highlights.length)) {
      highlights.push({
        id: event.id,
        category: event.category,
        statement: event.title,
        outcome: 'fulfilled',
        note: event.impact || event.description,
      });
    }
  }

  const misses: AnnualReviewHighlight[] = outcomes
    .filter((item) => item.missed > 0 || (item.hitRate < 0.5 && item.total - item.pending > 0))
    .sort((a, b) => a.hitRate - b.hitRate)
    .slice(0, 2)
    .map((item) => ({
      id: `${item.category}-miss`,
      category: formatCategory(item.category),
      statement: `${formatCategory(item.category)}线命中率偏低（${Math.round(item.hitRate * 100)}%）`,
      outcome: item.missed > 0 ? 'missed' as const : 'partial' as const,
      note: '需校准',
    }));

  for (const dim of dimensionStats.filter((item) => item.feedbackCount > 0 && item.hitRate < 0.5)) {
    if (misses.length >= 2) break;
    misses.push({
      id: `dim-miss-${dim.slug}`,
      category: dim.title,
      statement: `「${dim.title}」维度命中率偏低（${Math.round(dim.hitRate * 100)}%）`,
      outcome: 'partial',
      note: '建议补充事件回填后再跑一次维度研判',
    });
  }

  const adjustments = buildAdjustments(
    profile,
    year,
    hitRate,
    hitRateByCategory,
    yearEvents.length,
    dimensionStats,
  );

  return {
    year,
    hitRate,
    hitRateByCategory,
    totalPredictions,
    feedbackCount,
    highlights,
    misses,
    adjustments,
    dimensionStats,
  };
}

function computeWeightedHitRate(
  outcomes: LifeProfile['predictionOutcomes'],
): number {
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
  return weighted.count ? weighted.weighted / weighted.count : 0;
}

function buildAdjustments(
  profile: LifeProfile,
  year: number,
  hitRate: number,
  hitRateByCategory: Record<string, number>,
  yearEventCount: number,
  dimensionStats: DimensionReviewStat[] = [],
): string[] {
  const adjustments: string[] = [];

  if (hitRate >= 0.7) {
    adjustments.push(`${year + 1} 年可维持当前解读深度，优先展开历史高命中领域。`);
  } else if (hitRate > 0) {
    adjustments.push(`${year + 1} 年建议缩小时间窗口、增加可验证节点，避免过度展开低命中领域。`);
  } else {
    adjustments.push(`${year + 1} 年建议先补充人生事件与预测反馈，再生成深度报告。`);
  }

  const weakCategories = Object.entries(hitRateByCategory)
    .filter(([, rate]) => rate < 0.5)
    .map(([category]) => formatCategory(category));

  if (weakCategories.length) {
    adjustments.push(`以下领域命中率偏低，${year + 1} 年解读将降低权重：${weakCategories.join('、')}。`);
  }

  const strongDims = dimensionStats
    .filter((item) => item.hitRate >= 0.65 && item.feedbackCount > 0)
    .slice(0, 2)
    .map((item) => item.title);
  if (strongDims.length) {
    adjustments.push(`${year + 1} 年优先继续使用高命中维度：${strongDims.join('、')}。`);
  }

  const weakDims = dimensionStats
    .filter((item) => item.feedbackCount > 0 && item.hitRate < 0.45)
    .slice(0, 2)
    .map((item) => item.title);
  if (weakDims.length) {
    adjustments.push(`维度「${weakDims.join('、')}」需补充事件回填后再研判。`);
  }

  if (yearEventCount >= 3) {
    adjustments.push(`已记录 ${yearEventCount} 条 ${year} 年真实事件，事业/关系线将结合用户反馈校准。`);
  }

  const topLearning = Object.entries(profile.learningProgress)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)[0];

  if (topLearning && topLearning[1] >= 60) {
    adjustments.push(`学习路径「${topLearning[0]}」完成度 ${topLearning[1]}%，下次报告将采用更深入的专业表达。`);
  }

  const recent = profile.recentDimensionSlugs?.[0];
  if (recent) {
    adjustments.push(`你最近常看「${dimensionLabel(recent)}」，可把它设为 ${year + 1} 年默认复访入口。`);
  }

  return adjustments.slice(0, 5);
}