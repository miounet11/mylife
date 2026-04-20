import {
  isPublicKnowledgeEntry,
  type ManagedContentEntry,
  type ManagedContentType,
} from '@/lib/content-store';
import publicGrowthTargets from '@/data/public-growth-targets.json';

export type PublicGrowthLocale =
  | 'zh-CN'
  | 'zh-TW'
  | 'zh-HK'
  | 'zh-SG'
  | 'zh-MY'
  | 'zh-US'
  | 'en-US'
  | 'en-GB'
  | 'en-SG';

export interface PublicGrowthTarget {
  key: string;
  title: string;
  topic: string;
  angle: string;
  primaryType: ManagedContentType;
  locale: PublicGrowthLocale;
  market: string;
  keywords: string[];
  audience: string;
  trafficPotential: number;
  conversionPotential: number;
}

export interface PublicGrowthCoverageRow {
  target: PublicGrowthTarget;
  publishedCount: number;
  draftCount: number;
  sampleTitles: string[];
  priorityScore: number;
  missing: boolean;
}

export interface PublicGrowthAuditSnapshot {
  coverage: PublicGrowthCoverageRow[];
  queue: PublicGrowthCoverageRow[];
}

export interface PublicGrowthPublicationAssessment {
  ready: boolean;
  score: number;
  reasons: string[];
}

export const PUBLIC_GROWTH_TARGETS = publicGrowthTargets as PublicGrowthTarget[];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function canUseHeuristicTargetMatch(entry: ManagedContentEntry) {
  if (entry.status === 'published') {
    return true;
  }

  return entry.meta?.sourceType === 'public-growth';
}

function matchesTarget(entry: ManagedContentEntry, target: PublicGrowthTarget) {
  const growthPlanKey = typeof entry.meta?.growthPlanKey === 'string' ? entry.meta.growthPlanKey : '';
  if (growthPlanKey === target.key) {
    return true;
  }

  if (!canUseHeuristicTargetMatch(entry)) {
    return false;
  }

  const locale = typeof entry.meta?.locale === 'string' ? entry.meta.locale : '';
  const market = typeof entry.meta?.market === 'string' ? entry.meta.market : '';
  if (locale && locale !== target.locale) {
    return false;
  }
  if (market && market !== target.market) {
    return false;
  }

  const haystack = normalizeText([
    entry.title,
    entry.excerpt,
    entry.category || '',
    locale,
    market,
    ...(entry.tags || []),
  ].join(' '));

  const matchedKeywords = target.keywords.filter((keyword) => haystack.includes(normalizeText(keyword)));
  return matchedKeywords.length >= Math.min(2, target.keywords.length);
}

function isPubliclyPublished(entry: ManagedContentEntry) {
  if (entry.status !== 'published') {
    return false;
  }

  if (
    entry.contentType === 'knowledge'
    && (
      entry.meta?.sourceType === 'public-growth'
      || entry.meta?.sourceType === 'public-growth-wave2'
      || entry.meta?.sourceType === 'public-growth-global'
    )
  ) {
    return entry.meta?.publicationReady === true;
  }

  if (entry.contentType !== 'knowledge') {
    return true;
  }

  return isPublicKnowledgeEntry(entry);
}

function hasBlockedPlaceholderParagraphs(entry: ManagedContentEntry) {
  const text = entry.sections
    .flatMap((section) => section.paragraphs || [])
    .join('\n');

  return /当前尚未|当前.*不足|应继续补|仍薄|还没有足够|仍要回到個人生日測算|仍要回到个人生日测算/.test(text);
}

function hasQualifiedSectionDepth(entry: ManagedContentEntry) {
  return entry.sections.length >= 4
    && entry.sections.every((section) => (
      section.title.trim().length >= 4
      && section.paragraphs.length >= 2
      && section.paragraphs.every((paragraph) => paragraph.trim().length >= 36)
    ));
}

