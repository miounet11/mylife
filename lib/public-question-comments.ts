import OpenAI from 'openai';
import { db } from '@/lib/database';
import { getApiBaseUrl, getApiKey, getDefaultModel } from '@/lib/env';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import { generateId } from '@/lib/utils';

export type PublicQuestionCommentStatus = 'visible' | 'hidden' | 'pending';

export interface PublicQuestionComment {
  id: string;
  questionId: string;
  userId?: string;
  sessionId?: string;
  authorName: string;
  content: string;
  status: PublicQuestionCommentStatus;
  moderationReason?: string;
  engineReply?: string;
  assetTags: string[];
  createdAt?: string;
}

type RawCommentRow = {
  id: string;
  question_id: string;
  user_id?: string | null;
  session_id?: string | null;
  author_name?: string | null;
  content: string;
  status: PublicQuestionCommentStatus;
  moderation_reason?: string | null;
  engine_reply?: string | null;
  asset_tags?: string | null;
  created_at?: string;
};

type ModerationResult = {
  status: PublicQuestionCommentStatus;
  reason: string;
  engine: 'rules' | 'llm' | 'fallback';
};

const AD_PATTERNS = [
  /(?:微信|薇信|vx|v信|qq|q号|telegram|飞机|whatsapp|line)[:：\s-]*[a-z0-9_\-]{4,}/i,
  /(?:加我|私聊|联系我|扫码|代测|代算|付费咨询|引流|推广|广告|优惠|返现|兼职|代理|开户链接)/i,
  /(?:http|https):\/\/|www\.|\.com\b|\.cn\b|\.net\b|\.top\b/i,
];

const POLITICAL_PATTERNS = [
  /(?:共产党|国民党|民主党|共和党|习近平|拜登|特朗普|普京|台湾独立|港独|藏独|疆独|政治运动|政权|政府下台|游行示威|选举造势)/i,
];

function ensurePublicQuestionCommentsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS public_question_comments (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      user_id TEXT,
      session_id TEXT,
      author_name TEXT DEFAULT '匿名用户',
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      moderation_reason TEXT,
      moderation_engine TEXT,
      engine_reply TEXT,
      asset_tags JSON,
      source_context JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  for (const column of [
    `ALTER TABLE public_question_comments ADD COLUMN user_id TEXT`,
    `ALTER TABLE public_question_comments ADD COLUMN session_id TEXT`,
    `ALTER TABLE public_question_comments ADD COLUMN engine_reply TEXT`,
    `ALTER TABLE public_question_comments ADD COLUMN asset_tags JSON`,
    `ALTER TABLE public_question_comments ADD COLUMN source_context JSON`,
  ]) {
    try {
      db.exec(column);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('duplicate column')) throw error;
    }
  }

  db.exec(`CREATE INDEX IF NOT EXISTS idx_public_question_comments_question_status ON public_question_comments(question_id, status, created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_public_question_comments_user ON public_question_comments(user_id, created_at)`);
}

