// ── Build Engine Ground Truth V6 ──
// Converts raw FortuneAnalysisResult into StructuredAgenticGroundTruth

import type { EngineGroundTruth, LifeProfileContext } from './types';
import type { KlinePointV6, KlineAnchorV6 } from '@/lib/kline-v6';
import type { Pillar } from '@/lib/user-types';
import type { YongShenResult } from '@/lib/bazi-analyzer';
import type { DayunResult } from '@/lib/dayun-calculator';
import type { LifeProfile } from '@/lib/life-profile/types';
import { calculateShiShen, ZHI_CANG_GAN } from '@/lib/bazi-constants';

export interface GroundTruthInput {
  birthDate: Date;
  pillars: Pillar[];
  yongShen: YongShenResult | null;
  dayun: DayunResult | null;
  kline: KlinePointV6[];
  anchors: KlineAnchorV6[];
  shenSha: Array<string | { name?: string; pillar?: string; impact?: string; description?: string }>;
  pattern?: string;
  lifeProfile?: LifeProfile | null;
}

export function buildEngineGroundTruth(input: GroundTruthInput): EngineGroundTruth {
  const birthDate = input.birthDate instanceof Date ? input.birthDate : new Date(input.birthDate);
  const pillars = Array.isArray(input.pillars) ? input.pillars : [];
  const yongShen = input.yongShen || null;
  const dayun = input.dayun || null;
  const kline = Array.isArray(input.kline) ? input.kline : [];
  const anchors = Array.isArray(input.anchors) ? input.anchors : [];
  const shenSha = Array.isArray(input.shenSha) ? input.shenSha : [];

  const dayMaster = pillars[2]?.celestialStem || '';
  const currentYear = new Date().getFullYear();
  const currentAge = Number.isFinite(birthDate.getTime())
    ? currentYear - birthDate.getFullYear()
    : 0;

  // ── Constitution ──
  const constitution: EngineGroundTruth['constitution'] = {
    dayMaster,
    strength: normalizeStrength(yongShen?.strength || '中和'),
    patternType: input.pattern || '正格',
    yongShen: yongShen?.yongShen || [],
    xiShen: yongShen?.xiShen || [],
    jiShen: yongShen?.jiShen || [],
    seasonContext: getSeasonContext(birthDate.getMonth() + 1),
  };

  // ── Pillars ──
  const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
  const groundPillars = pillars.map((p, i) => ({
    label: pillarLabels[i] || `柱${i + 1}`,
    ganZhi: `${p.celestialStem}${p.earthlyBranch}`,
    celestialStem: p.celestialStem,
    earthlyBranch: p.earthlyBranch,
    nayin: p.nayin || '',
    hiddenStems: p.hiddenStems || [],
  }));

  // ── Ten Gods Table（日主 vs 各柱天干/藏干，禁止留空供 LLM 臆造）──
  const tenGodsTable = pillars.map((p, idx) => {
    const ganZhi = `${p.celestialStem || ''}${p.earthlyBranch || ''}`;
    const stemShiShen =
      idx === 2 ? '日主' : calculateShiShen(dayMaster, p.celestialStem) || '';
    const hiddenStems =
      Array.isArray(p.hiddenStems) && p.hiddenStems.length > 0
        ? p.hiddenStems
        : ZHI_CANG_GAN[p.earthlyBranch] || [];
    const hiddenShiShen = hiddenStems
      .map((stem) => calculateShiShen(dayMaster, stem))
      .filter((name): name is string => Boolean(name));
    return {
      pillar: ganZhi,
      stemShiShen,
      branchShiShen: hiddenShiShen[0] || '',
      hiddenShiShen,
    };
  });

  // ── K-line ──
  const phases = computePhases(kline);
  const windows = anchorsToWindows(anchors);

  const klineSection: EngineGroundTruth['kline'] = {
    points: kline,
    anchorPoints: anchors,
    phases,
    windows,
  };

  // ── Time Windows (3-year rolling per dimension) ──
  const timeWindows: EngineGroundTruth['timeWindows'] = {
    career: buildDimWindows(kline, 'career', 3),
    wealth: buildDimWindows(kline, 'wealth', 3),
    relationship: buildDimWindows(kline, 'marriage', 3),
    health: buildDimWindows(kline, 'health', 3),
  };

  // ── Dayun ──
  const dayunList = Array.isArray(dayun?.dayunList)
    ? dayun.dayunList
    : Array.isArray((dayun as { dayuns?: typeof dayun.dayunList } | null | undefined)?.dayuns)
      ? (dayun as { dayuns: NonNullable<typeof dayun.dayunList> }).dayuns
      : [];
  const dayunWindows = dayunList.map((d, i) => ({
    ganZhi: d.ganZhi,
    startAge: d.startAge,
    endAge: d.endAge,
    quality: d.quality,
    yongShenMatch: d.yongShenMatch,
    isCurrent: i === (dayun?.currentDayunIndex ?? 0),
  }));

  const currentDayunWindow = dayunWindows.find((w) => w.isCurrent) || null;
  const dayunSection: EngineGroundTruth['dayun'] = {
    windows: dayunWindows,
    direction: yongShen?.yongShen?.[0] ? '顺势' : '待定',
    currentDayun: currentDayunWindow
      ? {
          ganZhi: currentDayunWindow.ganZhi,
          startAge: currentDayunWindow.startAge,
          endAge: currentDayunWindow.endAge,
          quality: currentDayunWindow.quality,
          yongShenMatch: currentDayunWindow.yongShenMatch,
        }
      : null,
  };

  // ── ShenSha ──
  const shenShaList: EngineGroundTruth['shenSha'] = (shenSha || []).map((entry) => {
    if (typeof entry === 'string') {
      return { name: entry, pillar: '综合', impact: 'neutral' as const };
    }
    const item = entry as { name?: string; pillar?: string; impact?: string; description?: string };
    const name = item.name || '';
    const impactRaw = `${item.impact || item.description || ''}`.toLowerCase();
    const impact =
      /正|吉|贵|好|利|positive/.test(impactRaw)
        ? ('positive' as const)
        : /凶|忌|负|风险|negative/.test(impactRaw)
          ? ('negative' as const)
          : ('neutral' as const);
    return {
      name,
      pillar: item.pillar || '综合',
      impact,
    };
  }).filter((item) => item.name);

  // ── Derived Facts ──
  const safeKline = Array.isArray(kline) ? kline : [];
  const currentPoint = safeKline.find((p) => p?.year === currentYear);
  const avgScore = (p: KlinePointV6) =>
    ((Number(p?.career) || 0) + (Number(p?.wealth) || 0) + (Number(p?.marriage) || 0) + (Number(p?.health) || 0)) / 4;
  const scores = safeKline.map(avgScore).filter((n) => Number.isFinite(n));

  const derivedFacts: EngineGroundTruth['derivedFacts'] = {
    currentAge,
    currentYear,
    currentScore: currentPoint ? Math.round(avgScore(currentPoint)) : 50,
    peakScore: scores.length ? Math.round(Math.max(...scores)) : 50,
    troughScore: scores.length ? Math.round(Math.min(...scores)) : 50,
  };

  let lifeProfile: LifeProfileContext | undefined;
  try {
    lifeProfile = buildLifeProfileContext(input.lifeProfile ?? null, input.yongShen);
  } catch {
    lifeProfile = undefined;
  }

  return {
    constitution,
    pillars: groundPillars,
    tenGodsTable,
    kline: klineSection,
    timeWindows,
    dayun: dayunSection,
    shenSha: shenShaList,
    derivedFacts,
    lifeProfile,
  };
}

