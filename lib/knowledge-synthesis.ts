import type Database from 'better-sqlite3';
import { db } from '@/lib/database';
import { sanitizeContentSlug } from '@/lib/content-generation';
import { saveManagedContentEntry, type ManagedContentEntry } from '@/lib/content-store';
import {
  dedupeBibliographyEntries,
  dedupeKnowledgeEntities,
} from '@/lib/knowledge-canonicalization';
import { decorateKnowledgeDraftInput } from '@/lib/knowledge-publishing';
import {
  bibliographyOperations,
  knowledgeEntityOperations,
  knowledgeRelationOperations,
  type BibliographyEntryRecord,
  type KnowledgeEntityRecord,
} from '@/lib/knowledge-base-store';

export interface TopicSynthesisPack {
  topic: KnowledgeEntityRecord;
  questions: KnowledgeEntityRecord[];
  concepts: KnowledgeEntityRecord[];
  books: BibliographyEntryRecord[];
  relatedTexts: KnowledgeEntityRecord[];
  relatedTopics: Array<{
    topic: KnowledgeEntityRecord;
    sharedConcepts: string[];
  }>;
}

export interface KnowledgeSynthesisSnapshot {
  topics: TopicSynthesisPack[];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean))];
}

function sortByFreshness<T extends { updatedAt?: string; createdAt?: string }>(items: T[]) {
  return items
    .slice()
    .sort((left, right) => (
      new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime()
    ));
}

function getRelatedEntitiesByRelation(
  topic: KnowledgeEntityRecord,
  relationType: string,
  database: Database.Database
) {
  const relations = knowledgeRelationOperations.listForEntity(database, topic.id);
  return relations
    .filter((relation) => relation.relationType === relationType)
    .map((relation) => relation.subjectEntityId === topic.id ? relation.objectEntityId : relation.subjectEntityId);
}

function getRelatedTopics(topic: KnowledgeEntityRecord, database: Database.Database) {
  const relations = knowledgeRelationOperations.listForEntity(database, topic.id)
    .filter((relation) => relation.relationType === 'related_topic');
  const allTopics = knowledgeEntityOperations.list(database, { entityType: 'topic', limit: 300 });

  return uniqueStrings(
    relations.map((relation) => relation.subjectEntityId === topic.id ? relation.objectEntityId : relation.subjectEntityId)
  ).map((topicId) => {
    const entity = allTopics.find((item) => item.id === topicId);
    const relation = relations.find((item) => item.objectEntityId === topicId || item.subjectEntityId === topicId);
    return entity ? {
      topic: entity,
      sharedConcepts: Array.isArray(relation?.meta?.sharedConcepts)
        ? (relation?.meta?.sharedConcepts as string[])
        : [],
    } : null;
  }).filter((item): item is { topic: KnowledgeEntityRecord; sharedConcepts: string[] } => !!item);
}

function findBooksForConcepts(
  concepts: KnowledgeEntityRecord[],
  database: Database.Database
) {
  const conceptIds = new Set(concepts.map((item) => item.id));
  const texts = knowledgeEntityOperations.list(database, { entityType: 'text', limit: 500 });

  const matchedTexts = texts.filter((text) => {
    const relations = knowledgeRelationOperations.listForEntity(database, text.id);
    return relations.some((relation) => relation.relationType === 'discusses' && conceptIds.has(relation.objectEntityId));
  });

  const books = bibliographyOperations.list(database, { limit: 500 }).filter((book) =>
    matchedTexts.some((text) => text.meta?.bibliographySlug === book.slug)
  );

  return {
    books: dedupeBibliographyEntries(books),
    texts: dedupeKnowledgeEntities(matchedTexts),
  };
}

function buildSynthesisSlug(pack: TopicSynthesisPack, suffix: string) {
  const topicKey = `${pack.topic.meta?.topicKey || ''}`.trim();
  const base = topicKey || pack.topic.slug || sanitizeContentSlug(pack.topic.name, 'topic');
  return `${base}-${suffix}`;
}

