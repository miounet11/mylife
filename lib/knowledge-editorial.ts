import type { KnowledgeTopicHub, KnowledgeNetworkEntry } from '@/lib/knowledge-network-feed';
import {
  isPublicKnowledgeEntry,
  listPublishedManagedContentEntriesByType,
  type ManagedContentEntry,
} from '@/lib/content-store';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';

export interface KnowledgeEditorialCandidate {
  entry: ManagedContentEntry;
  topicEntityId: string | null;
  topicName: string | null;
  synthesisType: string | null;
  qualityScore: number;
  editorialScore: number;
  homepageEligible: boolean;
  editorialTier: 'flagship' | 'strong' | 'supporting';
}

function readString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSynthesisWeight(synthesisType: string | null) {
  switch (synthesisType) {
    case 'topic-overview':
      return 15;
    case 'concept-glossary':
      return 12;
    case 'book-path':
      return 11;
    case 'book-ladder':
      return 9;
    case 'question-clusters':
      return 8;
    case 'question-map':
      return 7;
    default:
      return 3;
  }
}

function getEditorialTier(score: number): KnowledgeEditorialCandidate['editorialTier'] {
  if (score >= 92) return 'flagship';
  if (score >= 82) return 'strong';
  return 'supporting';
}

export function toKnowledgeEditorialCandidate(entry: ManagedContentEntry): KnowledgeEditorialCandidate {
  const qualityScore = readNumber(entry.meta, 'qualityScore');
  const topicEntityId = readString(entry.meta, 'topicEntityId') || null;
  const topicName = readString(entry.meta, 'topicName') || null;
  const synthesisType = readString(entry.meta, 'synthesisType') || null;
  const conceptCount = readNumber(entry.meta, 'conceptCount');
  const questionCount = readNumber(entry.meta, 'questionCount');
  const bookCount = readNumber(entry.meta, 'bookCount');
  const relatedTopicCount = readNumber(entry.meta, 'relatedTopicCount');
  const clusterCount = readNumber(entry.meta, 'clusterCount');

  let editorialScore = qualityScore;
  editorialScore += getSynthesisWeight(synthesisType);
  editorialScore += Math.min(8, conceptCount * 0.8);
  editorialScore += Math.min(6, questionCount * 0.6);
  editorialScore += Math.min(6, bookCount * 0.9);
  editorialScore += Math.min(4, relatedTopicCount * 1.2);
  editorialScore += Math.min(3, clusterCount * 1.2);
  if (entry.featured) editorialScore += 3;
  if (entry.source.startsWith('knowledge-synthesis:')) editorialScore += 2;
  if ((entry.tags || []).length >= 4) editorialScore += 1.5;

  const normalizedScore = Number(clamp(Number(editorialScore.toFixed(2)), 0, 120));
  const editorialTier = getEditorialTier(normalizedScore);
  const homepageEligible = (
    normalizedScore >= 88
    || synthesisType === 'topic-overview'
    || synthesisType === 'concept-glossary'
  );

  return {
    entry,
    topicEntityId,
    topicName,
    synthesisType,
    qualityScore,
    editorialScore: normalizedScore,
    homepageEligible,
    editorialTier,
  };
}

function sortEditorialCandidates(items: KnowledgeEditorialCandidate[]) {
  return items
    .slice()
    .sort((left, right) => (
      right.editorialScore - left.editorialScore
      || Number(right.entry.featured) - Number(left.entry.featured)
      || right.entry.updatedAt.localeCompare(left.entry.updatedAt)
    ));
}

function buildTopicKey(item: KnowledgeEditorialCandidate) {
  if (item.topicEntityId) {
    return `topic:${item.topicEntityId}`;
  }

  if (item.topicName) {
    return `topic-name:${item.topicName.toLowerCase()}`;
  }

  return `slug:${item.entry.slug}`;
}

export function selectKnowledgePublicationBatch(
  entries: ManagedContentEntry[],
  params?: {
    limit?: number;
    maxPerTopic?: number;
  }
) {
  const limit = params?.limit ?? 4;
  const maxPerTopic = params?.maxPerTopic ?? 2;
  const ranked = sortEditorialCandidates(entries.map(toKnowledgeEditorialCandidate));
  const selected: KnowledgeEditorialCandidate[] = [];
  const topicCounts = new Map<string, number>();

  [1, maxPerTopic].forEach((passMax) => {
    ranked.forEach((item) => {
      if (selected.length >= limit) {
        return;
      }

      if (selected.some((candidate) => candidate.entry.id === item.entry.id)) {
        return;
      }

      const topicKey = buildTopicKey(item);
      const current = topicCounts.get(topicKey) || 0;
      if (current >= passMax) {
        return;
      }

      selected.push(item);
      topicCounts.set(topicKey, current + 1);
    });
  });

  return selected.slice(0, Math.max(1, limit));
}

export function listFeaturedKnowledgeEditorialEntries(limit = 3) {
  return sortEditorialCandidates(
    listPublishedManagedContentEntriesByType('knowledge')
      .filter((entry) => isPublicKnowledgeEntry(entry))
      .map(toKnowledgeEditorialCandidate)
      .filter((item) => item.homepageEligible)
  ).slice(0, Math.max(1, limit));
}

function rankTopicHub(hub: KnowledgeTopicHub) {
  const lead = toKnowledgeEditorialCandidate(hub.leadEntry.entry);
  return {
    hub,
    score: Number((
      lead.editorialScore
      + hub.entryCount * 5
      + hub.relatedTopicNames.length * 2
      + hub.entries.filter((item: KnowledgeNetworkEntry) => item.synthesisType === 'topic-overview').length * 4
    ).toFixed(2)),
  };
}

export function listFeaturedKnowledgeTopicHubs(limit = 3) {
  return listKnowledgeTopicHubs({ limit: 24 })
    .map(rankTopicHub)
    .sort((left, right) => right.score - left.score || right.hub.entryCount - left.hub.entryCount)
    .slice(0, Math.max(1, limit))
    .map((item) => item.hub);
}