// ── Helpers ──

const EVENT_FOCUS_MAP: Record<string, string> = {
  job_change: 'career',
  entrepreneurship: 'career',
  study: 'career',
  marriage: 'relationship',
  birth: 'relationship',
  move: 'spatial',
  illness: 'health',
  other: 'general',
};

function buildLifeProfileContext(
  profile?: LifeProfile | null,
  yongShen?: YongShenResult | null,
): LifeProfileContext | undefined {
  if (!profile) return undefined;

  const keyEvents = Array.isArray(profile.keyEvents) ? profile.keyEvents : [];
  const predictionOutcomes = Array.isArray(profile.predictionOutcomes) ? profile.predictionOutcomes : [];
  const calibrationByCategory =
    profile.calibrationByCategory && typeof profile.calibrationByCategory === 'object'
      ? profile.calibrationByCategory
      : {};
  const learningProgress =
    profile.learningProgress && typeof profile.learningProgress === 'object'
      ? profile.learningProgress
      : {};

  const recentEvents = [...keyEvents]
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .slice(0, 5)
    .map((event) => ({
      category: event.category,
      title: event.title,
      date: event.date,
      impact: event.impact,
    }));

  const focusAreas = Array.from(
    new Set([
      ...keyEvents.map((event) => EVENT_FOCUS_MAP[event.category] || event.category),
      ...predictionOutcomes
        .filter((item) => (item.pending || 0) > 0 || (item.hitRate || 0) < 0.6)
        .map((item) => item.category),
    ]),
  ).slice(0, 5);

  const uncertaintyNotes: string[] = [];
  const boundary = yongShen?.confidence?.boundary || profile.yongShen?.confidence?.boundary;
  if (boundary) {
    uncertaintyNotes.push(boundary);
  }
  if (keyEvents.length < 2) {
    uncertaintyNotes.push('用户人生事件反馈较少，趋势解读应保留更大不确定性边界。');
  }
  if ((profile.calibrationScore || 0) > 0 && (profile.calibrationScore || 0) < 0.5) {
    uncertaintyNotes.push(`历史命中率 ${Math.round((profile.calibrationScore || 0) * 100)}%，低命中领域应明确标注不确定性。`);
  }

  return {
    hasPreviousReports: (profile.reportCount || 0) > 0 || !!profile.lastReportId,
    calibrationScore: profile.calibrationScore || 0,
    calibrationByCategory,
    recentEvents,
    focusAreas,
    pastPredictionsSummary: predictionOutcomes.map((item) => ({
      category: item.category,
      total: item.total,
      hitRate: item.hitRate,
      pending: item.pending,
    })),
    preferredTone: profile.preferredTone,
    learningProgress,
    uncertaintyNotes,
  };
}

