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

  const needFullRewrite = !current.llmUsed;

  while (rounds < maxRounds && (!multi.publishReady || needFullRewrite && rounds === 0)) {
    rounds += 1;
    const english = isEnglish(slot.locale);
    const traditional = slot.locale === 'zh-TW' || slot.locale === 'zh-HK';
    const brief = buildRepairBrief(multi);
    const hubHref =
      slot.hubHref ||
      `/topics/${slot.entityKind === 'life-question' ? `q-${slot.entitySlug}` : `${slot.entityKind}-${slot.entitySlug}`}`;

    try {
      const { data, model } = await contentOsChatJson<RepairPayload>({
        maxTokens: 4200,
        temperature: 0.35,
        messages: [
          {
            role: 'system',
            content: english
              ? `You are chief editor for Life K-Line. People-first Google quality (not doorway pages).
LDPlayer model: entity hub satellite solving one real job; unique angle; structure→timing→environment→action→risk.
Native English only. Dense FAQ. Link hub + product CTA. No SEO jargon / fear marketing.
Return ONLY full JSON rewrite.`
              : traditional
                ? `你是人生K線主編。People-first 可收錄標準（禁止 doorway 換皮）。
雷電模式：實體中樞下的衛星文，解決一個真實任務；獨特角度；結構→時位→環境→動作→風險。
繁體中文。含 FAQ、中樞與產品內鏈。禁止 SEO 黑話/恐嚇。
只返回完整 JSON 重寫。`
                : `你是人生K线主编。People-first 可收录标准（禁止 doorway 换皮）。
雷电模式：实体中枢下的卫星文，解决一个真实任务；独特角度；结构→时位→环境→动作→风险。
简体中文。含 FAQ、中枢与产品内链。禁止 SEO 黑话/恐吓。
只返回完整 JSON 重写。`,
          },
          {
            role: 'user',
            content: JSON.stringify(
              {
                task: current.llmUsed ? 'repair_satellite_article' : 'full_rewrite_from_job',
                mode: needFullRewrite || !current.llmUsed ? 'full_rewrite' : 'repair',
                locale: slot.locale,
                market: slot.market,
                userJob: slot.topic,
                uniqueAngle: slot.angle,
                entity: {
                  kind: slot.entityKind,
                  slug: slot.entitySlug,
                  name: slot.entityName,
                  hubHref,
                },
                productCta: slot.relatedCta,
                sourceDemandTitle: slot.sourceDemandTitle,
                qualityBrief: brief,
                currentArticle: current.llmUsed
                  ? {
                      title: current.title,
                      excerpt: current.excerpt,
                      seoTitle: current.seoTitle,
                      seoDescription: current.seoDescription,
                      answerSummary: current.answerSummary,
                      tags: current.tags,
                      entityKeywords: current.entityKeywords,
                      searchIntents: current.searchIntents,
                      sections: current.sections,
                    }
                  : null,
                outputSchema: {
                  title: 'string task/decision style',
                  excerpt: 'string 100+',
                  seoTitle: 'string',
                  seoDescription: 'string 120+',
                  answerSummary: 'string 70+',
                  tags: 'string[≤8]',
                  entityKeywords: 'string[5-10]',
                  searchIntents: 'string[3-6]',
                  sections: [{ title: 'string', paragraphs: ['string 90+ each'] }],
                },
                hardRequirements: [
                  english ? 'ZERO Chinese characters in title/body' : 'primary language matches locale',
                  'min 8 sections, min 14 paragraphs',
                  'include FAQ section with 2+ Q&A',
                  'include explicit weekly actions + 30/90 day revisit',
                  `mention entity name「${slot.entityName}」≥ 3 times`,
                  `mention hub path ${hubHref} and CTA ${slot.relatedCta.href} naturally in body`,
                  'no SEO/转化/内容库 jargon',
                  'title is a real user job, not Best/Top/终极合集',
                  'uniqueAngle must remain non-swappable if entity name changes',
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
      if (current.llmUsed && multi.publishReady) break;
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
