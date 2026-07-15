// @ts-nocheck
import type { LearningTrackKey } from '@/lib/learning-tracks';
import type { ManagedContentEntry } from '@/lib/content-store';
import { entryText, matchesKeywords } from '@/lib/content-interest-signals';

export type EditorialPillar = 'knowledge' | 'world-yi' | 'kline-cta';

export type EditorialMissionMeta = {
  pillars: EditorialPillar[];
  primaryPillar: EditorialPillar;
  missionStatement: string;
  ctaHref: string;
  ctaLabel: string;
  worldYiHref?: string;
  learningTrackKey?: LearningTrackKey;
  analyzeSource: string;
};

const WORLD_YI_KEYWORDS = [
  '世界易',
  'world-yi',
  'world yi',
  '六步判断',
  '结构时位',
  '时位环境',
  '判断法',
  '六域',
];

const KNOWLEDGE_KEYWORDS = [
  '八字',
  '命理',
  '天干',
  '地支',
  '十神',
  '五行',
  '命盘',
  '排盘',
  '真太阳时',
  '大运',
  '流年',
  '神煞',
  '紫微',
  '卦象',
  '节气',
];

const KLINE_KEYWORDS = [
  '人生k线',
  '人生 k 线',
  'k线',
  '运势曲线',
  '趋势图',
  '报告',
  '测算',
  '分析入口',
];

const CLUSTER_TRACK_MAP: Record<string, LearningTrackKey> = {
  'solar-time': 'intro',
  'report-reading': 'intro',
  'world-yi-core': 'intro',
  'world-yi-domains': 'application',
  'bazi-fundamentals': 'intro',
  'life-kline-guide': 'application',
  'career-timing': 'career',
  'wealth-risk': 'wealth',
  'relationship-timing': 'relationship',
  'city-migration': 'migration',
  'industry-cycle': 'career',
  'gaokao-study': 'application',
  'health-balance': 'health',
  'organization-rhythm': 'career',
  'family-order': 'family',
};

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

export function detectEntryMissionPillars(entry: ManagedContentEntry): EditorialPillar[] {
  const text = entryText(entry);
  const slug = normalizeSlug(entry.slug);
  const source = `${entry.source || ''}`.toLowerCase();
  const pillars = new Set<EditorialPillar>();

  if (
    entry.contentType === 'knowledge'
    || matchesKeywords(text, KNOWLEDGE_KEYWORDS)
  ) {
    pillars.add('knowledge');
  }

  if (
    slug.includes('world-yi')
    || source.startsWith('world-yi')
    || matchesKeywords(text, WORLD_YI_KEYWORDS)
  ) {
    pillars.add('world-yi');
  }

  if (
    entry.contentType === 'case'
    || entry.contentType === 'insight'
    || matchesKeywords(text, KLINE_KEYWORDS)
  ) {
    pillars.add('kline-cta');
  }

  if (pillars.size === 0) {
    pillars.add(entry.contentType === 'knowledge' ? 'knowledge' : 'kline-cta');
  }

  return [...pillars];
}

export function resolvePrimaryEditorialPillar(pillars: EditorialPillar[]): EditorialPillar {
  if (pillars.includes('world-yi')) return 'world-yi';
  if (pillars.includes('knowledge')) return 'knowledge';
  return 'kline-cta';
}

export function buildEditorialMissionMeta(params: {
  entry: ManagedContentEntry;
  clusterKey?: string;
}): EditorialMissionMeta {
  const pillars = detectEntryMissionPillars(params.entry);
  const primaryPillar = resolvePrimaryEditorialPillar(pillars);
  const slug = params.entry.slug.trim();
  const analyzeSource = `content_publish:${params.entry.contentType}:${slug}`;
  const learningTrackKey = params.clusterKey
    ? CLUSTER_TRACK_MAP[params.clusterKey]
    : undefined;

  const missionStatement = primaryPillar === 'world-yi'
    ? '以世界易方法论帮助用户建立结构、时位与行动判断，再自然承接人生K线测算。'
    : primaryPillar === 'knowledge'
      ? '用可读的命理知识降低理解门槛，再引导用户用人生K线验证自己的节奏。'
      : '用真实场景案例示范判断路径，引导用户生成自己的人生K线报告。';

  const ctaLabel = primaryPillar === 'knowledge'
    ? '用人生K线验证你的判断'
    : primaryPillar === 'world-yi'
      ? '生成你的世界易判断报告'
      : '生成你的人生K线报告';

  return {
    pillars,
    primaryPillar,
    missionStatement,
    ctaHref: `/analyze?source=${encodeURIComponent(analyzeSource)}`,
    ctaLabel,
    worldYiHref: pillars.includes('world-yi') || primaryPillar !== 'knowledge'
      ? `/world-yi?source=${encodeURIComponent(analyzeSource)}`
      : '/world-yi',
    learningTrackKey,
    analyzeSource,
  };
}

