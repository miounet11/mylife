import type { ContentGenerationInput } from '@/lib/content-generation';
import { enqueueContentGenerationJob } from '@/lib/content-generation-jobs';
import type { ManagedContentType } from '@/lib/content-store';
import type { ContentGenerationJobRecord } from '@/lib/user-types';

export type PublicContentOpportunitySourceType = 'question' | 'comment' | 'report';
export type PublicContentOpportunityRisk = 'low' | 'medium' | 'high';
export type PublicContentOpportunityRejectReason =
  | 'private-source'
  | 'empty-source'
  | 'low-signal'
  | 'high-risk'
  | 'privacy-heavy'
  | 'duplicate-topic';

export interface PublicContentOpportunitySource {
  id: string;
  type: PublicContentOpportunitySourceType;
  isPublic?: boolean;
  href?: string;
  title?: string | null;
  question?: string | null;
  answer?: string | null;
  summary?: string | null;
  reportSummary?: string | null;
  contextLabel?: string | null;
  analysisPoints?: string[] | null;
  actionPoints?: string[] | null;
  comments?: Array<{ body?: string | null; label?: string | null }> | null;
  tags?: string[] | null;
  category?: string | null;
  createdAt?: string | null;
}

export interface PublicContentOpportunity {
  id: string;
  sourceId: string;
  sourceType: PublicContentOpportunitySourceType;
  sourceHref?: string;
  topic: string;
  angle: string;
  audience: string;
  keywords: string[];
  contentType: ManagedContentType;
  score: number;
  risk: PublicContentOpportunityRisk;
  sanitizedSignals: {
    title?: string;
    question?: string;
    answer?: string;
    summary?: string;
    contextLabel?: string;
    actionPoints: string[];
  };
  generationInput: ContentGenerationInput;
  meta: Record<string, unknown>;
}

export interface RejectedPublicContentOpportunity {
  sourceId: string;
  sourceType: PublicContentOpportunitySourceType;
  reason: PublicContentOpportunityRejectReason;
  risk: PublicContentOpportunityRisk;
  score: number;
  topic?: string;
  detail?: string;
}

export interface PublicContentOpportunityEvaluation {
  accepted: PublicContentOpportunity[];
  rejected: RejectedPublicContentOpportunity[];
}

export interface PublicContentOpportunityEnqueueResult {
  opportunities: PublicContentOpportunity[];
  rejected: RejectedPublicContentOpportunity[];
  jobs: Array<ContentGenerationJobRecord | null>;
}

interface ThemeRule {
  key: string;
  category: string;
  topic: string;
  angle: string;
  audience: string;
  keywords: string[];
  pattern: RegExp;
  weight: number;
  contentType?: ManagedContentType;
}

const MAX_OPPORTUNITIES_PER_SOURCE = 3;
const DEFAULT_OPPORTUNITIES_PER_SOURCE = 1;
const MIN_ACCEPT_SCORE = 62;
const MIN_EXPANSION_SCORE = 78;

