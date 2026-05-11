import { db, fortuneOperations } from '@/lib/database';
import type { FortuneRecord } from '@/lib/user-types';

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

export interface PublicQuestionFeedItem {
  id: string;
  reportId?: string | null;
  href: string;
  reportHref?: string | null;
  question: string;
  title: string;
  contextLabel: string;
  createdAt?: string;
}

function asText(value: unknown) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim();
}

export function sanitizePublicContent(value: unknown, maxLength = 180) {
  return asText(value)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[已脱敏]')
    .replace(/1[3-9]\d{9}/g, '[已脱敏]')
    .replace(/\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g, '某个出生日期')
    .replace(/\b\d{1,2}:\d{2}\b/g, '某个时辰')
    .slice(0, maxLength)
    .trim();
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

export function listPublicReportFeedItems(limit = 48): PublicReportFeedItem[] {
  return fortuneOperations
    .listRecent(Math.max(limit * 3, limit))
    .filter((report) => report.isPublic !== false)
    .map(toPublicReportFeedItem)
    .slice(0, limit);
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
};

function toPublicQuestionFeedItems(rows: PublicQuestionRow[], limit: number): PublicQuestionFeedItem[] {
  const seen = new Set<string>();
  const items: PublicQuestionFeedItem[] = [];

  for (const row of rows) {
    const question = sanitizePublicContent(row.question, 180);
    const normalized = question.toLowerCase();
    if (!question || seen.has(normalized)) continue;
    seen.add(normalized);

    const pattern = parseJson<{ type?: string }>(row.pattern, {});
    const bazi = parseJson<{ dayMaster?: string }>(row.bazi, {});
    const contextLabel = [asText(pattern.type), asText(bazi.dayMaster)].filter(Boolean).join(' · ') || '公开追问';

    items.push({
      id: row.id,
      reportId: row.report_id,
      href: `/questions/${row.id}`,
      reportHref: row.report_id ? `/result/${row.report_id}` : null,
      question,
      title: `${question.replace(/[？?。.!！]$/, '')}怎么判断？`,
      contextLabel,
      createdAt: row.created_at,
    });

    if (items.length >= limit) break;
  }

  return items;
}

export function listPublicQuestionFeedItems(limit = 80): PublicQuestionFeedItem[] {
  const rows = db.prepare(`
    SELECT
      q.id,
      q.question,
      q.analysis,
      q.created_at,
      f.id AS report_id,
      f.pattern,
      f.bazi
    FROM questions q
    LEFT JOIN fortunes f ON f.id = json_extract(q.analysis, '$.reportId')
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
      f.bazi
    FROM questions q
    LEFT JOIN fortunes f ON f.id = json_extract(q.analysis, '$.reportId')
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
