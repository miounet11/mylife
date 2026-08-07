/**
 * 合盘日运：两人星座结构 + 各自流日引擎分 + 合成建议
 */

import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import { isValidIsoDate } from '@/lib/astro/daily-window';
import { buildAstroPairPack, canonicalPairKeys } from '@/lib/astro/pair-engine';
import type { SignKey } from '@/lib/astro/types';
import type { PersonalDayStance } from '@/lib/almanac/types';

export type AstroPairDayPack = {
  date: string;
  a: SignKey;
  b: SignKey;
  title: string;
  pairScore: number;
  pairStance: 'ease' | 'work' | 'neutral';
  aDaily: {
    composite: number;
    stance: PersonalDayStance;
    mood: string;
    href: string;
  };
  bDaily: {
    composite: number;
    stance: PersonalDayStance;
    mood: string;
    href: string;
  };
  combined: {
    score: number;
    stance: PersonalDayStance;
    headline: string;
    favors: string[];
    watchouts: string[];
    evidence: Array<{ code: string; label: string }>;
  };
  elementNote: string;
  worldYi: string;
  almanacPath: string;
  pairPath: string;
  seo: { title: string; description: string; keywords: string[] };
};

function mergeStance(a: PersonalDayStance, b: PersonalDayStance): PersonalDayStance {
  if (a === 'conserve' || b === 'conserve') return 'conserve';
  if (a === 'push' && b === 'push') return 'push';
  return 'steady';
}

export function buildAstroPairDayPack(
  date: string,
  keyA: string,
  keyB: string,
): AstroPairDayPack | null {
  if (!isValidIsoDate(date)) return null;
  const keys = canonicalPairKeys(keyA, keyB);
  if (!keys) return null;
  const pair = buildAstroPairPack(keys[0], keys[1]);
  if (!pair) return null;
  const aPack = buildAstroDailyMatchPack(date, { kind: 'sign', key: keys[0] });
  const bPack = buildAstroDailyMatchPack(date, { kind: 'sign', key: keys[1] });
  if (!aPack || !bPack) return null;

  const combinedScore = Math.round(
    pair.score * 0.35 + aPack.scores.composite * 0.325 + bPack.scores.composite * 0.325,
  );
  const stance = mergeStance(aPack.scores.stance, bPack.scores.stance);
  const favors: string[] = [];
  const watchouts: string[] = [];
  const evidence: Array<{ code: string; label: string }> = [
    {
      code: 'PAIR_BASE',
      label: `配对结构分 ${pair.score}（${pair.stance === 'ease' ? '较易协作' : pair.stance === 'work' ? '需边界' : '中性'}）`,
    },
    {
      code: 'A_DAY',
      label: `${aPack.identity.title}今日 ${aPack.scores.composite}·${aPack.scores.stance}`,
    },
    {
      code: 'B_DAY',
      label: `${bPack.identity.title}今日 ${bPack.scores.composite}·${bPack.scores.stance}`,
    },
    {
      code: 'FLOW',
      label: `流日 ${aPack.almanac.dayGanZhi} · 宜${aPack.almanac.yi.slice(0, 2).join('、') || '—'}`,
    },
  ];

  if (aPack.scores.stance === 'push' && bPack.scores.stance === 'push') {
    favors.push('双方今日都偏「可试」：适合一起推进已准备事项，忌同时开新战场。');
  } else if (aPack.scores.stance === 'conserve' || bPack.scores.stance === 'conserve') {
    watchouts.push('至少一方今日偏守成：重要承诺、冲突性对话宜降规格或改期。');
  } else {
    favors.push('节奏中性：用清单对齐目标与边界，比情绪拉扯更有效。');
  }
  favors.push(...pair.favors.slice(0, 2));
  watchouts.push(...pair.watchouts.slice(0, 2));
  if (aPack.narrative.topHours[0] && bPack.narrative.topHours[0]) {
    favors.push(
      `对外窗口可对齐：${aPack.identity.title} ${aPack.narrative.topHours[0].timeLabel || aPack.narrative.topHours[0].ganZhi}；${bPack.identity.title} ${bPack.narrative.topHours[0].timeLabel || bPack.narrative.topHours[0].ganZhi}`,
    );
  }

  const stanceLine =
    stance === 'push' ? '可协作推进' : stance === 'conserve' ? '宜共同守界' : '稳节奏对齐';
  const title = `${pair.title} · ${date}`;

  return {
    date,
    a: keys[0],
    b: keys[1],
    title,
    pairScore: pair.score,
    pairStance: pair.stance,
    aDaily: {
      composite: aPack.scores.composite,
      stance: aPack.scores.stance,
      mood: aPack.narrative.moodLine,
      href: `/astro/signs/${keys[0]}/day/${date}`,
    },
    bDaily: {
      composite: bPack.scores.composite,
      stance: bPack.scores.stance,
      mood: bPack.narrative.moodLine,
      href: `/astro/signs/${keys[1]}/day/${date}`,
    },
    combined: {
      score: Math.max(0, Math.min(100, combinedScore)),
      stance,
      headline: `${pair.title}今日合盘节奏：${stanceLine}（综合${combinedScore}）`,
      favors: favors.slice(0, 5),
      watchouts: watchouts.slice(0, 5),
      evidence,
    },
    elementNote: pair.elementNote,
    worldYi: pair.worldYi,
    almanacPath: `/almanac/${date}`,
    pairPath: `/astro/pair/${keys[0]}/${keys[1]}`,
    seo: {
      title: `${pair.title}${date}合盘日运｜双星座引擎匹配｜人生K线`,
      description: `${pair.title}在${date}：配对${pair.score}分，双方日运${aPack.scores.composite}/${bPack.scores.composite}，综合${combinedScore}。结构参考，非宿命。`,
      keywords: [pair.title, '合盘', '双星座', date, '日运'],
    },
  };
}
