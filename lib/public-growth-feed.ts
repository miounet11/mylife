import { db, fortuneOperations } from '@/lib/database';
import type { FortuneRecord } from '@/lib/user-types';
import { isPublicNoiseLine } from '@/lib/public-noise-filter';

const SITE_URL = 'https://www.life-kline.com';

export interface PublicReportFeedItem {
  id: string;
  href: string;
  title: string;
  description: string;
  patternType: string;
  dayMaster: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface PublicQuestionStructured {
  patternType?: string;
  patternDescription?: string;
  dayMaster?: string;
  currentDaYun?: string;
  currentLiuNian?: string;
  yongShen?: string[];
  xiShen?: string[];
  trend?: string;
  /** 抽自 advice.career.timing/marriage.timing 等领域 timing */
  timing?: string[];
  /** 抽自 advice.career.directions 等 */
  directions?: string[];
}

export interface PublicQuestionFeedItem {
  id: string;
  reportId?: string | null;
  href: string;
  reportHref?: string | null;
  question: string;
  title: string;
  contextLabel: string;
  reportTitle?: string;
  reportSummary?: string;
  answerSummary: string;
  answerText?: string;
  analysisPoints: string[];
  actionPoints: string[];
  createdAt?: string;
  /** v5-D41: 权威结构化字段，渲染层优先使用这些，正则抽取仅作 fallback */
  structured?: PublicQuestionStructured;
}

function asText(value: unknown) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim();
}

function redactPublicContent(value: string) {
  return value
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
}

export function sanitizePublicIdentityText(value: unknown, maxLength = 180) {
  return redactPublicContent(asText(value))
    .slice(0, maxLength)
    .trim();
}

export function sanitizePublicContent(value: unknown, maxLength = 180) {
  return sanitizePublicIdentityText(value, maxLength);
}

function sanitizePublicBlock(value: unknown, maxLength = 900) {
  return redactPublicContent(`${value || ''}`)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, maxLength)
    .trim();
}

export function buildSeoPublicQuestionTitle(question: string, contextLabel: string) {
  const cleanQuestion = sanitizePublicIdentityText(question, 80).replace(/[？?。.!！]$/, '');
  const cleanContext = sanitizePublicIdentityText(contextLabel, 40) || '公开追问';
  return `${cleanQuestion}怎么判断？${cleanContext}匿名案例`;
}

export function buildSeoPublicQuestionSummary(input: {
  question: string;
  contextLabel: string;
  answerText?: string;
  reportSummary?: string;
  analysisPoints?: string[];
  fallback: string;
}) {
  const base = firstNonEmpty([
    input.answerText,
    input.reportSummary,
    input.analysisPoints?.[0],
    input.fallback,
  ], 210);
  const question = sanitizePublicIdentityText(input.question, 90);
  const context = sanitizePublicIdentityText(input.contextLabel, 40);
  const prefix = context ? `${context}公开案例：` : '公开案例：';
  const summary = `${prefix}${base || question}。重点看阶段、风险和可执行动作。`;
  return sanitizePublicContent(summary, 260);
}

function getPatternType(report: FortuneRecord) {
  return asText((report.pattern as { type?: string })?.type) || '结构格局';
}

function getDayMaster(report: FortuneRecord) {
  return asText((report.bazi as { dayMaster?: string })?.dayMaster) || '日主';
}

function getReportSummary(report: FortuneRecord) {
  const analysis = report.analysis as {
    summary?: string;
    opening?: string;
    coreTheme?: string;
  } | undefined;

  return sanitizePublicContent(
    analysis?.summary
      || analysis?.opening
      || analysis?.coreTheme
      || (report.pattern as { description?: string })?.description
      || '这是一份匿名公开结构判断案例，包含命局结构、阶段节奏、行动建议和后续追问入口。',
    220,
  );
}

export function buildPublicReportSeo(report: FortuneRecord) {
  const patternType = getPatternType(report);
  const dayMaster = getDayMaster(report);
  const title = `${patternType} · ${dayMaster}匿名结构判断案例`;
  const description = getReportSummary(report);

  return {
    title,
    description,
    patternType,
    dayMaster,
    canonical: `${SITE_URL}/result/${report.id}`,
  };
}

export function toPublicReportFeedItem(report: FortuneRecord): PublicReportFeedItem {
  const seo = buildPublicReportSeo(report);
  return {
    id: report.id,
    href: `/result/${report.id}`,
    title: seo.title,
    description: seo.description,
    patternType: seo.patternType,
    dayMaster: seo.dayMaster,
    updatedAt: report.updatedAt,
    createdAt: report.createdAt,
  };
}

