import type { FortuneRecord } from '@/lib/user-types';
import type { ToolSessionRecord } from '@/lib/user-types';
import {
  getManagedContentEntryBySlug,
  getManagedContentJourneyMeta,
  listPublishedManagedContentEntriesByType,
  isPublicKnowledgeEntry,
  type ManagedContentEntry,
} from '@/lib/content-store';
import {
  buildToolRecommendations,
  getToolDefinition,
  inferCategoryFromText,
  listToolsByCategory,
  type ToolDefinition,
  type ToolCategoryKey,
} from '@/lib/tools';
import { appendSourceToHref } from '@/lib/source-url';

export interface JourneyCard {
  href: string;
  title: string;
  description: string;
  eyebrow: string;
}

export interface SurfaceJourney {
  reportCard: JourneyCard;
  toolCards: JourneyCard[];
  knowledgeCards: JourneyCard[];
  caseCards: JourneyCard[];
}

export interface PersonalizedJourneySummary {
  heading: string;
  description: string;
  journey: SurfaceJourney;
}

const categoryKeywords: Record<ToolCategoryKey, string[]> = {
  career: ['事业', '工作', '岗位', '升职', '求职', '团队', '老板'],
  wealth: ['财富', '赚钱', '收入', '现金流', '理财', '投资'],
  relationship: ['关系', '感情', '婚姻', '伴侣', '复合', '边界'],
  health: ['健康', '恢复', '睡眠', '压力', '情绪', '透支'],
  family: ['家庭', '父母', '孩子', '照护', '代际', '家里'],
  migration: ['迁移', '出国', '回国', '城市', '海外', '身份'],
  timing: ['窗口', '时机', '本月', '今年', '什么时候', '择时'],
  application: ['起名', '家宅', '择日', '寻物', '短周期', '会面'],
};

function pickContentEntries(params: {
  contentType: 'knowledge' | 'case';
  slugs?: string[];
  category: ToolCategoryKey | null;
  signalText: string;
  excludeSlug?: string;
  limit: number;
  preferredToolSlug?: string;
  preferredReportThemes?: string[];
}) {
  const direct = (params.slugs || [])
    .map((slug) => getManagedContentEntryBySlug(params.contentType, slug))
    .filter((entry): entry is ManagedContentEntry => !!entry)
    .filter((entry) => params.contentType !== 'knowledge' || isPublicKnowledgeEntry(entry));

  const used = new Set(direct.map((item) => item.slug));
  const pool = listPublishedManagedContentEntriesByType(params.contentType)
    .filter((entry) => (params.contentType !== 'knowledge' || isPublicKnowledgeEntry(entry)))
    .filter((entry) => entry.slug !== params.excludeSlug)
    .filter((entry) => !used.has(entry.slug));

  const keywords = params.category ? categoryKeywords[params.category] : [];
  const loweredSignal = params.signalText.toLowerCase();

  const scored = pool
    .map((entry) => {
      const haystack = `${entry.title} ${entry.excerpt} ${(entry.tags || []).join(' ')} ${entry.category || ''}`.toLowerCase();
      let score = 0;
      keywords.forEach((keyword) => {
        if (haystack.includes(keyword.toLowerCase())) score += 3;
      });
      const journeyMeta = getManagedContentJourneyMeta(entry);
      if (params.preferredToolSlug && journeyMeta.relatedToolSlugs.includes(params.preferredToolSlug)) {
        score += 8;
      }
      (params.preferredReportThemes || []).forEach((theme) => {
        if (journeyMeta.relatedReportThemes.includes(theme)) {
          score += 4;
        }
      });
      (entry.tags || []).forEach((tag) => {
        if (loweredSignal.includes(tag.toLowerCase())) score += 2;
      });
      if (entry.featured) score += 1;
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.entry.updatedAt.localeCompare(left.entry.updatedAt))
    .map((item) => item.entry);

  return [...direct, ...scored].slice(0, params.limit);
}

function mapToolCard(tool: ToolDefinition): JourneyCard {
  return {
    href: `/tools/${tool.slug}`,
    title: tool.shortTitle,
    description: tool.hook,
    eyebrow: '相关工具',
  };
}

function mapEntryCard(entry: ManagedContentEntry, contentType: 'knowledge' | 'case'): JourneyCard {
  return {
    href: contentType === 'knowledge' ? `/knowledge/${entry.slug}` : `/cases/${entry.slug}`,
    title: entry.title,
    description: entry.excerpt,
    eyebrow: contentType === 'knowledge' ? '相关文章' : '相关案例',
  };
}

function buildReportCard(category: ToolCategoryKey | null): JourneyCard {
  const href = '/analyze';
  const categoryLabel = category ? `当前主轴更接近${category}` : '先建立你的综合测算底盘';
  return {
    href,
    title: '回到综合测算',
    description: `${categoryLabel}。先看整体结构，再把问题拆进单项工具和内容路径里。`,
    eyebrow: '综合测算',
  };
}

function pickFallbackCards<T>(current: T[], fallback: T[], limit: number, keyOf: (item: T) => string) {
  const seen = new Set(current.map(keyOf));
  const merged = [...current];

  for (const item of fallback) {
    if (merged.length >= limit) break;
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged.slice(0, limit);
}

function ensureToolCards(cards: JourneyCard[], category: ToolCategoryKey | null, limit = 3) {
  const fallbackCategory = category || 'career';
  const categoryFilled = pickFallbackCards(
    cards,
    listToolsByCategory(fallbackCategory).map(mapToolCard),
    limit,
    (item) => item.href
  );
  return pickFallbackCards(
    categoryFilled,
    listToolsByCategory('career').map(mapToolCard),
    limit,
    (item) => item.href
  );
}

function ensureKnowledgeCards(cards: JourneyCard[], category: ToolCategoryKey | null, signalText: string, limit = 3) {
  const fallbackCategory = category || 'career';
  const fallback = pickContentEntries({
    contentType: 'knowledge',
    category: fallbackCategory,
    signalText: `${signalText} ${categoryKeywords[fallbackCategory].join(' ')}`,
    limit,
  }).map((entry) => mapEntryCard(entry, 'knowledge'));
  const categoryFilled = pickFallbackCards(cards, fallback, limit, (item) => item.href);
  const broadFallback = pickContentEntries({
    contentType: 'knowledge',
    category: 'career',
    signalText: `${signalText} 事业 工作 岗位`,
    limit,
  }).map((entry) => mapEntryCard(entry, 'knowledge'));
  const broadFilled = pickFallbackCards(categoryFilled, broadFallback, limit, (item) => item.href);
  const publishedFallback = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry))
    .map((entry) => mapEntryCard(entry, 'knowledge'));
  return pickFallbackCards(broadFilled, publishedFallback, limit, (item) => item.href);
}

