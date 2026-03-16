import type {
  BibliographyEntryRecord,
  KnowledgeEntityRecord,
  SourceDocumentRecord,
} from '@/lib/knowledge-base-store';
import type { RightsStatus } from '@/lib/knowledge-taxonomy';

export type ReferenceDimension = 'tianShi' | 'diLi' | 'renHe';
export type ReferenceDirection = 'supportive' | 'neutral' | 'cautionary';

export interface ReferenceCorpusInput {
  sourceDocuments?: SourceDocumentRecord[];
  bibliographyEntries?: BibliographyEntryRecord[];
  entities?: KnowledgeEntityRecord[];
  focusIndustries?: string[];
  focusPlaces?: string[];
  focusRelationships?: string[];
}

export interface ReferenceEvidence {
  sourceId: string;
  sourceKind: 'source_document' | 'bibliography' | 'entity';
  label: string;
  dimension: ReferenceDimension;
  subdimension: string;
  direction: ReferenceDirection;
  weight: number;
  authorityWeight: number;
  matchedSignals: string[];
  reason: string;
}

export interface ReferenceDimensionSummary {
  score: number;
  evidenceCount: number;
  supportiveCount: number;
  cautionaryCount: number;
  signals: string[];
  leadingSubdimensions: string[];
  evidence: ReferenceEvidence[];
}

export interface ReferenceAuthorityProfile {
  sourceCount: number;
  sourceDiversity: number;
  publicSourceRatio: number;
  restrictedSourceRatio: number;
  canonicalSourceCount: number;
  classicBookCount: number;
  authorityScore: number;
}

export interface ReferenceStateVectorAdjustment {
  tianShiDelta: number;
  diLiDelta: number;
  renHeDelta: number;
}

export interface ReferenceIntelligencePack {
  version: string;
  generatedAt: string;
  dimensions: Record<ReferenceDimension, ReferenceDimensionSummary>;
  authority: ReferenceAuthorityProfile;
  stateVectorAdjustment: ReferenceStateVectorAdjustment;
  recommendedEngineWeights: {
    timingReferenceWeight: number;
    geoReferenceWeight: number;
    humanReferenceWeight: number;
  };
  modelDirectives: string[];
}

type ReferenceRule = {
  dimension: ReferenceDimension;
  subdimension: string;
  keywords: string[];
  reason: string;
};

type CorpusItem = {
  id: string;
  sourceKind: ReferenceEvidence['sourceKind'];
  label: string;
  platform: string;
  rightsStatus: RightsStatus;
  bookType?: string | null;
  publishedAt?: string | null;
  searchText: string;
};

const REFERENCE_RULES: ReferenceRule[] = [
  {
    dimension: 'tianShi',
    subdimension: 'solar_terms',
    keywords: ['节气', '真太阳时', '天时', '四时', '季节', '换季', '候气'],
    reason: '涉及节气、真太阳时或季节节奏，可作为天时参照。',
  },
  {
    dimension: 'tianShi',
    subdimension: 'macro_cycle',
    keywords: ['流年', '大运', '国运', '周期', '行业周期', 'economic cycle', 'industry cycle', 'timing'],
    reason: '涉及时间窗口、宏观周期或推进时机，可作为天时参照。',
  },
  {
    dimension: 'diLi',
    subdimension: 'geography',
    keywords: ['地利', '城市', '迁移', '方位', '经纬度', '地理', '风水', 'climate', 'city', 'space'],
    reason: '涉及城市、方位、气候或空间环境，可作为地利参照。',
  },
  {
    dimension: 'diLi',
    subdimension: 'settlement',
    keywords: ['定居', '搬家', '迁居', '居住', '办公环境', 'house', 'home', 'workspace'],
    reason: '涉及居住、办公或迁移环境，可作为地利参照。',
  },
  {
    dimension: 'renHe',
    subdimension: 'relationship',
    keywords: ['人和', '关系', '婚恋', '合作', '团队', '贵人', '社交', 'relationship', 'collaboration'],
    reason: '涉及关系、合作或互动质量，可作为人和参照。',
  },
  {
    dimension: 'renHe',
    subdimension: 'family_role',
    keywords: ['家庭', '亲密关系', '父母', '伴侣', '婚姻', 'family', 'partner'],
    reason: '涉及家庭角色与亲密关系，可作为人和参照。',
  },
];

