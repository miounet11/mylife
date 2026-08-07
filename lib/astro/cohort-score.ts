/**
 * Cohort scorer for sign / zone / rising without a real day master.
 * Uses element relation math (same as personal-day) — deterministic, not fluff.
 */

import {
  branchElement,
  ganZhiParts,
  relation,
  stemElement,
  type WuXing,
} from '@/lib/almanac/elements';
import type { AlmanacDayPack, AlmanacLuck, PersonalDayStance } from '@/lib/almanac/types';
import type { ElementKey, ModalityKey, ZonePhase } from '@/lib/astro/types';
import type { AstroEvidence, AstroHourNote } from '@/lib/astro/daily-match-types';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const ELEMENT_AS_WX: Record<ElementKey, WuXing> = {
  火: '火',
  土: '土',
  风: '金', // 风象以金/气机近似对接五行（表达层映射，页面声明）
  水: '水',
};

/** Preferred “用神-like” elements for a western element */
export function preferredElements(el: ElementKey): WuXing[] {
  const core = ELEMENT_AS_WX[el];
  const sheng: Record<WuXing, WuXing> = {
    木: '火',
    火: '土',
    土: '金',
    金: '水',
    水: '木',
  };
  // prefer same + what generates me
  const generatesMe = (Object.keys(sheng) as WuXing[]).find((k) => sheng[k] === core) || core;
  return [core, generatesMe];
}

export type CohortScoreResult = {
  structure: number;
  expression: number;
  stance: PersonalDayStance;
  stars: number;
  favors: string[];
  watchouts: string[];
  topHours: AstroHourNote[];
  avoidHours: AstroHourNote[];
  evidence: AstroEvidence[];
  moodLine: string;
  headline: string;
};

function stanceFromScore(score: number, modality?: ModalityKey): PersonalDayStance {
  let s = score;
  if (modality === '固定' && s >= 58 && s < 68) s = 55; // pull toward steady
  if (modality === '基本' && s >= 55 && s < 62) s = 64; // slight push bias
  if (s >= 62) return 'push';
  if (s <= 42) return 'conserve';
  return 'steady';
}

function hourScore(
  hourGanZhi: string,
  publicLuck: AlmanacLuck,
  preferred: WuXing[],
  risingBoost: boolean,
): { score: number; reason: string } {
  let score = publicLuck === 'auspicious' ? 60 : publicLuck === 'inauspicious' ? 34 : 48;
  const reasons: string[] = [];
  if (publicLuck === 'auspicious') reasons.push('黄道时');
  if (publicLuck === 'inauspicious') reasons.push('黑道时');
  const { stem } = ganZhiParts(hourGanZhi);
  const wx = stemElement(stem);
  if (wx && preferred.includes(wx)) {
    score += 10;
    reasons.push(`时干合${wx}偏好`);
  } else if (wx) {
    for (const p of preferred) {
      const r = relation(wx, p);
      if (r === 'generates') {
        score += 6;
        reasons.push('时干生扶偏好');
        break;
      }
      if (r === 'controls') {
        score -= 6;
        reasons.push('时干克偏好');
        break;
      }
    }
  }
  if (risingBoost && publicLuck === 'auspicious') {
    score += 4;
    reasons.push('对外窗口');
  }
  return { score: clamp(score, 0, 100), reason: reasons.slice(0, 2).join(' · ') || '综合' };
}