export function assessGrowthPublication(
  entry: ManagedContentEntry,
  sourceType: 'public-growth' | 'public-growth-wave2' | 'public-growth-global' = 'public-growth'
): PublicGrowthPublicationAssessment {
  const reasons: string[] = [];
  let score = 0;
  const locale = typeof entry.meta?.locale === 'string' ? entry.meta.locale : '';
  const market = typeof entry.meta?.market === 'string' ? entry.meta.market : '';

  if (entry.meta?.sourceType !== sourceType) {
    return {
      ready: false,
      score: 0,
      reasons: [`not-${sourceType}`],
    };
  }

  if (entry.source.startsWith('agent-llm:')) {
    score += 35;
    reasons.push('llm-generated');
  } else if (entry.source.startsWith('agent-fallback:')) {
    score += 20;
    reasons.push('fallback-source');
  } else {
    reasons.push('unsupported-source');
  }

  if (entry.excerpt.trim().length >= 72) {
    score += 12;
    reasons.push('excerpt-length');
  }

  if (entry.seoTitle.trim().length >= 22) {
    score += 10;
    reasons.push('seo-title-length');
  }

  if (entry.seoDescription.trim().length >= 72) {
    score += 10;
    reasons.push('seo-description-length');
  }

  if ((entry.tags || []).length >= 4) {
    score += 8;
    reasons.push('tag-density');
  }

  if ((entry.sections || []).length >= 4) {
    score += 10;
    reasons.push('section-coverage');
  }

  if (hasQualifiedSectionDepth(entry)) {
    score += 10;
    reasons.push('section-depth');
  } else {
    reasons.push('section-depth-insufficient');
  }

  if (locale) {
    score += 6;
    reasons.push('locale');
  }

  if (market) {
    score += 6;
    reasons.push('market');
  }

  if (!hasBlockedPlaceholderParagraphs(entry)) {
    score += 13;
    reasons.push('no-placeholder-copy');
  } else {
    reasons.push('placeholder-copy');
  }

  const hasDepth = hasQualifiedSectionDepth(entry);
  const hasCleanCopy = !hasBlockedPlaceholderParagraphs(entry);
  const isLlmSource = entry.source.startsWith('agent-llm:');
  const isFallbackSource = entry.source.startsWith('agent-fallback:');
  const ready = (
    ((isLlmSource && score >= 90) || (isFallbackSource && score >= 85))
    && (isLlmSource || isFallbackSource)
    && hasDepth
    && hasCleanCopy
    && !!locale
    && !!market
  );

  return {
    ready,
    score,
    reasons,
  };
}

export function assessPublicGrowthPublication(entry: ManagedContentEntry): PublicGrowthPublicationAssessment {
  return assessGrowthPublication(entry, 'public-growth');
}

export function listPublicGrowthTargets() {
  return PUBLIC_GROWTH_TARGETS;
}

export function buildPublicGrowthAudit(entries: ManagedContentEntry[]): PublicGrowthAuditSnapshot {
  const coverage = PUBLIC_GROWTH_TARGETS.map((target) => {
    const matched = entries.filter((entry) => entry.contentType === target.primaryType)
      .filter((entry) => matchesTarget(entry, target));
    const published = matched.filter((entry) => isPubliclyPublished(entry));
    const drafts = matched.filter((entry) => entry.status === 'draft');
    const missing = published.length === 0;
    const priorityScore = (
      target.trafficPotential * 18
      + target.conversionPotential * 16
      + (missing ? 36 : 0)
      + (drafts.length === 0 ? 14 : 0)
      - published.length * 12
      - drafts.length * 4
    );

    return {
      target,
      publishedCount: published.length,
      draftCount: drafts.length,
      sampleTitles: matched.slice(0, 3).map((entry) => entry.title),
      priorityScore,
      missing,
    } satisfies PublicGrowthCoverageRow;
  }).sort((left, right) => right.priorityScore - left.priorityScore);

  return {
    coverage,
    queue: coverage.filter((item) => item.missing).slice(0, 8),
  };
}
