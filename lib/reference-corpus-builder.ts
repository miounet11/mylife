import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import {
  bibliographyOperations,
  knowledgeEntityOperations,
  sourceDocumentOperations,
  type BibliographyEntryRecord,
  type KnowledgeEntityRecord,
  type SourceDocumentRecord,
} from '@/lib/knowledge-base-store';
import type { ReferenceCorpusInput } from '@/lib/reference-intelligence';

type AdviceLike = {
  career?: {
    general?: string;
    specific?: string[];
    timing?: string;
    avoid?: string[];
    direction?: string;
  };
  wealth?: {
    general?: string;
    specific?: string[];
    timing?: string;
    avoid?: string[];
    direction?: string;
  };
  marriage?: {
    general?: string;
    specific?: string[];
    timing?: string;
  };
  health?: {
    general?: string;
    specific?: string[];
    timing?: string;
    avoid?: string[];
  };
  directions?: string[];
  timing?: string[];
  yongShen?: string[];
  xiShen?: string[];
  jiShen?: string[];
};

type FortuneLike = {
  currentDaYun?: string;
  currentLiuNian?: string;
  interaction?: string;
  nextYear?: string;
};

export interface AutoReferenceCorpusParams {
  birthPlace?: string;
  currentPlace?: string;
  targetPlaces?: string[];
  industries?: string[];
  report?: {
    advice?: AdviceLike;
    fortune?: FortuneLike;
  };
  maxSourceDocuments?: number;
  maxBibliographyEntries?: number;
  maxEntities?: number;
  minimumScore?: number;
}

type ScoredSelection<T> = {
  item: T;
  score: number;
  matchedKeywords: string[];
};

const REFERENCE_HINT_KEYWORDS = [
  '真太阳时',
  '节气',
  '天时',
  '流年',
  '大运',
  '时机',
  '周期',
  '城市',
  '迁移',
  '搬家',
  '地理',
  '方位',
  '风水',
  '环境',
  '关系',
  '婚恋',
  '家庭',
  '合作',
  '团队',
  '贵人',
  '心理',
  '焦虑',
  '压力',
  '睡眠',
  '恢复',
  '事业',
  '财富',
  '职业',
  '玄学',
  '命理',
  '易学',
  '八字',
];

const BASELINE_HINT_KEYWORDS = [
  '真太阳时',
  '节气',
  '流年',
  '城市',
  '关系',
  '合作',
];

const RELATIONSHIP_HINT_KEYWORDS = [
  '关系',
  '婚恋',
  '家庭',
  '合作',
  '团队',
  '伴侣',
  '社交',
  '贵人',
];

const NOISY_PLACE_TOKENS = ['未知', '--', '北京时间'];

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function cleanPlaceLabel(value?: string) {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return '';
  if (NOISY_PLACE_TOKENS.some((token) => normalized.includes(token))) {
    return '';
  }
  return normalized;
}

function buildReportSearchText(params: AutoReferenceCorpusParams) {
  return [
    params.birthPlace || '',
    params.currentPlace || '',
    ...(params.targetPlaces || []),
    ...(params.industries || []),
    params.report?.advice?.career?.general || '',
    ...(params.report?.advice?.career?.specific || []),
    params.report?.advice?.career?.timing || '',
    ...(params.report?.advice?.career?.avoid || []),
    params.report?.advice?.career?.direction || '',
    params.report?.advice?.wealth?.general || '',
    ...(params.report?.advice?.wealth?.specific || []),
    params.report?.advice?.wealth?.timing || '',
    ...(params.report?.advice?.wealth?.avoid || []),
    params.report?.advice?.wealth?.direction || '',
    params.report?.advice?.marriage?.general || '',
    ...(params.report?.advice?.marriage?.specific || []),
    params.report?.advice?.marriage?.timing || '',
    params.report?.advice?.health?.general || '',
    ...(params.report?.advice?.health?.specific || []),
    params.report?.advice?.health?.timing || '',
    ...(params.report?.advice?.health?.avoid || []),
    ...(params.report?.advice?.directions || []),
    ...(params.report?.advice?.timing || []),
    ...(params.report?.advice?.yongShen || []),
    ...(params.report?.advice?.xiShen || []),
    ...(params.report?.advice?.jiShen || []),
    params.report?.fortune?.currentDaYun || '',
    params.report?.fortune?.currentLiuNian || '',
    params.report?.fortune?.interaction || '',
    params.report?.fortune?.nextYear || '',
  ].join(' ');
}