export function buildCohortScore(input: {
  pack: AlmanacDayPack;
  element: ElementKey;
  modality: ModalityKey;
  zonePhase?: ZonePhase | null;
  risingMode?: boolean;
  identityLabel: string;
}): CohortScoreResult {
  const { pack, element, modality, zonePhase, risingMode, identityLabel } = input;
  const preferred = preferredElements(element);
  const { stem, branch } = ganZhiParts(pack.lunar.dayGanZhi);
  const dayStemWx = stemElement(stem);
  const dayBranchWx = branchElement(branch);
  const evidence: AstroEvidence[] = [];
  let structure = 50;
  const favors: string[] = [];
  const watchouts: string[] = [];

  if (dayStemWx) {
    if (preferred.includes(dayStemWx)) {
      structure += 14;
      evidence.push({
        code: 'FLOW_STEM_MATCHES_ELEMENT',
        label: `流日天干属${dayStemWx}，与${element}象偏好同气`,
        weight: 14,
      });
      favors.push(`流日天干${dayStemWx}与${identityLabel}元素偏好同气，适合做验证型小推进。`);
    } else {
      for (const p of preferred) {
        const r = relation(dayStemWx, p);
        if (r === 'generates' || r === 'generated_by') {
          structure += 8;
          evidence.push({
            code: 'FLOW_STEM_GENERATES',
            label: `流日天干${dayStemWx}与偏好${p}有生扶`,
            weight: 8,
          });
          favors.push(`流日对${element}象偏扶助：推进已准备事项优于新开战场。`);
          break;
        }
        if (r === 'controls' || r === 'controlled_by') {
          structure -= 10;
          evidence.push({
            code: 'FLOW_STEM_CONTROLS',
            label: `流日天干${dayStemWx}与偏好${p}有克制`,
            weight: -10,
          });
          watchouts.push(`流日对${element}象有克制倾向：签约与冲突沟通多留缓冲。`);
          break;
        }
      }
    }
  }

  if (dayBranchWx && preferred.includes(dayBranchWx)) {
    structure += 6;
    evidence.push({
      code: 'FLOW_BRANCH_SUPPORT',
      label: `流日地支五行${dayBranchWx}支撑偏好`,
      weight: 6,
    });
  }

  if (pack.yi.length) {
    structure += 3;
    evidence.push({
      code: 'TONGSHU_YI',
      label: `通书宜：${pack.yi.slice(0, 3).join('、')}`,
      weight: 3,
    });
    favors.push(`通书宜：${pack.yi.slice(0, 4).join('、')}（仍须对齐你的边界，不自动等于该做）。`);
  }
  if (pack.ji.some((j) => /诸事不宜|嫁娶|动土|开市|入宅/.test(j))) {
    structure -= 5;
    evidence.push({
      code: 'TONGSHU_JI_HEAVY',
      label: `通书忌项偏重：${pack.ji.slice(0, 2).join('、')}`,
      weight: -5,
    });
    watchouts.push(`通书忌「${pack.ji.slice(0, 2).join('、')}」：高规格动作宜降档。`);
  }

  // Zone phase modifiers
  let expression = 50;
  if (zonePhase === 1) {
    expression -= 4;
    structure -= 3;
    evidence.push({ code: 'ZONE_PHASE_1', label: '星区一区：试探段，少把第一印象写终局', weight: -3 });
    watchouts.push('星区初段：适合信息收集与小步实验，忌一次押满。');
  } else if (zonePhase === 3) {
    expression += 8;
    structure += 4;
    evidence.push({ code: 'ZONE_PHASE_3', label: '星区三区：主气质最浓，优缺同步放大', weight: 4 });
    favors.push('星区中后段：优势易显，也易极端——用清单护栏。');
  } else if (zonePhase === 4) {
    expression += 2;
    structure -= 2;
    evidence.push({ code: 'ZONE_PHASE_4', label: '星区四区：收束与交界，宜复盘移交', weight: -2 });
    favors.push('星区末段：适合收尾、交接、复盘，而非强行开新盘。');
  } else {
    expression += 4;
    evidence.push({ code: 'ZONE_PHASE_MID', label: '星区中段：主气质稳定，适合固化习惯', weight: 2 });
  }

  // Expression: flow day western sign element vs cohort element (soft)
  if (pack.westernSign) {
    expression += 2;
    evidence.push({
      code: 'FLOW_WESTERN',
      label: `流日太阳落${pack.westernSign}（民用）`,
      weight: 2,
    });
  }

  structure = clamp(structure, 0, 100);
  expression = clamp(expression, 0, 100);

  const hours: AstroHourNote[] = pack.hours.map((h) => {
    const { score, reason } = hourScore(h.ganZhi, h.luck, preferred, Boolean(risingMode));
    return {
      ganZhi: h.ganZhi,
      timeLabel: h.timeLabel,
      score,
      reason,
      publicLuck: h.luck,
    };
  });
  const ranked = [...hours].sort((a, b) => b.score - a.score);
  const topHours = ranked.filter((h) => h.score >= 60).slice(0, 3);
  const avoidHours = [...hours]
    .sort((a, b) => a.score - b.score)
    .filter((h) => h.score <= 40)
    .slice(0, 3);

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

  if (risingMode) {
    favors.push('上升视角：优先把较顺时辰用在对外沟通、会面与呈现，而非独处硬扛。');
    evidence.push({ code: 'RISING_PRESENTATION', label: '上升层：时辰权重偏向对外窗口', weight: 2 });
  }

  const stance = stanceFromScore(structure, modality);
  const stars = clamp(Math.round(structure / 20), 1, 5);
  const stanceLine =
    stance === 'push' ? '可推进（验证型）' : stance === 'conserve' ? '宜守成复核' : '稳节奏观望';
  const moodLine =
    stance === 'push'
      ? `今天偏「可试」：把已准备好的事推进半步，比开新战场更赚。`
      : stance === 'conserve'
        ? `今天偏「守界」：少做承诺，多做复核，把摩擦挡在门外。`
        : `今天偏「安顿」：理清顺序与边界，比抢速度更重要。`;

  // Ensure min evidence
  if (evidence.length < 3) {
    evidence.push({
      code: 'DAY_PILLAR',
      label: `流日日柱 ${pack.lunar.dayGanZhi}`,
      weight: 0,
    });
  }

  return {
    structure,
    expression,
    stance,
    stars,
    favors: favors.slice(0, 5),
    watchouts: watchouts.slice(0, 5),
    topHours,
    avoidHours,
    evidence: evidence.slice(0, 8),
    moodLine,
    headline: `${identityLabel} · ${stanceLine} · 日柱 ${pack.lunar.dayGanZhi}`,
  };
}