// v5-D34d：listPublicReportFeedItems 在 PublicGrowthFeedPanel 里，
// /tools/* /tools/category/* /tools 三处 SSR 都装了它；GPTBot/SemrushBot 风暴下每次都
// fortuneOperations.listRecent(N) 全列 + JSON 解析。signal 在面板里客户端过滤，
// 输入参数仅 limit，可按 limit 做 30s TTL 全局缓存。
const PUBLIC_REPORT_FEED_TTL_MS = 30_000;
const publicReportFeedCache = new Map<number, { value: PublicReportFeedItem[]; expiresAt: number }>();

export function invalidatePublicGrowthFeedCache() {
  publicReportFeedCache.clear();
  publicQuestionFeedCache.clear();
}

export function listPublicReportFeedItems(limit = 48): PublicReportFeedItem[] {
  const now = Date.now();
  const cached = publicReportFeedCache.get(limit);
  if (cached && cached.expiresAt > now) return cached.value;
  const value = fortuneOperations
    .listRecent(Math.max(limit * 3, limit))
    .filter((report) => report.isPublic !== false)
    .map(toPublicReportFeedItem)
    .slice(0, limit);
  publicReportFeedCache.set(limit, { value, expiresAt: now + PUBLIC_REPORT_FEED_TTL_MS });
  return value;
}