function extractReferenceHints(params: AutoReferenceCorpusParams) {
  const places = uniqueStrings([
    cleanPlaceLabel(params.birthPlace),
    cleanPlaceLabel(params.currentPlace),
    ...(params.targetPlaces || []).map((item) => cleanPlaceLabel(item)),
  ]);
  const industries = uniqueStrings(params.industries || []);
  const searchText = normalizeText(buildReportSearchText(params));
  const matchedKeywords = REFERENCE_HINT_KEYWORDS.filter((keyword) => searchText.includes(normalizeText(keyword)));
  const keywords = uniqueStrings([
    ...BASELINE_HINT_KEYWORDS,
    ...matchedKeywords,
    ...places,
    ...industries,
  ]);
  const focusRelationships = uniqueStrings(
    RELATIONSHIP_HINT_KEYWORDS.filter((keyword) => searchText.includes(normalizeText(keyword)))
  );

  return {
    keywords,
    focusPlaces: places,
    focusIndustries: industries,
    focusRelationships,
  };
}

function scoreText(text: string, keywords: string[]) {
  const haystack = normalizeText(text);
  const matchedKeywords = uniqueStrings(
    keywords.filter((keyword) => haystack.includes(normalizeText(keyword)))
  );

  return {
    matchedKeywords,
    score: matchedKeywords.length,
  };
}

function sortSelections<T>(items: ScoredSelection<T>[]) {
  return items
    .slice()
    .sort((left, right) => right.score - left.score || right.matchedKeywords.length - left.matchedKeywords.length);
}

function pickTopMatches<T>(
  items: T[],
  selector: (item: T) => ScoredSelection<T>,
  limit: number,
  minimumScore: number
) {
  return sortSelections(items.map(selector))
    .filter((item) => item.score >= minimumScore)
    .slice(0, Math.max(1, limit))
    .map((item) => item.item);
}

function scoreSourceDocument(item: SourceDocumentRecord, keywords: string[]) {
  const base = scoreText([
    item.title,
    item.summary || '',
    ...(item.tags || []),
    JSON.stringify(item.rawMeta || {}),
  ].join(' '), keywords);

  let score = base.score * 2;
  if ((item.tags || []).some((tag) => tag.includes('metaphysics') || tag.includes('psychology'))) score += 1;
  if (item.platform === 'zhihu' || item.platform === 'reddit' || item.platform === 'github') score += 0.25;
  if (item.publishedAt) score += 0.15;

  return {
    item,
    matchedKeywords: base.matchedKeywords,
    score,
  };
}

function scoreBibliographyEntry(item: BibliographyEntryRecord, keywords: string[]) {
  const base = scoreText([
    item.title,
    item.originalTitle || '',
    item.summary || '',
    item.author || '',
    ...(item.altTitles || []),
    ...(item.tags || []),
  ].join(' '), keywords);

  let score = base.score * 2.2;
  if (item.bookType === 'classic') score += 1;
  if (item.bookType === 'commentary') score += 0.6;

  return {
    item,
    matchedKeywords: base.matchedKeywords,
    score,
  };
}

function scoreKnowledgeEntity(item: KnowledgeEntityRecord, keywords: string[]) {
  const base = scoreText([
    item.name,
    item.summary || '',
    item.description || '',
    ...(item.aliases || []),
    ...(item.tags || []),
    JSON.stringify(item.meta || {}),
  ].join(' '), keywords);

  let score = base.score * 1.8;
  if (base.score > 0) {
    if (item.entityType === 'topic') score += 1;
    if (item.entityType === 'concept') score += 0.8;
    if (item.entityType === 'text') score += 0.4;
  }

  return {
    item,
    matchedKeywords: base.matchedKeywords,
    score,
  };
}

export function buildAutoReferenceCorpusFromKnowledgeBase(
  params: AutoReferenceCorpusParams,
  database: Database.Database = db
): ReferenceCorpusInput {
  const maxSourceDocuments = params.maxSourceDocuments ?? 10;
  const maxBibliographyEntries = params.maxBibliographyEntries ?? 6;
  const maxEntities = params.maxEntities ?? 14;
  const minimumScore = params.minimumScore ?? 1;
  const hints = extractReferenceHints(params);

  const sourceDocuments = pickTopMatches(
    sourceDocumentOperations.list(database, { limit: 240 }),
    (item) => scoreSourceDocument(item, hints.keywords),
    maxSourceDocuments,
    minimumScore
  );
  const bibliographyEntries = pickTopMatches(
    bibliographyOperations.list(database, { limit: 120 }),
    (item) => scoreBibliographyEntry(item, hints.keywords),
    maxBibliographyEntries,
    minimumScore
  );
  const entities = pickTopMatches(
    knowledgeEntityOperations.list(database, { limit: 320 })
      .filter((item) => item.entityType === 'topic' || item.entityType === 'concept' || item.entityType === 'text'),
    (item) => scoreKnowledgeEntity(item, hints.keywords),
    maxEntities,
    minimumScore
  );

  return {
    sourceDocuments,
    bibliographyEntries,
    entities,
    focusPlaces: hints.focusPlaces,
    focusIndustries: hints.focusIndustries,
    focusRelationships: hints.focusRelationships,
  };
}