function sanitizeCommentText(value: unknown, maxLength: number) {
  return `${value || ''}`
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function inferAssetTags(content: string, questionText: string) {
  const text = `${questionText} ${content}`;
  const tags = new Set<string>(['public-discussion']);

  if (/婚|恋|对象|感情|复合|伴侣/.test(text)) tags.add('relationship');
  if (/工作|事业|岗位|创业|收入|钱|财/.test(text)) tags.add('career-wealth');
  if (/时间|几月|今年|明年|窗口|阶段|流年/.test(text)) tags.add('timing');
  if (/风险|担心|怕|反复|成本/.test(text)) tags.add('risk');
  if (/我觉得|我的情况|类似|经历|反馈/.test(text)) tags.add('self-disclosure');
  if (/怎么看|为什么|能不能|要不要|适合/.test(text)) tags.add('followup-question');

  return [...tags].slice(0, 8);
}

function mapCommentRow(row: RawCommentRow): PublicQuestionComment {
  return {
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id || undefined,
    sessionId: row.session_id || undefined,
    authorName: row.author_name || '匿名用户',
    content: row.content,
    status: row.status,
    moderationReason: row.moderation_reason || undefined,
    engineReply: row.engine_reply || undefined,
    assetTags: parseJson<string[]>(row.asset_tags, []),
    createdAt: row.created_at,
  };
}

function ruleModerateComment(content: string): ModerationResult | null {
  if (AD_PATTERNS.some((pattern) => pattern.test(content))) {
    return { status: 'hidden', reason: '疑似广告、引流或联系方式', engine: 'rules' };
  }

  if (POLITICAL_PATTERNS.some((pattern) => pattern.test(content))) {
    return { status: 'hidden', reason: '涉及政治内容', engine: 'rules' };
  }

  return null;
}

async function llmModerateComment(content: string, questionText: string): Promise<ModerationResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const timeoutMs = 3500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: timeoutMs, maxRetries: 0 });
    const response = await createOpenAiCompatibleChatCompletion(
      openai,
      {
        model: getDefaultModel(),
        messages: [
          {
            role: 'system',
            content: '你是公开留言审核器。只判断留言是否应该公开显示。广告、联系方式引流、推广、政治内容必须隐藏；普通对话、追问、反馈、命理问题可以显示。只输出 JSON：{"visible":true|false,"reason":"..."}',
          },
          {
            role: 'user',
            content: JSON.stringify({ question: questionText.slice(0, 220), comment: content.slice(0, 600) }),
          },
        ],
        temperature: 0,
        maxTokens: 120,
        responseFormat: { type: 'json_object' },
      },
      { signal: controller.signal, timeout: timeoutMs, maxRetries: 0 },
    );

    const text = response.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const parsed = JSON.parse(text) as { visible?: unknown; reason?: unknown };
    return {
      status: parsed.visible === false ? 'hidden' : 'visible',
      reason: `${parsed.reason || (parsed.visible === false ? '模型判定不适合公开' : '模型判定可公开')}`.slice(0, 120),
      engine: 'llm',
    };
  } catch (error) {
    console.warn('[PublicQuestionComments] moderation failed:', error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateDiscussionEngineReply(input: {
  content: string;
  questionText: string;
  assetTags: string[];
}): Promise<string | undefined> {
  const apiKey = getApiKey();
  if (!apiKey) return undefined;

  const timeoutMs = 4500;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: timeoutMs, maxRetries: 0 });
    const response = await createOpenAiCompatibleChatCompletion(
      openai,
      {
        model: getDefaultModel(),
        messages: [
          {
            role: 'system',
            content: '你是 WorldYi 公开讨论引擎。基于公开问题和用户留言，给一句温和、克制、可执行的回应。不要下绝对结论，不要制造焦虑，不处理医疗/法律/投资确定建议，不要求用户私聊或付费。80字以内。',
          },
          {
            role: 'user',
            content: JSON.stringify({
              question: input.questionText.slice(0, 260),
              comment: input.content.slice(0, 600),
              assetTags: input.assetTags,
            }),
          },
        ],
        temperature: 0.4,
        maxTokens: 120,
      },
      { signal: controller.signal, timeout: timeoutMs, maxRetries: 0 },
    );

    const text = response.choices?.[0]?.message?.content?.trim();
    return text ? text.replace(/^['"“”]+|['"“”]+$/g, '').slice(0, 160) : undefined;
  } catch (error) {
    console.warn('[PublicQuestionComments] engine reply failed:', error instanceof Error ? error.message : error);
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function listVisiblePublicQuestionComments(questionId: string, limit = 50): PublicQuestionComment[] {
  ensurePublicQuestionCommentsTable();
  const rows = db.prepare(`
    SELECT id, question_id, user_id, session_id, author_name, content, status, moderation_reason, engine_reply, asset_tags, created_at
    FROM public_question_comments
    WHERE question_id = ? AND status = 'visible'
    ORDER BY datetime(created_at) ASC
    LIMIT ?
  `).all(questionId, limit) as RawCommentRow[];

  return rows.map(mapCommentRow);
}

export async function createPublicQuestionComment(input: {
  questionId: string;
  questionText: string;
  userId?: string | null;
  sessionId?: string | null;
  authorName?: unknown;
  content: unknown;
  sourceContext?: Record<string, unknown>;
}): Promise<PublicQuestionComment> {
  ensurePublicQuestionCommentsTable();

  const authorName = sanitizeCommentText(input.authorName || '匿名用户', 24) || '匿名用户';
  const content = sanitizeCommentText(input.content, 600);

  if (content.length < 2) {
    throw new Error('留言太短');
  }

  const assetTags = inferAssetTags(content, input.questionText);
  const sourceContext = {
    surface: 'public_question_page',
    questionText: input.questionText.slice(0, 260),
    ...(input.sourceContext || {}),
  };
  const ruleResult = ruleModerateComment(content);
  const moderation = ruleResult || await llmModerateComment(content, input.questionText) || { status: 'visible', reason: '审核服务不可用，规则未命中，默认显示', engine: 'fallback' };
  const engineReply = moderation.status === 'visible'
    ? await generateDiscussionEngineReply({ content, questionText: input.questionText, assetTags })
    : undefined;
  const id = `pqc_${generateId()}`;

  const stmt = db.prepare(`
    INSERT INTO public_question_comments (id, question_id, user_id, session_id, author_name, content, status, moderation_reason, moderation_engine, engine_reply, asset_tags, source_context)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    input.questionId,
    input.userId || null,
    input.sessionId || null,
    authorName,
    content,
    moderation.status,
    moderation.reason,
    moderation.engine,
    engineReply || null,
    JSON.stringify(assetTags),
    JSON.stringify(sourceContext),
  );

  return {
    id,
    questionId: input.questionId,
    userId: input.userId || undefined,
    sessionId: input.sessionId || undefined,
    authorName,
    content,
    status: moderation.status,
    moderationReason: moderation.reason,
    engineReply,
    assetTags,
    createdAt: new Date().toISOString(),
  };
}
