require('./load-env');

const Database = require('better-sqlite3');
const targets = require('../data/public-growth-targets.json');

const db = new Database('data/lifekline.db', { readonly: true });

function normalizeText(value) {
  return `${value || ''}`.trim().toLowerCase();
}

function canUseHeuristicTargetMatch(row, meta) {
  if (row.status === 'published') {
    return true;
  }

  return meta.sourceType === 'public-growth';
}

function parseJson(value) {
  if (!value) return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function isPublicKnowledgeEntry(row, meta) {
  if (row.content_type !== 'knowledge' || row.status !== 'published') {
    return false;
  }

  if (row.source === 'seed' || row.source === 'cms') {
    return true;
  }

  if (row.source.startsWith('agent-fallback:')) {
    return false;
  }

  if (row.source.startsWith('knowledge-synthesis:')) {
    return meta.publicationReady === true;
  }

  return meta.publicationReady === true;
}

function isPubliclyPublished(row, meta) {
  if (row.status !== 'published') {
    return false;
  }

  if (row.content_type !== 'knowledge') {
    return true;
  }

  return isPublicKnowledgeEntry(row, meta);
}

function hasBlockedPlaceholderParagraphs(sections) {
  const text = Array.isArray(sections)
    ? sections.flatMap((section) => Array.isArray(section?.paragraphs) ? section.paragraphs : []).join('\n')
    : '';

  return /当前尚未|当前.*不足|应继续补|仍薄|还没有足够|仍要回到個人生日測算|仍要回到个人生日测算/.test(text);
}

function assessPublication(row, meta) {
  const reasons = [];
  let score = 0;

  if (meta.sourceType !== 'public-growth') {
    return { ready: false, score: 0, reasons: ['not-public-growth'] };
  }

  if (`${row.source || ''}`.startsWith('agent-llm:')) {
    score += 35;
    reasons.push('llm-generated');
  } else {
    reasons.push('fallback-source');
  }

  if ((row.excerpt || '').trim().length >= 72) {
    score += 12;
    reasons.push('excerpt-length');
  }
  if ((row.seo_title || '').trim().length >= 22) {
    score += 10;
    reasons.push('seo-title-length');
  }
  if ((row.seo_description || '').trim().length >= 72) {
    score += 10;
    reasons.push('seo-description-length');
  }
  if (Array.isArray(meta.tags) ? meta.tags.length >= 4 : false) {
    score += 8;
    reasons.push('tag-density');
  }
  if (Array.isArray(meta.sections) ? meta.sections.length >= 4 : false) {
    score += 10;
    reasons.push('section-coverage');
  }
  if (meta.locale) {
    score += 6;
    reasons.push('locale');
  }
  if (meta.market) {
    score += 6;
    reasons.push('market');
  }

  const blocked = hasBlockedPlaceholderParagraphs(meta.sections);
  if (!blocked) {
    score += 13;
    reasons.push('no-placeholder-copy');
  } else {
    reasons.push('placeholder-copy');
  }

  return {
    ready: score >= 84 && `${row.source || ''}`.startsWith('agent-llm:') && !blocked && !!meta.locale && !!meta.market,
    score,
    reasons,
  };
}

function matchesTarget(row, meta, target) {
  if (meta.growthPlanKey === target.key) {
    return true;
  }

  if (!canUseHeuristicTargetMatch(row, meta)) {
    return false;
  }

  if (meta.locale && meta.locale !== target.locale) {
    return false;
  }
  if (meta.market && meta.market !== target.market) {
    return false;
  }

  const haystack = normalizeText([
    row.title,
    row.excerpt,
    row.category,
    meta.locale,
    meta.market,
    ...(Array.isArray(meta.tags) ? meta.tags : []),
    row.tags || '',
  ].join(' '));

  const matched = (target.keywords || []).filter((keyword) => haystack.includes(normalizeText(keyword)));
  return matched.length >= Math.min(2, (target.keywords || []).length);
}

const rows = db.prepare(`
  SELECT id, content_type, slug, title, excerpt, category, tags, seo_title, seo_description, sections, status, source, meta
  FROM content_entries
  ORDER BY updated_at DESC, created_at DESC
`).all();

const coverage = targets.map((target) => {
  const matchedRows = rows.filter((row) => row.content_type === target.primaryType)
    .map((row) => {
      const meta = parseJson(row.meta);
      meta.tags = row.tags ? parseJson(row.tags) : [];
      meta.sections = row.sections ? parseJson(row.sections) : [];
      return { row, meta };
    })
    .filter(({ row, meta }) => matchesTarget(row, meta, target));
  const published = matchedRows.filter(({ row, meta }) => isPubliclyPublished(row, meta));
  const drafts = matchedRows.filter(({ row }) => row.status === 'draft');
  const missing = published.length === 0;
  const priorityScore = (
    target.trafficPotential * 18
    + target.conversionPotential * 16
    + (missing ? 36 : 0)
    + (drafts.length === 0 ? 14 : 0)
    - published.length * 12
    - drafts.length * 4
  );

  return {
    key: target.key,
    title: target.title,
    locale: target.locale,
    market: target.market,
    primaryType: target.primaryType,
    publishedCount: published.length,
    draftCount: drafts.length,
    missing,
    priorityScore,
    sampleTitles: matchedRows.slice(0, 3).map(({ row }) => row.title),
  };
}).sort((left, right) => right.priorityScore - left.priorityScore);

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  targetCount: targets.length,
  missingCount: coverage.filter((item) => item.missing).length,
  promoteQueue: rows
    .map((row) => {
      const meta = parseJson(row.meta);
      meta.tags = row.tags ? parseJson(row.tags) : [];
      meta.sections = row.sections ? parseJson(row.sections) : [];
      const assessment = assessPublication(row, meta);
      return {
        slug: row.slug,
        title: row.title,
        growthPlanKey: meta.growthPlanKey || '',
        locale: meta.locale || '',
        market: meta.market || '',
        status: row.status,
        source: row.source,
        ready: assessment.ready,
        score: assessment.score,
        reasons: assessment.reasons,
      };
    })
    .filter((item) => item.growthPlanKey)
    .filter((item) => item.status === 'draft')
    .sort((left, right) => right.score - left.score)
    .slice(0, 8),
  queue: coverage.filter((item) => item.missing || item.draftCount === 0).slice(0, 8),
  coverage,
}, null, 2));
