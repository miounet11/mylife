import type { LifeEvent, LifeEventCategory, LifeProfile } from './types';

export type KlineDimension = 'career' | 'wealth' | 'marriage' | 'health';

export interface KlineWeightAdjustment {
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  reason: string;
}

const CATEGORY_DIMENSION_MAP: Record<LifeEventCategory, KlineDimension | null> = {
  job_change: 'career',
  entrepreneurship: 'career',
  study: 'career',
  marriage: 'marriage',
  birth: 'marriage',
  move: 'wealth',
  illness: 'health',
  other: null,
};

const BASE_BOOST = 0.04;
const IMPACT_BOOST = 0.02;

function eventYear(date: string): number | null {
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function recentEventCount(profile: LifeProfile, category: LifeEventCategory, withinYears = 5): number {
  const currentYear = new Date().getFullYear();
  return profile.keyEvents.filter((item) => {
    if (item.category !== category) return false;
    const year = eventYear(item.date);
    return year !== null && currentYear - year <= withinYears;
  }).length;
}

export function recalibrateKlineWeights(
  profile: LifeProfile,
  event: LifeEvent,
): KlineWeightAdjustment {
  const adjustment: KlineWeightAdjustment = {
    career: 0,
    wealth: 0,
    marriage: 0,
    health: 0,
    reason: '无显著权重调整',
  };

  const dimension = CATEGORY_DIMENSION_MAP[event.category];
  if (!dimension) {
    return adjustment;
  }

  let boost = BASE_BOOST;
  if (event.impact?.trim()) {
    boost += IMPACT_BOOST;
  }

  const repeated = recentEventCount(profile, event.category);
  if (repeated > 1) {
    boost += 0.01 * Math.min(repeated - 1, 3);
  }

  adjustment[dimension] = boost;
  adjustment.reason = `用户记录「${event.title}」，强化${dimension}线解读权重 +${(boost * 100).toFixed(0)}%`;

  return adjustment;
}

export function mergeWeightAdjustments(
  adjustments: KlineWeightAdjustment[],
): KlineWeightAdjustment {
  const merged: KlineWeightAdjustment = {
    career: 0,
    wealth: 0,
    marriage: 0,
    health: 0,
    reason: '综合人生事件校准',
  };

  for (const item of adjustments) {
    merged.career += item.career;
    merged.wealth += item.wealth;
    merged.marriage += item.marriage;
    merged.health += item.health;
  }

  const active = (Object.entries(merged) as Array<[keyof KlineWeightAdjustment, number | string]>)
    .filter(([key, value]) => key !== 'reason' && typeof value === 'number' && value > 0)
    .map(([key, value]) => `${key}+${((value as number) * 100).toFixed(0)}%`);

  merged.reason = active.length ? `累计校准：${active.join('、')}` : '暂无累计权重偏移';
  return merged;
}