import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import { normalizeKnowledgeLabel } from '@/lib/knowledge-canonicalization';
import {
  knowledgeEntityOperations,
  knowledgeRelationOperations,
  type KnowledgeEntityRecord,
} from '@/lib/knowledge-base-store';
import {
  buildKnowledgeSynthesisSnapshot,
  type TopicSynthesisPack,
} from '@/lib/knowledge-synthesis';

export interface RelatedTopicEdge {
  sourceTopicId: string;
  targetTopicId: string;
  sharedConcepts: string[];
  confidenceScore: number;
}

export interface KnowledgeGraphEnrichmentResult {
  addedTopicConceptLinks: number;
  addedTopicTopicLinks: number;
  relatedTopicEdges: RelatedTopicEdge[];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function buildTopicSearchText(pack: TopicSynthesisPack) {
  return [
    pack.topic.name,
    pack.topic.summary || '',
    ...pack.questions.map((item) => item.name),
  ].join(' ').toLowerCase();
}

function listAllConcepts(database: Database.Database) {
  return knowledgeEntityOperations.list(database, {
    entityType: 'concept',
    limit: 1000,
  });
}

function getExistingConceptIds(pack: TopicSynthesisPack) {
  return new Set(pack.concepts.map((item) => item.id));
}

function addMissingTopicConceptLinks(
  packs: TopicSynthesisPack[],
  database: Database.Database
) {
  let added = 0;
  const allConcepts = listAllConcepts(database);

  packs.forEach((pack) => {
    const existingConceptIds = getExistingConceptIds(pack);
    const searchText = buildTopicSearchText(pack);

    allConcepts.forEach((concept) => {
      if (existingConceptIds.has(concept.id)) {
        return;
      }

      const label = normalizeKnowledgeLabel(concept.name);
      if (!label || label.length < 2) {
        return;
      }

      if (!searchText.includes(concept.name.toLowerCase()) && !searchText.includes(label)) {
        return;
      }

      const created = knowledgeRelationOperations.create(database, {
        subjectEntityId: pack.topic.id,
        relationType: 'includes',
        objectEntityId: concept.id,
        confidenceScore: 0.63,
        meta: {
          enrichedBy: 'knowledge-graph-enrichment',
          reason: 'topic-question-concept-match',
        },
      });

      if (created) {
        added += 1;
      }
    });
  });

  return added;
}

function buildRelatedTopicEdges(packs: TopicSynthesisPack[]): RelatedTopicEdge[] {
  const edges: RelatedTopicEdge[] = [];

  for (let i = 0; i < packs.length; i += 1) {
    for (let j = i + 1; j < packs.length; j += 1) {
      const left = packs[i];
      const right = packs[j];
      const leftConcepts = new Set(left.concepts.map((item) => normalizeKnowledgeLabel(item.name)));
      const rightConcepts = new Set(right.concepts.map((item) => normalizeKnowledgeLabel(item.name)));
      const sharedConcepts = uniqueStrings(
        [...leftConcepts].filter((item) => item && rightConcepts.has(item))
      );

      if (!sharedConcepts.length) {
        continue;
      }

      edges.push({
        sourceTopicId: left.topic.id,
        targetTopicId: right.topic.id,
        sharedConcepts,
        confidenceScore: Number(Math.min(0.92, 0.55 + sharedConcepts.length * 0.08).toFixed(2)),
      });
    }
  }

  return edges;
}

function persistRelatedTopicEdges(edges: RelatedTopicEdge[], database: Database.Database) {
  let added = 0;

  edges.forEach((edge) => {
    const existingIds = new Set(
      knowledgeRelationOperations.listForEntity(database, edge.sourceTopicId)
        .filter((item) => item.relationType === 'related_topic')
        .map((item) => item.subjectEntityId === edge.sourceTopicId ? item.objectEntityId : item.subjectEntityId)
    );
    const reverseExistingIds = new Set(
      knowledgeRelationOperations.listForEntity(database, edge.targetTopicId)
        .filter((item) => item.relationType === 'related_topic')
        .map((item) => item.subjectEntityId === edge.targetTopicId ? item.objectEntityId : item.subjectEntityId)
    );
    const forward = knowledgeRelationOperations.create(database, {
      subjectEntityId: edge.sourceTopicId,
      relationType: 'related_topic',
      objectEntityId: edge.targetTopicId,
      confidenceScore: edge.confidenceScore,
      meta: {
        enrichedBy: 'knowledge-graph-enrichment',
        sharedConcepts: edge.sharedConcepts,
      },
    });
    const reverse = knowledgeRelationOperations.create(database, {
      subjectEntityId: edge.targetTopicId,
      relationType: 'related_topic',
      objectEntityId: edge.sourceTopicId,
      confidenceScore: edge.confidenceScore,
      meta: {
        enrichedBy: 'knowledge-graph-enrichment',
        sharedConcepts: edge.sharedConcepts,
      },
    });

    if (forward && !existingIds.has(edge.targetTopicId)) added += 1;
    if (reverse && !reverseExistingIds.has(edge.sourceTopicId)) added += 1;
  });

  return added;
}

export function enrichKnowledgeGraph(
  params?: {
    topicLimit?: number;
  },
  database: Database.Database = db
): KnowledgeGraphEnrichmentResult {
  const initialSnapshot = buildKnowledgeSynthesisSnapshot({
    topicLimit: params?.topicLimit ?? 8,
  }, database);

  const addedTopicConceptLinks = addMissingTopicConceptLinks(initialSnapshot.topics, database);
  const refreshedSnapshot = buildKnowledgeSynthesisSnapshot({
    topicLimit: params?.topicLimit ?? 8,
  }, database);
  const relatedTopicEdges = buildRelatedTopicEdges(refreshedSnapshot.topics);
  const addedTopicTopicLinks = persistRelatedTopicEdges(relatedTopicEdges, database);

  return {
    addedTopicConceptLinks,
    addedTopicTopicLinks,
    relatedTopicEdges,
  };
}

export function listRelatedTopicsForTopic(
  topic: KnowledgeEntityRecord,
  database: Database.Database = db
) {
  const relations = knowledgeRelationOperations.listForEntity(database, topic.id)
    .filter((item) => item.relationType === 'related_topic');
  const topicIds = uniqueStrings(
    relations.map((item) => item.subjectEntityId === topic.id ? item.objectEntityId : item.subjectEntityId)
  );

  return topicIds
    .map((id) => {
      const entity = knowledgeEntityOperations.list(database, {
        entityType: 'topic',
        limit: 500,
      }).find((item) => item.id === id);
      const relation = relations.find((item) => item.objectEntityId === id || item.subjectEntityId === id);
      return entity ? {
        topic: entity,
        sharedConcepts: Array.isArray(relation?.meta?.sharedConcepts)
          ? (relation?.meta?.sharedConcepts as string[])
          : [],
      } : null;
    })
    .filter((item): item is { topic: KnowledgeEntityRecord; sharedConcepts: string[] } => !!item);
}
