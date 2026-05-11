/**
 * 共享：给一个 fortuneId 构建 / 复用 timing profile
 * 三个调用方：
 * 1. /r/[id] page.tsx — 用户访问时
 * 2. cron monthly digest — 给订阅用户发邮件时
 * 3. bootstrap 脚本 — 批量初始化
 */

import { fortuneOperations } from '@/lib/database';
import { PillarCalculatorService } from '@/lib/services/pillar-calculator.service';
import { calculateDayun } from '@/lib/dayun-calculator';
import { buildTimingProfile } from './timing-orchestrator';
import { getCurrentLiuNianGanZhi } from './lunar-utils';
import {
  getTimingProfile,
  saveTimingProfile,
  isProfileFresh,
  type TimingProfileRecord,
} from './timing-profile-store';
import { fallbackNarrate } from './timing-narrator';
import type { DetectorInput } from './types';

interface FortuneShape {
  id: string;
  userId: string | null | undefined;
  birthDate: string;
  birthTime: string | null | undefined;
  gender: string | null | undefined;
  analysis?: unknown;
}

export interface ResolveProfileResult {
  record: TimingProfileRecord;
  freshlyComputed: boolean;
}

/**
 * 给一份报告读取或重建 timing profile（含 fallback narrator）
 *
 * 缓存命中条件：birthSignature 一致 + computed_for_year 一致
 * 否则重算并 saveTimingProfile（status=fallback）
 *
 * 调用方收到的 record 始终带 userCopy（fallback 模板或 LLM 都行）
 */
export function resolveTimingProfileForReport(reportId: string): ResolveProfileResult | null {
  const fortune = fortuneOperations.getById(reportId) as FortuneShape | null;
  if (!fortune || !fortune.userId) return null;

  return resolveTimingProfileForFortune(fortune);
}

export function resolveTimingProfileForFortune(fortune: FortuneShape): ResolveProfileResult | null {
  const userId = fortune.userId;
  if (!userId) return null;

  const birthDate = new Date(fortune.birthDate);
  if (Number.isNaN(birthDate.getTime())) return null;
  const birthTime = fortune.birthTime || '12:00';
  const gender = (fortune.gender || 'male') as 'male' | 'female';
  const now = new Date();

  const pillarCalculator = new PillarCalculatorService();
  const pillars = pillarCalculator.calculate({
    date: birthDate,
    time: birthTime,
    timezone: 8,
  });

  const birthSignature = `${fortune.birthDate}_${pillars[0].celestialStem}${pillars[0].earthlyBranch}`;
  const currentLiuNian = getCurrentLiuNianGanZhi(now);

  let record = getTimingProfile(userId);

  if (isProfileFresh(record, birthSignature, currentLiuNian)) {
    return { record: record!, freshlyComputed: false };
  }

  // 重算
  const dayunResult = calculateDayun(
    birthDate,
    birthTime,
    gender,
    pillars[0].celestialStem,
    { gan: pillars[1].celestialStem, zhi: pillars[1].earthlyBranch },
    null,
    birthDate.getFullYear()
  );

  const input: DetectorInput = {
    bazi: {
      yearGan: pillars[0].celestialStem,
      yearZhi: pillars[0].earthlyBranch,
      monthGan: pillars[1].celestialStem,
      monthZhi: pillars[1].earthlyBranch,
      dayGan: pillars[2].celestialStem,
      dayZhi: pillars[2].earthlyBranch,
      hourGan: pillars[3].celestialStem,
      hourZhi: pillars[3].earthlyBranch,
    },
    birthDate,
    currentDate: now,
    dayunResult,
    pattern: extractPatternFromAnalysis(fortune.analysis),
  };

  const profile = buildTimingProfile(input);

  // 立即填 fallback narrator copy
  const profileWithFallback = {
    ...profile,
    next_30_days: profile.next_30_days.map((p) => ({ ...p, userCopy: fallbackNarrate(p) })),
    next_12_months: profile.next_12_months.map((p) => ({ ...p, userCopy: fallbackNarrate(p) })),
  };

  saveTimingProfile({
    userId,
    reportId: fortune.id,
    profile: profileWithFallback,
    narratorStatus: 'fallback',
  });

  record = {
    userId,
    reportId: fortune.id,
    narratorStatus: 'fallback',
    narratorCompletedAt: new Date().toISOString(),
    ...profileWithFallback,
  };

  return { record, freshlyComputed: true };
}

function extractPatternFromAnalysis(analysis: unknown): string | undefined {
  if (typeof analysis !== 'string') return undefined;
  try {
    const parsed = JSON.parse(analysis);
    if (parsed?.pattern?.type) return parsed.pattern.type;
  } catch {
    return undefined;
  }
  return undefined;
}