function ensureCaseCards(cards: JourneyCard[], category: ToolCategoryKey | null, signalText: string, limit = 3) {
  const fallbackCategory = category || 'career';
  const fallback = pickContentEntries({
    contentType: 'case',
    category: fallbackCategory,
    signalText: `${signalText} ${categoryKeywords[fallbackCategory].join(' ')}`,
    limit,
  }).map((entry) => mapEntryCard(entry, 'case'));
  const categoryFilled = pickFallbackCards(cards, fallback, limit, (item) => item.href);
  const broadFallback = pickContentEntries({
    contentType: 'case',
    category: 'career',
    signalText: `${signalText} 事业 工作 岗位`,
    limit,
  }).map((entry) => mapEntryCard(entry, 'case'));
  const broadFilled = pickFallbackCards(categoryFilled, broadFallback, limit, (item) => item.href);
  const publishedFallback = listPublishedManagedContentEntriesByType('case')
    .map((entry) => mapEntryCard(entry, 'case'));
  return pickFallbackCards(broadFilled, publishedFallback, limit, (item) => item.href);
}

function ensureJourneyDepth(journey: SurfaceJourney, params: {
  category: ToolCategoryKey | null;
  signalText: string;
}): SurfaceJourney {
  return {
    reportCard: journey.reportCard,
    toolCards: ensureToolCards(journey.toolCards, params.category),
    knowledgeCards: ensureKnowledgeCards(journey.knowledgeCards, params.category, params.signalText),
    caseCards: ensureCaseCards(journey.caseCards, params.category, params.signalText),
  };
}

function withJourneySource(journey: SurfaceJourney, rawSource?: string | null): SurfaceJourney {
  if (!rawSource) {
    return journey;
  }

  const mapCard = (card: JourneyCard): JourneyCard => ({
    ...card,
    href: appendSourceToHref(card.href, rawSource),
  });

  return {
    reportCard: mapCard(journey.reportCard),
    toolCards: journey.toolCards.map(mapCard),
    knowledgeCards: journey.knowledgeCards.map(mapCard),
    caseCards: journey.caseCards.map(mapCard),
  };
}

