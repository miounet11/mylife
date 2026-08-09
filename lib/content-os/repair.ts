/**
 * LLM multi-pass repair for Content OS articles.
 * No human review — scorer finds weak dimensions, model rewrites until publishReady or max rounds.
 */

import type { ContentSection } from '@/lib/content';
import { assessGeneratedManagedContentDraftQuality } from '@/lib/content-generation';
import { contentOsChatJson } from '@/lib/content-os/client';
import type { ContentOsGeneratedArticle } from '@/lib/content-os/generator';
import type { DestinyMatrixSlot } from '@/lib/content-os/matrix';
import {
  buildRepairBrief,
  scoreContentOsDimensions,
  type MultiDimensionQuality,
} from '@/lib/content-os/quality-dimensions';

export type RepairedArticle = ContentOsGeneratedArticle & {
  multiQuality: MultiDimensionQuality;
  repairRounds: number;
  publishedReady: boolean;
};

type RepairPayload = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  answerSummary?: string;
  tags?: string[];
  entityKeywords?: string[];
  searchIntents?: string[];
  sections?: Array<{ title?: string; paragraphs?: string[] }>;
};

function isEnglish(locale: string) {
  return locale.startsWith('en');
}

function normalizeSections(raw: RepairPayload['sections']): ContentSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((section) => ({
      title: `${section?.title || ''}`.trim(),
      paragraphs: Array.isArray(section?.paragraphs)
        ? section!.paragraphs!.map((p) => `${p || ''}`.trim()).filter(Boolean).slice(0, 6)
        : [],
    }))
    .filter((s) => s.title && s.paragraphs.length > 0)
    .slice(0, 14);
}

function mergeArticle(
  base: ContentOsGeneratedArticle,
  payload: RepairPayload,
  model: string,
): ContentOsGeneratedArticle {
  const sections = normalizeSections(payload.sections);
  const next: ContentOsGeneratedArticle = {
    ...base,
    title: `${payload.title || base.title}`.trim() || base.title,
    excerpt: `${payload.excerpt || base.excerpt}`.trim() || base.excerpt,
    seoTitle: `${payload.seoTitle || payload.title || base.seoTitle}`.trim().slice(0, 80),
    seoDescription: `${payload.seoDescription || base.seoDescription}`.trim().slice(0, 220),
    answerSummary: `${payload.answerSummary || base.answerSummary}`.trim(),
    tags:
      Array.isArray(payload.tags) && payload.tags.length
        ? payload.tags.map(String).slice(0, 12)
        : base.tags,
    entityKeywords:
      Array.isArray(payload.entityKeywords) && payload.entityKeywords.length
        ? payload.entityKeywords.map(String).slice(0, 16)
        : base.entityKeywords,
    searchIntents:
      Array.isArray(payload.searchIntents) && payload.searchIntents.length
        ? payload.searchIntents.map(String).slice(0, 10)
        : base.searchIntents,
    sections: sections.length >= 5 ? sections : base.sections,
    llmUsed: true,
    model,
  };
  next.quality = assessGeneratedManagedContentDraftQuality(next);
  return next;
}

export async function repairContentOsArticle(
  article: ContentOsGeneratedArticle,
  slot: DestinyMatrixSlot,
  options?: { maxRounds?: number; minPublishScore?: number },
): Promise<RepairedArticle> {
  const maxRounds = Math.max(0, Math.min(options?.maxRounds ?? 2, 4));
  let current = article;
  let multi = scoreContentOsDimensions(current, slot);
  let rounds = 0;

  while (rounds < maxRounds && !multi.publishReady) {
    rounds += 1;
    const english = isEnglish(slot.locale);
    const traditional = slot.locale === 'zh-TW' || slot.locale === 'zh-HK';
    const brief = buildRepairBrief(multi);

    try {
      const { data, model } = await contentOsChatJson<RepairPayload>({
        maxTokens: 4000,
        temperature: 0.35,
        messages: [
          {
            role: 'system',
            content: english
              ? `You are a chief editor repairing Life K-Line public articles for Google-quality publication.
Rules: native English only; structure→timing→environment→action→risk; no fear marketing; no SEO jargon; dense paragraphs; FAQ; product path to free chart / dimensions / revisit.
Return ONLY JSON with full rewritten fields.`
              : traditional
                ? `你是人生K線主編，負責把稿件修到可自動發布水準。
規則：使用繁體中文（台灣/香港語感）；結構→時位→環境→動作→風險；禁止恐嚇與 SEO 黑話；段落信息密度高；含 FAQ 與產品路徑。
只返回完整 JSON。`
                : `你是人生K线主编，负责把稿件修到可自动发布水准。
规则：简体中文；结构→时位→环境→动作→风险；禁止恐吓与 SEO 黑话；段落信息密度高；含 FAQ 与产品路径（免费排盘/十维度/回访）。
只返回完整 JSON。`,
          },
          {
            role: 'user',
            content: JSON.stringify(
              {
                task: 'repair_destiny_article',
                locale: slot.locale,
                market: slot.market,
                entity: {
                  kind: slot.entityKind,
                  slug: slot.entitySlug,
                  name: slot.entityName,
                },
                productCta: slot.relatedCta,
                qualityBrief: brief,
                currentArticle: {
                  title: current.title,
                  excerpt: current.excerpt,
                  seoTitle: current.seoTitle,
                  seoDescription: current.seoDescription,
                  answerSummary: current.answerSummary,
                  tags: current.tags,
                  entityKeywords: current.entityKeywords,
                  searchIntents: current.searchIntents,
                  sections: current.sections,
                },
                outputSchema: {
                  title: 'string',
                  excerpt: 'string 90+',
                  seoTitle: 'string',
                  seoDescription: 'string 120+',
                  answerSummary: 'string 60+',
                  tags: 'string[]',
                  entityKeywords: 'string[]',
                  searchIntents: 'string[]',
                  sections: [{ title: 'string', paragraphs: ['string 90+ each'] }],
                },
                hardRequirements: [
                  english ? 'ZERO Chinese characters in title/body' : 'primary language matches locale',
                  'min 7 sections, min 12 paragraphs',
                  'include FAQ section with 2+ Q&A',
                  'include explicit weekly actions + 30/90 day revisit',
                  'mention entity name ≥ 3 times',
                  'no SEO/转化/内容库 jargon',
                ],
              },
              null,
              2,
            ),
          },
        ],
      });
      current = mergeArticle(current, data, model);
      multi = scoreContentOsDimensions(current, slot);
    } catch {
      // keep current; break to avoid infinite empty loops
      break;
    }
  }

  return {
    ...current,
    multiQuality: multi,
    repairRounds: rounds,
    publishedReady: multi.publishReady,
    quality: {
      ...current.quality,
      ready: multi.publishReady || current.quality.ready,
      score: Math.max(current.quality.score, multi.overall),
      reasons: multi.publishReady
        ? []
        : multi.dimensions.filter((d) => d.score < 75).flatMap((d) => d.reasons).slice(0, 6),
    },
  };
}

export async function repairBatch(
  items: Array<{ article: ContentOsGeneratedArticle; slot: DestinyMatrixSlot }>,
  options?: { maxRounds?: number; concurrency?: number },
) {
  const concurrency = Math.max(1, Math.min(options?.concurrency || 1, 3));
  const results: RepairedArticle[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index;
      index += 1;
      const item = items[i];
      results[i] = await repairContentOsArticle(item.article, item.slot, {
        maxRounds: options?.maxRounds ?? 2,
      });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results.filter(Boolean);
}
