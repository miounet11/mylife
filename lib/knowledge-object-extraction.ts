import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import {
  bibliographyOperations,
  knowledgeEntityOperations,
  knowledgeRelationOperations,
  type BibliographyEntryRecord,
  type KnowledgeEntityRecord,
  type SourceDocumentRecord,
} from '@/lib/knowledge-base-store';
import { KNOWLEDGE_TOPIC_SEEDS } from '@/lib/knowledge-taxonomy';

export interface KnowledgeExtractionResult {
  topics: KnowledgeEntityRecord[];
  questions: KnowledgeEntityRecord[];
  concepts: KnowledgeEntityRecord[];
  textEntities: KnowledgeEntityRecord[];
  books: BibliographyEntryRecord[];
  relationCount: number;
}

const QUESTION_PATTERNS = [
  /[?？]/,
  /(怎么|如何|为什么|为何|是否|能不能|该不该|怎么看|先看什么|是什么|区别|推荐|值得吗)/i,
  /\b(how|why|what|should|can|is it|which)\b/i,
];

const CONCEPT_KEYWORDS = [
  '阴阳',
  '五行',
  '天干',
  '地支',
  '十神',
  '格局',
  '调候',
  '用神',
  '喜用神',
  '真太阳时',
  '节气',
  '流年',
  '大运',
  '命理',
  '八字',
  '易经',
  '周易',
  '卦象',
  '风水',
  '心理学',
  '情绪',
  '压力',
  '焦虑',
  '关系',
  '人格',
  '哲学',
  '认识论',
  '方法论',
  '形而上学',
  '历史',
  '思想史',
  '时间线',
  'AI',
  'Agent',
  'RAG',
  'LLM',
  '统计学',
  '概率',
  '回归',
  '置信度',
  '编程',
  '软件工程',
  '自动化',
  '占星',
  '星座',
  '健康',
  '睡眠',
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function buildSearchText(source: SourceDocumentRecord) {
  return [
    source.title,
    source.summary || '',
    ...(source.tags || []),
  ].join(' ');
}

function isQuestionLike(value: string) {
  return QUESTION_PATTERNS.some((pattern) => pattern.test(value));
}

function extractQuotedBookTitles(text: string) {
  const chinese = [...text.matchAll(/《([^》]{2,60})》/g)].map((match) => `${match[1] || ''}`.trim());
  const english = [...text.matchAll(/"([^"\n]{3,80})"/g)].map((match) => `${match[1] || ''}`.trim());
  return uniqueStrings([...chinese, ...english]).filter((item) => !/[?？]/.test(item));
}

function matchTopicSeeds(searchText: string) {
  const normalized = normalizeText(searchText);
  return KNOWLEDGE_TOPIC_SEEDS.filter((seed) =>
    seed.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))
  );
}

function matchConceptKeywords(searchText: string) {
  const normalized = normalizeText(searchText);
  return uniqueStrings(
    CONCEPT_KEYWORDS.filter((keyword) => normalized.includes(normalizeText(keyword)))
  );
}

function createTopicEntities(source: SourceDocumentRecord, database: Database.Database) {
  return matchTopicSeeds(buildSearchText(source))
    .map((seed) => knowledgeEntityOperations.upsert(database, {
      entityType: 'topic',
      name: seed.title,
      slug: `topic-${seed.key}`,
      summary: seed.description,
      description: `由来源文档自动归类到“${seed.title}”主题。`,
      tags: uniqueStrings(['topic', seed.key, ...seed.keywords]),
      meta: {
        topicKey: seed.key,
        extractedFromSourceId: source.id,
      },
    }))
    .filter((item): item is KnowledgeEntityRecord => !!item);
}

function createConceptEntities(source: SourceDocumentRecord, database: Database.Database) {
  return matchConceptKeywords(buildSearchText(source))
    .map((keyword) => knowledgeEntityOperations.upsert(database, {
      entityType: 'concept',
      name: keyword,
      slug: `concept-${normalizeText(keyword).replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')}`,
      summary: `${keyword} 是从自动采集来源中抽取出的高频概念。`,
      description: `该概念由来源标题、摘要和标签匹配得到，用于支撑后续的知识链归一与关系图谱。`,
      tags: uniqueStrings(['concept', ...source.tags, source.platform].slice(0, 12)),
      meta: {
        extractedFromSourceId: source.id,
        platform: source.platform,
      },
    }))
    .filter((item): item is KnowledgeEntityRecord => !!item);
}

function createQuestionEntity(source: SourceDocumentRecord, database: Database.Database) {
  if (!isQuestionLike(source.title)) {
    return null;
  }

  return knowledgeEntityOperations.upsert(database, {
    entityType: 'question',
    name: source.title,
    slug: `question-${normalizeText(source.title).replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)}`,
    summary: source.summary || `${source.title} 是自动抽取的高频问题。`,
    description: `该问题来源于 ${source.platform}，用于构建问题地图和用户表达层。`,
    tags: uniqueStrings(['question', source.platform, ...(source.tags || [])]),
    meta: {
      extractedFromSourceId: source.id,
      canonicalUrl: source.canonicalUrl,
    },
  });
}