function normalizeStrength(raw: string): 'strong' | 'weak' | 'balanced' | 'follow' {
  const s = raw.toLowerCase();
  if (s.includes('强') || s.includes('旺') || s.includes('strong')) return 'strong';
  if (s.includes('弱') || s.includes('weak')) return 'weak';
  if (s.includes('从') || s.includes('follow')) return 'follow';
  return 'balanced';
}

function getSeasonContext(month: number): string {
  if (month >= 3 && month <= 5) return '春木当令';
  if (month >= 6 && month <= 8) return '夏火当令';
  if (month >= 9 && month <= 11) return '秋金当令';
  return '冬水当令';
}

function computePhases(kline: KlinePointV6[]): EngineGroundTruth['kline']['phases'] {
  if (kline.length < 5) return [];
  const phases: EngineGroundTruth['kline']['phases'] = [];
  const segSize = 5;
  for (let i = 0; i < kline.length; i += segSize) {
    const seg = kline.slice(i, i + segSize);
    if (seg.length < 2) break;
    const avg = seg.reduce((s, p) => s + (p.career + p.wealth + p.marriage + p.health) / 4, 0) / seg.length;
    const first = (seg[0]!.career + seg[0]!.wealth + seg[0]!.marriage + seg[0]!.health) / 4;
    const last = (seg[seg.length - 1]!.career + seg[seg.length - 1]!.wealth + seg[seg.length - 1]!.marriage + seg[seg.length - 1]!.health) / 4;
    phases.push({
      label: `${seg[0]!.year}-${seg[seg.length - 1]!.year}`,
      startYear: seg[0]!.year,
      endYear: seg[seg.length - 1]!.year,
      trend: last - first > 3 ? 'up' : first - last > 3 ? 'down' : 'flat',
      avgScore: Math.round(avg),
    });
  }
  return phases;
}

function anchorsToWindows(anchors: KlineAnchorV6[]): EngineGroundTruth['kline']['windows'] {
  return anchors.slice(0, 8).map((a) => {
    const typeLabel = a.type === 'peak' ? '高点' : a.type === 'trough' ? '低点' : '转折';
    return {
      // Unique year-scoped labels so review H2 / agents can align without inventing windows
      label: `${a.year}${typeLabel}`,
      startYear: a.year,
      endYear: a.year + 1,
      type: a.type as 'peak' | 'trough' | 'turning' | 'stable',
      score: a.score || 50,
    };
  });
}

function buildDimWindows(kline: KlinePointV6[], dim: string, size: number): Array<{ label: string; startYear: number; endYear: number; score: number }> {
  if (kline.length < size) return [];
  const windows: Array<{ label: string; startYear: number; endYear: number; score: number }> = [];
  for (let i = 0; i + size <= kline.length; i += 2) {
    const seg = kline.slice(i, i + size);
    const avg = seg.reduce((s, p) => s + ((p as any)[dim] || 0), 0) / seg.length;
    windows.push({
      label: `${seg[0]!.year}-${seg[seg.length - 1]!.year}`,
      startYear: seg[0]!.year,
      endYear: seg[seg.length - 1]!.year,
      score: Math.round(avg),
    });
  }
  return windows;
}