export function scoreEditorialMissionFit(entry: ManagedContentEntry) {
  const text = entryText(entry);
  const pillars = detectEntryMissionPillars(entry);
  let score = 0;
  const reasons: string[] = [];

  if (pillars.includes('knowledge')) {
    score += 18;
    reasons.push('命理知识普及 +18');
  }
  if (pillars.includes('world-yi')) {
    score += 28;
    reasons.push('世界易传播 +28');
  }
  if (pillars.includes('kline-cta')) {
    score += 22;
    reasons.push('人生K线引导 +22');
  }
  if (pillars.length >= 2) {
    score += 16;
    reasons.push('多主线协同 +16');
  }
  if (pillars.length >= 3) {
    score += 12;
    reasons.push('三线合一优质稿 +12');
  }
  if (entry.contentType === 'knowledge' && matchesKeywords(text, KNOWLEDGE_KEYWORDS)) {
    score += 10;
    reasons.push('基础命理科普 +10');
  }
  if (normalizeSlug(entry.slug).includes('world-yi')) {
    score += 20;
    reasons.push('世界易专题稿 +20');
  }

  return { score, reasons, pillars };
}

export function buildRecentPillarPublishCounts(entries: ManagedContentEntry[], limit = 40) {
  const counts: Record<EditorialPillar, number> = {
    knowledge: 0,
    'world-yi': 0,
    'kline-cta': 0,
  };

  const recent = entries
    .filter((entry) => entry.status === 'published')
    .filter((entry) => {
      const trigger = `${entry.meta?.scheduleTrigger || ''}`;
      return trigger === 'interest' || trigger === 'cron' || trigger === 'manual';
    })
    .sort((left, right) => (
      Date.parse(right.meta?.schedulePublishedAt as string || right.updatedAt || '')
      - Date.parse(left.meta?.schedulePublishedAt as string || left.updatedAt || '')
    ))
    .slice(0, limit);

  for (const entry of recent) {
    const stored = entry.meta?.editorialMission as { primaryPillar?: EditorialPillar } | undefined;
    const pillar = stored?.primaryPillar || resolvePrimaryEditorialPillar(detectEntryMissionPillars(entry));
    counts[pillar] += 1;
  }

  return counts;
}

export function applyEditorialPillarBalanceBoost(params: {
  score: number;
  reasons: string[];
  pillars: EditorialPillar[];
  recentPillarCounts: Record<EditorialPillar, number>;
}) {
  const primary = resolvePrimaryEditorialPillar(params.pillars);
  const total = Object.values(params.recentPillarCounts).reduce((sum, value) => sum + value, 0) || 1;
  const share = params.recentPillarCounts[primary] / total;
  let score = params.score;
  const reasons = [...params.reasons];

  if (share <= 0.2) {
    score += 36;
    reasons.push(`主线 ${primary} 近期偏少，轮换加权 +36`);
  } else if (share <= 0.33) {
    score += 18;
    reasons.push(`主线 ${primary} 仍需补充，轮换加权 +18`);
  } else if (share >= 0.55) {
    score -= 12;
    reasons.push(`主线 ${primary} 近期已偏多，轮换降权 -12`);
  }

  return { score, reasons };
}

export function buildInterestPublishMeta(params: {
  entry: ManagedContentEntry;
  clusterKey: string;
  clusterTitle: string;
  score: number;
  reasons: string[];
  publishedAt: string;
}) {
  const editorialMission = buildEditorialMissionMeta({
    entry: params.entry,
    clusterKey: params.clusterKey,
  });

  return {
    schedulePublishedAt: params.publishedAt,
    scheduleTrigger: 'interest' as const,
    scheduleScore: params.score,
    scheduleReasons: params.reasons,
    interestClusterKey: params.clusterKey,
    interestClusterTitle: params.clusterTitle,
    editorialMission,
    contentMission: editorialMission.missionStatement,
    surfaceVisibility: 'public',
    analyzeCtaHref: editorialMission.ctaHref,
    analyzeCtaLabel: editorialMission.ctaLabel,
    worldYiCtaHref: editorialMission.worldYiHref,
    learningTrackKey: editorialMission.learningTrackKey,
    origin: params.entry.meta?.origin || 'interest-driven-publish',
  };
}