export function buildJourneyForTool(tool: ToolDefinition, options?: { source?: string | null }): SurfaceJourney {
  const category = tool.category;
  const signalText = `${tool.title} ${tool.description} ${tool.hook} ${tool.relatedReportThemes.join(' ')}`;
  const tools = tool.nextToolSlugs
    .map((slug) => getToolDefinition(slug))
    .filter((item): item is ToolDefinition => !!item)
    .slice(0, 3);
  const knowledge = pickContentEntries({
    contentType: 'knowledge',
    slugs: tool.relatedKnowledgeSlugs,
    category,
    signalText,
    limit: 3,
    preferredToolSlug: tool.slug,
    preferredReportThemes: tool.relatedReportThemes,
  });
  const cases = pickContentEntries({
    contentType: 'case',
    slugs: tool.relatedCaseSlugs,
    category,
    signalText,
    limit: 3,
    preferredToolSlug: tool.slug,
    preferredReportThemes: tool.relatedReportThemes,
  });

  const journey = ensureJourneyDepth({
    reportCard: buildReportCard(category),
    toolCards: tools.map(mapToolCard),
    knowledgeCards: knowledge.map((entry) => mapEntryCard(entry, 'knowledge')),
    caseCards: cases.map((entry) => mapEntryCard(entry, 'case')),
  }, { category, signalText });
  return withJourneySource(journey, options?.source);
}

export function buildJourneyForReport(report: FortuneRecord, options?: { source?: string | null }): SurfaceJourney {
  const signalText = [
    report.analysis?.opening,
    report.analysis?.explanation,
    report.pattern?.type,
    report.advice?.overall,
    report.advice?.career,
    report.advice?.wealth,
    report.advice?.marriage,
    report.advice?.health,
  ].filter(Boolean).join(' ');
  const category = inferCategoryFromText(signalText);
  const recommendedTools = buildToolRecommendations({ report, limit: 3 })
    .map((item) => getToolDefinition(item.slug))
    .filter((item): item is ToolDefinition => !!item);
  const knowledge = pickContentEntries({
    contentType: 'knowledge',
    category,
    signalText,
    limit: 3,
    preferredReportThemes: [report.pattern?.type || '', report.advice?.overall || ''].filter(Boolean),
  });
  const cases = pickContentEntries({
    contentType: 'case',
    category,
    signalText,
    limit: 3,
    preferredReportThemes: [report.pattern?.type || '', report.advice?.overall || ''].filter(Boolean),
  });

  const journey = ensureJourneyDepth({
    reportCard: {
      href: `/result/${report.id}`,
      title: '这份综合报告就是总底盘',
      description: '所有工具和内容建议都应围绕这份主测算继续展开，而不是脱离你的结构单独判断。',
      eyebrow: '综合测算',
    },
    toolCards: recommendedTools.map(mapToolCard),
    knowledgeCards: knowledge.map((entry) => mapEntryCard(entry, 'knowledge')),
    caseCards: cases.map((entry) => mapEntryCard(entry, 'case')),
  }, { category, signalText });
  return withJourneySource(journey, options?.source);
}

export function buildJourneyForContent(params: {
  title: string;
  excerpt: string;
  tags: string[];
  category?: string | null;
  contentType: 'knowledge' | 'case';
  slug: string;
}, options?: { source?: string | null }): SurfaceJourney {
  const signalText = `${params.title} ${params.excerpt} ${(params.tags || []).join(' ')} ${params.category || ''}`;
  const category = inferCategoryFromText(signalText);
  const entry = getManagedContentEntryBySlug(params.contentType, params.slug);
  const journeyMeta = getManagedContentJourneyMeta(entry);
  const tools = [
    ...journeyMeta.relatedToolSlugs.map((slug) => getToolDefinition(slug)).filter((item): item is ToolDefinition => !!item),
    ...(category ? listToolsByCategory(category) : listToolsByCategory('career')),
  ].filter((item, index, array) => array.findIndex((candidate) => candidate.slug === item.slug) === index).slice(0, 3);
  const knowledge = pickContentEntries({
    contentType: 'knowledge',
    slugs: journeyMeta.relatedKnowledgeSlugs,
    category,
    signalText,
    excludeSlug: params.contentType === 'knowledge' ? params.slug : undefined,
    limit: 3,
    preferredReportThemes: journeyMeta.relatedReportThemes,
  });
  const cases = pickContentEntries({
    contentType: 'case',
    slugs: journeyMeta.relatedCaseSlugs,
    category,
    signalText,
    excludeSlug: params.contentType === 'case' ? params.slug : undefined,
    limit: 3,
    preferredReportThemes: journeyMeta.relatedReportThemes,
  });

  const journey = ensureJourneyDepth({
    reportCard: buildReportCard(category),
    toolCards: tools.map(mapToolCard),
    knowledgeCards: knowledge.map((entry) => mapEntryCard(entry, 'knowledge')),
    caseCards: cases.map((entry) => mapEntryCard(entry, 'case')),
  }, { category, signalText });

  return withJourneySource(journey, options?.source);
}