function buildTopicMeta(pack: TopicSynthesisPack) {
  return {
    topicEntityId: pack.topic.id,
    topicName: pack.topic.name,
    relatedTopicNames: pack.relatedTopics.map((item) => item.topic.name),
  };
}

export function buildKnowledgeSynthesisSnapshot(
  params?: {
    topicLimit?: number;
  },
  database: Database.Database = db
): KnowledgeSynthesisSnapshot {
  const topicLimit = params?.topicLimit ?? 6;
  const topics = sortByFreshness(
    knowledgeEntityOperations.list(database, { entityType: 'topic', limit: 100 })
  ).slice(0, topicLimit);

  return {
    topics: topics.map((topic) => {
      const questionIds = new Set(getRelatedEntitiesByRelation(topic, 'belongs_to_topic', database));
      const conceptIds = new Set(getRelatedEntitiesByRelation(topic, 'includes', database));
      const questions = sortByFreshness(
        knowledgeEntityOperations.list(database, { entityType: 'question', limit: 300 })
          .filter((item) => questionIds.has(item.id))
      );
      const concepts = sortByFreshness(
        knowledgeEntityOperations.list(database, { entityType: 'concept', limit: 400 })
          .filter((item) => conceptIds.has(item.id))
      );
      const related = findBooksForConcepts(concepts, database);

      return {
        topic,
        questions: dedupeKnowledgeEntities(questions),
        concepts: dedupeKnowledgeEntities(concepts),
        books: related.books,
        relatedTexts: related.texts,
        relatedTopics: getRelatedTopics(topic, database),
      };
    }),
  };
}

function buildQuestionMapDraft(pack: TopicSynthesisPack): Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & { source?: string } {
  const slug = buildSynthesisSlug(pack, 'question-map');
  const questionTitles = pack.questions.slice(0, 6).map((item) => item.name);
  const conceptNames = pack.concepts.slice(0, 6).map((item) => item.name);
  const relatedTopicNames = pack.relatedTopics.slice(0, 3).map((item) => item.topic.name);

  return {
    id: `content_synth_question_map_${slug}`,
    contentType: 'knowledge',
    subtype: null,
    slug,
    title: `${pack.topic.name}问题地图`,
    name: null,
    excerpt: `围绕“${pack.topic.name}”自动整理高频问题、核心概念和后续阅读路径，作为知识库持续扩张的中间产物。`,
    category: '自动问题地图',
    readTime: '6 分钟',
    tags: uniqueStrings([pack.topic.name, '问题地图', ...conceptNames.slice(0, 4)]),
    featured: false,
    seoTitle: `${pack.topic.name}问题地图：高频问题与核心概念整理`,
    seoDescription: `自动整理“${pack.topic.name}”相关的高频问题、核心概念和阅读线索，帮助知识库持续构建结构化问题层。`,
    sections: [
      {
        title: '主题概览',
        paragraphs: [
          pack.topic.summary || `“${pack.topic.name}”是当前知识引擎自动归并出的核心主题之一。`,
          `当前已经聚合 ${pack.questions.length} 个问题、${pack.concepts.length} 个概念，适合继续向专题页扩展。`,
        ],
      },
      {
        title: '高频问题',
        paragraphs: questionTitles.length
          ? questionTitles.map((item, index) => `${index + 1}. ${item}`)
          : ['当前还没有足够的问题表达，下一步应优先补足社区与问答平台信号。'],
      },
      {
        title: '核心概念',
        paragraphs: conceptNames.length
          ? conceptNames.map((item, index) => `${index + 1}. ${item}`)
          : ['当前还没有足够的概念沉淀，下一步应优先补足经典和术语源。'],
      },
      {
        title: '下一步扩张建议',
        paragraphs: [
          '优先把高频问题改写成用户可读的综述页，同时保留问题原始表达的检索价值。',
          '围绕已出现的核心概念继续补书目、出处和案例，逐步把问题层、概念层和书目层打通。',
          ...(relatedTopicNames.length
            ? [`当前还可与 ${relatedTopicNames.join('、')} 建立跨专题桥接，减少知识孤岛。`]
            : []),
        ],
      },
    ],
    status: 'draft',
    source: 'knowledge-synthesis:question-map',
    meta: {
      synthesisType: 'question-map',
      ...buildTopicMeta(pack),
      questionCount: pack.questions.length,
      conceptCount: pack.concepts.length,
    },
  };
}

