require('./load-env');

const Database = require('better-sqlite3');
const targets = require('../data/public-growth-targets-wave2.json');

const db = new Database('data/lifekline.db', { readonly: true });

function parseJson(value, fallback = {}) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function hasBlockedPlaceholderParagraphs(sections) {
  const text = Array.isArray(sections)
    ? sections.flatMap((section) => Array.isArray(section?.paragraphs) ? section.paragraphs : []).join('\n')
    : '';

  return /当前尚未|当前.*不足|应继续补|仍薄|还没有足够|仍要回到個人生日測算|仍要回到个人生日测算/.test(text);
}

function hasQualifiedSectionDepth(sections) {
  return Array.isArray(sections)
    && sections.length >= 4
    && sections.every((section) => (
      `${section?.title || ''}`.trim().length >= 4
      && Array.isArray(section?.paragraphs)
      && section.paragraphs.length >= 2
      && section.paragraphs.every((paragraph) => `${paragraph || ''}`.trim().length >= 36)
    ));
}

function assessDraftPublication(row, sourceType) {
  const meta = row.meta || {};
  const tags = parseJson(row.tags, []);
  const sections = parseJson(row.sections, []);
  let score = 0;
  const reasons = [];

  if (meta.sourceType !== sourceType) {
    return { ready: false, score: 0, reasons: [`not-${sourceType}`] };
  }

  if (`${row.source || ''}`.startsWith('agent-llm:')) {
    score += 35;
    reasons.push('llm-generated');
  } else if (`${row.source || ''}`.startsWith('agent-fallback:')) {
    score += 20;
    reasons.push('fallback-source');
  } else {
    reasons.push('unsupported-source');
  }
  if (`${row.excerpt || ''}`.trim().length >= 72) {
    score += 12;
    reasons.push('excerpt-length');
  }
  if (`${row.seo_title || ''}`.trim().length >= 22) {
    score += 10;
    reasons.push('seo-title-length');
  }
  if (`${row.seo_description || ''}`.trim().length >= 72) {
    score += 10;
    reasons.push('seo-description-length');
  }
  if (Array.isArray(tags) && tags.length >= 4) {
    score += 8;
    reasons.push('tag-density');
  }
  if (Array.isArray(sections) && sections.length >= 4) {
    score += 10;
    reasons.push('section-coverage');
  }
  if (hasQualifiedSectionDepth(sections)) {
    score += 10;
    reasons.push('section-depth');
  } else {
    reasons.push('section-depth-insufficient');
  }
  if (`${meta.locale || ''}`.trim()) {
    score += 6;
    reasons.push('locale');
  }
  if (`${meta.market || ''}`.trim()) {
    score += 6;
    reasons.push('market');
  }
  if (!hasBlockedPlaceholderParagraphs(sections)) {
    score += 13;
    reasons.push('no-placeholder-copy');
  } else {
    reasons.push('placeholder-copy');
  }

  const isLlmSource = `${row.source || ''}`.startsWith('agent-llm:');
  const isFallbackSource = `${row.source || ''}`.startsWith('agent-fallback:');

  return {
    ready: (
      ((isLlmSource && score >= 90) || (isFallbackSource && score >= 85))
      && (isLlmSource || isFallbackSource)
      && hasQualifiedSectionDepth(sections)
      && !hasBlockedPlaceholderParagraphs(sections)
      && !!`${meta.locale || ''}`.trim()
      && !!`${meta.market || ''}`.trim()
    ),
    score,
    reasons,
  };
}

const rows = db.prepare(`
  SELECT id, slug, title, excerpt, category, read_time, tags, featured, seo_title, seo_description, sections, status, source, meta, created_at, updated_at
  FROM content_entries
  ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
`).all();

const coverage = targets.map((target) => {
  const matched = rows
    .map((row) => ({
      ...row,
      meta: parseJson(row.meta),
    }))
    .filter((row) => row.meta.growthPlanKey === target.key)
    .filter((row) => row.meta.sourceType === 'public-growth-wave2');

  const published = matched.filter((row) => row.status === 'published');
  const drafts = matched.filter((row) => row.status === 'draft');

  return {
    key: target.key,
    title: target.title,
    locale: target.locale,
    market: target.market,
    primaryType: target.primaryType,
    publishedCount: published.length,
    draftCount: drafts.length,
    missing: published.length === 0 && drafts.length === 0,
    sampleTitles: matched.slice(0, 3).map((row) => row.title),
  };
});

const draftEntries = rows
  .map((row) => ({
    ...row,
    meta: parseJson(row.meta),
  }))
  .filter((row) => row.status === 'draft')
  .filter((row) => row.meta.sourceType === 'public-growth-wave2')
  .map((row) => ({
    slug: row.slug,
    title: row.title,
    growthPlanKey: row.meta.growthPlanKey,
    locale: row.meta.locale,
    market: row.meta.market,
    source: row.source,
    assessment: assessDraftPublication(row, 'public-growth-wave2'),
  }))
  .sort((left, right) => right.assessment.score - left.assessment.score);

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  targetCount: targets.length,
  missingCount: coverage.filter((item) => item.missing).length,
  draftOnlyCount: coverage.filter((item) => !item.missing && item.publishedCount === 0 && item.draftCount > 0).length,
  publishedCount: coverage.filter((item) => item.publishedCount > 0).length,
  queue: coverage.filter((item) => item.missing).slice(0, 8),
  promoteQueue: draftEntries.slice(0, 8).map((item) => ({
    slug: item.slug,
    title: item.title,
    growthPlanKey: item.growthPlanKey,
    locale: item.locale,
    market: item.market,
    source: item.source,
    ready: item.assessment.ready,
    score: item.assessment.score,
    reasons: item.assessment.reasons,
  })),
  coverage,
}, null, 2));
