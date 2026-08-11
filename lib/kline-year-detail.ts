/**
 * 人生 K 线 · 年明细 / 12 月展开 / 引擎证据全量展示
 * 纯函数，可在 client 使用；月分由年点 + 流月干支用忌确定性修正（与 kline-v6 同口径）。
 */

export type KlineEvidenceLike = {
  natal?: Array<{ driver?: string; impact?: number }>;
  dayun?: Array<{ driver?: string; impact?: number }>;
  liunian?: Array<{ driver?: string; impact?: number }>;
  drivers?: string[];
  risks?: string[];
  ganZhi?: string;
  dayunGanZhi?: string | null;
  monthGanZhi?: string;
  elementBreakdown?: {
    yearElement?: string;
    yongShenMatch?: string;
    relationSummary?: string;
  };
};

export type KlineYearPointLike = {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  overall?: number;
  evidence?: KlineEvidenceLike;
};

export type KlineMonthCell = {
  year: number;
  month: number;
  key: string; // YYYY-MM
  /** 公历月 1 日，用于万年历深链 */
  almanacDate: string;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  overall: number;
  monthGanZhi: string;
  delta: number;
  stance: 'push' | 'steady' | 'conserve';
  drivers: string[];
};

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GAN_EL: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
  庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
const ZHI_EL: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};
const EN_TO_CN: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

function clamp(n: number) {
  return Math.max(25, Math.min(98, Math.round(n)));
}

function overallOf(p: {
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  overall?: number;
}) {
  if (typeof p.overall === 'number' && p.overall > 0) return Math.round(p.overall);
  return Math.round((p.career + p.wealth + p.marriage + p.health) / 4);
}

function yearGanZhi(year: number): string {
  const ganIdx = ((year - 4) % 10 + 10) % 10;
  const zhiIdx = ((year - 4) % 12 + 12) % 12;
  return `${TIAN_GAN[ganIdx]}${DI_ZHI[zhiIdx]}`;
}

/** 与 kline-v6 同口径近似月柱 */
export function approxMonthGanZhi(year: number, month: number): string {
  const yearGan = yearGanZhi(year)[0] || '甲';
  const yearGanIdx = TIAN_GAN.indexOf(yearGan);
  const yinGanStarts = [2, 4, 6, 8, 0];
  const group = ((yearGanIdx % 5) + 5) % 5;
  const yinGanIdx = yinGanStarts[group] ?? 2;
  const zhiIdx = (month + 1) % 12;
  const ganIdx = (yinGanIdx + ((zhiIdx - 2 + 12) % 12)) % 10;
  return `${TIAN_GAN[ganIdx]}${DI_ZHI[zhiIdx]}`;
}

function normEls(list?: string[]): string[] {
  return (list || []).map((s) => EN_TO_CN[s] || s).filter(Boolean);
}

function monthDelta(monthGanZhi: string, yong: string[], ji: string[], xi: string[]): number {
  const g = monthGanZhi[0] || '';
  const z = monthGanZhi[1] || '';
  const ge = GAN_EL[g] || '';
  const ze = ZHI_EL[z] || '';
  let d = 0;
  if (yong.includes(ge)) d += 4;
  else if (xi.includes(ge)) d += 2.5;
  else if (ji.includes(ge)) d -= 3.5;
  if (yong.includes(ze)) d += 2;
  else if (ji.includes(ze)) d -= 2;
  return Math.max(-8, Math.min(8, d));
}

function stanceFromOverall(score: number): KlineMonthCell['stance'] {
  if (score >= 68) return 'push';
  if (score <= 48) return 'conserve';
  return 'steady';
}

/**
 * 由年点展开 12 个月（引擎确定性修正，非 LLM）。
 */
export function expandYearToMonths(
  yearPoint: KlineYearPointLike,
  opts?: { yongShen?: string[]; jiShen?: string[]; xiShen?: string[] },
): KlineMonthCell[] {
  const year = yearPoint.year;
  const yong = normEls(opts?.yongShen);
  const ji = normEls(opts?.jiShen);
  const xi = normEls(opts?.xiShen);
  const baseCareer = Number(yearPoint.career) || 60;
  const baseWealth = Number(yearPoint.wealth) || 60;
  const baseMarriage = Number(yearPoint.marriage) || 60;
  const baseHealth = Number(yearPoint.health) || 60;
  const out: KlineMonthCell[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthGanZhi = approxMonthGanZhi(year, month);
    const delta = monthDelta(monthGanZhi, yong, ji, xi);
    const career = clamp(baseCareer + delta * 0.85);
    const wealth = clamp(baseWealth + delta * 0.9);
    const marriage = clamp(baseMarriage + delta * 0.55);
    const health = clamp(baseHealth + delta * 0.4);
    const overall = Math.round((career + wealth + marriage + health) / 4);
    const key = `${year}-${String(month).padStart(2, '0')}`;
    out.push({
      year,
      month,
      key,
      almanacDate: `${key}-15`,
      career,
      wealth,
      marriage,
      health,
      overall,
      monthGanZhi,
      delta: Math.round(delta * 10) / 10,
      stance: stanceFromOverall(overall),
      drivers: [
        delta > 1 ? `流月${monthGanZhi}偏用` : delta < -1 ? `流月${monthGanZhi}偏忌` : `流月${monthGanZhi}中平`,
      ],
    });
  }
  return out;
}

