/**
 * Continuous public content flywheel: privacy-safe tool results + list/query helpers.
 *
 * - Completed tool sessions with enough signal are auto-marked public (no PII).
 * - Public cases surface on /share/tool/[id], /reports hub, sitemap, and growth feeds.
 * - Uses raw SQL for list/update so production works even without toolSessionOperations.update.
 */

import { db, toolSessionOperations } from '@/lib/database';
import { redactText, redactRecord } from '@/lib/publish/privacy-redact';
import { isPublicNoiseLine } from '@/lib/public-noise-filter';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.life-kline.com';

const TOOL_LABELS: Record<string, string> = {
  hehun: '合婚双盘',
  'timing-yearly-window': '流年窗口',
  palmistry: '手相观察',
  physiognomy: '面相观察',
  'dimension-marriage': '婚姻维度',
  'dimension-career-industry': '事业行业',
  'dimension-investment': '投资节奏',
  'dimension-naming': '命名维度',
  'dimension-fortune-rhythm': '运势节奏',
  'dimension-living-environment': '人居环境',
  'dimension-study-career': '学业事业',
  'dimension-partnership': '合伙关系',
  'daily-sign': '日签',
  'naming-lab': '起名实验室',
  'public-insight': '结构笔记',
  'public-naming': '起名短名单',
  'public-space-report': '空间场报表',
};

export type PublicToolArticle = {
  public: true;
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  tags: string[];
  sourceType: 'tool';
  toolSlug: string;
  toolLabel: string;
  publishedAt: string;
  dayMaster?: string | null;
  qualityScore?: number | null;
};

export type PublicToolCaseItem = {
  id: string;
  href: string;
  title: string;
  summary: string;
  toolSlug: string;
  toolLabel: string;
  tags: string[];
  publishedAt?: string;
  createdAt?: string;
};

function asText(value: unknown) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim();
}

function toolLabel(slug: string) {
  return TOOL_LABELS[slug] || slug.replace(/[-_]/g, ' ').slice(0, 24);
}

function pickStrings(source: unknown, keys: string[], max = 6): string[] {
  if (!source || typeof source !== 'object') return [];
  const obj = source as Record<string, unknown>;
  const out: string[] = [];
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim().length >= 8) {
      const t = redactText(v.trim());
      if (t && !isPublicNoiseLine(t)) out.push(t.slice(0, 400));
    }
    if (Array.isArray(v)) {
      for (const item of v.slice(0, 4)) {
        if (typeof item === 'string' && item.trim().length >= 6) {
          const t = redactText(item.trim());
          if (t && !isPublicNoiseLine(t)) out.push(t.slice(0, 280));
        } else if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>;
          const line = asText(row.body || row.text || row.description || row.title || row.label);
          if (line.length >= 6) {
            const t = redactText(line);
            if (t && !isPublicNoiseLine(t)) out.push(t.slice(0, 280));
          }
        }
      }
    }
  }
  return [...new Set(out)].slice(0, max);
}

function deepDiveBodies(meta: Record<string, unknown>): string[] {
  const llm = (meta.llmEnhancement || {}) as Record<string, unknown>;
  const sections = Array.isArray(llm.deepDiveSections) ? llm.deepDiveSections : [];
  return sections
    .map((s) => {
      const row = (s || {}) as Record<string, unknown>;
      const heading = asText(row.heading);
      const body = asText(row.body);
      if (!body || isPublicNoiseLine(body)) return '';
      return redactText(heading ? `${heading}\n${body}` : body).slice(0, 800);
    })
    .filter(Boolean)
    .slice(0, 4);
}

