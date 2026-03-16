import type Database from 'better-sqlite3';
import { contentSignalOperations, db } from '@/lib/database';
import {
  buildDomainAcquisitionPlans,
  buildCoreReferenceSeedPlan,
  type DomainAcquisitionPlan,
} from '@/lib/domain-acquisition-planner';
import {
  buildCoreReferenceSourceDocumentInputs,
  buildDomainSourceDocumentInputs,
} from '@/lib/domain-source-ingestion';
import type { DomainKey } from '@/lib/domain-source-presets';
import {
  buildSourceDocumentInputFromSignal,
  inferRightsStatusFromPlatform,
  type SignalLike,
} from '@/lib/knowledge-ingestion';
import {
  sourceDocumentOperations,
  type SourceDocumentRecord,
  type UpsertSourceDocumentInput,
} from '@/lib/knowledge-base-store';
import { extractKnowledgeObjectsFromSourceDocuments } from '@/lib/knowledge-object-extraction';
import { enrichKnowledgeGraph } from '@/lib/knowledge-graph-enrichment';
import { runKnowledgePublicationCycle } from '@/lib/knowledge-publication-ops';
import {
  buildKnowledgeSynthesisDraftInputs,
  generateKnowledgeSynthesisDrafts,
} from '@/lib/knowledge-synthesis';
import { runContentRadarCycle } from '@/lib/content-radar';
import type { ContentSignalRecord } from '@/lib/user-types';

export interface DomainSignalMatch {
  domain: DomainKey;
  score: number;
  matchedKeywords: string[];
}

export interface PromotedSignalResult {
  signalId: string;
  title: string;
  domains: DomainSignalMatch[];
  documentId: string;
  canonicalUrl: string;
}

export interface KnowledgeAcquisitionCycleResult {
  ranAt: string;
  radarRefreshed: boolean;
  radarSignalsFetched: number;
  coreSeededCount: number;
  domainSeedResults: Array<{
    domain: DomainKey;
    insertedCount: number;
  }>;
  promotedSignalsCount: number;
  promotedSignals: PromotedSignalResult[];
  extractedObjects: {
    topicCount: number;
    questionCount: number;
    conceptCount: number;
    textCount: number;
    bookCount: number;
    relationCount: number;
  };
  synthesizedDrafts: {
    draftCount: number;
    persistedCount: number;
    candidateCount: number;
    publishedCount: number;
    titles: string[];
  };
  graphEnrichment: {
    topicConceptLinksAdded: number;
    topicTopicLinksAdded: number;
    relatedTopicCount: number;
  };
  selectedDomains: DomainKey[];
  coreMissingAfterRun: number;
  domainPlans: DomainAcquisitionPlan[];
}

