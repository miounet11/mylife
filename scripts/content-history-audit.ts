/**
 * Historical content audit / remediation for Google people-first recovery.
 *
 * Aligns with docs/ldplayer-ops-and-google-alignment.md
 *
 *   npx tsx scripts/content-history-audit.ts --report
 *   npx tsx scripts/content-history-audit.ts --demote-thin --limit 100
 *   npx tsx scripts/content-history-audit.ts --protect-sources content-os,seed
 *   npx tsx scripts/content-history-audit.ts --restore --limit 50
 *   npx tsx scripts/content-history-audit.ts --restore --source-includes engine-llm:encyclopedia-2 --limit 20
 *
 * --demote-thin: set status=draft for high-risk thin/template published rows
 *                (does NOT delete; reversible). Prefer report-only first.
 * --restore: re-publish drafts previously demoted by this family of tools
 *            (meta.demotedBy starts with content-history-audit).
 */

import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '../lib/content-store';

type Risk = 'keep' | 'review' | 'thin' | 'template' | 'ops-jargon';

type Row = {
  id: string;
  slug: string;
  title: string;
  source: string;
  contentType: string;
  status: string;
  risk: Risk;
  score: number;
  reasons: string[];
  chars: number;
  sections: number;
};

const OPS_JARGON =
  /内容自动化|转化价值|流量承接|站点内容库|\bSEO\b|\bGEO\b|soft-?404|程序化|内容工厂|crawl budget/i;
const TEMPLATEISH =
  /完整指南|最全合集|终极指南|Best\s+.+\s+202\d|Top\s+\d+|如何用结构·时位·环境判断/i;
const FEAR = /必破财|百分百|包准|绝对准|不改名就|立刻转运必/i;