function buildConceptGlossaryDraft(pack: TopicSynthesisPack): Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & { source?: string } {
  const slug = buildSynthesisSlug(pack, 'concept-glossary');
  const concepts = pack.concepts.slice(0, 10);

  return {
    id: `content_synth_concept_glossary_${slug}`,
    contentType: 'knowledge',
    subtype: null,
    slug,
    title: `${pack.topic.name}概念词汇表`,
    name: null,
    excerpt: `围绕“${pack.topic.name}”自动整理的概念词汇表，用于把术语层和专题层真正接起来。`,
    category: '自动概念词汇表',
    readTime: '7 分钟',
    tags: uniqueStrings([pack.topic.name, '概念词汇表', ...concepts.slice(0, 4).map((item) => item.name)]),
    featured: false,
    seoTitle: `${pack.topic.name}概念词汇表：核心术语与解释线索`,
    seoDescription: `自动整理“${pack.topic.name}”相关的核心术语、概念线索和相邻专题，作为知识引擎的概念层入口。`,
    sections: [
      {
        title: '词汇表定位',
        paragraphs: [
          `“${pack.topic.name}”当前已沉淀 ${pack.concepts.length} 个可复用概念，这一页用于给后续解释页和专题页提供统一术语入口。`,
          '概念词汇表不是最终解释页，而是用于压缩歧义、统一表达、支撑跨专题桥接的中间层。',
        ],
      },
      {
        title: '核心概念清单',
        paragraphs: concepts.length
          ? concepts.map((item, index) => `${index + 1}. ${item.name}${item.summary ? `：${item.summary}` : ''}`)
          : ['当前概念仍然不足，应继续从经典、术语库和高权威来源中补概念。'],
      },
      {
        title: '相关专题线索',
        paragraphs: pack.relatedTopics.length
          ? pack.relatedTopics.slice(0, 4).map((item, index) => `${index + 1}. ${item.topic.name}${item.sharedConcepts.length ? `，共享概念：${item.sharedConcepts.join('、')}` : ''}`)
          : ['当前尚未形成稳定的相邻专题桥接，后续应继续补共享概念。'],
      },
      {
        title: '下一步构建建议',
        paragraphs: [
          '优先把高频概念扩成真正的 glossary 页面，再逐步补出处、版本差异和常见误解。',
          '对跨专题重复出现的概念，应优先做统一解释，而不是让多个页面各写各的。',
        ],
      },
    ],
    status: 'draft',
    source: 'knowledge-synthesis:concept-glossary',
    meta: {
      synthesisType: 'concept-glossary',
      ...buildTopicMeta(pack),
      conceptCount: pack.concepts.length,
      relatedTopicCount: pack.relatedTopics.length,
    },
  };
}