export type EngineEvidenceBlock = {
  label: string;
  items: Array<{ text: string; impact?: number }>;
};

/** 把年点 evidence 摊平成可读块（页面「全量引擎信息」） */
export function buildEngineEvidenceBlocks(
  yearPoint: KlineYearPointLike | null | undefined,
): EngineEvidenceBlock[] {
  if (!yearPoint?.evidence) {
    return [
      {
        label: '引擎提示',
        items: [{ text: '该年暂无完整证据包；可结合大运色带与综合分阅读。' }],
      },
    ];
  }
  const e = yearPoint.evidence;
  const blocks: EngineEvidenceBlock[] = [];

  if (e.natal?.length) {
    blocks.push({
      label: '原局基线',
      items: e.natal.map((x) => ({
        text: x.driver || '原局',
        impact: typeof x.impact === 'number' ? x.impact : undefined,
      })),
    });
  }
  if (e.dayun?.length) {
    blocks.push({
      label: '大运背景',
      items: e.dayun.map((x) => ({
        text: x.driver || '大运',
        impact: typeof x.impact === 'number' ? x.impact : undefined,
      })),
    });
  }
  if (e.liunian?.length) {
    blocks.push({
      label: '流年触发',
      items: e.liunian.map((x) => ({
        text: x.driver || '流年',
        impact: typeof x.impact === 'number' ? x.impact : undefined,
      })),
    });
  }
  if (e.drivers?.length) {
    blocks.push({
      label: '综合驱动',
      items: e.drivers.map((t) => ({ text: t })),
    });
  }
  if (e.risks?.length) {
    blocks.push({
      label: '风险提示',
      items: e.risks.map((t) => ({ text: t })),
    });
  }
  if (e.elementBreakdown) {
    const eb = e.elementBreakdown;
    const matchMap: Record<string, string> = {
      strong: '强用神',
      good: '偏用/喜',
      neutral: '中平',
      bad: '偏忌',
      conflict: '忌神触达',
    };
    blocks.push({
      label: '五行结构',
      items: [
        { text: `流年五行：${EN_TO_CN[eb.yearElement || ''] || eb.yearElement || '—'}` },
        {
          text: `用忌匹配：${matchMap[eb.yongShenMatch || ''] || eb.yongShenMatch || '—'}`,
        },
        { text: `原局关系：${eb.relationSummary || '—'}` },
      ],
    });
  }
  if (e.ganZhi || e.dayunGanZhi) {
    blocks.push({
      label: '干支索引',
      items: [
        { text: `流年：${e.ganZhi || '—'}` },
        { text: `大运：${e.dayunGanZhi || '—'}` },
      ],
    });
  }
  return blocks;
}

export type YearDeskModel = {
  year: number;
  overall: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  ganZhi: string;
  dayunGanZhi: string | null;
  evidenceBlocks: EngineEvidenceBlock[];
  months: KlineMonthCell[];
  bestMonths: KlineMonthCell[];
  toughMonths: KlineMonthCell[];
  almanacYearHref: string;
  note: string;
};

export function buildYearDeskModel(
  yearPoint: KlineYearPointLike,
  opts?: { yongShen?: string[]; jiShen?: string[]; xiShen?: string[] },
): YearDeskModel {
  const months = expandYearToMonths(yearPoint, opts);
  const sorted = [...months].sort((a, b) => b.overall - a.overall);
  const overall = overallOf(yearPoint);
  return {
    year: yearPoint.year,
    overall,
    career: Math.round(yearPoint.career),
    wealth: Math.round(yearPoint.wealth),
    marriage: Math.round(yearPoint.marriage),
    health: Math.round(yearPoint.health),
    ganZhi: yearPoint.evidence?.ganZhi || yearGanZhi(yearPoint.year),
    dayunGanZhi: yearPoint.evidence?.dayunGanZhi || null,
    evidenceBlocks: buildEngineEvidenceBlocks(yearPoint),
    months,
    bestMonths: sorted.slice(0, 3),
    toughMonths: [...sorted].reverse().slice(0, 3),
    almanacYearHref: `/almanac/${yearPoint.year}-01-01`,
    note:
      '月分由流月干支×用忌在年分上修正（公历月近似，非精确节气月）。日运请点入万年历查看通书+个人结构。',
  };
}

/** 从 klineData 数组取某年点（含完整 evidence） */
export function findYearPoint(
  klineData: unknown,
  year: number,
): KlineYearPointLike | null {
  if (!Array.isArray(klineData)) return null;
  for (const raw of klineData) {
    if (!raw || typeof raw !== 'object') continue;
    const p = raw as Record<string, unknown>;
    if (Number(p.year) !== year) continue;
    const career = Number(p.career) || 0;
    const wealth = Number(p.wealth) || 0;
    const marriage = Number(p.marriage) || 0;
    const health = Number(p.health) || 0;
    return {
      year,
      career,
      wealth,
      marriage,
      health,
      overall:
        typeof p.score === 'number' && Number(p.score) > 0
          ? Number(p.score)
          : Math.round((career + wealth + marriage + health) / 4),
      evidence: (p.evidence as KlineEvidenceLike) || undefined,
    };
  }
  return null;
}