/** Build a shareable article from a completed tool session (no LLM required). */
export function buildPublicArticleFromToolSession(session: {
  id?: string;
  toolSlug?: string;
  status?: string;
  result?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  createdAt?: string;
}): PublicToolArticle | null {
  if (!session || session.status !== 'completed') return null;
  const slug = `${session.toolSlug || ''}`.trim();
  if (!slug || slug.startsWith('public-')) {
    // already a publish artifact
  }
  const result = (session.result || {}) as Record<string, unknown>;
  const meta = (session.meta || {}) as Record<string, unknown>;

  // Already has a public article — normalize
  const existing = (result.article || null) as PublicToolArticle | null;
  if (existing && existing.title && Array.isArray(existing.sections) && existing.sections.length > 0) {
    return {
      public: true,
      title: redactText(String(existing.title)).slice(0, 80),
      summary: redactText(String(existing.summary || '')).slice(0, 200),
      sections: existing.sections.slice(0, 8).map((s) => ({
        heading: redactText(String(s.heading || '章节')).slice(0, 40),
        body: redactText(String(s.body || '')).slice(0, 3000),
      })),
      tags: (existing.tags || []).slice(0, 8),
      sourceType: 'tool',
      toolSlug: slug || existing.toolSlug || 'tool',
      toolLabel: toolLabel(slug || existing.toolSlug || 'tool'),
      publishedAt: existing.publishedAt || new Date().toISOString(),
      dayMaster: existing.dayMaster || (meta.dayMaster as string) || null,
      qualityScore: existing.qualityScore ?? (meta.quality as { score?: number } | undefined)?.score ?? null,
    };
  }

  const label = toolLabel(slug);
  const headline = asText(result.headline || result.title || result.summary || `${label}结构观察`);
  const summaryCandidates = pickStrings(result, ['summary', 'headline', 'opening', 'coreInsight', 'overview'], 3);
  const actions = pickStrings(result, ['actions', 'nextSteps', 'recommendations', 'suggestions', 'actionItems'], 5);
  const risks = pickStrings(result, ['risks', 'watchouts', 'cautions', 'warnings'], 4);
  const windows = pickStrings(result, ['windows', 'timing', 'periods', 'stages'], 4);
  const dives = deepDiveBodies(meta);
  const qualityScore = typeof (meta.quality as { score?: number } | undefined)?.score === 'number'
    ? (meta.quality as { score: number }).score
    : null;
  const dayMaster = asText(meta.dayMaster) || null;

  const bodyPool = [...summaryCandidates, ...dives, ...actions, ...risks, ...windows].filter(Boolean);
  const contentChars = bodyPool.join('').length;
  // Quality gate: enough substance, not tiny stubs
  if (contentChars < 80 && !dives.length) return null;
  if (qualityScore != null && qualityScore < 40 && contentChars < 200) return null;

  const sections: PublicToolArticle['sections'] = [];
  if (summaryCandidates[0] || headline) {
    sections.push({
      heading: '结构摘要',
      body: redactText(summaryCandidates[0] || headline).slice(0, 600),
    });
  }
  if (dives.length) {
    sections.push({
      heading: '深一层观察',
      body: dives.map((d, i) => `${i + 1}. ${d}`).join('\n\n').slice(0, 2400),
    });
  }
  if (windows.length) {
    sections.push({
      heading: '节奏与窗口',
      body: windows.map((w, i) => `${i + 1}. ${w}`).join('\n').slice(0, 1200),
    });
  }
  if (actions.length) {
    sections.push({
      heading: '可验证动作',
      body: actions.map((a, i) => `${i + 1}. ${a}`).join('\n').slice(0, 1200),
    });
  }
  if (risks.length) {
    sections.push({
      heading: '风险边界',
      body: risks.map((r, i) => `${i + 1}. ${r}`).join('\n').slice(0, 1000),
    });
  }
  sections.push({
    heading: '阅读说明',
    body: '本文由系统将用户工具测算结果脱敏后自动公开，已去除联系方式与精确身份信息。内容为结构参考与教学示意，不构成吉凶断语、投资或医疗建议。',
  });

  if (sections.length < 2) return null;

  const titleBase = redactText(headline).slice(0, 40) || label;
  const title = `${label}匿名案例：${titleBase}`.slice(0, 72);
  const summary = redactText(summaryCandidates[0] || headline || `${label}结构观察案例`).slice(0, 180);

  return {
    public: true,
    title,
    summary,
    sections,
    tags: [label, '匿名案例', '工具测算', dayMaster ? `日主${dayMaster}` : ''].filter(Boolean) as string[],
    sourceType: 'tool',
    toolSlug: slug || 'tool',
    toolLabel: label,
    publishedAt: new Date().toISOString(),
    dayMaster,
    qualityScore,
  };
}

function parseJson(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
}

/**
 * Mark a completed tool session public with a redacted article.
 * Safe to call repeatedly (idempotent when already public with article).
 */
export function autoPublishToolSession(sessionId: string): {
  published: boolean;
  url?: string;
  reason?: string;
} {
  const id = `${sessionId || ''}`.trim();
  if (!id) return { published: false, reason: 'missing_id' };

  try {
    const session = toolSessionOperations.getById?.(id) as {
      id: string;
      toolSlug: string;
      status: string;
      result?: Record<string, unknown>;
      meta?: Record<string, unknown>;
      createdAt?: string;
    } | null;
    if (!session) return { published: false, reason: 'not_found' };
    if (session.status !== 'completed') return { published: false, reason: 'not_completed' };

    const result = { ...(session.result || {}) };
    const meta = { ...(session.meta || {}) };
    if (meta.public === true && result.public === true && (result.article as PublicToolArticle | undefined)?.title) {
      return { published: true, url: `/share/tool/${id}` };
    }

    const article = buildPublicArticleFromToolSession(session);
    if (!article) return { published: false, reason: 'quality_gate' };

    const nextResult = redactRecord({
      ...result,
      public: true,
      article,
    }) as Record<string, unknown>;
    const nextMeta = redactRecord({
      ...meta,
      public: true,
      publicPath: `/share/tool/${id}`,
      publicPublishedAt: article.publishedAt,
      sourceType: 'tool_auto_public',
    }) as Record<string, unknown>;

    db.prepare(
      `UPDATE tool_sessions
       SET result = ?, meta = ?, updated_at = ?
       WHERE id = ?`,
    ).run(JSON.stringify(nextResult), JSON.stringify(nextMeta), new Date().toISOString(), id);

    return { published: true, url: `/share/tool/${id}` };
  } catch (error) {
    console.warn('[public-tool-cases] autoPublish failed', error);
    return { published: false, reason: 'error' };
  }
}

