/**
 * Forum trend generator — consumes content_generation_jobs from forum trend signals
 * and produces actual forum questions + answers using the existing forum template system.
 *
 * Quality gate: minimum body length, forbidden word check, template residue detection.
 */
import { forumQuestionOperations, forumAnswerOperations, forumTitlePoolOperations } from '@/lib/database';
import { CATEGORIES, QUESTION_TEMPLATES, SITUATIONS, PROBLEMS } from '@/lib/forum/templates';
import type { ContentGenerationJobRecord } from '@/lib/user-types';

const MIN_QUESTION_BODY_LENGTH = 80;
const MIN_ANSWER_BODY_LENGTH = 120;
const FORBIDDEN_WORDS = ['测试', 'test', 'TODO', 'FIXME', '占位', 'placeholder', 'XXXXXXXX'];
const TEMPLATE_RESIDUE_PATTERNS = [/\$\{[a-z_]+\}/, /\{\{[a-z_]+\}\}/, /<[a-z_]+\/>/];

function pick<T>(arr: T[], seed: number): T {
  const idx = Math.abs(Math.floor(seed * 1000)) % arr.length;
  return arr[idx];
}

function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function slugify(title: string, id: string): string {
  const base = title
    .replace(/[^\u4e00-\u9fff\w]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${base}-${id.slice(-4)}`;
}

function generateId(): string {
  return `ft_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

interface GeneratedQuestion {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
}

interface GeneratedAnswer {
  id: string;
  questionId: string;
  body: string;
}

function qualityCheck(body: string, label: string): { ok: boolean; reason?: string } {
  if (body.length < MIN_QUESTION_BODY_LENGTH) {
    return { ok: false, reason: `${label} body too short (${body.length} < ${MIN_QUESTION_BODY_LENGTH})` };
  }
  for (const word of FORBIDDEN_WORDS) {
    if (body.includes(word)) {
      return { ok: false, reason: `${label} contains forbidden word: ${word}` };
    }
  }
  for (const pattern of TEMPLATE_RESIDUE_PATTERNS) {
    if (pattern.test(body)) {
      return { ok: false, reason: `${label} contains template residue matching ${pattern}` };
    }
  }
  return { ok: true };
}

export interface TrendGenResult {
  jobId: string;
  question?: GeneratedQuestion;
  answer?: GeneratedAnswer;
  error?: string;
}

/**
 * Generate a forum question + answer from a content generation job's request payload.
 * Uses the existing forum template system but with trend signal context.
 */
export function generateFromTrendJob(job: ContentGenerationJobRecord): TrendGenResult {
  const payload = (job.request || {}) as Record<string, unknown>;
  const category = String(payload.category || 'bazi');
  const keywords = (Array.isArray(payload.keywords) ? payload.keywords : []) as string[];
  const signalTitle = String(payload.title || '');

  const catDef = CATEGORIES.find((c) => c.key === category);
  if (!catDef) {
    return { jobId: job.id, error: `Unknown category: ${category}` };
  }

  const seed = Date.now();
  const rng = makeRng(seed);

  // Build question using existing template system
  const topic = pick(catDef.topics, seed + 1);
  const keyword = keywords.length > 0 ? pick(keywords, seed + 2) : topic;
  const situation = pick(SITUATIONS, seed + 3);
  const problem = pick(PROBLEMS, seed + 4);

  // Select a template for this category
  const tplArr = QUESTION_TEMPLATES[category] || QUESTION_TEMPLATES.bazi;
  const tpl = pick(tplArr, seed + 5);

  // Build a realistic question title
  const titleStyles = [
    `${catDef.label}看${topic}：${situation}，怎么破`,
    `${age()}岁${occupation()}的困惑：${situation}，${keyword}能解决吗`,
    `${catDef.label}${topic}分析：${problem}，${situation}`,
    `${situation}，从${keyword}角度看${catDef.label}${topic}`,
    `求助：${situation}，${catDef.label}怎么看${topic}`,
  ];
  const title = pick(titleStyles, seed + 6);

  // Build question body
  const body = [
    `最近${situation}，想从${catDef.label}的角度看看${topic}。`,
    `具体来说，${problem}。`,
    `之前试过一些方法但效果不明显，想请有经验的朋友从${keyword || catDef.label}方向给点思路。`,
    `如果有类似经历的，也欢迎分享。`,
  ].join('\n\n');

  const qCheck = qualityCheck(body, 'question');
  if (!qCheck.ok) {
    return { jobId: job.id, error: qCheck.reason };
  }

  const qId = generateId();
  const question: GeneratedQuestion = {
    id: qId,
    slug: slugify(title, qId),
    title,
    body,
    category,
    tags: [catDef.label, topic, ...keywords.slice(0, 3)],
  };

  // Build official answer
  const signals = [
    `关于${topic}的问题，从${catDef.label}角度看，${situation}通常和几方面有关。`,
    `第一，${pick(['命局结构', '当前大运', '流年作用', '宫位互动', '用神力量'], seed + 7)}的影响最直接。`,
    `第二，${pick(['外部环境', '时间窗口', '人际关系', '职业赛道', '生活习惯'], seed + 8)}也不能忽略。`,
    `第三，${pick(['心态调整', '节奏控制', '信息收集', '小步试错', '借力打力'], seed + 9)}是当前可操作的切入点。`,
    ``,
    `建议：${pick(['先把现有的事情做好', '观察未来1-3个月的变化', '找一个靠谱的人聊聊', '做个详细的计划再行动', '适当放慢节奏等时机'], seed + 10)}。`,
    `以上判断基于${catDef.label}的常规分析框架，具体情况因人而异。如果需要更精准的建议，建议提供完整的出生信息或起卦条件。`,
  ].join('\n\n');

  const aCheck = qualityCheck(signals, 'answer');
  if (!aCheck.ok) {
    return { jobId: job.id, error: aCheck.reason };
  }

  const answer: GeneratedAnswer = {
    id: generateId(),
    questionId: qId,
    body: signals,
  };

  return { jobId: job.id, question, answer };
}

function age(): string {
  const ages = ['28岁', '32岁', '35岁', '38岁', '41岁', '45岁', '50岁'];
  return ages[Math.floor(Math.random() * ages.length)];
}

function occupation(): string {
  const occs = ['程序员', '产品经理', '设计师', '运营', '销售', '财务', '教师', '自由职业', '创业者', '公务员'];
  return occs[Math.floor(Math.random() * occs.length)];
}