function parseArgs(argv: string[]) {
  const get = (name: string, fallback = '') => {
    const i = argv.indexOf(name);
    if (i === -1) return fallback;
    return argv[i + 1] || fallback;
  };
  const protect = get('--protect-sources', 'content-os,seed,world-yi')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    demoteThin: argv.includes('--demote-thin'),
    restore: argv.includes('--restore'),
    limit: Number(get('--limit', '500')) || 500,
    protect,
    minChars: Number(get('--min-chars', '900')) || 900,
    minSections: Number(get('--min-sections', '4')) || 4,
    sourceIncludes: get('--source-includes', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function bodyStats(entry: ManagedContentEntry) {
  const sections = entry.sections || [];
  const chars = sections.reduce(
    (n, s) => n + (s.title || '').length + (s.paragraphs || []).join('').length,
    0,
  );
  return { sections: sections.length, chars };
}

function classify(entry: ManagedContentEntry, args: ReturnType<typeof parseArgs>): Row {
  const { sections, chars } = bodyStats(entry);
  const text = [
    entry.title,
    entry.excerpt,
    entry.seoTitle,
    entry.seoDescription,
    ...(entry.tags || []),
    ...(entry.sections || []).flatMap((s) => [s.title, ...(s.paragraphs || [])]),
  ].join('\n');

  const reasons: string[] = [];
  let risk: Risk = 'keep';
  let score = 70;

  if (chars < args.minChars) {
    reasons.push(`body short (${chars}<${args.minChars})`);
    score -= 25;
    risk = 'thin';
  }
  if (sections < args.minSections) {
    reasons.push(`sections ${sections}<${args.minSections}`);
    score -= 15;
    if (risk === 'keep') risk = 'thin';
  }
  if (TEMPLATEISH.test(entry.title || '') || TEMPLATEISH.test(text.slice(0, 400))) {
    reasons.push('template-like title/opening');
    score -= 20;
    risk = risk === 'thin' ? 'thin' : 'template';
  }
  if (OPS_JARGON.test(text)) {
    reasons.push('ops/SEO jargon in body');
    score -= 30;
    risk = 'ops-jargon';
  }
  if (FEAR.test(text)) {
    reasons.push('fear/absolute marketing');
    score -= 25;
    if (risk === 'keep') risk = 'review';
  }
  // Engine batch libraries often share structure — flag for review if source matches
  const src = `${entry.source || ''}`;
  if (/engine-llm:case-library|engine-llm:keyword|encyclopedia-2:en/i.test(src) && chars < 1500) {
    reasons.push(`batch source ${src}`);
    score -= 10;
    if (risk === 'keep') risk = 'review';
  }
  if (score >= 55 && reasons.length === 0) risk = 'keep';
  if (score >= 45 && score < 55 && risk === 'keep') risk = 'review';

  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    source: src,
    contentType: entry.contentType,
    status: entry.status,
    risk,
    score: Math.max(0, Math.min(100, score)),
    reasons,
    chars,
    sections,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.restore) {
    const drafts = listManagedContentEntries().filter((e) => {
      if (e.status !== 'draft') return false;
      const by = String((e.meta as { demotedBy?: string } | undefined)?.demotedBy || '');
      if (!by.startsWith('content-history-audit')) return false;
      if (args.sourceIncludes.length === 0) return true;
      const src = String(e.source || '');
      return args.sourceIncludes.some((p) => src.includes(p));
    });
    const pool = drafts.slice(0, args.limit);
    let restored = 0;
    for (const entry of pool) {
      const meta = { ...(entry.meta || {}) } as Record<string, unknown>;
      const previous = meta.previousStatus === 'published' ? 'published' : 'published';
      delete meta.demotedBy;
      delete meta.demotedAt;
      delete meta.demoteRisk;
      delete meta.demoteReasons;
      delete meta.previousStatus;
      delete meta.demoteScore;
      meta.restoredBy = 'content-history-audit';
      meta.restoredAt = new Date().toISOString();
      saveManagedContentEntry(
        { ...entry, status: previous as 'published', meta },
        'content-history-audit-restore',
      );
      restored += 1;
      console.log('restored', entry.slug, entry.source);
    }
    console.log(JSON.stringify({ phase: 'restore-done', candidates: drafts.length, restored }, null, 2));
    return;
  }

  const entries = listManagedContentEntries().filter((e) => e.status === 'published');
  const rows = entries.map((e) => classify(e, args));

  const buckets: Record<Risk, Row[]> = {
    keep: [],
    review: [],
    thin: [],
    template: [],
    'ops-jargon': [],
  };
  for (const r of rows) buckets[r.risk].push(r);

  const summary = {
    phase: 'report',
    totalPublished: rows.length,
    buckets: Object.fromEntries(
      Object.entries(buckets).map(([k, v]) => [k, v.length]),
    ),
    protectSources: args.protect,
    demoteThin: args.demoteThin,
    samples: {
      thin: buckets.thin.slice(0, 8).map((r) => ({
        slug: r.slug,
        source: r.source,
        score: r.score,
        reasons: r.reasons,
      })),
      template: buckets.template.slice(0, 8).map((r) => ({
        slug: r.slug,
        source: r.source,
        score: r.score,
        reasons: r.reasons,
      })),
      ops: buckets['ops-jargon'].slice(0, 5).map((r) => ({
        slug: r.slug,
        source: r.source,
        reasons: r.reasons,
      })),
    },
    guidance: {
      northStar: 'indexable clicks → chart/chat, not URL count',
      keep: 'real entity satellites, unique angles, adequate depth',
      demote: 'thin/template/ops-jargon → draft (reversible)',
      next: 're-submit slim sitemap; GSC URL inspection on hubs',
    },
  };
  console.log(JSON.stringify(summary, null, 2));

  if (!args.demoteThin) return;

  const demotePool = [...buckets.thin, ...buckets.template, ...buckets['ops-jargon']]
    .filter((r) => !args.protect.some((p) => r.source.includes(p)))
    .sort((a, b) => a.score - b.score)
    .slice(0, args.limit);

  let demoted = 0;
  for (const r of demotePool) {
    const entry = entries.find((e) => e.id === r.id);
    if (!entry) continue;
    saveManagedContentEntry(
      {
        ...entry,
        status: 'draft',
        meta: {
          ...(entry.meta || {}),
          demotedBy: 'content-history-audit',
          demotedAt: new Date().toISOString(),
          demoteRisk: r.risk,
          demoteReasons: r.reasons,
          previousStatus: 'published',
        },
      },
      'content-history-audit',
    );
    demoted += 1;
    console.log('demoted', r.risk, r.slug, r.score, r.reasons.join('; '));
  }
  console.log(JSON.stringify({ phase: 'done', demoted }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
