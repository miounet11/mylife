/**
 * Year-scoped era environment snapshot for reports / annual review.
 * Pure narrative mapping — not an ephemeris engine.
 */

import {
  ERA_FOUR_PHASES,
  ERA_THREE_LAYERS,
  type FourPhase,
  type FourPhaseId,
} from '@/lib/world-yi-era-timing';

export type EraEnvironmentSnapshot = {
  year: number;
  phase: FourPhase;
  phaseNote: string;
  phaseNoteEn: string;
  outer: string;
  outerEn: string;
  social: string;
  socialEn: string;
  friction: string;
  frictionEn: string;
  personalAsk: string;
  personalAskEn: string;
  actions: string[];
  actionsEn: string[];
  disclaimer: string;
  disclaimerEn: string;
  hubHref: string;
};

function phaseForYear(year: number): FourPhaseId {
  if (year <= 2023) return 'garage';
  if (year <= 2027) return 'scale';
  if (year <= 2031) return 'integrate';
  return 'rule';
}

function phaseById(id: FourPhaseId): FourPhase {
  return ERA_FOUR_PHASES.find((p) => p.id === id) || ERA_FOUR_PHASES[0];
}

/**
 * Build a calendar-year era environment block for report / review UI.
 * Heuristic phase bands are product narrative, labeled as such in UI.
 */
export function buildEraEnvironmentSnapshot(year = new Date().getFullYear()): EraEnvironmentSnapshot {
  const y = Number.isFinite(year) ? Math.floor(year) : new Date().getFullYear();
  const phase = phaseById(phaseForYear(y));
  const outerLayer = ERA_THREE_LAYERS.find((l) => l.id === 'outer')!;
  const socialLayer = ERA_THREE_LAYERS.find((l) => l.id === 'social')!;
  const frictionLayer = ERA_THREE_LAYERS.find((l) => l.id === 'friction')!;

  const phaseNote =
    y <= 2027
      ? `${y} 年技术与商业叙事偏「${phase.title}」：单点能力仍在扩散，整合与规则尚未完全收敛。`
      : y <= 2031
        ? `${y} 年更易进入「${phase.title}」：标准、接口与产业分工开始压过单点神话。`
        : `${y} 年叙事偏「${phase.title}」：话语权、合规与长期资产权重上升。`;

  const phaseNoteEn =
    y <= 2027
      ? `${y} tech/commerce narrative skews “${phase.titleEn}”: point capabilities still spreading; integration/rules not fully settled.`
      : y <= 2031
        ? `${y} skews toward “${phase.titleEn}”: standards and division of labor start to outweigh single-point myths.`
        : `${y} skews “${phase.titleEn}”: voice, compliance, and long-horizon assets weigh more.`;

  return {
    year: y,
    phase,
    phaseNote,
    phaseNoteEn,
    outer: `${outerLayer.title}：${y} 仍处技术范式切换窗口——把外行星叙事读成时代底色，不改写你的日主结构。`,
    outerEn: `${outerLayer.titleEn}: ${y} remains a paradigm-shift window — era base color, not a rewrite of day-master structure.`,
    social: `${socialLayer.title}：关注监管、利率/算力成本、平台规则与签证/编制类约束中最硬的 1–2 项。`,
    socialEn: `${socialLayer.titleEn}: name the 1–2 hardest constraints among regulation, rates/compute cost, platform rules, visa/headcount.`,
    friction: `${frictionLayer.title}：长约、公开对线、激进扩招宜复核流程；把高摩擦时段写入事件日历。`,
    frictionEn: `${frictionLayer.titleEn}: re-check long contracts, public fights, aggressive hiring; log high-friction windows on the calendar.`,
    personalAsk:
      '个人时位对齐：当前大运/流年是允许重排扩张，还是宜守成验证？时代天气只放大或削弱，不决定对错。',
    personalAskEn:
      'Personal timing: does this decade/year allow re-layout expansion, or conserve-and-validate? Era weather amplifies or dampens — it does not decide right/wrong.',
    actions: [
      `对照四象阶段「${phase.title}」，写清你在赛道里的角色（探索/表达/协调/收敛）`,
      '列出今年最硬的 1–2 个社会压力来源，并设 30–90 天可逆验证',
      '打开时代天时页，对开放假设做回访打分（命中/部分/落空）',
    ],
    actionsEn: [
      `Map four-phase “${phase.titleEn}” to your role style (explore / express / coordinate / conserve)`,
      'Name 1–2 hardest social pressures this year; design 30–90 day reversible tests',
      'Open era-timing hub and score open hypotheses (hit / partial / miss)',
    ],
    disclaimer:
      '时代环境块是宏观透镜与可校准叙事，不构成投资、移民或医疗建议；个人结构与现金流优先。',
    disclaimerEn:
      'Era environment is a macro lens and calibratable narrative — not investment, immigration, or medical advice. Structure and cash flow come first.',
    hubHref: '/world-yi/era-timing',
  };
}

/**
 * Compact JSON blob for LLM prompt injection (CONTEXT_ERA_ENVIRONMENT).
 * Keep short — agents must treat as macro weather, not destiny switch.
 */
export function buildEraEnvironmentPromptPayload(year = new Date().getFullYear()) {
  const snap = buildEraEnvironmentSnapshot(year);
  return {
    year: snap.year,
    phaseId: snap.phase.id,
    phaseTitle: snap.phase.title,
    phaseNote: snap.phaseNote,
    outer: snap.outer,
    social: snap.social,
    friction: snap.friction,
    personalAsk: snap.personalAsk,
    actions: snap.actions.slice(0, 3),
    stance:
      '时代环境=宏观透镜；不得改写日主/用神；不得单独据此断吉凶或投资；须与个人大运流年对齐后给动作。',
    hub: snap.hubHref,
  };
}

export function buildEraEnvironmentPromptModuleContent(year = new Date().getFullYear()): string {
  return JSON.stringify(buildEraEnvironmentPromptPayload(year), null, 2);
}
