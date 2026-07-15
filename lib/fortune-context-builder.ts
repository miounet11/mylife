import { calculateFourPillars } from '@/lib/fortune-engine';
import { determineYongShen, type YongShenResult } from '@/lib/bazi-analyzer';
import { calculateDayun, type DayunResult } from '@/lib/dayun-calculator';
import { generateLifeKlineV6, detectKlineAnchorsV6 } from '@/lib/kline-v6';
import type { CreateContextInput } from '@/lib/agentic-report/create-agentic-context';
import type { Pillar } from '@/lib/user-types';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import { getOrCreateProfile, updateProfile } from '@/lib/life-profile/store';

export interface BirthInput {
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  birthAccuracy?: 'exact' | 'range' | 'unknown';
  gender?: 'male' | 'female';
  name?: string;
}

function parseBirthDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid birthDate');
  }
  return date;
}

function resolveBirthTime(input: BirthInput): string {
  if (input.birthAccuracy === 'unknown' || !input.birthTime) {
    return '12:00';
  }
  return input.birthTime;
}

function elementScoresFromPillars(pillars: Pillar[]): Record<string, number> {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const map: Record<string, keyof typeof scores> = {
    甲: 'wood', 乙: 'wood',
    丙: 'fire', 丁: 'fire',
    戊: 'earth', 己: 'earth',
    庚: 'metal', 辛: 'metal',
    壬: 'water', 癸: 'water',
  };

  for (const pillar of pillars) {
    const stemElement = map[pillar.celestialStem];
    if (stemElement) scores[stemElement] += 12;
    const branchElement = map[pillar.earthlyBranch];
    if (branchElement) scores[branchElement] += 8;
    for (const hidden of pillar.hiddenStems || []) {
      const hiddenElement = map[hidden];
      if (hiddenElement) scores[hiddenElement] += 4;
    }
  }

  return scores;
}

function inferYongShen(pillars: Pillar[]): YongShenResult | null {
  const direct = determineYongShen(pillars.map((pillar) => pillar.celestialStem + pillar.earthlyBranch));
  if (direct) return direct;

  const dayMaster = pillars[2]?.celestialStem;
  if (!dayMaster) return null;

  const elementMap: Record<string, string> = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
  };
  const scores = elementScoresFromPillars(pillars);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dayElement = elementMap[dayMaster] || '木';
  const weakest = sorted[sorted.length - 1]?.[0];
  const strongest = sorted[0]?.[0];
  const cnMap: Record<string, string> = {
    wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
  };
  const yongShen = weakest ? [cnMap[weakest]] : [];
  const jiShen = strongest ? [cnMap[strongest]] : [];

  return {
    dayMaster,
    dayMasterElement: dayElement,
    strength: '中和',
    strengthDesc: '基于五行分布的基础推断',
    score: 50,
    yongShen,
    xiShen: yongShen,
    jiShen,
    qiuShen: [],
    analysis: '引擎基础推断：优先补偏弱五行，谨慎使用偏旺五行。',
    details: { helpStrength: 0, drainStrength: 0, seasonBonus: 0 },
    priority: yongShen.map((element) => ({ element, reason: '偏弱五行优先' })),
  };
}

/** Prod dayun-calculator returns `dayuns`; local/kline expect `dayunList`. */
function normalizeDayunResult(raw: DayunResult | (DayunResult & { dayuns?: DayunResult['dayunList'] }) | null): DayunResult {
  if (!raw) {
    return { startAge: 0, currentDayunIndex: 0, dayunList: [] };
  }
  const dayunList = Array.isArray(raw.dayunList)
    ? raw.dayunList
    : Array.isArray((raw as { dayuns?: DayunResult['dayunList'] }).dayuns)
      ? (raw as { dayuns: DayunResult['dayunList'] }).dayuns
      : [];
  return {
    ...raw,
    dayunList,
    currentDayunIndex: raw.currentDayunIndex ?? raw.currentDayun?.index ?? 0,
  };
}

export function buildFortuneContextInput(input: BirthInput): CreateContextInput {
  const birthDate = parseBirthDate(input.birthDate);
  const birthTime = resolveBirthTime(input);
  const gender = input.gender || 'male';
  const birthPlace = input.birthPlace?.trim() || '北京';

  const pillars = calculateFourPillars(birthDate, birthTime, 8, {
    birthPlace,
    useTrueSolarTime: input.birthAccuracy !== 'unknown',
  });
  const yongShen = inferYongShen(pillars);
  const dayun = normalizeDayunResult(calculateDayun(
    birthDate,
    birthTime,
    gender,
    pillars[0]?.celestialStem || '',
    { gan: pillars[1]?.celestialStem || '', zhi: pillars[1]?.earthlyBranch || '' },
    yongShen,
    birthDate.getFullYear(),
  ));

  const kline = generateLifeKlineV6(birthDate, gender, pillars, yongShen, dayun, {
    fromBirth: true,
    lifeYears: 80,
  });
  const anchors = detectKlineAnchorsV6(kline);
  const elements = elementScoresFromPillars(pillars);
  const pattern = yongShen?.pattern?.pattern || '正格';

  const birthSignature = buildBirthSignature({
    birthDate: input.birthDate,
    birthTime,
    birthPlace,
    birthAccuracy: input.birthAccuracy,
    gender,
  });

  // Server-safe: life-profile store is browser-first; never let profile IO break report generation.
  let lifeProfile = null as ReturnType<typeof getOrCreateProfile> | null;
  try {
    lifeProfile = getOrCreateProfile(birthSignature);
    if (!lifeProfile.yongShen || lifeProfile.pattern !== pattern) {
      lifeProfile = updateProfile(birthSignature, {
        yongShen,
        pattern,
      });
    }
  } catch {
    lifeProfile = null;
  }

  return {
    truthInput: {
      birthDate,
      pillars,
      yongShen,
      dayun,
      kline: Array.isArray(kline) ? kline : [],
      anchors: Array.isArray(anchors) ? anchors : [],
      shenSha: [],
      pattern,
      lifeProfile,
    },
    signalsInput: {
      birthDate,
      elements,
      birthPlace,
    },
    reportRaw: {
      birthAccuracy: input.birthAccuracy || 'range',
      gender,
      birthTime: input.birthAccuracy === 'unknown' ? null : birthTime,
      birthPlace,
      dayMaster: pillars[2]?.celestialStem,
      birthSignature,
      intent: null,
    },
    lifeProfile,
  };
}