function buildQuestionClusterSummaryDraft(pack: TopicSynthesisPack): Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & { source?: string } {
  const slug = buildSynthesisSlug(pack, 'question-clusters');
  const concepts = pack.concepts.slice(0, 5);
  const questionClusters = concepts.map((concept) => ({
    concept,
    questions: pack.questions
      .filter((question) => (`${question.name} ${question.summary || ''}`).includes(concept.name))
      .slice(0, 3),
  })).filter((item) => item.questions.length > 0);

  return {
    id: `content_synth_question_clusters_${slug}`,
    contentType: 'knowledge',
    subtype: null,
    slug,
    title: `${pack.topic.name}问题簇综述`,
    name: null,
    excerpt: `围绕“${pack.topic.name}”自动整理的问题簇综述，用于把零散问题归并成更稳定的用户需求结构。`,
    category: '自动问题簇综述',
    readTime: '7 分钟',
    tags: uniqueStrings([pack.topic.name, '问题簇', ...concepts.slice(0, 3).map((item) => item.name)]),
    featured: false,
    seoTitle: `${pack.topic.name}问题簇综述：高频问题如何归并`,
    seoDescription: `自动归并“${pack.topic.name}”相关的高频问题簇，帮助知识引擎把零散问答整理成更稳定的需求结构。`,
    sections: [
      {
        title: '问题簇定位',
        paragraphs: [
          `当前“${pack.topic.name}”已识别 ${pack.questions.length} 个问题表达，这一页用于把问题从单点提问提升为结构化问题簇。`,
          '问题簇层的价值，不在于重复罗列问题，而在于帮助产品识别哪些疑问其实属于同一类判断障碍。',
        ],
      },
      {
        title: '高频问题簇',
        paragraphs: questionClusters.length
          ? questionClusters.flatMap((cluster, index) => [
              `${index + 1}. ${cluster.concept.name}`,
              ...cluster.questions.map((question) => `- ${question.name}`),
            ])
          : pack.questions.slice(0, 6).map((item, index) => `${index + 1}. ${item.name}`),
      },
      {
        title: '适合优先扩成专题的问题',
        paragraphs: [
          '优先选择同时出现于多个来源、且与核心概念直接相连的问题，扩成综述页和案例页。',
          '对表面不同、实则同构的问题，优先做归并，不要让内容系统被相似标题淹没。',
        ],
      },
      {
        title: '下一步动作',
        paragraphs: [
          '把问题簇转成更细的 question summary 页面，再和概念页、书单页做互链。',
          '持续用社区信号验证这些问题簇是否还在增长，从而决定是否升级成正式专题。',
        ],
      },
    ],
    status: 'draft',
    source: 'knowledge-synthesis:question-clusters',
    meta: {
      synthesisType: 'question-clusters',
      ...buildTopicMeta(pack),
      questionCount: pack.questions.length,
      clusterCount: questionClusters.length,
    },
  };
}

function buildBookPathDraft(pack: TopicSynthesisPack): Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & { source?: string } {
  const slug = buildSynthesisSlug(pack, 'book-path');
  const bookTitles = pack.books.slice(0, 6).map((item) => item.title);
  const conceptNames = pack.concepts.slice(0, 5).map((item) => item.name);
  const relatedTopicNames = pack.relatedTopics.slice(0, 3).map((item) => item.topic.name);

  return {
    id: `content_synth_book_path_${slug}`,
    contentType: 'knowledge',
    subtype: null,
    slug,
    title: `${pack.topic.name}书单路径`,
    name: null,
    excerpt: `围绕“${pack.topic.name}”自动生成的书单路径，优先帮助资料引擎建立经典、导论和概念之间的连接。`,
    category: '自动书单路径',
    readTime: '6 分钟',
    tags: uniqueStrings([pack.topic.name, '书单路径', ...bookTitles.slice(0, 3)]),
    featured: false,
    seoTitle: `${pack.topic.name}书单路径：自动整理经典与入门阅读线索`,
    seoDescription: `自动整理“${pack.topic.name}”相关的书单、概念和阅读路径，帮助知识库逐步构建书目层与解释层。`,
    sections: [
      {
        title: '阅读目标',
        paragraphs: [
          pack.topic.summary || `“${pack.topic.name}”适合优先建立书目骨架和概念入口。`,
          `当前已匹配 ${pack.books.length} 本书、${pack.concepts.length} 个相关概念，可继续补作者、版本与出处。`,
        ],
      },
      {
        title: '优先阅读线索',
        paragraphs: bookTitles.length
          ? bookTitles.map((item, index) => `${index + 1}. ${item}`)
          : ['当前尚未抽到足够书目，下一步应优先补齐目录型和书目型来源。'],
      },
      {
        title: '先理解哪些概念',
        paragraphs: conceptNames.length
          ? conceptNames.map((item, index) => `${index + 1}. ${item}`)
          : ['当前概念层仍薄，先补术语和概念释义，再扩书目推荐。'],
      },
      {
        title: '资料引擎下一步',
        paragraphs: [
          '把已识别书目继续分成原典、导论、注本和研究型资料，逐步形成更可用的学习路径。',
          '围绕书目继续抽作者、流派、版本和核心概念，形成可追溯的书目图谱。',
          ...(relatedTopicNames.length
            ? [`当前书目路径还可联动 ${relatedTopicNames.join('、')} 这些相邻专题。`]
            : []),
        ],
      },
    ],
    status: 'draft',
    source: 'knowledge-synthesis:book-path',
    meta: {
      synthesisType: 'book-path',
      ...buildTopicMeta(pack),
      bookCount: pack.books.length,
      conceptCount: pack.concepts.length,
    },
  };
}

