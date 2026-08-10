/**
 * Thicken short brand / methodology seeds with LLM (people-first).
 *
 *   npx tsx scripts/content-seed-thicken.ts --limit 5
 *   npx tsx scripts/content-seed-thicken.ts --slugs world-yi-v1-manifesto,true-solar-time-guide
 *   npx tsx scripts/content-seed-thicken.ts --needs-thicken --limit 8
 *   npx tsx scripts/content-seed-thicken.ts --dry-run
 *
 * North star: indexable, useful depth — not keyword stuffing.
 * Constitution: docs/ldplayer-ops-and-google-alignment.md
 */

import {
  listManagedContentEntries,
  saveManagedContentEntry,
  type ManagedContentEntry,
} from '../lib/content-store';
import { contentOsChatJson } from '../lib/content-os/client';
import type { ContentSection } from '../lib/content';

type ThickPayload = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  answerSummary?: string;
  tags?: string[];
  sections?: Array<{ title?: string; paragraphs?: string[] }>;
};

function parseArgs(argv: string[]) {
  const get = (name: string, fallback = '') => {
    const i = argv.indexOf(name);
    if (i === -1) return fallback;
    return argv[i + 1] || fallback;
  };
  return {
    dryRun: argv.includes('--dry-run'),
    needsThicken: argv.includes('--needs-thicken') || !argv.includes('--slugs'),
    limit: Number(get('--limit', '6')) || 6,
    minChars: Number(get('--min-chars', '750')) || 750,
    targetChars: Number(get('--target-chars', '1600')) || 1600,
    slugs: get('--slugs', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function charsOf(entry: ManagedContentEntry) {
  return (entry.sections || []).reduce(
    (n, s) => n + (s.title || '').length + (s.paragraphs || []).join('').length,
    0,
  );
}

function normalizeSections(raw: ThickPayload['sections']): ContentSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => ({
      title: `${s?.title || ''}`.trim(),
      paragraphs: Array.isArray(s?.paragraphs)
        ? s!
            .paragraphs!.map((p) => `${p || ''}`.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [],
    }))
    .filter((s) => s.title && s.paragraphs.length > 0)
    .slice(0, 12);
}

function pickCandidates(args: ReturnType<typeof parseArgs>): ManagedContentEntry[] {
  const pub = listManagedContentEntries().filter((e) => e.status === 'published');
  let pool = pub;

  if (args.slugs.length) {
    pool = pub.filter((e) => args.slugs.includes(e.slug));
  } else if (args.needsThicken) {
    pool = pub.filter((e) => {
      const meta = (e.meta || {}) as { needsThicken?: boolean };
      if (meta.needsThicken) return true;
      if (String(e.source || '').includes('seed') && charsOf(e) < args.minChars) return true;
      // methodology-ish short pages
      if (/world-yi|true-solar|how-to-read-bazi|methodology/i.test(e.slug) && charsOf(e) < 1100) {
        return true;
      }
      return false;
    });
  }

  return pool
    .map((e) => ({ e, chars: charsOf(e) }))
    .sort((a, b) => a.chars - b.chars)
    .slice(0, args.limit)
    .map((x) => x.e);
}

async function thickenOne(entry: ManagedContentEntry, targetChars: number): Promise<{
  entry: ManagedContentEntry;
  model: string;
  before: number;
  after: number;
}> {
  const before = charsOf(entry);
  const existing = (entry.sections || [])
    .map((s) => `## ${s.title}\n${(s.paragraphs || []).join('\n')}`)
    .join('\n\n')
    .slice(0, 2500);

  const { data, model } = await contentOsChatJson<ThickPayload>({
    maxTokens: 4500,
    temperature: 0.45,
    messages: [
      {
        role: 'system',
        content: `你是「人生K线 / 世界易」的资深内容编辑。任务：把偏短的品牌/方法论文章加厚成可收录、对人有用的中文正文。

硬性要求：
1. People-first：服务真实决策，不写 SEO/转化/流量/内容库等运营黑话
2. 结构·时位·环境 方法论一致；可执行、可回访，不恐吓、不绝对化
3. 输出严格 JSON：title, excerpt, seoTitle, seoDescription, answerSummary, tags[], sections[{title, paragraphs[]}]
4. sections 至少 6 个；全文汉字合计约 ${targetChars}–${Math.round(targetChars * 1.4)} 字
5. 保留原标题核心语义，可小幅润色；保留原 slug 语义
6. 至少包含：问题场景、判断步骤、边界与误区、30天可回访动作、FAQ(≥3)
7. CTA 自然：有用之后再指向免费排盘/十维度，不硬广`,
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            slug: entry.slug,
            contentType: entry.contentType,
            currentTitle: entry.title,
            currentExcerpt: entry.excerpt,
            currentSeo: { title: entry.seoTitle, description: entry.seoDescription },
            currentBody: existing,
            instruction: '在保留核心主张的前提下加厚，补足证据钩子与可执行步骤。',
          },
          null,
          2,
        ),
      },
    ],
  });

  let sections = normalizeSections(data.sections);
  // Prefer ≥5 sections; accept ≥4 if depth is already enough after merge
  if (sections.length < 4) {
    throw new Error(`THICKEN_TOO_FEW_SECTIONS:${entry.slug}:${sections.length}`);
  }
  // If model returned thin structure, keep original sections as prefix material
  if (sections.length < 5 && (entry.sections || []).length > 0) {
    const seen = new Set(sections.map((s) => s.title));
    for (const s of entry.sections || []) {
      if (seen.has(s.title)) continue;
      sections.push(s);
      seen.add(s.title);
      if (sections.length >= 6) break;
    }
  }

  const next: ManagedContentEntry = {
    ...entry,
    title: `${data.title || entry.title}`.trim() || entry.title,
    excerpt: `${data.excerpt || entry.excerpt}`.trim() || entry.excerpt,
    seoTitle: `${data.seoTitle || data.title || entry.seoTitle}`.trim().slice(0, 80),
    seoDescription: `${data.seoDescription || entry.seoDescription}`.trim().slice(0, 220),
    tags:
      Array.isArray(data.tags) && data.tags.length
        ? data.tags.map(String).slice(0, 12)
        : entry.tags,
    sections,
    status: 'published',
    meta: {
      ...(entry.meta || {}),
      needsThicken: false,
      thickenedBy: 'content-seed-thicken',
      thickenedAt: new Date().toISOString(),
      thickenModel: model,
      thickenBeforeChars: before,
      answerSummary: `${data.answerSummary || ''}`.trim() || entry.meta?.answerSummary,
    },
  };

  const after = charsOf(next);
  if (after < Math.min(1100, targetChars * 0.7)) {
    throw new Error(`THICKEN_STILL_SHORT:${entry.slug}:${after}`);
  }

  return { entry: next, model, before, after };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const candidates = pickCandidates(args);

  console.log(
    JSON.stringify(
      {
        phase: 'plan',
        dryRun: args.dryRun,
        count: candidates.length,
        targets: candidates.map((e) => ({
          slug: e.slug,
          source: e.source,
          chars: charsOf(e),
          needsThicken: Boolean((e.meta as { needsThicken?: boolean } | undefined)?.needsThicken),
        })),
      },
      null,
      2,
    ),
  );

  if (args.dryRun || candidates.length === 0) {
    console.log(JSON.stringify({ phase: 'done', thickened: 0, dryRun: args.dryRun }, null, 2));
    return;
  }

  const results: Array<Record<string, unknown>> = [];
  for (const entry of candidates) {
    try {
      const { entry: next, model, before, after } = await thickenOne(entry, args.targetChars);
      saveManagedContentEntry(next, 'content-seed-thicken');
      results.push({
        ok: true,
        slug: entry.slug,
        before,
        after,
        model,
        sections: next.sections.length,
      });
      console.log('thickened', entry.slug, `${before}->${after}`, model);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ ok: false, slug: entry.slug, error: message.slice(0, 240) });
      console.error('failed', entry.slug, message.slice(0, 240));
    }
  }

  console.log(
    JSON.stringify(
      {
        phase: 'done',
        thickened: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok).length,
        results,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
