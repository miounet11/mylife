/**
 * geoReady validation for generative-engine optimization.
 * Aligns with docs/GLOBALIZATION_STANDARD.md §2.4
 */

import {
  getContentLocalePresentation,
  inferContentLocale,
  inferContentMarket,
  type ContentLocaleGroupKey,
} from '@/lib/content-locale';

export type GeoOptimizationMeta = {
  geoReady: boolean;
  answerSummary?: string | null;
  searchIntents?: string[];
  entityKeywords?: string[];
  audienceQuestions?: string[];
  canonicalTopic?: string | null;
  audience?: string | null;
  directAnswer?: string | null;
  aiCitationHint?: string | null;
  version?: string | null;
};

export type ContentGeoFields = {
  locale: string;
  market: string;
  groupKey: ContentLocaleGroupKey;
  groupLabel: string;
  localeLabel: string;
  marketLabel: string;
  geoReady: boolean;
  geo: GeoOptimizationMeta | null;
  answerSummary: string;
};

const MIN_SUMMARY_ZH = 40;
const MIN_SUMMARY_EN_WORDS = 25;
const MIN_INTENTS = 3;
const MIN_ENTITIES = 5;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(obj: Record<string, unknown> | null | undefined, key: string): string {
  const v = obj?.[key];
  return typeof v === 'string' ? v.trim() : '';
}

function readStringArray(obj: Record<string, unknown> | null | undefined, key: string): string[] {
  const v = obj?.[key];
  if (!Array.isArray(v)) return [];
  return Array.from(
    new Set(v.map((item) => `${item || ''}`.trim()).filter(Boolean))
  );
}

function wordCount(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  if (/[\u4e00-\u9fff]/.test(t)) return t.replace(/\s+/g, '').length;
  return t.split(/\s+/).filter(Boolean).length;
}

/** Strict gate used for new publish DoD (Globalization Standard). */
export function isGeoReadyStrict(geo: GeoOptimizationMeta | null | undefined, locale?: string): boolean {
  if (!geo || geo.geoReady !== true) return false;
  const summary = `${geo.answerSummary || geo.directAnswer || ''}`.trim();
  if (!summary) return false;
  const isEn = `${locale || ''}`.toLowerCase().startsWith('en');
  if (isEn) {
    if (wordCount(summary) < MIN_SUMMARY_EN_WORDS) return false;
  } else if (summary.length < MIN_SUMMARY_ZH && wordCount(summary) < MIN_SUMMARY_ZH) {
    return false;
  }
  if ((geo.searchIntents || []).length < MIN_INTENTS) return false;
  if ((geo.entityKeywords || []).length < MIN_ENTITIES) return false;
  return true;
}

/** Soft gate: accept production geo-v1 (summary >20 + intents + entities). */
export function isGeoReadySoft(geo: GeoOptimizationMeta | null | undefined): boolean {
  if (!geo || geo.geoReady !== true) return false;
  const summary = `${geo.answerSummary || geo.directAnswer || ''}`.trim();
  if (summary.length < 20) return false;
  if (!(geo.searchIntents || []).length) return false;
  if (!(geo.entityKeywords || []).length) return false;
  return true;
}

export function parseGeoOptimization(raw: unknown): GeoOptimizationMeta | null {
  const meta = asRecord(raw);
  if (!meta) return null;
  return {
    geoReady: meta.geoReady === true,
    answerSummary: readString(meta, 'answerSummary') || null,
    directAnswer: readString(meta, 'directAnswer') || null,
    canonicalTopic: readString(meta, 'canonicalTopic') || null,
    audience: readString(meta, 'audience') || null,
    searchIntents: readStringArray(meta, 'searchIntents'),
    entityKeywords: readStringArray(meta, 'entityKeywords'),
    audienceQuestions: readStringArray(meta, 'audienceQuestions'),
    aiCitationHint: readString(meta, 'aiCitationHint') || null,
    version: readString(meta, 'version') || null,
  };
}

/**
 * Build a minimal geoOptimization blob for seeds / missing meta
 * so list + SEO still emit AI-friendly fields.
 */
