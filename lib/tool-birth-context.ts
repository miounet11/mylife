/**
 * Birth-only free-tool context — no saved report required.
 * Builds GroundTruthPack + an ephemeral FortuneRecord-shaped shell for orchestrator.
 * Session.reportId must be null (FK to fortunes); meta.birthEphemeral=true.
 */

import {
  buildGroundTruthPackFromBirth,
  type GroundTruthPack,
} from '@/lib/ground-truth/pack';
import type { BirthInput } from '@/lib/fortune-context-builder';
import type { FortuneRecord, Pillar } from '@/lib/user-types';

export const EPHEMERAL_REPORT_PREFIX = 'ephemeral_birth_';

export function isEphemeralBirthReportId(id: string | null | undefined): boolean {
  return Boolean(id && `${id}`.startsWith(EPHEMERAL_REPORT_PREFIX));
}

export function parseToolBirthInput(raw: unknown): BirthInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const birthDate = `${o.birthDate || o.date || ''}`.trim();
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (!Number.isFinite(d.getTime())) return null;
  // Reject absurd future births > 1 year ahead
  if (d.getTime() > Date.now() + 366 * 24 * 3600 * 1000) return null;
  // Reject births before 1900
  if (d.getFullYear() < 1900) return null;

  const genderRaw = `${o.gender || ''}`.trim().toLowerCase();
  const gender =
    genderRaw === 'female' || genderRaw === '女' || genderRaw === 'f'
      ? 'female'
      : genderRaw === 'male' || genderRaw === '男' || genderRaw === 'm'
        ? 'male'
        : undefined;

  const accuracyRaw = `${o.birthAccuracy || o.accuracy || ''}`.trim();
  const birthAccuracy =
    accuracyRaw === 'exact' || accuracyRaw === 'range' || accuracyRaw === 'unknown'
      ? accuracyRaw
      : undefined;

  return {
    birthDate,
    birthTime: `${o.birthTime || o.time || ''}`.trim() || undefined,
    birthPlace: `${o.birthPlace || o.place || ''}`.trim() || undefined,
    birthAccuracy,
    gender,
    name: `${o.name || ''}`.trim() || undefined,
  };
}

function pillarsFromPack(pack: GroundTruthPack): Pillar[] {
  const raw = pack.truthInput.pillars || [];
  return raw.map((p) => ({
    celestialStem: p.celestialStem,
    earthlyBranch: p.earthlyBranch,
    nayin: (p as Pillar).nayin || '',
    hiddenStems: (p as Pillar).hiddenStems || [],
  }));
}

/**
 * Ephemeral report shell for runToolWorkflow when user only provides birth.
 * Not persisted to fortunes table.
 */
export function buildEphemeralReportFromBirth(params: {
  userId: string;
  birth: BirthInput;
}): { report: FortuneRecord; pack: GroundTruthPack } {
  const pack = buildGroundTruthPackFromBirth(params.birth);
  const f = pack.lockedFacts;
  const pillars = pillarsFromPack(pack);
  const dayun = pack.truthInput.dayun;
  const current =
    dayun && typeof dayun.currentDayunIndex === 'number'
      ? dayun.dayunList?.[dayun.currentDayunIndex]
      : dayun?.dayunList?.[0];

  const report: FortuneRecord = {
    id: `${EPHEMERAL_REPORT_PREFIX}${params.userId.slice(0, 12)}_${Date.now().toString(36)}`,
    userId: params.userId,
    name: params.birth.name || '快速测算',
    birthDate: params.birth.birthDate,
    birthTime: params.birth.birthTime || '12:00',
    birthPlace: params.birth.birthPlace,
    timezone: 8,
    gender: params.birth.gender === 'female' ? 'female' : 'male',
    bazi: {
      dayMaster: f.dayMaster,
      pillars,
    } as FortuneRecord['bazi'],
    fiveElements: {} as FortuneRecord['fiveElements'],
    tenGods: {} as FortuneRecord['tenGods'],
    pattern: { type: f.pattern || '以结构为准' } as FortuneRecord['pattern'],
    fortune: {
      currentDaYun: current
        ? `${current.ganZhi}（${current.startAge}-${current.endAge}岁）`
        : f.currentDayun
          ? `${f.currentDayun.ganZhi}（${f.currentDayun.startAge}-${f.currentDayun.endAge}岁）`
          : '',
      currentLiuNian: `${f.currentYear}`,
    } as FortuneRecord['fortune'],
    advice: {
      yongShen: f.yongShen,
      xiShen: f.xiShen,
      jiShen: f.jiShen,
    } as FortuneRecord['advice'],
    evidence: {} as FortuneRecord['evidence'],
    analysis: {
      opening: `日主${f.dayMaster || '—'}，用神${f.yongShen.join('、') || '—'}，由出生信息即时重算。`,
      explanation: '本结果来自引擎真值包，非历史报告开场白。',
    } as FortuneRecord['analysis'],
    klineData: pack.truthInput.kline as FortuneRecord['klineData'],
    dayun: pack.truthInput.dayun as FortuneRecord['dayun'],
    shenSha: pack.truthInput.shenSha as FortuneRecord['shenSha'],
    reportVersion: 'birth-ephemeral-gt-v1',
  };

  return { report, pack };
}

/** Persistable reportId for sessions — null when ephemeral (FK-safe). */
export function sessionReportIdFor(report: { id?: string } | null | undefined): string | null {
  if (!report?.id) return null;
  if (isEphemeralBirthReportId(report.id)) return null;
  return report.id;
}
