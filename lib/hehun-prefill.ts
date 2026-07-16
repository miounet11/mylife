/**
 * 合婚预填：从报告 / 档案 pillarSummary 解析日柱、用忌、当前大运
 */

import type { HehunPersonInput } from '@/lib/hehun-engine';
import {
  personFromBirthInput,
  personFromGroundTruthPack,
  personFromReportResult,
} from '@/lib/hehun-engine';
import { buildGroundTruthPackFromBirth } from '@/lib/ground-truth/pack';
import type { BirthInput } from '@/lib/fortune-context-builder';

const GAN = '甲乙丙丁戊己庚辛壬癸';
const ZHI = '子丑寅卯辰巳午未申酉戌亥';

export function extractGanZhiToken(text?: string | null): string {
  const m = `${text || ''}`.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/);
  return m?.[0] || '';
}

export function parseDayPillarFromSummary(pillarSummary?: string | null): {
  dayMaster: string;
  dayBranch: string;
  pillars: string[];
} | null {
  if (!pillarSummary) return null;
  const matches = pillarSummary.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g) || [];
  if (matches.length < 3) {
    // try space-separated
    const parts = pillarSummary
      .split(/[\s,，、]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && GAN.includes(s[0]!) && ZHI.includes(s[1]!));
    if (parts.length >= 3) {
      const day = parts[2]!;
      return { dayMaster: day[0]!, dayBranch: day[1]!, pillars: parts };
    }
    return null;
  }
  const day = matches[2]!;
  return {
    dayMaster: day[0]!,
    dayBranch: day[1]!,
    pillars: matches,
  };
}

export function personFromPillarSummary(
  summary: string | null | undefined,
  opts?: {
    name?: string;
    yongShen?: string[];
    jiShen?: string[];
    currentDayunGanZhi?: string;
    currentDayunQuality?: string;
    currentDayunYongMatch?: string;
    currentDayunYears?: string;
  }
): HehunPersonInput | null {
  const parsed = parseDayPillarFromSummary(summary);
  if (!parsed) return null;
  return {
    name: opts?.name || '本人',
    dayMaster: parsed.dayMaster,
    dayBranch: parsed.dayBranch,
    pillars: parsed.pillars,
    yongShen: opts?.yongShen || [],
    jiShen: opts?.jiShen || [],
    currentDayunGanZhi: opts?.currentDayunGanZhi || undefined,
    currentDayunQuality: opts?.currentDayunQuality || undefined,
    currentDayunYongMatch: opts?.currentDayunYongMatch || undefined,
    currentDayunYears: opts?.currentDayunYears || undefined,
  };
}

function appendPersonQuery(q: URLSearchParams, prefix: 'a' | 'b', person: HehunPersonInput) {
  if (person.name) q.set(`${prefix}Name`, person.name);
  if (person.dayMaster) q.set(`${prefix}Dm`, person.dayMaster);
  if (person.dayBranch) q.set(`${prefix}Db`, person.dayBranch);
  if (person.yongShen?.length) q.set(`${prefix}Yong`, person.yongShen.join(','));
  if (person.jiShen?.length) q.set(`${prefix}Ji`, person.jiShen.join(','));
  if (person.currentDayunGanZhi) q.set(`${prefix}Dz`, person.currentDayunGanZhi);
  if (person.currentDayunQuality) q.set(`${prefix}Dq`, person.currentDayunQuality);
  if (person.currentDayunYongMatch) q.set(`${prefix}Dy`, person.currentDayunYongMatch);
  if (person.currentDayunYears) q.set(`${prefix}Dyears`, person.currentDayunYears);
}

export function buildHehunHref(params: {
  reportId?: string;
  personA?: HehunPersonInput | null;
  personB?: HehunPersonInput | null;
}) {
  const q = new URLSearchParams();
  if (params.reportId) q.set('reportId', params.reportId);
  if (params.personA) appendPersonQuery(q, 'a', params.personA);
  if (params.personB) appendPersonQuery(q, 'b', params.personB);
  const qs = q.toString();
  return qs ? `/hehun?${qs}` : '/hehun';
}

export function hehunPersonFromQuery(
  side: 'a' | 'b',
  search: URLSearchParams
): HehunPersonInput | null {
  const p = side === 'a' ? 'a' : 'b';
  const dm = search.get(`${p}Dm`) || '';
  const db = search.get(`${p}Db`) || '';
  if (!dm || !db) return null;
  const dz = extractGanZhiToken(search.get(`${p}Dz`)) || search.get(`${p}Dz`) || '';
  return {
    name: search.get(`${p}Name`) || (side === 'a' ? '本人' : '对方'),
    dayMaster: dm.slice(0, 1),
    dayBranch: db.slice(0, 1),
    yongShen: splitEls(search.get(`${p}Yong`)),
    jiShen: splitEls(search.get(`${p}Ji`)),
    currentDayunGanZhi: dz || undefined,
    currentDayunQuality: search.get(`${p}Dq`) || undefined,
    currentDayunYongMatch: search.get(`${p}Dy`) || undefined,
    currentDayunYears: search.get(`${p}Dyears`) || undefined,
  };
}

function splitEls(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 从 Pro 视图 + 可选 dayun 结构构建合婚甲方 */
export function personFromProView(params: {
  name?: string;
  dayMaster?: string;
  dayPillarGanZhi?: string;
  yongShen?: string[];
  jiShen?: string[];
  currentDaYunText?: string;
  currentDayun?: {
    ganZhi?: string;
    quality?: string;
    yongShenMatch?: string;
    startYear?: number;
    endYear?: number;
  } | null;
}): HehunPersonInput {
  const dayGz = extractGanZhiToken(params.dayPillarGanZhi);
  const dayMaster =
    (params.dayMaster || '').slice(0, 1) || (dayGz ? dayGz[0]! : '');
  const dayBranch = dayGz ? dayGz[1]! : '';
  const dz =
    params.currentDayun?.ganZhi ||
    extractGanZhiToken(params.currentDaYunText) ||
    '';
  const years =
    params.currentDayun?.startYear && params.currentDayun?.endYear
      ? `${params.currentDayun.startYear}-${params.currentDayun.endYear}`
      : undefined;
  return {
    name: params.name || '本人',
    dayMaster,
    dayBranch,
    yongShen: params.yongShen || [],
    jiShen: params.jiShen || [],
    currentDayunGanZhi: dz || undefined,
    currentDayunQuality: params.currentDayun?.quality || undefined,
    currentDayunYongMatch: params.currentDayun?.yongShenMatch || undefined,
    currentDayunYears: years,
  };
}

export function hehunFromReportResult(
  result: Parameters<typeof personFromReportResult>[0],
  name?: string
) {
  return personFromReportResult(result, name);
}

/** 从出生信息生成合婚单方（引擎 pack）。 */
export function hehunPersonFromBirth(birth: BirthInput, name?: string): HehunPersonInput {
  const pack = buildGroundTruthPackFromBirth(birth);
  return personFromGroundTruthPack(pack, name || birth.name);
}

/** 双人出生信息 → 合婚对照（无需完整报告）。 */
export function hehunFromBirthPair(
  a: BirthInput,
  b: BirthInput,
): { personA: HehunPersonInput; personB: HehunPersonInput } {
  return {
    personA: hehunPersonFromBirth(a, a.name || '甲方'),
    personB: hehunPersonFromBirth(b, b.name || '乙方'),
  };
}

export { personFromBirthInput, personFromGroundTruthPack };