const THEME_RULES: ThemeRule[] = [
  {
    key: 'career-timing',
    category: '事业',
    topic: '事业窗口怎么判断：从阶段、资源和行动顺序拆解',
    angle: '用公开匿名案例讲清事业推进、跳槽、升职或创业前应该先确认哪些信号。',
    audience: '正在判断事业机会、职业变化和行动时机的用户',
    keywords: ['事业窗口', '职业节奏', '跳槽', '升职', '创业', '行动建议'],
    pattern: /事业|职业|工作|跳槽|转行|升职|创业|项目|岗位|老板|公司|offer|職業|轉職/i,
    weight: 24,
    contentType: 'case',
  },
  {
    key: 'relationship-boundary',
    category: '关系',
    topic: '关系问题怎么判断：先看边界、节奏和可验证行动',
    angle: '把感情、婚姻、家庭沟通问题拆成可观察信号，避免宿命化结论。',
    audience: '正在处理亲密关系、婚恋或家庭沟通问题的用户',
    keywords: ['关系判断', '感情节奏', '婚恋', '沟通边界', '行动建议'],
    pattern: /感情|恋爱|婚姻|伴侣|复合|分手|离婚|桃花|家庭|亲密关系|对象|关系/i,
    weight: 22,
    contentType: 'case',
  },
  {
    key: 'wealth-decision',
    category: '财富',
    topic: '财务选择怎么判断：机会、风险和投入边界',
    angle: '从公开问题里提炼财富与副业决策的判断框架，只给结构建议，不给收益承诺。',
    audience: '正在判断收入、副业、投资边界和财务节奏的用户',
    keywords: ['财富判断', '副业', '投资边界', '风险', '现金流'],
    pattern: /财运|财富|赚钱|收入|副业|投资|现金流|买房|卖房|合作|生意|資產|錢/i,
    weight: 20,
  },
  {
    key: 'timing-method',
    category: '阶段',
    topic: '阶段窗口怎么看：不要只问年份，要拆到决策动作',
    angle: '解释流年、大运、年份窗口这类问题如何落到当下行动，而不是空泛预测。',
    audience: '正在询问年份、阶段窗口和下一步选择的用户',
    keywords: ['阶段窗口', '流年', '大运', '2026', '2027', '时机判断'],
    pattern: /20\d{2}|今年|明年|后年|流年|大运|什么时候|时机|阶段|窗口|幾時|何時/i,
    weight: 18,
  },
  {
    key: 'home-layout',
    category: '空间',
    topic: '户型和风水问题怎么问才有用：先看可验证的空间信息',
    angle: '把户型、办公室、居住空间问题转成采光、动线、功能区和边界说明。',
    audience: '想用空间工具做居家或办公布局判断的用户',
    keywords: ['户型', '风水', '家居布局', '办公室', '空间判断'],
    pattern: /户型|风水|房子|住宅|办公室|工位|卧室|客厅|厨房|财位|布局|家居|空間/i,
    weight: 17,
  },
  {
    key: 'learning-method',
    category: '方法',
    topic: '命理问题怎么问才不会跑偏：信息、边界和验证方式',
    angle: '帮助新用户理解如何提出高质量问题，以及哪些结论不能直接从公开信息判断。',
    audience: '刚开始使用人生K线和单项工具的用户',
    keywords: ['命理提问', '八字', '边界', '验证', '公开案例'],
    pattern: /八字|命理|格局|日主|五行|十神|用神|人生K线|世界易|算命|测算/i,
    weight: 14,
  },
];

const HIGH_RISK_PATTERN = /自杀|轻生|自残|杀人|伤害他人|报复|暴力|诈骗|网赌|洗钱|代孕|毒品|药物剂量|诊断.*癌|确诊|急救|法律意见|保证收益|稳赚|内幕消息/i;
const LOW_SIGNAL_PATTERN = /^(看看|测测|算算|准吗|谢谢|好的|帮我看下|帮忙看看|怎么看)[。.!！?？\s]*$/i;
const ACTION_PATTERN = /怎么办|怎么做|如何|建议|选择|要不要|能不能|应该|风险|机会|下一步|行动|判断|验证|规划|拆解/i;
const PRIVACY_PATTERN = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?86[-\s]?)?1[3-9]\d{9}|(?:微信|薇信|vx|v信|qq|q号)[:：\s-]*[a-z0-9_\-]{4,}|(?:19|20)\d{2}年\d{1,2}月\d{1,2}[日号]?|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b|(?:出生地|出生地点|籍贯|老家|住在|现居|地址)[:：\s]*[\u4e00-\u9fa5A-Za-z0-9省市区县镇乡街道路号\-\s]{2,32}/gi;

function asText(value: unknown) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim();
}

function compactText(value: unknown, maxLength: number) {
  const text = asText(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((item) => asText(item)).filter(Boolean)));
}

export function sanitizePublicOpportunityText(value: unknown, maxLength = 220) {
  const redacted = asText(value)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[已脱敏]')
    .replace(/(?:\+?86[-\s]?)?1[3-9]\d{9}/g, '[已脱敏]')
    .replace(/(?:微信|薇信|vx|v信|qq|q号)[:：\s-]*[a-z0-9_\-]{4,}/gi, '[已脱敏]')
    .replace(/(?:我叫|姓名|名字叫|本人叫|我是)\s*[\u4e00-\u9fa5]{2,4}/g, '匿名用户')
    .replace(/[\u4e00-\u9fa5]{2,4}(?:先生|女士|小姐|老师|师傅)/g, '匿名用户')
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '某个出生日期')
    .replace(/(?:19|20)\d{2}年\d{1,2}月\d{1,2}[日号]?/g, '某个出生日期')
    .replace(/(?:出生(?:时间)?|生于|生日|阳历|农历)[:：\s]*(?:19|20)\d{2}[^，。；\n]{0,18}/g, '出生信息已脱敏')
    .replace(/(?:出生地|出生地点|籍贯|老家|住在|现居|地址)[:：\s]*[\u4e00-\u9fa5A-Za-z0-9省市区县镇乡街道路号\-\s]{2,32}/g, '地点信息已脱敏')
    .replace(/\b\d{1,2}:\d{2}\b/g, '某个时辰');

  return compactText(redacted, maxLength).trim();
}