const SUPPORTIVE_KEYWORDS = [
  '适合',
  '利于',
  '帮助',
  '增益',
  '贵人',
  '机会',
  '顺势',
  '改善',
  '稳定',
  '突破',
  'support',
  'growth',
  'opportunity',
];

const CAUTIONARY_KEYWORDS = [
  '风险',
  '避免',
  '冲突',
  '波动',
  '谨慎',
  '代价',
  '焦虑',
  '压力',
  '误判',
  '损耗',
  'risk',
  'avoid',
  'pressure',
  'conflict',
];

const CANONICAL_PLATFORMS = new Set([
  'ctext',
  'wikisource',
  'openlibrary',
  'internet-archive',
  'gutenberg',
]);

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function countMatchedKeywords(searchText: string, keywords: string[]) {
  const normalized = normalizeText(searchText);
  return uniqueStrings(keywords).filter((keyword) => normalized.includes(normalizeText(keyword)));
}

function getDirection(searchText: string): ReferenceDirection {
  const normalized = normalizeText(searchText);
  const supportive = SUPPORTIVE_KEYWORDS.some((keyword) => normalized.includes(normalizeText(keyword)));
  const cautionary = CAUTIONARY_KEYWORDS.some((keyword) => normalized.includes(normalizeText(keyword)));

  if (supportive && !cautionary) {
    return 'supportive';
  }

  if (cautionary && !supportive) {
    return 'cautionary';
  }

  return 'neutral';
}

function getRecencyBonus(publishedAt?: string | null) {
  if (!publishedAt) return 0;
  const diffMs = Date.now() - new Date(publishedAt).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 0;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 30) return 0.25;
  if (diffDays <= 180) return 0.15;
  if (diffDays <= 365) return 0.08;
  return 0;
}

function getAuthorityWeight(item: CorpusItem) {
  let weight = 1;

  if (item.rightsStatus === 'public_domain') weight += 0.3;
  if (item.rightsStatus === 'open_license') weight += 0.2;
  if (item.rightsStatus === 'platform_restricted') weight -= 0.12;
  if (CANONICAL_PLATFORMS.has(item.platform)) weight += 0.25;
  if (item.bookType === 'classic') weight += 0.25;
  if (item.bookType === 'commentary') weight += 0.12;

  return clamp(Number(weight.toFixed(2)), 0.6, 1.8);
}

function buildCorpus(input: ReferenceCorpusInput): CorpusItem[] {
  const documents = (input.sourceDocuments || []).map((item) => ({
    id: item.id,
    sourceKind: 'source_document' as const,
    label: item.title,
    platform: item.platform,
    rightsStatus: item.rightsStatus,
    publishedAt: item.publishedAt,
    searchText: [
      item.title,
      item.summary || '',
      ...(item.tags || []),
      ...(input.focusIndustries || []),
      ...(input.focusPlaces || []),
      ...(input.focusRelationships || []),
    ].join(' '),
  }));

  const books = (input.bibliographyEntries || []).map((item) => ({
    id: item.id,
    sourceKind: 'bibliography' as const,
    label: item.title,
    platform: item.sourceUrl ? new URL(item.sourceUrl).hostname.replace(/^www\./, '') : 'bibliography',
    rightsStatus: item.rightsStatus,
    bookType: item.bookType,
    searchText: [
      item.title,
      item.originalTitle || '',
      item.summary || '',
      item.author || '',
      ...(item.altTitles || []),
      ...(item.tags || []),
    ].join(' '),
  }));

  const entities = (input.entities || []).map((item) => ({
    id: item.id,
    sourceKind: 'entity' as const,
    label: item.name,
    platform: 'knowledge-entity',
    rightsStatus: 'licensed' as const,
    searchText: [
      item.name,
      item.summary || '',
      item.description || '',
      ...(item.aliases || []),
      ...(item.tags || []),
    ].join(' '),
  }));

  return [...documents, ...books, ...entities];
}