function createBookObjects(source: SourceDocumentRecord, database: Database.Database) {
  const titles = extractQuotedBookTitles(buildSearchText(source));

  return titles.map((title) => {
    const book = bibliographyOperations.upsert(database, {
      title,
      slug: `book-${normalizeText(title).replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)}`,
      rightsStatus: source.rightsStatus,
      sourceUrl: source.canonicalUrl,
      summary: `从来源文档《${source.title}》中识别出的书籍线索。`,
      tags: uniqueStrings(['auto_extracted', source.platform, ...(source.tags || [])]),
      meta: {
        extractedFromSourceId: source.id,
      },
    });

    const textEntity = knowledgeEntityOperations.upsert(database, {
      entityType: 'text',
      name: title,
      slug: `text-${normalizeText(title).replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)}`,
      summary: `书籍《${title}》的文本对象，用于连接概念和主题关系。`,
      description: `该文本对象由自动抽取层生成，可与概念、主题和问题建立关系。`,
      tags: uniqueStrings(['book', 'text', source.platform, ...(source.tags || [])]),
      meta: {
        bibliographySlug: book?.slug || null,
        extractedFromSourceId: source.id,
      },
    });

    return {
      book,
      textEntity,
    };
  }).filter((item): item is { book: BibliographyEntryRecord; textEntity: KnowledgeEntityRecord } => !!item.book && !!item.textEntity);
}

function createRelationsForSource(
  source: SourceDocumentRecord,
  params: {
    topics: KnowledgeEntityRecord[];
    concepts: KnowledgeEntityRecord[];
    question: KnowledgeEntityRecord | null;
    textEntities: KnowledgeEntityRecord[];
  },
  database: Database.Database
) {
  let count = 0;

  params.topics.forEach((topic) => {
    params.concepts.forEach((concept) => {
      if (knowledgeRelationOperations.create(database, {
        subjectEntityId: topic.id,
        relationType: 'includes',
        objectEntityId: concept.id,
        evidenceSourceId: source.id,
        confidenceScore: 0.76,
        meta: { extractedBy: 'knowledge-object-extraction' },
      })) {
        count += 1;
      }
    });
  });

  if (params.question) {
    params.topics.forEach((topic) => {
      if (knowledgeRelationOperations.create(database, {
        subjectEntityId: params.question!.id,
        relationType: 'belongs_to_topic',
        objectEntityId: topic.id,
        evidenceSourceId: source.id,
        confidenceScore: 0.82,
        meta: { extractedBy: 'knowledge-object-extraction' },
      })) {
        count += 1;
      }
    });

    params.concepts.forEach((concept) => {
      if (knowledgeRelationOperations.create(database, {
        subjectEntityId: params.question!.id,
        relationType: 'mentions_concept',
        objectEntityId: concept.id,
        evidenceSourceId: source.id,
        confidenceScore: 0.78,
        meta: { extractedBy: 'knowledge-object-extraction' },
      })) {
        count += 1;
      }
    });
  }

  params.textEntities.forEach((textEntity) => {
    params.concepts.forEach((concept) => {
      if (knowledgeRelationOperations.create(database, {
        subjectEntityId: textEntity.id,
        relationType: 'discusses',
        objectEntityId: concept.id,
        evidenceSourceId: source.id,
        confidenceScore: 0.74,
        meta: { extractedBy: 'knowledge-object-extraction' },
      })) {
        count += 1;
      }
    });
  });

  return count;
}

export function extractKnowledgeObjectsFromSourceDocuments(
  sources: SourceDocumentRecord[],
  database: Database.Database = db
): KnowledgeExtractionResult {
  const topics: KnowledgeEntityRecord[] = [];
  const questions: KnowledgeEntityRecord[] = [];
  const concepts: KnowledgeEntityRecord[] = [];
  const textEntities: KnowledgeEntityRecord[] = [];
  const books: BibliographyEntryRecord[] = [];
  let relationCount = 0;

  sources.forEach((source) => {
    const topicEntities = createTopicEntities(source, database);
    const conceptEntities = createConceptEntities(source, database);
    const questionEntity = createQuestionEntity(source, database);
    const bookObjects = createBookObjects(source, database);

    topics.push(...topicEntities);
    concepts.push(...conceptEntities);
    if (questionEntity) {
      questions.push(questionEntity);
    }
    books.push(...bookObjects.map((item) => item.book));
    textEntities.push(...bookObjects.map((item) => item.textEntity));

    relationCount += createRelationsForSource(source, {
      topics: topicEntities,
      concepts: conceptEntities,
      question: questionEntity,
      textEntities: bookObjects.map((item) => item.textEntity),
    }, database);
  });

  return {
    topics,
    questions,
    concepts,
    textEntities,
    books,
    relationCount,
  };
}