export function buildJourneyForVisualAsset(params: {
  title: string;
  description: string;
  narrativeExcerpt: string;
  module: string;
  slug: string;
  relatedToolSlugs?: string[];
  relatedReportThemes?: string[];
  targetRoutes?: string[];
  source?: string | null;
}): SurfaceJourney {
  const signalText = [
    params.title,
    params.description,
    params.narrativeExcerpt,
    params.module,
    ...(params.relatedReportThemes || []),
    ...(params.targetRoutes || []),
  ].join(' ');
  const inferredCategory = inferCategoryFromText(signalText);
  const fallbackCategory: ToolCategoryKey = params.module === 'CONTENT'
    ? 'career'
    : params.module === 'SOCIAL'
      ? 'timing'
      : params.module === 'MINGLI'
        ? 'application'
        : 'career';
  const category = inferredCategory || fallbackCategory;
  const directTools = (params.relatedToolSlugs || [])
    .map((slug) => getToolDefinition(slug))
    .filter((item): item is ToolDefinition => !!item);
  const tools = [
    ...directTools,
    ...listToolsByCategory(category),
  ].filter((item, index, array) => array.findIndex((candidate) => candidate.slug === item.slug) === index).slice(0, 4);
  const preferredToolSlug = tools[0]?.slug;
  const knowledge = pickContentEntries({
    contentType: 'knowledge',
    category,
    signalText,
    limit: 3,
    preferredToolSlug,
    preferredReportThemes: params.relatedReportThemes || [],
  });
  const cases = pickContentEntries({
    contentType: 'case',
    category,
    signalText,
    limit: 3,
    preferredToolSlug,
    preferredReportThemes: params.relatedReportThemes || [],
  });

  const journey = ensureJourneyDepth({
    reportCard: buildReportCard(category),
    toolCards: tools.map(mapToolCard),
    knowledgeCards: knowledge.map((entry) => mapEntryCard(entry, 'knowledge')),
    caseCards: cases.map((entry) => mapEntryCard(entry, 'case')),
  }, { category, signalText });

  return withJourneySource(journey, params.source || null);
}

export function buildPersonalizedJourney(params: {
  reports?: FortuneRecord[];
  toolSessions?: ToolSessionRecord[];
}): PersonalizedJourneySummary {
  const latestReport = (params.reports || [])[0] || null;
  const latestToolSlug = (params.toolSessions || [])[0]?.toolSlug;
  const latestTool = latestToolSlug ? getToolDefinition(latestToolSlug) : null;

  if (latestReport) {
    return {
      heading: '下一步，不该重新从零开始',
      description: '系统已经知道你最近的主测算重点。最好的动作不是重新泛问，而是沿着主测算继续拆工具，再补文章和案例。',
      journey: buildJourneyForReport(latestReport),
    };
  }

  if (latestTool) {
    return {
      heading: '你已经开始做单项判断',
      description: '既然已经进入工具层，就应该继续接回综合测算和相关内容，而不是停在单点结果上。',
      journey: buildJourneyForTool(latestTool),
    };
  }

  const fallbackCategory: ToolCategoryKey = 'career';
  return {
    heading: '先建立你的第一条协同路径',
    description: '第一次进入时，先做综合测算，再选一个高频工具，最后去读相关方法文章和案例，会比只看一个入口更有感觉。',
    journey: ensureJourneyDepth({
      reportCard: buildReportCard(fallbackCategory),
      toolCards: listToolsByCategory(fallbackCategory).slice(0, 3).map(mapToolCard),
      knowledgeCards: pickContentEntries({
        contentType: 'knowledge',
        category: fallbackCategory,
        signalText: '事业 工作 岗位 升职',
        limit: 3,
      }).map((entry) => mapEntryCard(entry, 'knowledge')),
      caseCards: pickContentEntries({
        contentType: 'case',
        category: fallbackCategory,
        signalText: '事业 工作 岗位 升职',
        limit: 3,
      }).map((entry) => mapEntryCard(entry, 'case')),
    }, { category: fallbackCategory, signalText: '事业 工作 岗位 升职' }),
  };
}
