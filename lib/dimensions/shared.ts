import type { Prediction, PredictionCategory } from '@/lib/predictions/types';
import type { DimensionReportSection } from './types';

export type LineScores = {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
};

export function createPredictionId(reportId: string, suffix: string): string {
  return `dim_${reportId}_${suffix}`;
}

export function formatDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function clampConfidence(value: number, min = 0.55, max = 0.88): number {
  if (!Number.isFinite(value)) return min;
  return Math.round(Math.min(max, Math.max(min, value)) * 100) / 100;
}

export function averageLines(point: Pick<LineScores, 'career' | 'wealth' | 'marriage' | 'health'>): number {
  return (point.career + point.wealth + point.marriage + point.health) / 4;
}

export function findKlinePoint(
  kline: LineScores[],
  year = new Date().getFullYear(),
): LineScores | null {
  if (!kline.length) return null;
  return kline.find((item) => item.year === year) || kline[kline.length - 1] || null;
}

/** Rank which life-line is currently strongest / weakest. */
export function rankLifeLines(point: LineScores): Array<{ key: keyof Omit<LineScores, 'year'>; label: string; score: number }> {
  const rows: Array<{ key: keyof Omit<LineScores, 'year'>; label: string; score: number }> = [
    { key: 'career', label: '事业', score: point.career },
    { key: 'wealth', label: '财富', score: point.wealth },
    { key: 'marriage', label: '关系', score: point.marriage },
    { key: 'health', label: '健康', score: point.health },
  ];
  return rows.sort((a, b) => b.score - a.score);
}

export function quarterOfDate(date = new Date()): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const month = date.getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

export function yearQuarterLabel(year: number, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q2'): string {
  return `${year}年${quarter}`;
}

export function buildPrediction(
  reportId: string,
  birthSignature: string,
  suffix: string,
  input: {
    category: PredictionCategory;
    statement: string;
    dueDate: string;
    confidence: number;
    evidence: string;
    window?: string;
    verifyChecklist: string[];
  },
): Prediction {
  return {
    id: createPredictionId(reportId, suffix),
    reportId,
    birthSignature,
    category: input.category,
    statement: input.statement,
    confidence: clampConfidence(input.confidence),
    dueDate: input.dueDate,
    window: input.window,
    evidence: input.evidence,
    verifyChecklist: input.verifyChecklist,
    outcome: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export function section(
  key: string,
  title: string,
  items: string[],
  tone: DimensionReportSection['tone'] = 'default',
): DimensionReportSection {
  return { key, title, items: items.filter(Boolean), tone };
}

/** Reject LLM investment copy that invents return promises. */
export function containsForbiddenInvestmentClaim(text: string): boolean {
  return /收益率|稳赚|保本|翻倍|必涨|年化\s*\d|保证收益|无风险/.test(text);
}

const WUXING_CN: Record<string, '木' | '火' | '土' | '金' | '水'> = {
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
  WOOD: '木',
  FIRE: '火',
  EARTH: '土',
  METAL: '金',
  WATER: '水',
};

/** Normalize engine wuxing tokens (wood/fire or 木/火) to Chinese. */
export function normalizeWuxingElement(value: string | null | undefined): '木' | '火' | '土' | '金' | '水' | null {
  if (!value) return null;
  const direct = WUXING_CN[value.trim()];
  if (direct) return direct;
  const lower = value.trim().toLowerCase();
  return WUXING_CN[lower] || null;
}

export function normalizeWuxingList(values: string[] | null | undefined): Array<'木' | '火' | '土' | '金' | '水'> {
  if (!values?.length) return [];
  const out: Array<'木' | '火' | '土' | '金' | '水'> = [];
  for (const value of values) {
    const normalized = normalizeWuxingElement(value);
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}

export function formatWuxingList(values: string[] | null | undefined, fallback = '待补'): string {
  const normalized = normalizeWuxingList(values);
  return normalized.length ? normalized.join('、') : fallback;
}