function buildBookLadderDraft(pack: TopicSynthesisPack): Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & { source?: string } {
  const slug = buildSynthesisSlug(pack, 'book-ladder');
  const books = pack.books.slice(0, 9);
  const foundation = books.slice(0, 3);
  const intermediate = books.slice(3, 6);
  const advanced = books.slice(6, 9);

  return {
    id: `content_synth_book_ladder_${slug}`,
    contentType: 'knowledge',
    subtype: null,
    slug,
    title: `${pack.topic.name}书目阶梯`,
    name: null,
    excerpt: `围绕“${pack.topic.name}”自动整理的书目阶梯，用于把书单从平铺推荐升级成分层阅读路径。`,
    category: '自动书目阶梯',
    readTime: '7 分钟',
    tags: uniqueStrings([pack.topic.name, '书目阶梯', ...books.slice(0, 3).map((item) => item.title)]),
    featured: false,
    seoTitle: `${pack.topic.name}书目阶梯：从入门到深入的阅读路径`,
    seoDescription: `自动整理“${pack.topic.name}”相关书目，按阶梯方式组织阅读路径，帮助知识引擎形成更稳定的书目层。`,
    sections: [
      {
        title: '为什么要做书目阶梯',
        paragraphs: [
          '平铺书单很容易失去顺序感，书目阶梯的作用是把资料按理解门槛和用途分层。',
          `当前“${pack.topic.name}”已识别 ${pack.books.length} 本书，适合先构出基础阶梯，再逐步补作者和版本。`,
        ],
      },
      {
        title: '第一阶梯：建立骨架',
        paragraphs: foundation.length
          ? foundation.map((item, index) => `${index + 1}. ${item.title}`)
          : ['当前基础层书目不足，应优先补目录源和导论型来源。'],
      },
      {
        title: '第二阶梯：扩展理解',
        paragraphs: intermediate.length
          ? intermediate.map((item, index) => `${index + 1}. ${item.title}`)
          : ['当前中阶层书目不足，应继续补注本、综述和研究型资料。'],
      },
      {
        title: '第三阶梯：深入研究',
        paragraphs: advanced.length
          ? advanced.map((item, index) => `${index + 1}. ${item.title}`)
          : ['当前高阶层书目不足，后续可继续补经典版本、注释本和研究本。'],
      },
    ],
    status: 'draft',
    source: 'knowledge-synthesis:book-ladder',
    meta: {
      synthesisType: 'book-ladder',
      ...buildTopicMeta(pack),
      bookCount: pack.books.length,
    },
  };
}

