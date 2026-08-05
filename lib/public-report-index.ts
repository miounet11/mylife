/**
 * Public report index quality + crawler helpers.
 *
 * Goals:
 * 1) Only high-signal anonymous cases are indexable (sitemap + robots allow + noindex gate).
 * 2) Thin guest shells stay shareable but noindex (avoid crawl-budget waste).
 * 3) Shared crawler UA detection for chat analytics / guest creation hygiene.
 */

import type { FortuneRecord } from '@/lib/user-types';
import { isPublicNoiseLine } from '@/lib/public-noise-filter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.life-kline.com';

/** Expanded bot / preview / CLI signatures (product analytics + guest hygiene). */
const CRAWLER_UA_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|preview|headless|phantom|selenium|puppeteer|playwright|curl\/|wget|python-requests|python-urllib|go-http-client|scrapy|bytespider|baiduspider|yandex|semrush|ahrefs|petalbot|gptbot|claudebot|anthropic|bingpreview|duckduckbot|applebot|twitterbot|linkedinbot|discordbot|telegrambot|whatsapp|skypeuripreview|embedly|quora link preview|outbrain|pinterest|redditbot|slackbot|vkshare|w3c_validator|screaming frog|sitesucker|httpclient|java\/|libwww|okhttp|axios\/|node-fetch|undici|postman|insomnia|monitor|uptime|pingdom|statuscake|datadog|newrelic|amazonbot|googleother|storebot|adsbot|mediapartners|apis-google|feedfetcher|ia_archiver/i;

export function isLikelyCrawlerUserAgent(userAgent?: string | null): boolean {
  const ua = `${userAgent || ''}`.trim();
  if (!ua) return true;
  // Extremely short UAs are almost never real browsers.
  if (ua.length < 12) return true;
  return CRAWLER_UA_RE.test(ua);
}

/** Prefer real browser product tokens (still may be spoofed; used as soft signal). */
export function looksLikeRealBrowserUserAgent(userAgent?: string | null): boolean {
  const ua = `${userAgent || ''}`.trim();
  if (!ua || isLikelyCrawlerUserAgent(ua)) return false;
  return /mozilla\/|chrome\/|safari\/|firefox\/|edg\/|opr\/|mobile|android|iphone|ipad/i.test(ua);
}

function asText(value: unknown) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim();
}

function jsonSize(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'string') return value.length;
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

function getPatternType(report: FortuneRecord | Record<string, unknown>) {
  const pattern = (report as FortuneRecord).pattern as { type?: string } | undefined;
  const analysis = (report as FortuneRecord).analysis as { pattern?: { type?: string } } | undefined;
  return asText(pattern?.type || analysis?.pattern?.type);
}

function getDayMaster(report: FortuneRecord | Record<string, unknown>) {
  const bazi = (report as FortuneRecord).bazi as { dayMaster?: string; dayGan?: string } | undefined;
  return asText(bazi?.dayMaster || bazi?.dayGan);
}

function getSummary(report: FortuneRecord | Record<string, unknown>) {
  const analysis = (report as FortuneRecord).analysis as {
    summary?: string;
    opening?: string;
    coreTheme?: string;
  } | undefined;
  return asText(
    analysis?.summary
      || analysis?.opening
      || analysis?.coreTheme
      || ((report as FortuneRecord).pattern as { description?: string } | undefined)?.description,
  );
}

const INTENT_LABELS: Record<string, string> = {
  career: '事业节奏',
  wealth: '财运结构',
  relationship: '关系情感',
  yearly: '流年窗口',
  health: '身心节奏',
  general: '综合结构',
};

export type PublicReportIndexScore = {
  score: number;
  indexable: boolean;
  reasons: string[];
  patternType: string;
  dayMaster: string;
  intent: string;
  intentLabel: string;
  summary: string;
  contentBytes: number;
};

/**
 * Score whether a public report is worth search indexing.
 * Shareable (is_public) ≠ indexable: thin guest shells stay noindex.
 */
