import type { ManagedContentEntry } from '@/lib/content-store';
import { getKnowledgeSynthesisPublishThreshold } from '@/lib/env';

export interface KnowledgeDraftAssessment {
  score: number;
  candidate: boolean;
  recommendedStatus: 'draft' | 'published';
  reasons: string[];
}

type DraftLike = Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & {
  source?: string;
  meta?: Record<string, unknown>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readNumber(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readString(meta: Record<string, unknown> | undefined, key: string) {
  const value = meta?.[key];
  return typeof value === 'string' ? value : '';
}

export function assessKnowledgeDraftInput(
  input: DraftLike,
  params?: {
    publishThreshold?: number;
    autoPublish?: boolean;
  }
): KnowledgeDraftAssessment {
  const publishThreshold = params?.publishThreshold ?? getKnowledgeSynthesisPublishThreshold();
  const reasons: string[] = [];
  let score = 40;

  if ((input.sections || []).length >= 4) {
    score += 12;
    reasons.push('section-coverage');
  }
  if ((input.excerpt || '').length >= 60) {
    score += 8;
    reasons.push('excerpt-quality');
  }
  if ((input.seoTitle || '').length >= 18) {
    score += 5;
    reasons.push('seo-title');
  }
  if ((input.seoDescription || '').length >= 56) {
    score += 5;
    reasons.push('seo-description');
  }
  if ((input.tags || []).length >= 3) {
    score += 4;
    reasons.push('tag-density');
  }

  const conceptCount = readNumber(input.meta, 'conceptCount');
  const questionCount = readNumber(input.meta, 'questionCount');
  const bookCount = readNumber(input.meta, 'bookCount');
  const relatedTopicCount = readNumber(input.meta, 'relatedTopicCount');
  const clusterCount = readNumber(input.meta, 'clusterCount');
  const synthesisType = readString(input.meta, 'synthesisType');

  score += Math.min(12, conceptCount * 2);
  score += Math.min(10, questionCount * 1.5);
  score += Math.min(8, bookCount * 1.5);
  score += Math.min(6, relatedTopicCount * 2);
  score += Math.min(6, clusterCount * 2);

  if (synthesisType === 'topic-overview') {
    score += 8;
    reasons.push('topic-overview');
  }
  if (synthesisType === 'concept-glossary') {
    score += 7;
    reasons.push('concept-glossary');
  }
  if (synthesisType === 'question-map' || synthesisType === 'question-clusters') {
    score += 7;
    reasons.push('question-structure');
  }
  if (synthesisType === 'book-path' || synthesisType === 'book-ladder') {
    score += 7;
    reasons.push('book-structure');
  }

  if (conceptCount > 0) reasons.push('concept-support');
  if (questionCount > 0) reasons.push('question-support');
  if (bookCount > 0) reasons.push('book-support');
  if (relatedTopicCount > 0) reasons.push('cross-topic-bridge');
  if (clusterCount > 0) reasons.push('question-clusters');

  const normalizedScore = clamp(Math.round(score), 0, 100);
  const candidate = normalizedScore >= publishThreshold;

  return {
    score: normalizedScore,
    candidate,
    recommendedStatus: candidate && params?.autoPublish ? 'published' : 'draft',
    reasons,
  };
}

export function decorateKnowledgeDraftInput(
  input: DraftLike,
  params?: {
    publishThreshold?: number;
    autoPublish?: boolean;
  }
): DraftLike {
  const assessment = assessKnowledgeDraftInput(input, params);

  return {
    ...input,
    status: assessment.recommendedStatus,
    meta: {
      ...(input.meta || {}),
      qualityScore: assessment.score,
      publishCandidate: assessment.candidate,
      publishReasons: assessment.reasons,
    },
  };
}