function countPrivacySignals(rawText: string) {
  return rawText.match(PRIVACY_PATTERN)?.length || 0;
}

function buildSourceText(source: PublicContentOpportunitySource) {
  return uniqueStrings([
    source.title,
    source.question,
    source.answer,
    source.summary,
    source.reportSummary,
    source.contextLabel,
    ...(source.analysisPoints || []),
    ...(source.actionPoints || []),
    ...(source.comments || []).map((comment) => comment.body || ''),
    ...(source.tags || []),
    source.category,
  ]).join('。');
}

function buildSanitizedSignals(source: PublicContentOpportunitySource) {
  return {
    title: sanitizePublicOpportunityText(source.title, 90),
    question: sanitizePublicOpportunityText(source.question, 140),
    answer: sanitizePublicOpportunityText(source.answer, 220),
    summary: sanitizePublicOpportunityText(source.summary || source.reportSummary, 220),
    contextLabel: sanitizePublicOpportunityText(source.contextLabel, 60),
    actionPoints: uniqueStrings(source.actionPoints || [])
      .map((item) => sanitizePublicOpportunityText(item, 90))
      .slice(0, 3),
  };
}

function assessBaseScore(source: PublicContentOpportunitySource, sanitizedText: string) {
  let score = 30;
  if (sanitizedText.length >= 40) score += 8;
  if (sanitizedText.length >= 90) score += 8;
  if (ACTION_PATTERN.test(sanitizedText)) score += 12;
  if ((source.actionPoints || []).length > 0) score += 8;
  if ((source.analysisPoints || []).length > 0) score += 6;
  if (source.contextLabel) score += 4;
  if (source.type === 'question') score += 6;
  if (source.type === 'report') score += 3;
  return score;
}

function assessRisk(rawText: string, sanitizedText: string): PublicContentOpportunityRisk {
  if (HIGH_RISK_PATTERN.test(rawText)) return 'high';
  const privacySignals = countPrivacySignals(rawText);
  if (privacySignals >= 3) return 'high';
  if (privacySignals > 0 || /\[已脱敏\]|出生信息已脱敏|地点信息已脱敏/.test(sanitizedText)) return 'medium';
  return 'low';
}

function selectThemeCandidates(sanitizedText: string, baseScore: number) {
  const matched = THEME_RULES
    .filter((rule) => rule.pattern.test(sanitizedText))
    .map((rule) => ({ rule, score: Math.min(100, baseScore + rule.weight) }))
    .sort((a, b) => b.score - a.score);

  if (matched.length) return matched;

  return [{
    rule: THEME_RULES[THEME_RULES.length - 1],
    score: Math.min(100, baseScore + 8),
  }];
}

function buildOpportunity(params: {
  source: PublicContentOpportunitySource;
  rule: ThemeRule;
  score: number;
  risk: PublicContentOpportunityRisk;
  sanitizedSignals: PublicContentOpportunity['sanitizedSignals'];
  index: number;
}): PublicContentOpportunity {
  const { source, rule, score, risk, sanitizedSignals, index } = params;
  const context = uniqueStrings([
    sanitizedSignals.question,
    sanitizedSignals.summary,
    sanitizedSignals.answer,
    ...sanitizedSignals.actionPoints,
  ]).join(' / ');
  const keywords = uniqueStrings([
    ...rule.keywords,
    rule.category,
    sanitizedSignals.contextLabel,
    ...(source.tags || []),
  ]).slice(0, 10);
  const contentType = rule.contentType || (source.type === 'report' ? 'case' : 'knowledge');
  const generationInput: ContentGenerationInput = {
    mode: 'single',
    contentType,
    topic: rule.topic,
    angle: rule.angle,
    platform: 'public-growth',
    keywords,
    audience: rule.audience,
    locale: 'zh-CN',
    sourceSignals: compactText(context || buildSourceText(source), 600),
    status: 'draft',
    featured: false,
  };

  return {
    id: `public_opp_${source.type}_${source.id}_${rule.key}_${index + 1}`,
    sourceId: source.id,
    sourceType: source.type,
    sourceHref: source.href,
    topic: rule.topic,
    angle: rule.angle,
    audience: rule.audience,
    keywords,
    contentType,
    score,
    risk,
    sanitizedSignals,
    generationInput,
    meta: {
      publicContentOpportunity: true,
      sourceId: source.id,
      sourceType: source.type,
      sourceHref: source.href,
      sourceCreatedAt: source.createdAt,
      theme: rule.key,
      category: rule.category,
      risk,
      score,
      draftOnly: true,
      version: 'public-content-opportunity-v1',
    },
  };
}

