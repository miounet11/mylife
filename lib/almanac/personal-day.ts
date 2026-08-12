/**
 * Personal day overlay: public 黄历 × 日主/用神 structure.
 * Deterministic scoring — not LLM, not medical/financial advice.
 */

// @ts-ignore
import { Solar } from 'lunar-javascript';
import {
  branchElement,
  ganZhiParts,
  isBranchClash,
  relation,
  stemElement,
  type WuXing,
} from '@/lib/almanac/elements';
import type { AlmanacDayPack, PersonalDayOverlay, PersonalDayStance, PersonalHourNote } from '@/lib/almanac/types';
import { toElementCn } from '@/lib/wuxing-normalize';

export type PersonalDayInput = {
  /** 日主天干 e.g. 甲 */
  dayMaster: string;
  /** 日支 e.g. 子 */
  dayBranch?: string;
  /** 用神五行列表 e.g. ['木','火'] */
  yongShen?: string[];
  /** Optional full day pillar 甲子 */
  dayPillar?: string;
  dayMasterElement?: string;
  strengthDesc?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreElementFit(dayStemWx: WuXing | null, dayMasterWx: WuXing | null, yong: WuXing[]): number {
  let score = 50;
  if (!dayStemWx || !dayMasterWx) return score;

  const vsDm = relation(dayStemWx, dayMasterWx);
  if (vsDm === 'same' || vsDm === 'generates') score += 12;
  if (vsDm === 'generated_by') score += 6;
  if (vsDm === 'controls') score -= 10;
  if (vsDm === 'controlled_by') score -= 14;

  for (const y of yong) {
    const r = relation(dayStemWx, y);
    if (r === 'same' || r === 'generates') score += 8;
    if (r === 'generated_by') score += 4;
    if (r === 'controls' || r === 'controlled_by') score -= 6;
  }
  return score;
}

function stanceFromScore(score: number): PersonalDayStance {
  if (score >= 62) return 'push';
  if (score <= 42) return 'conserve';
  return 'steady';
}

function personalHourScore(
  hourGanZhi: string,
  publicLuck: 'auspicious' | 'inauspicious' | 'neutral',
  dayMasterWx: WuXing | null,
  yong: WuXing[],
): { score: number; reason: string } {
  let score = publicLuck === 'auspicious' ? 62 : publicLuck === 'inauspicious' ? 32 : 48;
  const { stem } = ganZhiParts(hourGanZhi);
  const wx = stemElement(stem);
  const reasons: string[] = [];
  if (publicLuck === 'auspicious') reasons.push('黄道时');
  if (publicLuck === 'inauspicious') reasons.push('黑道时');

  if (wx && dayMasterWx) {
    const r = relation(wx, dayMasterWx);
    if (r === 'same' || r === 'generates') {
      score += 12;
      reasons.push('时干扶日主');
    } else if (r === 'controlled_by' || r === 'controls') {
      score -= 10;
      reasons.push('时干与日主有克');
    }
  }
  if (wx) {
    for (const y of yong) {
      const r = relation(wx, y);
      if (r === 'same' || r === 'generates') {
        score += 8;
        reasons.push('利于用神');
        break;
      }
      if (r === 'controls') {
        score -= 6;
        reasons.push('时干克用神');
        break;
      }
    }
  }
  return { score: clamp(score, 0, 100), reason: reasons.slice(0, 2).join(' · ') || '综合评估' };
}

/**
 * Resolve day master from birth date using lunar-javascript (noon default if no hour).
 */
export function resolveDayMasterFromBirth(birthDate: string, birthHour = 12): {
  dayMaster: string;
  dayBranch: string;
  dayPillar: string;
} | null {
  const m = `${birthDate || ''}`.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  try {
    const solar = Solar.fromYmdHms(Number(m[1]), Number(m[2]), Number(m[3]), birthHour, 0, 0);
    const lunar = solar.getLunar();
    const dayPillar = `${lunar.getDayInGanZhi?.() || ''}`.trim();
    if (dayPillar.length < 2) return null;
    return {
      dayMaster: dayPillar[0],
      dayBranch: dayPillar[1],
      dayPillar,
    };
  } catch {
    return null;
  }
}

export function buildPersonalDayOverlay(
  pack: AlmanacDayPack,
  input: PersonalDayInput,
): PersonalDayOverlay | null {
  const dayMaster = `${input.dayMaster || ''}`.trim().slice(0, 1);
  if (!dayMaster) return null;

  const dayBranch = `${input.dayBranch || input.dayPillar?.[1] || ''}`.trim().slice(0, 1);
  const yongRaw = (input.yongShen || []).map((x) => `${x || ''}`.trim()).filter(Boolean);
  const yong = yongRaw
    .map((x) => {
      const cn = toElementCn(x);
      if (cn === '木' || cn === '火' || cn === '土' || cn === '金' || cn === '水') return cn;
      return stemElement(x) || branchElement(x);
    })
    .filter(Boolean) as WuXing[];

  const dayGanZhi = pack.lunar.dayGanZhi;
  const { stem: dayStem, branch: flowBranch } = ganZhiParts(dayGanZhi);
  const dayStemWx = stemElement(dayStem);
  const dayMasterWx = stemElement(dayMaster);

  let score = scoreElementFit(dayStemWx, dayMasterWx, yong);

  const watchouts: string[] = [];
  const favors: string[] = [];

  if (dayBranch && flowBranch && isBranchClash(dayBranch, flowBranch)) {
    score -= 16;
    watchouts.push(`今日支与日支相冲（${flowBranch}冲${dayBranch}），重要决定宜放缓、先复核。`);
  }
  if (pack.ji.some((j) => /诸事不宜|嫁娶|动土|开市|入宅/.test(j))) {
    score -= 4;
    watchouts.push(`通书忌项含「${pack.ji.slice(0, 2).join('、')}」：高风险动作宜避开或降规格。`);
  }
  if (pack.yi.length) {
    favors.push(`通书宜：${pack.yi.slice(0, 4).join('、')}（仍须对齐你的结构，不自动等于该做）。`);
  }
  if (dayStemWx && yong.includes(dayStemWx)) {
    favors.push(`流日天干属${dayStemWx}，与用神同气，适合做验证型小推进。`);
  }
  if (dayStemWx && dayMasterWx) {
    const r = relation(dayStemWx, dayMasterWx);
    if (r === 'controlled_by') {
      watchouts.push('流日对日主有克制倾向：沟通与签约多留缓冲，避免硬碰。');
    }
    if (r === 'generates' || r === 'same') {
      favors.push('流日对日主偏扶助：适合推进已准备好的事项，而非临时起意的大赌注。');
    }
  }

  score = clamp(score, 0, 100);
  const stance = stanceFromScore(score);

  const hours: PersonalHourNote[] = pack.hours.map((h) => {
    const { score: hs, reason } = personalHourScore(h.ganZhi, h.luck, dayMasterWx, yong);
    let label = '平';
    if (hs >= 68) label = '较吉';
    else if (hs <= 38) label = '慎用';
    return {
      ganZhi: h.ganZhi,
      timeLabel: h.timeLabel,
      publicLuck: h.luck,
      personalScore: hs,
      label,
      reason,
    };
  });

  const ranked = [...hours].sort((a, b) => b.personalScore - a.personalScore);
  const topHours = ranked.filter((h) => h.personalScore >= 60).slice(0, 3);
  const avoidHours = [...hours]
    .sort((a, b) => a.personalScore - b.personalScore)
    .filter((h) => h.personalScore <= 40)
    .slice(0, 3);

  const stanceLine =
    stance === 'push'
      ? '今日结构倾向：可推进（验证型）'
      : stance === 'conserve'
        ? '今日结构倾向：宜守成复核'
        : '今日结构倾向：稳节奏观望';

  const headline = `${stanceLine} · 日柱 ${dayGanZhi} · 日主 ${dayMaster}${yong.length ? ` · 用神 ${yong.join('')}` : ''}`;

  const moodLine =
    stance === 'push'
      ? `今天偏「可试」：把已准备好的事推进半步，比开新战场更赚。`
      : stance === 'conserve'
        ? `今天偏「守界」：少做承诺，多做复核，把摩擦挡在门外。`
        : `今天偏「安顿」：理清顺序与边界，比抢速度更重要。`;

  const stars = clamp(Math.round(score / 20), 1, 5);

  if (topHours.length) {
    favors.push(
      `相对较顺时辰：${topHours.map((h) => `${h.timeLabel || h.ganZhi}（${h.reason}）`).join('；')}`,
    );
  }
  if (avoidHours.length) {
    watchouts.push(
      `宜谨慎时辰：${avoidHours.map((h) => `${h.timeLabel || h.ganZhi}（${h.reason}）`).join('；')}`,
    );
  }

  return {
    date: pack.date,
    dayMaster,
    dayBranch,
    yongShen: yong,
    dayGanZhi,
    stance,
    score,
    headline,
    moodLine,
    stars,
    watchouts: watchouts.slice(0, 5),
    favors: favors.slice(0, 5),
    hours,
    topHours,
    avoidHours,
    dayMasterElement: input.dayMasterElement,
    strengthDesc: input.strengthDesc,
    disclaimer:
      '个人日运由日主/用神与流日通书叠加估算，服务节奏管理，不构成投资、医疗、法律建议；时辰以本地钟表为参考，交界前后请留余地。',
  };
}
