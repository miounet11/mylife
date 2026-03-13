import { contentRadarRunOperations, contentSignalOperations } from '@/lib/database';
import { STRATEGIC_CLUSTERS } from '@/lib/content-ops';
import type { ContentGenerationInput } from '@/lib/content-generation';
import type { EntityInsightType } from '@/lib/content';
import type { ManagedContentType } from '@/lib/content-store';
import type { ContentRadarRunRecord, ContentSignalRecord } from '@/lib/user-types';
import { generateId } from '@/lib/utils';

export interface ContentRadarSource {
  id: string;
  label: string;
  platform: string;
  url: string;
  type: 'rss';
  enabled?: boolean;
  keywords?: string[];
}

export interface ParsedFeedItem {
  title: string;
  url: string;
  publishedAt?: string;
  author?: string;
  summary?: string;
}

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'');
}

function stripTags(value: string) {
  return decodeEntities(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchTag(block: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      return stripTags(match[1]);
    }
  }
  return '';
}

function parseRssItems(xml: string) {
  const itemBlocks = [...xml.matchAll(/<item\b[\s\S]*?>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  return itemBlocks.map((block) => ({
    title: matchTag(block, [/<title>([\s\S]*?)<\/title>/i]),
    url: matchTag(block, [/<link>([\s\S]*?)<\/link>/i]),
    publishedAt: matchTag(block, [/<pubDate>([\s\S]*?)<\/pubDate>/i]) || undefined,
    author: matchTag(block, [/<author>([\s\S]*?)<\/author>/i, /<dc:creator>([\s\S]*?)<\/dc:creator>/i]) || undefined,
    summary: matchTag(block, [/<description>([\s\S]*?)<\/description>/i, /<content:encoded>([\s\S]*?)<\/content:encoded>/i]) || undefined,
  })).filter((item) => item.title && item.url);
}

function parseAtomItems(xml: string) {
  const entryBlocks = [...xml.matchAll(/<entry\b[\s\S]*?>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  return entryBlocks.map((block) => {
    const urlMatch = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
    return {
      title: matchTag(block, [/<title[^>]*>([\s\S]*?)<\/title>/i]),
      url: stripTags(urlMatch?.[1] || ''),
      publishedAt: matchTag(block, [/<published[^>]*>([\s\S]*?)<\/published>/i, /<updated[^>]*>([\s\S]*?)<\/updated>/i]) || undefined,
      author: matchTag(block, [/<author[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>[\s\S]*?<\/author>/i]) || undefined,
      summary: matchTag(block, [/<summary[^>]*>([\s\S]*?)<\/summary>/i, /<content[^>]*>([\s\S]*?)<\/content>/i]) || undefined,
    };
  }).filter((item) => item.title && item.url);
}

export function parseFeedXml(xml: string): ParsedFeedItem[] {
  if (/<rss\b/i.test(xml) || /<channel\b/i.test(xml)) {
    return parseRssItems(xml);
  }
  if (/<feed\b/i.test(xml)) {
    return parseAtomItems(xml);
  }
  return [];
}

const DEFAULT_CONTENT_RADAR_SOURCES: ContentRadarSource[] = [
  {
    id: 'google-news-bazi',
    label: 'Google News · 八字',
    platform: 'google-news',
    url: 'https://news.google.com/rss/search?q=%E5%85%AB%E5%AD%97+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
    type: 'rss',
    enabled: true,
    keywords: ['八字', '命理', '流年', '运势'],
  },
  {
    id: 'google-news-mingli',
    label: 'Google News · 命理',
    platform: 'google-news',
    url: 'https://news.google.com/rss/search?q=%E5%91%BD%E7%90%86+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
    type: 'rss',
    enabled: true,
    keywords: ['命理', '五行', '事业', '婚恋'],
  },
  {
    id: 'google-news-yijing',
    label: 'Google News · 易经',
    platform: 'google-news',
    url: 'https://news.google.com/rss/search?q=%E6%98%93%E7%BB%8F+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans',
    type: 'rss',
    enabled: true,
    keywords: ['易经', '决策', '趋势', '时机'],
  },
  {
    id: 'google-news-astrology',
    label: 'Google News · Astrology',
    platform: 'google-news',
    url: 'https://news.google.com/rss/search?q=astrology+when:7d&hl=en-US&gl=US&ceid=US:en',
    type: 'rss',
    enabled: true,
    keywords: ['astrology', 'zodiac', 'career', 'relationship'],
  },
  {
    id: 'google-news-fengshui',
    label: 'Google News · Feng Shui',
    platform: 'google-news',
    url: 'https://news.google.com/rss/search?q=%22feng+shui%22+when:7d&hl=en-US&gl=US&ceid=US:en',
    type: 'rss',
    enabled: true,
    keywords: ['feng shui', 'city', 'home', 'space'],
  },
  {
    id: 'google-news-numerology',
    label: 'Google News · Numerology',
    platform: 'google-news',
    url: 'https://news.google.com/rss/search?q=numerology+when:7d&hl=en-US&gl=US&ceid=US:en',
    type: 'rss',
    enabled: true,
    keywords: ['numerology', 'timing', 'career', 'relationship'],
  },
];

export function getContentRadarSources() {
  const raw = `${process.env.CONTENT_RADAR_SOURCES || ''}`.trim();
  if (!raw) {
    return DEFAULT_CONTENT_RADAR_SOURCES;
  }

  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed
      .map((item) => ({
        id: `${item.id || ''}`.trim(),
        label: `${item.label || ''}`.trim(),
        platform: `${item.platform || ''}`.trim(),
        url: `${item.url || ''}`.trim(),
        type: item.type === 'rss' ? 'rss' : 'rss',
        enabled: item.enabled !== false,
        keywords: Array.isArray(item.keywords) ? item.keywords.map((value) => `${value || ''}`.trim()).filter(Boolean) : [],
      }))
      .filter((item) => item.id && item.label && item.platform && item.url);
  } catch (error) {
    console.error('[Content Radar] parse sources failed:', error);
    return DEFAULT_CONTENT_RADAR_SOURCES;
  }
}

export function getEditorialKeywords() {
  return [...new Set(
    STRATEGIC_CLUSTERS.flatMap((cluster) => cluster.keywords).filter(Boolean)
  )];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function scoreItem(item: ParsedFeedItem, source: ContentRadarSource) {
  const allKeywords = [...getEditorialKeywords(), ...(source.keywords || [])];
  const haystack = normalizeText(`${item.title} ${item.summary || ''}`);
  const matchedKeywords = [...new Set(
    allKeywords.filter((keyword) => haystack.includes(normalizeText(keyword)))
  )];

  const freshnessBonus = item.publishedAt ? 4 : 0;
  const score = matchedKeywords.length * 12 + Math.min(item.title.length, 120) / 20 + freshnessBonus;

  return {
    matchedKeywords,
    score: Math.round(score),
  };
}

export function buildSignalSuggestions(signals: ContentSignalRecord[]) {
  return signals
    .slice()
    .sort((left, right) => (right.score || 0) - (left.score || 0))
    .slice(0, 8)
    .map((signal) => ({
      signalId: signal.id,
      sourceId: signal.sourceId,
      title: signal.title,
      platform: signal.platform,
      score: signal.score || 0,
      keywords: signal.matchedKeywords || [],
      suggestedTopic: signal.title,
      suggestedAngle: `从“${signal.title}”切入，结合用户真实决策焦虑和命理判断边界，做成熟产品级内容。`,
      url: signal.url,
    }));
}

export function inferContentTypeFromSignal(signal: ContentSignalRecord): {
  contentType: ManagedContentType;
  subtype?: EntityInsightType;
} {
  const keywordText = `${signal.title} ${(signal.matchedKeywords || []).join(' ')}`.toLowerCase();

  if (/行业|产业|赛道|公司|组织|城市|地理|feng shui|space|city|industry|company/.test(keywordText)) {
    return {
      contentType: 'insight',
      subtype: /城市|地理|city|space|feng shui/.test(keywordText) ? 'city' : /公司|组织|company/.test(keywordText) ? 'company' : 'industry',
    };
  }

  if (/高考|婚恋|关系|跳槽|事业|升学|career|relationship/.test(keywordText)) {
    return {
      contentType: 'case',
    };
  }

  return {
    contentType: 'knowledge',
  };
}

function findBestClusterForSignal(signal: ContentSignalRecord) {
  const signalText = normalizeText(`${signal.title} ${signal.summary || ''} ${(signal.matchedKeywords || []).join(' ')}`);

  return STRATEGIC_CLUSTERS
    .map((cluster) => ({
      cluster,
      score: cluster.keywords.reduce((sum, keyword) => (
        signalText.includes(normalizeText(keyword)) ? sum + 1 : sum
      ), 0),
    }))
    .sort((left, right) => right.score - left.score || right.cluster.baseDemand - left.cluster.baseDemand)[0]?.cluster || null;
}

export function buildGenerationInputFromSignal(
  signal: ContentSignalRecord,
  params?: {
    mode?: 'single' | 'cluster';
    status?: 'draft' | 'published';
    featured?: boolean;
  }
): ContentGenerationInput {
  const inferred = inferContentTypeFromSignal(signal);
  const cluster = findBestClusterForSignal(signal);
  const keywords = [...new Set([
    ...(signal.matchedKeywords || []),
    ...(cluster?.keywords || []),
    signal.platform,
    signal.sourceLabel,
  ].filter(Boolean))];

  return {
    mode: params?.mode || 'single',
    contentType: inferred.contentType,
    subtype: inferred.contentType === 'insight' ? (inferred.subtype || cluster?.subtype || 'industry') : undefined,
    topic: signal.title,
    angle: cluster
      ? `从“${signal.title}”切入，结合${cluster.title}这一高需求主题，把热点翻译成普通用户真正能理解和决策使用的内容。`
      : `从“${signal.title}”切入，结合用户现实处境、判断边界和时间窗口，生成成熟、克制、可转化的内容。`,
    platform: 'radar',
    keywords,
    audience: cluster?.audience || '被热点吸引、但需要更稳定判断框架的普通用户',
    entityName: inferred.contentType === 'insight' ? signal.title : '',
    sourceSignals: [
      `signal:${signal.id}`,
      `source:${signal.sourceLabel}`,
      `platform:${signal.platform}`,
      `url:${signal.url}`,
      signal.summary ? `summary:${signal.summary}` : '',
    ].filter(Boolean).join('\n'),
    status: params?.status || 'draft',
    featured: params?.featured === true,
  };
}

async function fetchSourceItems(source: ContentRadarSource) {
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'LifeKlineContentRadar/1.0',
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`SOURCE_HTTP_${response.status}`);
  }

  const xml = await response.text();
  return parseFeedXml(xml);
}

export async function runContentRadarCycle(params?: {
  sourceIds?: string[];
  limitPerSource?: number;
}) {
  const configuredSources = getContentRadarSources().filter((source) => source.enabled !== false);
  const selectedSources = params?.sourceIds?.length
    ? configuredSources.filter((source) => params.sourceIds?.includes(source.id))
    : configuredSources;
  const allSignals: ContentSignalRecord[] = [];
  const runs: ContentRadarRunRecord[] = [];

  for (const source of selectedSources) {
    try {
      const fetchedItems = await fetchSourceItems(source);
      const limitedItems = fetchedItems.slice(0, params?.limitPerSource || 12);
      let savedCount = 0;

      for (const item of limitedItems) {
        const { matchedKeywords, score } = scoreItem(item, source);
        const signal: ContentSignalRecord = {
          id: `signal_${generateId()}`,
          sourceId: source.id,
          sourceLabel: source.label,
          platform: source.platform,
          title: item.title,
          url: item.url,
          author: item.author,
          summary: item.summary,
          publishedAt: item.publishedAt,
          matchedKeywords,
          score,
          meta: {
            sourceUrl: source.url,
            type: source.type,
          },
        };
        contentSignalOperations.upsert(signal);
        allSignals.push(signal);
        savedCount += 1;
      }

      const run: ContentRadarRunRecord = {
        id: `radar_${generateId()}`,
        sourceId: source.id,
        sourceLabel: source.label,
        platform: source.platform,
        status: 'success',
        fetchedCount: limitedItems.length,
        savedCount,
        meta: { sourceUrl: source.url },
      };
      contentRadarRunOperations.create(run);
      runs.push(run);
    } catch (error) {
      const run: ContentRadarRunRecord = {
        id: `radar_${generateId()}`,
        sourceId: source.id,
        sourceLabel: source.label,
        platform: source.platform,
        status: 'error',
        fetchedCount: 0,
        savedCount: 0,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        meta: { sourceUrl: source.url },
      };
      contentRadarRunOperations.create(run);
      runs.push(run);
    }
  }

  return {
    sources: selectedSources,
    runs,
    signals: allSignals
      .sort((left, right) => (right.score || 0) - (left.score || 0))
      .slice(0, 30),
    suggestions: buildSignalSuggestions(allSignals),
  };
}
