/**
 * Single natal chain: 四柱 → 用神 → 大运 → K线 → 神煞.
 * Dimensions / 合婚 / 通书 / 十维 should go through here (or fortune-context-builder),
 * not re-wire determineYongShen without birthDate.
 */

import {
  analyzeShenSha,
  determineYongShen,
  type YongShenResult,
} from '@/lib/bazi-analyzer';
import { GAN_TO_WUXING, ZHI_TO_WUXING } from '@/lib/bazi-constants';
import {
  calculateDayun,
  resolveDayunList,
  type DayunResult,
} from '@/lib/dayun-calculator';
import { calculateFourPillars } from '@/lib/fortune-engine';
import { detectKlineAnchorsV6, generateLifeKlineV6, type KlineAnchorV6, type KlinePointV6 } from '@/lib/kline-v6';
import type { Pillar } from '@/lib/user-types';
import { toElementEn } from '@/lib/wuxing-normalize';

export type NatalChainInput = {
  civilDate: Date;
  civilTime: string;
  pillarDate: Date;
  pillarTime: string;
  timezone?: number;
  birthPlace?: string | null;
  sect?: 1 | 2;
  gender?: 'male' | 'female';
};

export type NatalChainResult = {
  pillars: Pillar[];
  bazi: string[];
  yongShen: YongShenResult | null;
  dayun: DayunResult;
  kline: KlinePointV6[];
  anchors: KlineAnchorV6[];
  shenSha: string[];
  elements: Record<string, number>;
  pattern: string;
};

export function parseClockHm(time: string): { hour: number; minute: number } {
  const m = `${time || ''}`.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return { hour: 12, minute: 0 };
  return {
    hour: Math.min(23, Math.max(0, Number(m[1]))),
    minute: Math.min(59, Math.max(0, Number(m[2]))),
  };
}

/** 用神 must receive civil date/time so 司令分日 matches analyze/report. */
export function resolveYongShenForPillars(
  pillars: Pillar[],
  civilDate: Date,
  civilTime: string,
): YongShenResult | null {
  const bazi = pillars.map((p) => `${p.celestialStem}${p.earthlyBranch}`);
  const { hour, minute } = parseClockHm(civilTime);
  return determineYongShen(bazi, {
    birthDate: civilDate,
    birthHour: hour,
    birthMinute: minute,
  });
}

export function scoreElementsFromPillars(pillars: Pillar[]): Record<string, number> {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const bump = (raw: string, n: number) => {
    const el = toElementEn(raw);
    if (el) scores[el] += n;
  };
  for (const pillar of pillars) {
    bump(GAN_TO_WUXING[pillar.celestialStem] || '', 12);
    bump(ZHI_TO_WUXING[pillar.earthlyBranch] || '', 8);
    for (const hidden of pillar.hiddenStems || []) {
      bump(GAN_TO_WUXING[hidden] || hidden, 4);
    }
  }
  return scores;
}

export function normalizeDayunAlias(raw: DayunResult | null): DayunResult {
  if (!raw) {
    return {
      startAge: 0,
      dayuns: [],
      dayunList: [],
      currentDayun: null,
      currentDayunYear: 0,
      currentDayunIndex: 0,
    };
  }
  const dayunList = resolveDayunList(raw);
  return {
    ...raw,
    dayuns: dayunList,
    dayunList,
    currentDayunIndex: raw.currentDayunIndex ?? raw.currentDayun?.index ?? 0,
  };
}

export function runNatalEngineChain(input: NatalChainInput): NatalChainResult {
  const gender = input.gender || 'male';
  const timezone = Number.isFinite(input.timezone as number) ? Number(input.timezone) : 8;
  const sect = input.sect === 1 ? 1 : 2;
  const pillars = calculateFourPillars(input.pillarDate, input.pillarTime, timezone, {
    birthPlace: input.birthPlace || null,
    useTrueSolarTime: false,
    sect,
  });
  const yongShen = resolveYongShenForPillars(pillars, input.civilDate, input.civilTime);
  const dayun = normalizeDayunAlias(
    calculateDayun(
      input.civilDate,
      input.civilTime,
      gender,
      pillars[0]?.celestialStem || '',
      { gan: pillars[1]?.celestialStem || '', zhi: pillars[1]?.earthlyBranch || '' },
      yongShen,
      input.civilDate.getFullYear(),
    ),
  );
  const kline = generateLifeKlineV6(input.civilDate, gender, pillars, yongShen, dayun, {
    fromBirth: true,
    lifeYears: 80,
  });
  const anchors = detectKlineAnchorsV6(kline);
  const bazi = pillars.map((p) => `${p.celestialStem}${p.earthlyBranch}`);
  let shenSha: string[] = [];
  try {
    const result = analyzeShenSha(bazi);
    const list = result?.list;
    if (Array.isArray(list)) {
      shenSha = list
        .map((item) => (typeof item === 'string' ? item : item?.name || ''))
        .filter(Boolean);
    }
  } catch {
    shenSha = [];
  }
  return {
    pillars,
    bazi,
    yongShen,
    dayun,
    kline: Array.isArray(kline) ? kline : [],
    anchors: Array.isArray(anchors) ? anchors : [],
    shenSha,
    elements: scoreElementsFromPillars(pillars),
    pattern: yongShen?.pattern?.pattern || '正格',
  };
}