export function classifyReferenceEvidence(input: ReferenceCorpusInput): ReferenceEvidence[] {
  const corpus = buildCorpus(input);
  const evidence: ReferenceEvidence[] = [];

  corpus.forEach((item) => {
    const authorityWeight = getAuthorityWeight(item);
    const direction = getDirection(item.searchText);

    REFERENCE_RULES.forEach((rule) => {
      const matchedSignals = countMatchedKeywords(item.searchText, rule.keywords);
      if (!matchedSignals.length) {
        return;
      }

      const baseWeight = 0.7 + matchedSignals.length * 0.25 + getRecencyBonus(item.publishedAt);
      const directionFactor = direction === 'supportive' ? 0.12 : direction === 'cautionary' ? 0.08 : 0;
      const weight = clamp(Number((baseWeight + directionFactor).toFixed(2)), 0.5, 1.8);

      evidence.push({
        sourceId: item.id,
        sourceKind: item.sourceKind,
        label: item.label,
        dimension: rule.dimension,
        subdimension: rule.subdimension,
        direction,
        weight,
        authorityWeight,
        matchedSignals,
        reason: rule.reason,
      });
    });
  });

  return evidence.sort((left, right) => (right.weight * right.authorityWeight) - (left.weight * left.authorityWeight));
}

