import type { StateVectorData } from '@/lib/report-types';
import { applyReferenceIntelligenceToStateVector } from '@/lib/reference-engine-bridge';
import type { ReferenceIntelligencePack } from '@/lib/reference-intelligence';

type KlinePoint = {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
};

type AdviceLike = {
  directions?: string[];
  timing?: string[];
  career?: { timing?: string };
  wealth?: { timing?: string };
  marriage?: { general?: string; timing?: string };
};

type DayunLike = {
  currentDayun?: {
    quality?: 'excellent' | 'good' | 'neutral' | 'bad' | 'poor';
  } | null;
};

export interface BuildStateVectorInput {
  klineData?: KlinePoint[] | null;
  advice?: AdviceLike;
  dayun?: DayunLike | null;
  referencePack?: ReferenceIntelligencePack;
  now?: Date;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getDayunModifier(quality?: 'excellent' | 'good' | 'neutral' | 'bad' | 'poor') {
  switch (quality) {
    case 'excellent':
      return 0.9;
    case 'good':
      return 0.55;
    case 'bad':
      return -0.45;
    case 'poor':
      return -0.8;
    default:
      return 0;
  }
}

function computeBaseVector(point: KlinePoint, advice?: AdviceLike, dayun?: DayunLike | null): StateVectorData['current'] {
  const timingHints = [
    advice?.timing?.length ? advice.timing.join(' ') : '',
    advice?.career?.timing || '',
    advice?.wealth?.timing || '',
  ].join(' ');
  const relationHints = [advice?.marriage?.general || '', advice?.marriage?.timing || ''].join(' ');
  const directionBonus = advice?.directions?.length ? 0.35 : 0;
  const timingBonus = timingHints.trim() ? 0.45 : 0;
  const relationBonus = relationHints.trim() ? 0.45 : 0;
  const dayunModifier = getDayunModifier(dayun?.currentDayun?.quality);

  return {
    tianShi: round(clamp(average([point.career, point.wealth]) / 10 + timingBonus + dayunModifier, 0, 10)),
    diLi: round(clamp(average([point.wealth, point.health]) / 10 + directionBonus + dayunModifier * 0.4, 0, 10)),
    renHe: round(clamp(average([point.marriage, point.career]) / 10 + relationBonus + dayunModifier * 0.3, 0, 10)),
  };
}

function sortByDistance(points: KlinePoint[], year: number) {
  return points
    .slice()
    .sort((left, right) => Math.abs(left.year - year) - Math.abs(right.year - year) || left.year - right.year);
}

export function buildStateVectorData(input: BuildStateVectorInput): StateVectorData {
  const now = input.now || new Date();
  const points = (input.klineData || []).slice().sort((left, right) => left.year - right.year);
  const nearest = sortByDistance(points, now.getFullYear())[0];

  const baseCurrent = nearest
    ? computeBaseVector(nearest, input.advice, input.dayun)
    : { tianShi: 5, diLi: 5, renHe: 5 };

  const current = input.referencePack
    ? applyReferenceIntelligenceToStateVector({ current: baseCurrent }, input.referencePack).current
    : baseCurrent;

  const history = points
    .filter((point) => point.year < now.getFullYear())
    .slice(-3)
    .map((point) => ({
      year: point.year,
      ...computeBaseVector(point, input.advice, input.dayun),
    }));

  const forecastBase = points
    .filter((point) => point.year >= now.getFullYear())
    .slice(0, 3)
    .map((point) => ({
      year: point.year,
      ...computeBaseVector(point, input.advice, input.dayun),
    }));

  const referencePack = input.referencePack;
  const forecast = referencePack
    ? forecastBase.map((point) => ({
        year: point.year,
        tianShi: round(clamp(point.tianShi + referencePack.stateVectorAdjustment.tianShiDelta * 0.6, 0, 10)),
        diLi: round(clamp(point.diLi + referencePack.stateVectorAdjustment.diLiDelta * 0.6, 0, 10)),
        renHe: round(clamp(point.renHe + referencePack.stateVectorAdjustment.renHeDelta * 0.6, 0, 10)),
      }))
    : forecastBase;

  return {
    current,
    history: history.length ? history : undefined,
    forecast: forecast.length ? forecast : undefined,
  };
}
