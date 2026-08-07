/**
 * 合盘周运：双方周均 + 配对结构 + 合成周节奏
 */

import { buildAstroWeekPack, parseIsoWeekId, datesInIsoWeek } from '@/lib/astro/week-engine';
import { buildAstroPairPack, canonicalPairKeys } from '@/lib/astro/pair-engine';
import { buildAstroPairDayPack } from '@/lib/astro/pair-day-engine';
import type { SignKey } from '@/lib/astro/types';
import type { PersonalDayStance } from '@/lib/almanac/types';

export type AstroPairWeekDay = {
  date: string;
  score: number;
  stance: PersonalDayStance;
  href: string;
};

export type AstroPairWeekPack = {
  weekId: string;
  label: string;
  a: SignKey;
  b: SignKey;
  title: string;
  pairScore: number;
  aAvg: number;
  bAvg: number;
  combinedAvg: number;
  pushDays: number;
  conserveDays: number;
  best: AstroPairWeekDay | null;
  careful: AstroPairWeekDay | null;
  days: AstroPairWeekDay[];
  favors: string[];
  watchouts: string[];
  elementNote: string;
  worldYi: string;
  pairPath: string;
  aWeekHref: string;
  bWeekHref: string;
  seo: { title: string; description: string; keywords: string[] };
};

export function buildAstroPairWeekPack(
  weekId: string,
  keyA: string,
  keyB: string,
): AstroPairWeekPack | null {
  if (!parseIsoWeekId(weekId)) return null;
  const keys = canonicalPairKeys(keyA, keyB);
  if (!keys) return null;
  const pair = buildAstroPairPack(keys[0], keys[1]);
  if (!pair) return null;

  const aWeek = buildAstroWeekPack(
    weekId,
    { kind: 'sign', key: keys[0] },
    pair.title.split('与')[0] || keys[0],
    (date) => `/astro/signs/${keys[0]}/day/${date}`,
  );
  const bWeek = buildAstroWeekPack(
    weekId,
    { kind: 'sign', key: keys[1] },
    keys[1],
    (date) => `/astro/signs/${keys[1]}/day/${date}`,
  );
  if (!aWeek || !bWeek) return null;

  const dates = datesInIsoWeek(weekId);
  const days: AstroPairWeekDay[] = [];
  for (const date of dates) {
    const pd = buildAstroPairDayPack(date, keys[0], keys[1]);
    if (!pd) continue;
    days.push({
      date,
      score: pd.combined.score,
      stance: pd.combined.stance,
      href: `/astro/pair/${keys[0]}/${keys[1]}/day/${date}`,
    });
  }
  if (!days.length) return null;

  const combinedAvg = Math.round(days.reduce((s, d) => s + d.score, 0) / days.length);
  const best = [...days].sort((a, b) => b.score - a.score)[0] || null;
  const careful = [...days].sort((a, b) => a.score - b.score)[0] || null;
  const pushDays = days.filter((d) => d.stance === 'push').length;
  const conserveDays = days.filter((d) => d.stance === 'conserve').length;

  const favors = [
    `本周双方周均 ${aWeek.avg} / ${bWeek.avg}，合盘周均 ${combinedAvg}`,
    best ? `较适合一起推进：${best.date}（${best.score}分）` : '',
    ...pair.favors.slice(0, 2),
  ].filter(Boolean);
  const watchouts = [
    careful ? `宜降规格沟通：${careful.date}（${careful.score}分）` : '',
    conserveDays >= 3 ? `本周守成日偏多（${conserveDays}天），重大承诺宜后移` : '',
    ...pair.watchouts.slice(0, 2),
  ].filter(Boolean);

  return {
    weekId,
    label: aWeek.label,
    a: keys[0],
    b: keys[1],
    title: pair.title,
    pairScore: pair.score,
    aAvg: aWeek.avg,
    bAvg: bWeek.avg,
    combinedAvg,
    pushDays,
    conserveDays,
    best,
    careful,
    days,
    favors: favors.slice(0, 5),
    watchouts: watchouts.slice(0, 5),
    elementNote: pair.elementNote,
    worldYi: pair.worldYi,
    pairPath: `/astro/pair/${keys[0]}/${keys[1]}`,
    aWeekHref: `/astro/signs/${keys[0]}/week/${weekId}`,
    bWeekHref: `/astro/signs/${keys[1]}/week/${weekId}`,
    seo: {
      title: `${pair.title}${weekId}合盘周运｜双星座周均｜人生K线`,
      description: `${pair.title}${weekId}：合盘周均${combinedAvg}，双方${aWeek.avg}/${bWeek.avg}。配对结构+7日引擎，非宿命。`,
      keywords: [pair.title, weekId, '合盘周运', '双星座'],
    },
  };
}