function reject(source: PublicContentOpportunitySource, reason: PublicContentOpportunityRejectReason, risk: PublicContentOpportunityRisk, score = 0, detail?: string): RejectedPublicContentOpportunity {
  return {
    sourceId: source.id,
    sourceType: source.type,
    reason,
    risk,
    score,
    detail,
  };
}

export function evaluatePublicContentOpportunities(
  source: PublicContentOpportunitySource,
  options: { maxOpportunities?: number } = {}
): PublicContentOpportunityEvaluation {
  if (source.isPublic === false) {
    return { accepted: [], rejected: [reject(source, 'private-source', 'low')] };
  }

  const rawText = buildSourceText(source);
  const sanitizedText = sanitizePublicOpportunityText(rawText, 1200);

  if (!sanitizedText) {
    return { accepted: [], rejected: [reject(source, 'empty-source', 'low')] };
  }

  const risk = assessRisk(rawText, sanitizedText);
  if (risk === 'high') {
    const reason = countPrivacySignals(rawText) >= 3 ? 'privacy-heavy' : 'high-risk';
    return { accepted: [], rejected: [reject(source, reason, risk, 0)] };
  }

  if (sanitizedText.length < 18 || LOW_SIGNAL_PATTERN.test(sanitizedText)) {
    return { accepted: [], rejected: [reject(source, 'low-signal', risk, 20)] };
  }

  const baseScore = assessBaseScore(source, sanitizedText);
  const sanitizedSignals = buildSanitizedSignals(source);
  const candidates = selectThemeCandidates(sanitizedText, baseScore);
  const requestedLimit = options.maxOpportunities ?? DEFAULT_OPPORTUNITIES_PER_SOURCE;
  const limit = Math.max(1, Math.min(requestedLimit, MAX_OPPORTUNITIES_PER_SOURCE));
  const accepted: PublicContentOpportunity[] = [];
  const rejected: RejectedPublicContentOpportunity[] = [];
  const usedCategories = new Set<string>();

  candidates.forEach(({ rule, score }) => {
    const isExpansion = accepted.length >= DEFAULT_OPPORTUNITIES_PER_SOURCE;
    const requiredScore = isExpansion ? MIN_EXPANSION_SCORE : MIN_ACCEPT_SCORE;

    if (accepted.length >= limit) return;
    if (score < requiredScore) {
      rejected.push(reject(source, 'low-signal', risk, score, rule.key));
      return;
    }
    if (usedCategories.has(rule.category)) {
      rejected.push(reject(source, 'duplicate-topic', risk, score, rule.key));
      return;
    }

    usedCategories.add(rule.category);
    accepted.push(buildOpportunity({ source, rule, score, risk, sanitizedSignals, index: accepted.length }));
  });

  return { accepted, rejected };
}

export function extractPublicContentOpportunities(
  source: PublicContentOpportunitySource,
  options: { maxOpportunities?: number } = {}
) {
  return evaluatePublicContentOpportunities(source, options).accepted;
}

export function enqueuePublicContentOpportunityDraftJobs(params: {
  userId: string;
  source: PublicContentOpportunitySource;
  maxOpportunities?: number;
}): PublicContentOpportunityEnqueueResult {
  const evaluation = evaluatePublicContentOpportunities(params.source, {
    maxOpportunities: params.maxOpportunities,
  });
  const jobs = evaluation.accepted.map((opportunity) => enqueueContentGenerationJob({
    userId: params.userId,
    input: opportunity.generationInput,
    meta: opportunity.meta,
  }));

  return {
    opportunities: evaluation.accepted,
    rejected: evaluation.rejected,
    jobs,
  };
}
