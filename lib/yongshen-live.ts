/**
 * Live 用神解析：从四柱现算，避免旧报告缓存的喜忌（身强/身弱翻转问题）。
 */

import { determineYongShen, type YongShenResult } from '@/lib/bazi-analyzer';
import {
  isYongShenVersionCurrent,
  readStoredYongShenEngineVersion,
  YONGSHEN_ENGINE_VERSION,
} from '@/lib/yongshen-engine-version';
import { elementsToCn, formatYongShenPublic } from '@/lib/yongshen-presentation';

function toCnList(list: unknown): string[] {
  return elementsToCn(list);
}

/** 从报告 result 尽量抽出四柱干支数组 */
export function extractPillarGanZhiList(result: unknown): string[] | null {
  const r = (result || {}) as any;
  const pillars = r.basic?.pillars || r.pillars || r.yongShen?.pillars || [];
  if (!Array.isArray(pillars) || pillars.length < 4) return null;
  const list = pillars.slice(0, 4).map((p: any) => {
    if (typeof p === 'string' && p.length >= 2) return p.slice(0, 2);
    const gz = `${p?.ganZhi || ''}`.trim();
    if (gz.length >= 2) return gz.slice(0, 2);
    const stem = `${p?.celestialStem || p?.gan || ''}`.trim();
    const branch = `${p?.earthlyBranch || p?.zhi || ''}`.trim();
    if (stem && branch) return `${stem}${branch}`;
    return '';
  });
  if (list.some((x: string) => !x || x.length < 2)) return null;
  return list;
}

export type YongShenPresentation = {
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  strength: string;
  strengthDesc: string;
  score: number;
  reasonChain: string[];
  analysis: string;
  /** 一句用户向总览 */
  headline?: string;
  /** 宜生扶 / 宜克泄 */
  actionHint?: string;
  /** 调候附注（与主用神分列） */
  tiaohuoNote?: string;
  tiaohuoElement?: string;
  stale: boolean;
  storedVersion: string | null;
  liveVersion: string;
  /** English keys from engine when live */
  live: YongShenResult | null;
};

/** Best-effort birth date for 司令分日 on live recompute. */
function extractBirthDateHint(result: unknown): { birthDate?: string; birthHour?: number; birthMinute?: number } {
  const r = (result || {}) as any;
  const raw =
    r.birthDate ||
    r.basic?.birthDate ||
    r.input?.birthDate ||
    r.meta?.birthDate ||
    r.calculationProfile?.clockBirthDate ||
    '';
  const birthDate = `${raw || ''}`.trim().slice(0, 10);
  const timeRaw =
    r.birthTime ||
    r.basic?.birthTime ||
    r.input?.birthTime ||
    r.meta?.birthTime ||
    '';
  const tm = `${timeRaw || ''}`.match(/(\d{1,2}):(\d{2})/);
  return {
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : undefined,
    birthHour: tm ? Number(tm[1]) : undefined,
    birthMinute: tm ? Number(tm[2]) : undefined,
  };
}

/**
 * Prefer live recompute from pillars; fall back to stored advice/yongShen.
 * `stale=true` when stored engine version ≠ current (or missing on old reports with pillars).
 */
export function resolveYongShenPresentation(result: unknown): YongShenPresentation {
  const r = (result || {}) as any;
  const storedVersion = readStoredYongShenEngineVersion(result);
  const pillars = extractPillarGanZhiList(result);
  const liveVersion = YONGSHEN_ENGINE_VERSION;

  let live: YongShenResult | null = null;
  if (pillars) {
    try {
      const birthHint = extractBirthDateHint(result);
      live = determineYongShen(pillars, birthHint);
    } catch {
      live = null;
    }
  }

  const stale =
    Boolean(pillars) &&
    (!storedVersion || !isYongShenVersionCurrent(storedVersion));

  if (live) {
    const pub = formatYongShenPublic(live);
    return {
      yongShen: pub?.yongShen || toCnList(live.yongShen),
      xiShen: pub?.xiShen || toCnList(live.xiShen),
      jiShen: pub?.jiShen || toCnList(live.jiShen),
      strength: live.strength,
      strengthDesc: pub?.strengthDesc || live.strengthDesc,
      score: live.score,
      reasonChain: pub?.reasonChain || live.threeGain?.reasonChain || [],
      analysis: pub?.analysis || live.analysis || '',
      headline: pub?.headline,
      actionHint: pub?.actionHint,
      tiaohuoNote: pub?.tiaohuoNote,
      tiaohuoElement: pub?.tiaohuoElement,
      stale,
      storedVersion,
      liveVersion,
      live,
    };
  }

  // Fallback: stored fields only
  const storedYs = r.yongShen || r.analysis?.contextSignals?.yongShen || {};
  const advice = r.advice || {};
  return {
    yongShen: toCnList(advice.yongShen || storedYs.yongShen),
    xiShen: toCnList(advice.xiShen || storedYs.xiShen),
    jiShen: toCnList(advice.jiShen || storedYs.jiShen),
    strength: `${storedYs.strength || ''}`.trim(),
    strengthDesc: `${storedYs.strengthDesc || ''}`.trim() || '待分析',
    score: typeof storedYs.score === 'number' ? storedYs.score : 0,
    reasonChain: Array.isArray(storedYs.threeGain?.reasonChain)
      ? storedYs.threeGain.reasonChain.map(String)
      : [],
    analysis: `${storedYs.analysis || ''}`.trim(),
    stale: Boolean(pillars) || !isYongShenVersionCurrent(storedVersion),
    storedVersion,
    liveVersion,
    live: null,
  };
}