function buildTopicOverviewDraft(pack: TopicSynthesisPack): Omit<ManagedContentEntry, 'createdAt' | 'updatedAt' | 'source'> & { source?: string } {
  const slug = buildSynthesisSlug(pack, 'topic-overview');
  const conceptNames = pack.concepts.slice(0, 6).map((item) => item.name);
  const questionNames = pack.questions.slice(0, 4).map((item) => item.name);
  const bookNames = pack.books.slice(0, 4).map((item) => item.title);
  const relatedTopicNames = pack.relatedTopics.slice(0, 4).map((item) => item.topic.name);

  return {
    id: `content_synth_topic_overview_${slug}`,
    contentType: 'knowledge',
    subtype: null,
    slug,
    title: `${pack.topic.name}专题总览`,
    name: null,
    excerpt: `围绕“${pack.topic.name}”自动整理概念、问题与书目骨架，作为后续专题页和知识链扩张的总入口。`,
    category: '自动专题总览',
    readTime: '7 分钟',
    tags: uniqueStrings([pack.topic.name, '专题总览', ...conceptNames.slice(0, 3)]),
    featured: false,
    seoTitle: `${pack.topic.name}专题总览：概念、问题与书目骨架`,
    seoDescription: `自动生成“${pack.topic.name}”的专题总览，汇总核心概念、高频问题和书目线索，作为知识引擎持续扩张的主入口。`,
    sections: [
      {
        title: '专题定位',
        paragraphs: [
          pack.topic.summary || `“${pack.topic.name}”是当前知识引擎自动归并的高优先级主题。`,
          `目前已聚合 ${pack.concepts.length} 个概念、${pack.questions.length} 个问题、${pack.books.length} 本相关书目。`,
        ],
      },
      {
        title: '先看这些概念',
        paragraphs: conceptNames.length
          ? conceptNames.map((item, index) => `${index + 1}. ${item}`)
          : ['当前概念层尚薄，应继续从经典和高权威资料中抽术语和定义。'],
      },
      {
        title: '用户最关心的问题',
        paragraphs: questionNames.length
          ? questionNames.map((item, index) => `${index + 1}. ${item}`)
          : ['当前问题表达仍不足，应继续补社区源与问答源。'],
      },
      {
        title: '继续延伸的阅读线索',
        paragraphs: bookNames.length
          ? bookNames.map((item, index) => `${index + 1}. ${item}`)
          : ['当前书目层仍不足，应继续补目录源、馆藏源和版本源。'],
      },
      {
        title: '可桥接的相邻专题',
        paragraphs: relatedTopicNames.length
          ? relatedTopicNames.map((item, index) => `${index + 1}. ${item}`)
          : ['当前尚未形成足够的跨专题桥接，后续应继续补共享概念和共享问题。'],
      },
    ],
    status: 'draft',
    source: 'knowledge-synthesis:topic-overview',
    meta: {
      synthesisType: 'topic-overview',
      ...buildTopicMeta(pack),
      conceptCount: pack.concepts.length,
      questionCount: pack.questions.length,
      bookCount: pack.books.length,
    },
  };
}

export function generateKnowledgeSynthesisDrafts(
  params?: {
    topicLimit?: number;
    userId?: string;
    autoPublish?: boolean;
  }
) {
  const userId = params?.userId || 'system_knowledge';
  const autoPublish = params?.autoPublish ?? process.env.KNOWLEDGE_SYNTHESIS_AUTO_PUBLISH === '1';
  const snapshot = buildKnowledgeSynthesisSnapshot({ topicLimit: params?.topicLimit ?? 4 });
  const drafts: ManagedContentEntry[] = [];

  snapshot.topics.forEach((pack) => {
    const draftInputs = [
      buildTopicOverviewDraft(pack),
      buildConceptGlossaryDraft(pack),
      buildQuestionMapDraft(pack),
      buildQuestionClusterSummaryDraft(pack),
      buildBookPathDraft(pack),
      buildBookLadderDraft(pack),
    ].map((input) => decorateKnowledgeDraftInput(input, { autoPublish }));

    const persisted = draftInputs
      .map((input) => saveManagedContentEntry(input, userId))
      .filter((item): item is ManagedContentEntry => !!item);

    drafts.push(...persisted);
  });

  return {
    snapshot,
    drafts,
  };
}

export function buildKnowledgeSynthesisDraftInputs(
  params?: {
    topicLimit?: number;
  },
  database: Database.Database = db
) {
  const snapshot = buildKnowledgeSynthesisSnapshot({ topicLimit: params?.topicLimit ?? 4 }, database);

  return {
    snapshot,
    drafts: snapshot.topics.flatMap((pack) => [
      buildTopicOverviewDraft(pack),
      buildConceptGlossaryDraft(pack),
      buildQuestionMapDraft(pack),
      buildQuestionClusterSummaryDraft(pack),
      buildBookPathDraft(pack),
      buildBookLadderDraft(pack),
    ]).map((input) => decorateKnowledgeDraftInput(input, { autoPublish: false })),
  };
}