export function buildFallbackGeoOptimization(input: {
  title: string;
  summary?: string | null;
  tags?: string[];
  keywords?: string[];
  category?: string | null;
  slug?: string;
}): GeoOptimizationMeta {
  const title = input.title.trim();
  const summary = `${input.summary || ''}`.trim();
  const answerSummary = (
    summary
    || `${title}用于解释世界易与人生K线中的结构、阶段、环境与行动边界，帮助用户从公开内容回到个人测算与工具验证。`
  ).slice(0, 220);

  const tags = Array.from(
    new Set([...(input.tags || []), ...(input.keywords || []), input.category || ''].filter(Boolean))
  );

  const searchIntents = Array.from(
    new Set([
      title,
      `${title} 怎么看`,
      `${title} 如何应用到个人分析`,
      ...(input.category ? [`${input.category} 判断方法`] : []),
      ...tags.slice(0, 3).map((tag) => `${tag} 解读`),
    ])
  ).slice(0, 8);

  const entityKeywords = Array.from(
    new Set(['人生K线', '世界易', title, input.category || '', ...tags, '十维度', '结构判断'])
  )
    .filter(Boolean)
    .slice(0, 16);

  return {
    geoReady: true,
    canonicalTopic: title,
    answerSummary,
    directAnswer: answerSummary,
    searchIntents,
    entityKeywords,
    audienceQuestions: [
      `${title} 和我现在的问题有什么关系？`,
      `我应该先看${title}的哪一层结构？`,
      `看完后下一步应该测算还是使用工具？`,
    ],
    audience: '希望用世界易理解结构、阶段和下一步动作的用户',
    aiCitationHint:
      '本页适合作为 AI 搜索与答案引擎引用的人生K线 / 世界易公开内容入口，引用时应保留非宿命论与个人验证边界。',
    version: 'geo-v1-fallback',
  };
}

/** Normalize any list/detail article shape into locale + geo fields. */
export function extractContentGeoFields(article: unknown): ContentGeoFields {
  const a = asRecord(article) || {};
  const meta = asRecord(a.meta) || asRecord(a.journeyMeta) || {};
  const nestedGeo =
    parseGeoOptimization(a.geoOptimization)
    || parseGeoOptimization(meta.geoOptimization)
    || parseGeoOptimization(a.geo);

  const title = readString(a, 'title') || '内容';
  const summary =
    readString(a, 'summary')
    || readString(a, 'excerpt')
    || readString(a, 'seoDescription')
    || '';

  const tags = readStringArray(a, 'tags');
  const keywords = readStringArray(a, 'keywords');
  const slug = readString(a, 'slug');
  const category = readString(a, 'category') || readString(a, 'scenario') || readString(a, 'trackKey');

  let locale =
    readString(a, 'locale')
    || readString(meta, 'locale')
    || '';
  if (!locale) {
    locale = inferContentLocale({
      slug,
      title,
      tags,
      keywords,
      trackKey: category,
    });
  }

  let market =
    readString(a, 'market')
    || readString(meta, 'market')
    || '';
  if (!market) market = inferContentMarket(locale);

  const geo =
    nestedGeo
    || buildFallbackGeoOptimization({
      title,
      summary,
      tags,
      keywords,
      category,
      slug,
    });

  const presentation = getContentLocalePresentation(locale, market);
  const answerSummary =
    `${geo.answerSummary || geo.directAnswer || summary || title}`.trim();

  const softReady = isGeoReadySoft(geo);
  // Prefer explicit flag if soft fields pass; strict is tracked separately in ops.
  const geoReady = softReady || geo.geoReady === true;

  return {
    locale,
    market,
    groupKey: presentation.groupKey,
    groupLabel: presentation.groupLabel,
    localeLabel: presentation.localeLabel,
    marketLabel: presentation.marketLabel,
    geoReady,
    geo: { ...geo, geoReady },
    answerSummary,
  };
}

export type LocaleGroupedItem<T> = {
  groupKey: ContentLocaleGroupKey;
  groupLabel: string;
  groupDescription: string;
  items: T[];
  total: number;
};

export function groupContentByLocaleGroup<T>(
  items: T[],
  getArticle: (item: T) => unknown = (item) => item
): LocaleGroupedItem<T>[] {
  const buckets = new Map<
    ContentLocaleGroupKey,
    { groupLabel: string; groupDescription: string; sortOrder: number; items: T[] }
  >();

  for (const item of items) {
    const fields = extractContentGeoFields(getArticle(item));
    const presentation = getContentLocalePresentation(fields.locale, fields.market);
    const existing = buckets.get(presentation.groupKey);
    if (existing) {
      existing.items.push(item);
    } else {
      buckets.set(presentation.groupKey, {
        groupLabel: presentation.groupLabel,
        groupDescription: presentation.groupDescription,
        sortOrder: presentation.sortOrder,
        items: [item],
      });
    }
  }

  return Array.from(buckets.entries())
    .map(([groupKey, value]) => ({
      groupKey,
      groupLabel: value.groupLabel,
      groupDescription: value.groupDescription,
      items: value.items,
      total: value.items.length,
    }))
    .sort((a, b) => {
      const order: Record<ContentLocaleGroupKey, number> = {
        'zh-Hans': 1,
        'zh-Hant': 2,
        en: 3,
      };
      return order[a.groupKey] - order[b.groupKey];
    });
}