export interface PublicReportFeedPage {
  items: PublicReportFeedItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function listPublicReportFeedItemsPaged(
  page = 1,
  perPage = 48,
): PublicReportFeedPage {
  const safePerPage = Math.max(1, Math.min(120, Math.floor(perPage)));
  const total = fortuneOperations.countPublic();
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const safePage = Math.max(1, Math.min(totalPages, Math.floor(page)));
  const offset = (safePage - 1) * safePerPage;
  const items = fortuneOperations
    .listPublicPaged(safePerPage, offset)
    .map(toPublicReportFeedItem);
  return { items, total, page: safePage, perPage: safePerPage, totalPages };
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

type PublicQuestionRow = {
  id: string;
  question: string;
  analysis?: string | null;
  created_at?: string;
  report_id?: string | null;
  pattern?: string | null;
  bazi?: string | null;
  fortune?: string | null;
  advice?: string | null;
  report_analysis?: string | null;
  assistant_answer?: string | null;
};

type PublicQuestionAnalysis = {
  intent?: string;
  materialSummary?: string;
  materials?: Array<{ kind?: string; label?: string; note?: string; summary?: string }>;
};

type PublicContentDomain = 'palmistry' | 'home-layout';

type PublicReportAnalysis = {
  opening?: string;
  summary?: string;
  explanation?: string;
  qualityAudit?: { summary?: string; strengths?: string[]; recommendedActions?: string[]; concerns?: string[] };
  judgmentBlocks?: {
    pastValidation?: { headline?: string; evidence?: string[] };
    presentDiagnosis?: { headline?: string; evidence?: string[] };
    futureGuidance?: { headline?: string; evidence?: string[] };
  };
  feedbackLoop?: {
    validationInsights?: { summary?: string; lessons?: string[] };
    correctionInsight?: { summary?: string; fixes?: string[]; checkpoints?: string[] };
  };
};

function firstNonEmpty(values: unknown[], maxLength = 220) {
  for (const value of values) {
    const text = sanitizePublicContent(value, maxLength);
    if (text) return text;
  }
  return '';
}

function uniquePublicPoints(values: unknown[], maxLength = 130) {
  const seen = new Set<string>();
  const points: string[] = [];

  for (const value of values.flat()) {
    const point = sanitizePublicContent(value, maxLength);
    const key = point.toLowerCase();
    if (!point || seen.has(key)) continue;
    if (isPublicNoiseLine(point)) continue;
    seen.add(key);
    points.push(point);
    if (points.length >= 5) break;
  }

  return points;
}

function extractExplanationPoints(explanation?: string) {
  return sanitizePublicBlock(explanation, 900)
    .split(/\n+|(?=世界易判断：|已发生的印证：|主判断：|判断依据：|接下来会怎么走：|现在先做：|风险提醒：)/)
    .map((line) => line.replace(/^[-•\d.、\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildPublicQuestionFallback(question: string, contextLabel: string) {
  return `围绕“${question}”，公开页只保留匿名后的结构判断：先看${contextLabel}，再结合阶段节奏、现实条件和可执行动作判断；不展示姓名、生日、出生时间、出生地等敏感信息。`;
}

function detectPublicContentDomain(value: unknown): PublicContentDomain | null {
  const text = asText(value).toLowerCase();
  if (!text) return null;

  if (/手相|掌纹|掌丘|手型|手掌|palm/.test(text)) return 'palmistry';
  if (/户型|户型图|房屋|住宅|家宅|风水|floor[_\s-]?plan|home-layout/.test(text)) return 'home-layout';

  return null;
}

function getAnalysisDomain(analysis: PublicQuestionAnalysis) {
  return detectPublicContentDomain([
    analysis.intent,
    analysis.materialSummary,
    ...(analysis.materials || []).flatMap((material) => [material.kind, material.label, material.note, material.summary]),
  ].join(' '));
}

function hasPublicContentDomainMismatch(question: string, analysis: PublicQuestionAnalysis, answerText: string) {
  const questionDomain = detectPublicContentDomain(question);
  if (!questionDomain) return false;

  const analysisDomain = getAnalysisDomain(analysis);
  const answerDomain = detectPublicContentDomain(answerText);

  return [analysisDomain, answerDomain].some((domain) => domain && domain !== questionDomain);
}

function buildMismatchFallback(question: string, contextLabel: string) {
  return `围绕“${question}”，公开页检测到原始材料类型或回答内容与问题主题不一致，因此不展示可能错配的解析。这里只保留匿名后的安全边界说明：需要以用户实际提交的材料为准，先确认问题主题、材料类型和可见信息一致，再做${contextLabel}相关判断；不展示姓名、生日、出生时间、出生地等敏感信息。`;
}

// v5-D41: 把权威 JSON 字段（pattern/bazi/fortune/advice）转成 structured，
// 供页面渲染层优先使用，避免正则抽取漏检 / 误判。
function buildStructuredFields(parts: {
  pattern: { type?: string; description?: string };
  bazi: { dayMaster?: string };
  fortune: { currentDaYun?: string; currentLiuNian?: string; interaction?: string; trend?: string };
  advice: {
    career?: { timing?: string; specific?: string[]; directions?: string[] };
    wealth?: { timing?: string; specific?: string[]; directions?: string[] };
    marriage?: { timing?: string; specific?: string[]; directions?: string[] };
    health?: { timing?: string; specific?: string[]; directions?: string[] };
    timing?: string[];
    yongShen?: string[];
    xiShen?: string[];
  };
}): PublicQuestionStructured | undefined {
  const { pattern, bazi, fortune, advice } = parts;

  // 元素 chip 白名单过滤（仅五行单字），避免脏数据穿透到 UI
  const cleanElements = (raw?: string[]): string[] | undefined => {
    if (!Array.isArray(raw)) return undefined;
    const out: string[] = [];
    for (const item of raw) {
      const text = asText(item);
      for (const ch of text) {
        if (/[金木水火土]/.test(ch) && !out.includes(ch)) out.push(ch);
      }
    }
    return out.length > 0 ? out : undefined;
  };

  // timing 收敛到字符串数组：兼容 advice.timing[] 和各领域 advice.X.timing
  const timingPool: string[] = [];
  const pushTiming = (v?: string | string[]) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach((s) => pushTiming(s));
    else {
      const text = sanitizePublicContent(v, 80);
      if (text && !timingPool.includes(text)) timingPool.push(text);
    }
  };
  pushTiming(advice.timing);
  pushTiming(advice.career?.timing);
  pushTiming(advice.wealth?.timing);
  pushTiming(advice.marriage?.timing);
  pushTiming(advice.health?.timing);

  const directionPool: string[] = [];
  const pushDirection = (v?: string[] | string) => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach((s) => pushDirection(s));
    else {
      const text = sanitizePublicContent(v, 60);
      if (text && !directionPool.includes(text)) directionPool.push(text);
    }
  };
  pushDirection(advice.career?.directions);
  pushDirection(advice.wealth?.directions);
  pushDirection(advice.marriage?.directions);
  pushDirection(advice.health?.directions);

  const out: PublicQuestionStructured = {
    patternType: pattern.type ? sanitizePublicContent(pattern.type, 30) : undefined,
    patternDescription: pattern.description ? sanitizePublicContent(pattern.description, 180) : undefined,
    dayMaster: bazi.dayMaster ? sanitizePublicContent(bazi.dayMaster, 8) : undefined,
    currentDaYun: fortune.currentDaYun ? sanitizePublicContent(fortune.currentDaYun, 30) : undefined,
    currentLiuNian: fortune.currentLiuNian ? sanitizePublicContent(fortune.currentLiuNian, 30) : undefined,
    yongShen: cleanElements(advice.yongShen),
    xiShen: cleanElements(advice.xiShen),
    trend: fortune.trend ? sanitizePublicContent(fortune.trend, 120) : undefined,
    timing: timingPool.length > 0 ? timingPool.slice(0, 4) : undefined,
    directions: directionPool.length > 0 ? directionPool.slice(0, 4) : undefined,
  };

  const hasAny = Object.values(out).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  );
  return hasAny ? out : undefined;
}

function toPublicQuestionFeedItems(rows: PublicQuestionRow[], limit: number): PublicQuestionFeedItem[] {
  const seen = new Set<string>();
  const items: PublicQuestionFeedItem[] = [];

  for (const row of rows) {
    const question = sanitizePublicContent(row.question, 180);
    const normalized = question.toLowerCase();
    if (!question || seen.has(normalized)) continue;
    seen.add(normalized);

    const pattern = parseJson<{ type?: string; description?: string }>(row.pattern, {});
    const bazi = parseJson<{ dayMaster?: string }>(row.bazi, {});
    const fortune = parseJson<{ currentDaYun?: string; currentLiuNian?: string; interaction?: string; trend?: string }>(row.fortune, {});
    const advice = parseJson<{
      career?: { overall?: string; timing?: string; specific?: string[]; directions?: string[] };
      wealth?: { overall?: string; timing?: string; specific?: string[]; directions?: string[] };
      marriage?: { overall?: string; timing?: string; specific?: string[]; directions?: string[] };
      health?: { general?: string; timing?: string; specific?: string[]; directions?: string[] };
      overall?: string;
      timing?: string[];
      yongShen?: string[];
      xiShen?: string[];
    }>(row.advice, {});
    const questionAnalysis = parseJson<PublicQuestionAnalysis>(row.analysis, {});
    const reportAnalysis = parseJson<PublicReportAnalysis>(row.report_analysis, {});
    const contextLabel = sanitizePublicIdentityText([asText(pattern.type), asText(bazi.dayMaster)].filter(Boolean).join(' · ') || '公开追问', 60);
    const reportSummary = firstNonEmpty([
      reportAnalysis.summary,
      reportAnalysis.opening,
      // v5-D43: qualityAudit.summary 是评分摘要，不是给用户的报告摘要，不再走 fallback
      pattern.description,
      fortune.interaction,
      fortune.trend,
    ], 260);
    const assistantAnswer = row.assistant_answer ? sanitizePublicBlock(row.assistant_answer, 900) : '';
    const hasDomainMismatch = hasPublicContentDomainMismatch(question, questionAnalysis, assistantAnswer);
    const answerText = hasDomainMismatch ? '' : firstNonEmpty([
      assistantAnswer,
      reportAnalysis.explanation ? sanitizePublicBlock(reportAnalysis.explanation, 900) : '',
      reportAnalysis.opening,
      reportAnalysis.summary,
      reportSummary,
    ], 900);
    const analysisPoints = uniquePublicPoints([
      reportAnalysis.judgmentBlocks?.presentDiagnosis?.headline,
      reportAnalysis.judgmentBlocks?.presentDiagnosis?.evidence,
      reportAnalysis.judgmentBlocks?.futureGuidance?.headline,
      reportAnalysis.judgmentBlocks?.futureGuidance?.evidence,
      reportAnalysis.feedbackLoop?.validationInsights?.summary,
      reportAnalysis.feedbackLoop?.validationInsights?.lessons,
      extractExplanationPoints(reportAnalysis.explanation),
      pattern.description,
      // v5-D46: 结构卡顶部已渲染 currentDaYun / currentLiuNian / pattern，
      // analysisPoints 不再重复出"当前阶段：xxx / 流年参考：xxx"
      fortune.interaction,
    ]);
    const actionPoints = uniquePublicPoints([
      // v5-D43: qualityAudit.recommendedActions / feedbackLoop.correctionInsight 是
      // 运维向字段（"补齐 evidence/actions"/"升级重算"），不再流到公开页用户视图
      advice.overall,
      advice.career?.overall,
      advice.career?.specific,
      advice.wealth?.overall,
      advice.wealth?.specific,
      advice.marriage?.overall,
      advice.marriage?.specific,
      advice.health?.general,
      advice.health?.specific,
      advice.timing,
    ]);
    const fallback = hasDomainMismatch
      ? buildMismatchFallback(question, contextLabel)
      : buildPublicQuestionFallback(question, contextLabel);
    const publicAnswerText = answerText || fallback;
    const publicAnalysisPoints = analysisPoints.length > 0 ? analysisPoints : [fallback];

    items.push({
      id: row.id,
      reportId: row.report_id,
      href: `/questions/${row.id}`,
      reportHref: row.report_id ? `/result/${row.report_id}` : null,
      question,
      title: buildSeoPublicQuestionTitle(question, contextLabel),
      contextLabel,
      reportTitle: row.report_id ? `${contextLabel}匿名结构判断案例` : undefined,
      reportSummary: reportSummary || undefined,
      answerSummary: buildSeoPublicQuestionSummary({
        question,
        contextLabel,
        answerText: publicAnswerText,
        reportSummary,
        analysisPoints: publicAnalysisPoints,
        fallback,
      }),
      answerText: publicAnswerText,
      analysisPoints: publicAnalysisPoints,
      actionPoints,
      createdAt: row.created_at,
      structured: buildStructuredFields({ pattern, bazi, fortune, advice }),
    });

    if (items.length >= limit) break;
  }

  return items;
}

const PUBLIC_QUESTION_FEED_TTL_MS = 30_000;
const publicQuestionFeedCache = new Map<number, { value: PublicQuestionFeedItem[]; expiresAt: number }>();

export function listPublicQuestionFeedItems(limit = 80): PublicQuestionFeedItem[] {
  const now = Date.now();
  const cached = publicQuestionFeedCache.get(limit);
  if (cached && cached.expiresAt > now) return cached.value;
  const value = listPublicQuestionFeedItemsUncached(limit);
  publicQuestionFeedCache.set(limit, { value, expiresAt: now + PUBLIC_QUESTION_FEED_TTL_MS });
  return value;
}

function listPublicQuestionFeedItemsUncached(limit: number): PublicQuestionFeedItem[] {
  const rows = db.prepare(`
    SELECT
      q.id,
      q.question,
      q.analysis,
      q.created_at,
      f.id AS report_id,
      f.pattern,
      f.bazi,
      f.fortune,
      f.advice,
      f.analysis AS report_analysis,
      assistant.question AS assistant_answer
    FROM questions q
    LEFT JOIN fortunes f ON f.id = json_extract(q.analysis, '$.reportId')
    LEFT JOIN questions assistant
      ON assistant.category = 'chat_assistant'
      AND assistant.user_id = q.user_id
      AND json_extract(assistant.analysis, '$.responseToQuestionId') = q.id
    WHERE q.category = 'chat_user'
      AND length(trim(q.question)) >= 8
      AND length(trim(q.question)) <= 260
      AND (f.id IS NULL OR f.is_public = 1)
    ORDER BY datetime(q.created_at) DESC
    LIMIT ?
  `).all(limit * 2) as PublicQuestionRow[];

  return toPublicQuestionFeedItems(rows, limit);
}

export function getPublicQuestionFeedItem(id: string): PublicQuestionFeedItem | null {
  const row = db.prepare(`
    SELECT
      q.id,
      q.question,
      q.analysis,
      q.created_at,
      f.id AS report_id,
      f.pattern,
      f.bazi,
      f.fortune,
      f.advice,
      f.analysis AS report_analysis,
      assistant.question AS assistant_answer
    FROM questions q
    LEFT JOIN fortunes f ON f.id = json_extract(q.analysis, '$.reportId')
    LEFT JOIN questions assistant
      ON assistant.category = 'chat_assistant'
      AND assistant.user_id = q.user_id
      AND json_extract(assistant.analysis, '$.responseToQuestionId') = q.id
    WHERE q.id = ?
      AND q.category = 'chat_user'
      AND length(trim(q.question)) >= 8
      AND length(trim(q.question)) <= 260
      AND (f.id IS NULL OR f.is_public = 1)
    LIMIT 1
  `).get(id) as PublicQuestionRow | undefined;

  if (!row) return null;
  return toPublicQuestionFeedItems([row], 1)[0] || null;
}