/** List recent public tool cases for hub / feed / sitemap. */
export function listPublicToolCaseItems(limit = 40): PublicToolCaseItem[] {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  try {
    const rows = db
      .prepare(
        `SELECT id, tool_slug, result, meta, created_at, updated_at
         FROM tool_sessions
         WHERE status = 'completed'
           AND (
             json_extract(meta, '$.public') = 1
             OR json_extract(result, '$.public') = 1
             OR meta LIKE '%"public":true%'
             OR result LIKE '%"public":true%'
           )
         ORDER BY datetime(COALESCE(updated_at, created_at)) DESC
         LIMIT ?`,
      )
      .all(safeLimit * 2) as Array<{
      id: string;
      tool_slug: string;
      result: string;
      meta: string;
      created_at: string;
      updated_at: string;
    }>;

    const items: PublicToolCaseItem[] = [];
    for (const row of rows) {
      const result = parseJson(row.result);
      const meta = parseJson(row.meta);
      if (!(meta.public === true || result.public === true || meta.public === 1 || result.public === 1)) {
        continue;
      }
      const article = (result.article || {}) as Partial<PublicToolArticle>;
      let title = asText(article.title);
      let summary = asText(article.summary);
      if (!title) {
        const built = buildPublicArticleFromToolSession({
          id: row.id,
          toolSlug: row.tool_slug,
          status: 'completed',
          result,
          meta,
          createdAt: row.created_at,
        });
        if (!built) continue;
        title = built.title;
        summary = built.summary;
      }
      const slug = row.tool_slug || article.toolSlug || 'tool';
      // Prefer dedicated share routes for known types
      const href =
        slug === 'public-naming' || meta.sourceType === 'naming'
          ? `/share/naming/${row.id}`
          : slug === 'public-space-report' || meta.sourceType === 'space_report'
            ? `/share/space/${row.id}`
            : slug === 'public-insight' && meta.sourceType !== 'tool' && meta.sourceType !== 'tool_auto_public'
              ? `/share/insight/${row.id}`
              : `/share/tool/${row.id}`;

      items.push({
        id: row.id,
        href,
        title: redactText(title).slice(0, 80),
        summary: redactText(summary || title).slice(0, 180),
        toolSlug: slug,
        toolLabel: toolLabel(slug),
        tags: Array.isArray(article.tags) ? article.tags.map(String).slice(0, 6) : [toolLabel(slug)],
        publishedAt: asText(article.publishedAt || meta.publicPublishedAt) || undefined,
        createdAt: row.created_at,
      });
      if (items.length >= safeLimit) break;
    }
    return items;
  } catch (error) {
    console.warn('[public-tool-cases] list failed', error);
    return [];
  }
}

export function listPublicToolCaseIdsForSitemap(limit = 40): Array<{ id: string; href: string; updatedAt?: string }> {
  return listPublicToolCaseItems(limit).map((item) => ({
    id: item.id,
    href: item.href,
    updatedAt: item.publishedAt || item.createdAt,
  }));
}

/** Backfill: publish recent completed sessions that pass the quality gate. */
export function backfillPublicToolCases(limit = 60): { scanned: number; published: number } {
  let scanned = 0;
  let published = 0;
  try {
    const rows = db
      .prepare(
        `SELECT id FROM tool_sessions
         WHERE status = 'completed'
           AND length(COALESCE(result, '')) > 200
           AND tool_slug NOT LIKE 'public-%'
         ORDER BY datetime(created_at) DESC
         LIMIT ?`,
      )
      .all(Math.max(1, Math.min(200, limit))) as Array<{ id: string }>;
    for (const row of rows) {
      scanned += 1;
      const res = autoPublishToolSession(row.id);
      if (res.published) published += 1;
    }
  } catch (error) {
    console.warn('[public-tool-cases] backfill failed', error);
  }
  return { scanned, published };
}

export function publicToolCaseCanonical(id: string) {
  return `${SITE_URL}/share/tool/${id}`;
}
