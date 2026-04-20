import {
  getKnowledgeSynthesisAllowedTypesEnv,
  getKnowledgeSynthesisPublishBatchSize,
} from '@/lib/env';
import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '@/lib/content-store';
import { selectKnowledgePublicationBatch, toKnowledgeEditorialCandidate } from '@/lib/knowledge-editorial';

export interface KnowledgePublishCandidate {
  entry: ManagedContentEntry;
  qualityScore: number;
  synthesisType: string;
}

export interface KnowledgePublicationCycleResult {
  candidates: KnowledgePublishCandidate[];
  publishedEntries: ManagedContentEntry[];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function parseAllowedSynthesisTypes() {
  const raw = getKnowledgeSynthesisAllowedTypesEnv();
  if (!raw) {
    return ['topic-overview', 'concept-glossary', 'book-path', 'book-ladder'];
  }
  return uniqueStrings(raw.split(','));
}

function getQualityScore(entry: ManagedContentEntry) {
  return typeof entry.meta?.qualityScore === 'number' ? entry.meta.qualityScore : 0;
}

function getSynthesisType(entry: ManagedContentEntry) {
  return typeof entry.meta?.synthesisType === 'string' ? entry.meta.synthesisType : '';
}

function readNumber(entry: ManagedContentEntry, key: string) {
  const value = entry.meta?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function hasBlockedPlaceholderParagraphs(entry: ManagedContentEntry) {
  const text = entry.sections
    .flatMap((section) => section.paragraphs || [])
    .join('\n');

  return /当前尚未|当前.*不足|应继续补|仍薄|还没有足够/.test(text);
}

export function assessKnowledgePublicationReadiness(entry: ManagedContentEntry) {
  const synthesisType = getSynthesisType(entry);
  const qualityScore = getQualityScore(entry);
  const conceptCount = readNumber(entry, 'conceptCount');
  const questionCount = readNumber(entry, 'questionCount');
  const bookCount = readNumber(entry, 'bookCount');
  const relatedTopicCount = readNumber(entry, 'relatedTopicCount');

  if (!entry.source.startsWith('knowledge-synthesis:')) {
    return !entry.source.startsWith('agent-fallback:');
  }

  if (!['topic-overview', 'concept-glossary'].includes(synthesisType)) {
    return false;
  }

  if (qualityScore < 84) {
    return false;
  }

  if (conceptCount < 3) {
    return false;
  }

  if ((questionCount + bookCount + relatedTopicCount) < 2) {
    return false;
  }

  if (hasBlockedPlaceholderParagraphs(entry)) {
    return false;
  }

  return true;
}

export function listKnowledgePublishCandidates(params?: {
  limit?: number;
}) {
  const allowedTypes = new Set(parseAllowedSynthesisTypes());
  const limit = params?.limit ?? getKnowledgeSynthesisPublishBatchSize();

  const eligibleEntries = listManagedContentEntries()
    .filter((entry) => entry.contentType === 'knowledge')
    .filter((entry) => entry.status === 'draft')
    .filter((entry) => entry.source.startsWith('knowledge-synthesis:'))
    .filter((entry) => entry.meta?.publishCandidate === true)
    .filter((entry) => allowedTypes.has(getSynthesisType(entry)));

  return selectKnowledgePublicationBatch(eligibleEntries, { limit })
    .map((item) => ({
      entry: item.entry,
      qualityScore: item.qualityScore,
      synthesisType: item.synthesisType || '',
    }));
}

export function runKnowledgePublicationCycle(params?: {
  userId?: string;
  limit?: number;
}) : KnowledgePublicationCycleResult {
  const userId = params?.userId || 'system_knowledge';
  const candidates = listKnowledgePublishCandidates({ limit: params?.limit });
  const publishedEntries: ManagedContentEntry[] = [];

  candidates.forEach(({ entry }) => {
    const editorial = toKnowledgeEditorialCandidate(entry);
    const publicationReady = assessKnowledgePublicationReadiness(entry);
    const published = saveManagedContentEntry({
      ...entry,
      status: 'published',
      featured: entry.featured || editorial.editorialTier === 'flagship',
      meta: {
        ...(entry.meta || {}),
        autoPublishedAt: new Date().toISOString(),
        editorialScore: editorial.editorialScore,
        editorialTier: editorial.editorialTier,
        homepageEligible: editorial.homepageEligible,
        publicationReady,
        surfaceVisibility: publicationReady ? 'public' : 'internal',
      },
    }, userId);

    if (published) {
      publishedEntries.push(published);
    }
  });

  return {
    candidates,
    publishedEntries,
  };
}