const DOMAIN_SIGNAL_KEYWORDS: Record<DomainKey, string[]> = {
  metaphysics: ['玄学', '命理', '易学', '易经', '周易', '八字', '风水', '真太阳时', '节气', '流年', '占卜'],
  psychology: ['心理', '心理学', '情绪', '压力', '焦虑', '人格', '亲密关系', '创伤', 'therapy', 'anxiety', 'stress'],
  philosophy: ['哲学', '认识论', '方法论', '形而上学', '伦理', '存在', 'epistemology', 'metaphysics', 'ethics'],
  history: ['历史', '史料', '思想史', '制度史', '朝代', '年表', 'historian', 'history', 'timeline'],
  programming: ['编程', '程序', '软件工程', 'python', 'javascript', 'typescript', 'api', 'automation', 'browser'],
  ai: ['ai', '人工智能', '机器学习', 'llm', 'agent', 'rag', '模型', 'prompt', 'openai'],
  statistics: ['统计', '概率', '样本', '回归', '置信', '显著性', 'bayesian', 'causal', 'variance'],
  astrology: ['占星', 'astrology', 'zodiac', 'horoscope', '星座', '星盘'],
  medicine: ['医学', '健康', '症状', '睡眠', 'clinical', 'symptom', 'recovery', 'therapy'],
  law: ['法律', '法规', '合规', '判例', 'case law', 'regulation', 'statute'],
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function parseDomainList(raw: string | undefined) {
  return uniqueStrings(`${raw || ''}`.split(','))
    .filter((item): item is DomainKey => (
      [
        'metaphysics',
        'psychology',
        'philosophy',
        'history',
        'programming',
        'ai',
        'statistics',
        'astrology',
        'medicine',
        'law',
      ] as DomainKey[]
    ).includes(item as DomainKey));
}

function pickFocusDomains(paramsDomains?: DomainKey[]) {
  return paramsDomains?.length
    ? paramsDomains
    : parseDomainList(process.env.KNOWLEDGE_ACQUISITION_FOCUS_DOMAINS).filter((item) => item !== 'law');
}

function seedMissingSourceInputs(inputs: UpsertSourceDocumentInput[], database: Database.Database) {
  return inputs
    .filter((input) => !sourceDocumentOperations.getByCanonicalUrl(database, input.canonicalUrl))
    .map((input) => sourceDocumentOperations.upsert(database, input))
    .filter((item): item is SourceDocumentRecord => !!item);
}

export function inferDomainsForSignal(signal: SignalLike, maxDomains = 3): DomainSignalMatch[] {
  const haystack = normalizeText([
    signal.title,
    signal.summary || '',
    signal.platform,
    signal.sourceLabel,
    ...(signal.matchedKeywords || []),
  ].join(' '));

  return (Object.keys(DOMAIN_SIGNAL_KEYWORDS) as DomainKey[])
    .map((domain) => {
      const matchedKeywords = DOMAIN_SIGNAL_KEYWORDS[domain]
        .filter((keyword) => haystack.includes(normalizeText(keyword)));

      return {
        domain,
        score: matchedKeywords.length,
        matchedKeywords: uniqueStrings(matchedKeywords),
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.domain.localeCompare(right.domain))
    .slice(0, maxDomains);
}

export function buildKnowledgeSourceDocumentInputFromSignal(
  signal: SignalLike,
  params?: {
    focusDomains?: DomainKey[];
  }
): UpsertSourceDocumentInput | null {
  const domainMatches = inferDomainsForSignal(signal);
  const focusDomains = params?.focusDomains || [];

  if (focusDomains.length && !domainMatches.some((item) => focusDomains.includes(item.domain))) {
    return null;
  }

  const base = buildSourceDocumentInputFromSignal(signal);
  const rightsStatus = inferRightsStatusFromPlatform(signal.platform);
  const domainTags = domainMatches.flatMap((item) => [item.domain, `domain:${item.domain}`]);

  return {
    ...base,
    tags: uniqueStrings([
      ...(base.tags || []),
      ...domainTags,
      'signal_promoted',
      `platform:${signal.platform}`,
    ]),
    rightsStatus,
    reusePolicy: rightsStatus === 'platform_restricted' ? 'summary-only' : 'review-before-publish',
    rawMeta: {
      ...(base.rawMeta || {}),
      inferredDomains: domainMatches,
      promotedFrom: 'content_signal',
    },
  };
}

export function promoteSignalsToKnowledgeBase(
  signals: SignalLike[],
  params?: {
    minScore?: number;
    limit?: number;
    focusDomains?: DomainKey[];
  },
  database: Database.Database = db
) {
  const minScore = params?.minScore ?? 18;
  const limit = params?.limit ?? 12;
  const focusDomains = params?.focusDomains || [];

  const promotedSignals: PromotedSignalResult[] = [];
  const recentDocuments: SourceDocumentRecord[] = [];

  signals
    .slice()
    .sort((left, right) => (right.score || 0) - (left.score || 0))
    .filter((signal) => (signal.score || 0) >= minScore)
    .slice(0, limit * 3)
    .forEach((signal) => {
      if (promotedSignals.length >= limit) {
        return;
      }

      if (sourceDocumentOperations.getByCanonicalUrl(database, signal.url)) {
        return;
      }

      const input = buildKnowledgeSourceDocumentInputFromSignal(signal, { focusDomains });
      if (!input) {
        return;
      }

      const record = sourceDocumentOperations.upsert(database, input);
      if (!record) {
        return;
      }

      const domains = inferDomainsForSignal(signal);
      promotedSignals.push({
        signalId: signal.id,
        title: signal.title,
        domains,
        documentId: record.id,
        canonicalUrl: record.canonicalUrl,
      });
      recentDocuments.push(record);
    });

  return {
    promotedSignals,
    recentDocuments,
  };
}

export async function runKnowledgeAcquisitionCycle(
  params?: {
    refreshRadar?: boolean;
    radarLimitPerSource?: number;
    coreLimit?: number;
    maxDomainsPerRun?: number;
    signalMinScore?: number;
    signalPromotionLimit?: number;
    signals?: ContentSignalRecord[];
    focusDomains?: DomainKey[];
  },
  database: Database.Database = db
): Promise<KnowledgeAcquisitionCycleResult> {
  const refreshRadar = params?.refreshRadar ?? process.env.KNOWLEDGE_ACQUISITION_REFRESH_RADAR === '1';
  const radarLimitPerSource = params?.radarLimitPerSource ?? Number(process.env.KNOWLEDGE_ACQUISITION_RADAR_LIMIT_PER_SOURCE || 8);
  const coreLimit = params?.coreLimit ?? Number(process.env.KNOWLEDGE_ACQUISITION_CORE_LIMIT || 18);
  const maxDomainsPerRun = params?.maxDomainsPerRun ?? Number(process.env.KNOWLEDGE_ACQUISITION_MAX_DOMAINS_PER_RUN || 3);
  const signalMinScore = params?.signalMinScore ?? Number(process.env.KNOWLEDGE_ACQUISITION_SIGNAL_MIN_SCORE || 18);
  const signalPromotionLimit = params?.signalPromotionLimit ?? Number(process.env.KNOWLEDGE_ACQUISITION_SIGNAL_PROMOTION_LIMIT || 10);
  const focusDomains = pickFocusDomains(params?.focusDomains);

  let radarSignalsFetched = 0;
  if (refreshRadar) {
    const radar = await runContentRadarCycle({ limitPerSource: radarLimitPerSource });
    radarSignalsFetched = radar.signals.length;
  }

  const coreSeeded = seedMissingSourceInputs(buildCoreReferenceSourceDocumentInputs(coreLimit), database);
  const domainPlans = buildDomainAcquisitionPlans({
    domains: focusDomains.length ? focusDomains : undefined,
    nextWaveLimit: 5,
  }, database);
  const selectedPlans = domainPlans
    .filter((item) => item.unseededSources > 0)
    .slice(0, maxDomainsPerRun);

  const domainSeedResultsDetailed = selectedPlans.map((plan) => {
    const documents = seedMissingSourceInputs(buildDomainSourceDocumentInputs(plan.domain), database);
    return {
      domain: plan.domain,
      insertedCount: documents.length,
      documents,
    };
  });
  const domainSeedResults = domainSeedResultsDetailed.map(({ domain, insertedCount }) => ({
    domain,
    insertedCount,
  }));

  const signals = params?.signals || contentSignalOperations.listRecent(80);
  const promoted = promoteSignalsToKnowledgeBase(signals, {
    minScore: signalMinScore,
    limit: signalPromotionLimit,
    focusDomains,
  }, database);
  const recentlyAddedSources = [
    ...coreSeeded,
    ...domainSeedResultsDetailed.flatMap((item) => item.documents),
    ...promoted.recentDocuments,
  ];
  const domainSeededDocuments = selectedPlans.flatMap((plan) =>
    sourceDocumentOperations.list(database, { limit: 200 }).filter((item) => {
      const domainTags = item.tags || [];
      return domainTags.includes(plan.domain) || domainTags.includes(`domain:${plan.domain}`);
    }).slice(0, 12)
  );
  const extraction = extractKnowledgeObjectsFromSourceDocuments(
    [...new Map(
      [...recentlyAddedSources, ...domainSeededDocuments]
        .map((item) => [item.canonicalUrl, item] as const)
    ).values()],
    database
  );
  const graphEnrichment = enrichKnowledgeGraph({ topicLimit: 8 }, database);
  const synthesisInputs = buildKnowledgeSynthesisDraftInputs({ topicLimit: 4 }, database);
  const persistedSynthesis = database === db
    ? generateKnowledgeSynthesisDrafts({
        topicLimit: 4,
        userId: 'system_knowledge',
        autoPublish: false,
      })
    : { drafts: [] };
  const publication = database === db && process.env.KNOWLEDGE_SYNTHESIS_AUTO_PUBLISH === '1'
    ? runKnowledgePublicationCycle({
        userId: 'system_knowledge',
        limit: Number(process.env.KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE || 4),
      })
    : { publishedEntries: [] };

  const corePlanAfterRun = buildCoreReferenceSeedPlan({ limit: coreLimit }, database);

  return {
    ranAt: new Date().toISOString(),
    radarRefreshed: refreshRadar,
    radarSignalsFetched,
    coreSeededCount: coreSeeded.length,
    domainSeedResults,
    promotedSignalsCount: promoted.promotedSignals.length,
    promotedSignals: promoted.promotedSignals,
    extractedObjects: {
      topicCount: extraction.topics.length,
      questionCount: extraction.questions.length,
      conceptCount: extraction.concepts.length,
      textCount: extraction.textEntities.length,
      bookCount: extraction.books.length,
      relationCount: extraction.relationCount,
    },
    synthesizedDrafts: {
      draftCount: synthesisInputs.drafts.length,
      persistedCount: persistedSynthesis.drafts.length,
      candidateCount: synthesisInputs.drafts.filter((item) => item.meta?.publishCandidate === true).length,
      publishedCount: publication.publishedEntries.length,
      titles: synthesisInputs.drafts.map((item) => item.title),
    },
    graphEnrichment: {
      topicConceptLinksAdded: graphEnrichment.addedTopicConceptLinks,
      topicTopicLinksAdded: graphEnrichment.addedTopicTopicLinks,
      relatedTopicCount: graphEnrichment.relatedTopicEdges.length,
    },
    selectedDomains: selectedPlans.map((item) => item.domain),
    coreMissingAfterRun: corePlanAfterRun.missingCount,
    domainPlans: buildDomainAcquisitionPlans({
      domains: focusDomains.length ? focusDomains : undefined,
      nextWaveLimit: 5,
    }, database),
  };
}