function buildDimensionSummary(dimension: ReferenceDimension, evidence: ReferenceEvidence[]): ReferenceDimensionSummary {
  const scoped = evidence.filter((item) => item.dimension === dimension);
  const supportiveCount = scoped.filter((item) => item.direction === 'supportive').length;
  const cautionaryCount = scoped.filter((item) => item.direction === 'cautionary').length;
  const weightedSupport = scoped
    .filter((item) => item.direction === 'supportive')
    .reduce((sum, item) => sum + item.weight * item.authorityWeight, 0);
  const weightedCaution = scoped
    .filter((item) => item.direction === 'cautionary')
    .reduce((sum, item) => sum + item.weight * item.authorityWeight, 0);
  const signalStrength = scoped.reduce((sum, item) => sum + item.weight * item.authorityWeight, 0);
  const net = weightedSupport - weightedCaution;
  const score = clamp(Number((5 + net / 2 + Math.min(signalStrength, 8) / 8).toFixed(2)), 0, 10);
  const leadingSubdimensions = Object.entries(
    scoped.reduce<Record<string, number>>((acc, item) => {
      acc[item.subdimension] = (acc[item.subdimension] || 0) + item.weight * item.authorityWeight;
      return acc;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => key);

  return {
    score,
    evidenceCount: scoped.length,
    supportiveCount,
    cautionaryCount,
    signals: uniqueStrings(scoped.flatMap((item) => item.matchedSignals)).slice(0, 12),
    leadingSubdimensions,
    evidence: scoped.slice(0, 8),
  };
}

function buildAuthorityProfile(input: ReferenceCorpusInput): ReferenceAuthorityProfile {
  const sourceDocuments = input.sourceDocuments || [];
  const bibliographyEntries = input.bibliographyEntries || [];
  const allPlatforms = uniqueStrings([
    ...sourceDocuments.map((item) => item.platform),
    ...bibliographyEntries.map((item) => {
      try {
        return item.sourceUrl ? new URL(item.sourceUrl).hostname.replace(/^www\./, '') : 'bibliography';
      } catch {
        return 'bibliography';
      }
    }),
  ]);
  const publicSourceCount = sourceDocuments.filter((item) => item.rightsStatus === 'public_domain' || item.rightsStatus === 'open_license').length
    + bibliographyEntries.filter((item) => item.rightsStatus === 'public_domain' || item.rightsStatus === 'open_license').length;
  const restrictedSourceCount = sourceDocuments.filter((item) => item.rightsStatus === 'platform_restricted').length;
  const canonicalSourceCount = sourceDocuments.filter((item) => CANONICAL_PLATFORMS.has(item.platform)).length
    + bibliographyEntries.filter((item) => {
      try {
        return item.sourceUrl ? CANONICAL_PLATFORMS.has(new URL(item.sourceUrl).hostname.replace(/^www\./, '')) : false;
      } catch {
        return false;
      }
    }).length;
  const classicBookCount = bibliographyEntries.filter((item) => item.bookType === 'classic').length;
  const sourceCount = sourceDocuments.length + bibliographyEntries.length + (input.entities || []).length;
  const publicSourceRatio = sourceCount ? publicSourceCount / sourceCount : 0;
  const restrictedSourceRatio = sourceCount ? restrictedSourceCount / sourceCount : 0;
  const diversityScore = Math.min(allPlatforms.length / 6, 1);
  const authorityScore = clamp(
    Number((
      45
      + publicSourceRatio * 20
      + diversityScore * 15
      + Math.min(canonicalSourceCount, 5) * 3
      + Math.min(classicBookCount, 5) * 2
      - restrictedSourceRatio * 10
    ).toFixed(2)),
    0,
    100
  );

  return {
    sourceCount,
    sourceDiversity: allPlatforms.length,
    publicSourceRatio: Number(publicSourceRatio.toFixed(2)),
    restrictedSourceRatio: Number(restrictedSourceRatio.toFixed(2)),
    canonicalSourceCount,
    classicBookCount,
    authorityScore,
  };
}

function buildStateVectorAdjustment(dimensions: Record<ReferenceDimension, ReferenceDimensionSummary>): ReferenceStateVectorAdjustment {
  const toDelta = (summary: ReferenceDimensionSummary) => clamp(Number(((summary.score - 5) / 2.5).toFixed(2)), -2, 2);

  return {
    tianShiDelta: toDelta(dimensions.tianShi),
    diLiDelta: toDelta(dimensions.diLi),
    renHeDelta: toDelta(dimensions.renHe),
  };
}

function buildRecommendedEngineWeights(dimensions: Record<ReferenceDimension, ReferenceDimensionSummary>) {
  const total = dimensions.tianShi.evidenceCount + dimensions.diLi.evidenceCount + dimensions.renHe.evidenceCount;
  if (!total) {
    return {
      timingReferenceWeight: 0.34,
      geoReferenceWeight: 0.33,
      humanReferenceWeight: 0.33,
    };
  }

  const timing = Number((dimensions.tianShi.evidenceCount / total).toFixed(2));
  const geo = Number((dimensions.diLi.evidenceCount / total).toFixed(2));
  const human = Number((1 - timing - geo).toFixed(2));

  return {
    timingReferenceWeight: timing,
    geoReferenceWeight: geo,
    humanReferenceWeight: human,
  };
}

function buildModelDirectives(
  dimensions: Record<ReferenceDimension, ReferenceDimensionSummary>,
  authority: ReferenceAuthorityProfile
) {
  const directives: string[] = [];

  if (dimensions.tianShi.evidenceCount > 0) {
    directives.push(`回答时显式引用天时参照，优先结合${dimensions.tianShi.leadingSubdimensions.join('、') || '时间窗口'}解释节奏。`);
  }
  if (dimensions.diLi.evidenceCount > 0) {
    directives.push(`涉及迁移、城市、空间布局时，优先结合地利参照，重点看${dimensions.diLi.leadingSubdimensions.join('、') || '地理环境'}。`);
  }
  if (dimensions.renHe.evidenceCount > 0) {
    directives.push(`涉及合作、婚恋、家庭或团队议题时，把人和参照放进判断链，避免只看单点吉凶。`);
  }
  if (authority.authorityScore >= 70) {
    directives.push('当前参考资料权威度较高，可把外部知识作为解释层增强，但不要替代命盘底层结构。');
  } else {
    directives.push('当前参考资料更多用于辅助解释和选题，不应覆盖命盘本身的稳定判断。');
  }

  return directives;
}

export function buildReferenceIntelligencePack(input: ReferenceCorpusInput): ReferenceIntelligencePack {
  const evidence = classifyReferenceEvidence(input);
  const dimensions = {
    tianShi: buildDimensionSummary('tianShi', evidence),
    diLi: buildDimensionSummary('diLi', evidence),
    renHe: buildDimensionSummary('renHe', evidence),
  };
  const authority = buildAuthorityProfile(input);

  return {
    version: 'v1',
    generatedAt: new Date().toISOString(),
    dimensions,
    authority,
    stateVectorAdjustment: buildStateVectorAdjustment(dimensions),
    recommendedEngineWeights: buildRecommendedEngineWeights(dimensions),
    modelDirectives: buildModelDirectives(dimensions, authority),
  };
}