export function scorePublicReportForIndex(
  report: FortuneRecord | Record<string, unknown> | null | undefined,
): PublicReportIndexScore {
  if (!report) {
    return {
      score: 0,
      indexable: false,
      reasons: ['missing'],
      patternType: '',
      dayMaster: '',
      intent: '',
      intentLabel: '',
      summary: '',
      contentBytes: 0,
    };
  }

  const isPublic = (report as FortuneRecord).isPublic !== false
    && (report as { is_public?: number | boolean }).is_public !== 0
    && (report as { is_public?: number | boolean }).is_public !== false;

  const patternType = getPatternType(report);
  const dayMaster = getDayMaster(report);
  const intent = asText((report as FortuneRecord).intent || 'general').toLowerCase();
  const intentLabel = INTENT_LABELS[intent] || INTENT_LABELS.general;
  const summary = getSummary(report);
  const analysisBytes = jsonSize((report as FortuneRecord).analysis);
  const adviceBytes = jsonSize((report as FortuneRecord).advice);
  const fortuneBytes = jsonSize((report as FortuneRecord).fortune);
  const contentBytes = analysisBytes + adviceBytes + fortuneBytes;

  let score = 0;
  const reasons: string[] = [];

  if (!isPublic) {
    return {
      score: 0,
      indexable: false,
      reasons: ['private'],
      patternType,
      dayMaster,
      intent,
      intentLabel,
      summary,
      contentBytes,
    };
  }

  if (contentBytes >= 8000) {
    score += 40;
    reasons.push('rich_body');
  } else if (contentBytes >= 2500) {
    score += 25;
    reasons.push('medium_body');
  } else {
    reasons.push('thin_body');
  }

  if (dayMaster && dayMaster !== '日主') {
    score += 15;
    reasons.push('day_master');
  }
  if (patternType && patternType !== '结构格局' && patternType.length >= 2) {
    score += 15;
    reasons.push('pattern');
  }
  if (summary.length >= 40 && !isPublicNoiseLine(summary)) {
    score += 15;
    reasons.push('summary');
  }
  if (['career', 'wealth', 'relationship', 'yearly'].includes(intent)) {
    score += 10;
    reasons.push('intent');
  }
  if (adviceBytes >= 400) {
    score += 10;
    reasons.push('advice');
  }

  // Hard rejects for low-quality shells
  if (contentBytes < 2000) {
    score = Math.min(score, 35);
    reasons.push('reject_thin');
  }
  if (!dayMaster && !patternType) {
    score = Math.min(score, 30);
    reasons.push('reject_no_structure');
  }

  const indexable = score >= 55;
  return {
    score,
    indexable,
    reasons,
    patternType: patternType || '结构格局',
    dayMaster: dayMaster || '日主',
    intent,
    intentLabel,
    summary: summary.slice(0, 280),
    contentBytes,
  };
}

export function isIndexablePublicReport(
  report: FortuneRecord | Record<string, unknown> | null | undefined,
): boolean {
  return scorePublicReportForIndex(report).indexable;
}

/** Richer SEO title/description for indexable anonymous cases. */
export function buildIndexablePublicReportSeo(
  report: FortuneRecord,
): {
  title: string;
  description: string;
  patternType: string;
  dayMaster: string;
  intentLabel: string;
  canonical: string;
  indexable: boolean;
  score: number;
} {
  const scored = scorePublicReportForIndex(report);
  const title = `${scored.patternType} · ${scored.dayMaster}${scored.intentLabel}匿名案例`;
  const baseDesc =
    scored.summary
    || `这是一份匿名公开${scored.intentLabel}结构案例，包含命局格局、阶段节奏与可执行动作边界。`;
  const description = `${baseDesc} 重点看阶段适配、风险边界与下一步动作。结构参考，不替代现实决策。`.slice(0, 220);

  return {
    title,
    description,
    patternType: scored.patternType,
    dayMaster: scored.dayMaster,
    intentLabel: scored.intentLabel,
    canonical: `${SITE_URL}/r/${report.id}`,
    indexable: scored.indexable,
    score: scored.score,
  };
}

/** JSON-LD CaseStudy/Article for indexable public summary pages. */
export function buildPublicReportJsonLd(input: {
  id: string;
  title: string;
  description: string;
  patternType?: string;
  dayMaster?: string;
  intentLabel?: string;
  datePublished?: string | null;
  dateModified?: string | null;
}) {
  const url = `${SITE_URL}/r/${input.id}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: url,
    url,
    inLanguage: 'zh-CN',
    isAccessibleForFree: true,
    author: {
      '@type': 'Organization',
      name: 'Life K-Line 命运K线',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Life K-Line 命运K线',
      url: SITE_URL,
    },
    about: [
      input.patternType,
      input.dayMaster,
      input.intentLabel,
      '八字结构',
      '人生K线',
      '匿名案例',
    ].filter(Boolean),
    datePublished: input.datePublished || undefined,
    dateModified: input.dateModified || input.datePublished || undefined,
  };
}
