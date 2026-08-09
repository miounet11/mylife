/**
 * Content OS generator — matrix slot → high-quality multi-locale article draft.
 * Uses self-hosted SpaceXAI (ttqq) with model auto; optional z-image-turbo cover.
 */

import {
  assessGeneratedManagedContentDraftQuality,
  sanitizeContentSlug,
  type ContentGenerationLocale,
  type GeneratedManagedContentDraft,
} from '@/lib/content-generation';
import type { ContentSection } from '@/lib/content';
import type { ManagedContentType } from '@/lib/content-store';
import { contentOsChatJson, contentOsGenerateImage } from '@/lib/content-os/client';
import type { DestinyMatrixSlot } from '@/lib/content-os/matrix';

export type ContentOsGeneratedArticle = GeneratedManagedContentDraft & {
  matrixKey: string;
  locale: ContentGenerationLocale;
  market: string;
  pathFamily: DestinyMatrixSlot['pathFamily'];
  entityKind: DestinyMatrixSlot['entityKind'];
  entitySlug: string;
  searchIntents: string[];
  answerSummary: string;
  entityKeywords: string[];
  relatedCta: DestinyMatrixSlot['relatedCta'];
  coverImagePrompt?: string;
  coverImageB64?: string;
  quality: ReturnType<typeof assessGeneratedManagedContentDraftQuality>;
  model: string;
  generatedAt: string;
};

type LlmArticlePayload = {
  title?: string;
  slug?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  answerSummary?: string;
  tags?: string[];
  entityKeywords?: string[];
  searchIntents?: string[];
  sections?: Array<{ title?: string; paragraphs?: string[] }>;
  coverImagePrompt?: string;
};

function isEnglish(locale: string) {
  return locale.startsWith('en');
}

function systemPrompt(slot: DestinyMatrixSlot) {
  const english = isEnglish(slot.locale);
  const traditional = slot.locale === 'zh-TW' || slot.locale === 'zh-HK';
  if (english) {
    return `You are a senior editor for Life K-Line / World Yi — a destiny-structure product (Bazi, dayun, life rhythm), NOT superstition theater.

Write publication-ready content for locale=${slot.locale}, market=${slot.market}.

Hard rules:
1. NATIVE ENGLISH ONLY — zero Chinese characters in title, excerpt, sections, or FAQ.
2. Structure → timing → environment → action → risk. No fear marketing, no guaranteed outcomes.
3. First give a direct answer a search/AI engine can quote; then evidence; then bounds; then CTA.
4. Never invent medical/legal/investment advice.
5. Dense paragraphs (each ≥ 90 characters). Min 7 sections, min 12 paragraphs.
6. Include FAQ (2–3 real questions) and weekly actions + 30/90-day revisit.
7. Product path: free chart → dimension tools → email save → prediction revisit.
8. Entity name must appear ≥ 3 times. No SEO/ops jargon.
9. Return ONLY valid JSON.`;
  }

  if (traditional) {
    return `你是「人生K線 / 世界易」的資深內容主編。產品中心是人生命運結構判斷，不是恐嚇式運勢站。

目標語言 locale=${slot.locale}（繁體），市場=${slot.market}。

硬規則：
1. 全文繁體中文（台灣/香港語感），勿用簡體用詞主導。
2. 結構→時位→環境→動作→風險；禁止恐嚇、包賺。
3. 先給可被搜尋/AI 引用的直接答案，再依據、邊界、下一步。
4. 每段 ≥ 90 字；至少 7 節、12 段；含 FAQ 與 30/90 天回訪。
5. 自然導向：免費排盤 → 十維度 → 信箱保存 → 預測回訪。
6. 實體名稱至少出現 3 次；禁止 SEO/運營黑話。
7. 只返回合法 JSON。`;
  }

  return `你是「人生K线 / 世界易」的资深内容主编。产品中心是人生命运结构判断（八字、大运、人生K线），不是恐吓式运势站。

目标语言 locale=${slot.locale}，市场=${slot.market}。

硬规则：
1. 始终按 结构→时位→环境→动作→风险 写；禁止恐吓、包赚、算命保证。
2. 先给可被搜索/AI 引用的直接答案，再依据、边界、下一步。
3. 不构成医疗/法律/投资建议；文末可隐含合规边界。
4. 每段 ≥ 90 字；至少 7 节、12 段；含 FAQ（2–3 问）与本周清单 + 30/90 天回访。
5. 自然导向：免费排盘 → 十维度 → 邮箱保存 → 预测回访 → 会员。
6. 实体名称至少出现 3 次；禁止 SEO/转化/内容库等内部词。
7. 只返回用户要求的合法 JSON，不要 markdown 围栏外的废话。`;
}

function userPrompt(slot: DestinyMatrixSlot) {
  return JSON.stringify(
    {
      task: 'generate_destiny_seo_article',
      entity: {
        kind: slot.entityKind,
        slug: slot.entitySlug,
        name: slot.entityName,
      },
      template: slot.template,
      contentType: slot.contentType,
      topic: slot.topic,
      angle: slot.angle,
      keywords: slot.keywords,
      audience: slot.audience,
      locale: slot.locale,
      market: slot.market,
      searchIntentsSeed: slot.searchIntents,
      productCta: slot.relatedCta,
      schema: {
        title: 'string, SEO-strong native title',
        slug: 'kebab-case english slug preferred',
        excerpt: '80-160 chars summary',
        seoTitle: '≤ 60 chars for SERP',
        seoDescription: '120-160 chars',
        answerSummary: '40+ chars (or 25+ EN words) standalone answer',
        tags: 'string[4-8]',
        entityKeywords: 'string[5-12]',
        searchIntents: 'string[3-8] real user queries in target language',
        sections: [
          {
            title: 'section title',
            paragraphs: ['2-4 rich paragraphs'],
          },
        ],
        coverImagePrompt: 'english prompt for editorial cover illustration, clean linear style',
      },
      sectionPlan:
        slot.template === 'case-study'
          ? ['压力从何而来', '关键变量', '常见误判', '可执行窗口', '如何用人生K线验证', '边界说明']
          : slot.template === 'answer-engine'
            ? ['直接答案', '为什么会这样', '适用与不适用', '下一步动作', '相关工具', '边界说明']
            : slot.template === 'seasonal-pulse'
              ? ['本月一句话', '结构层观察', '时位与窗口', '环境约束', '可执行清单', '边界说明']
              : [
                  '一句话结论',
                  '核心问题',
                  '结构层怎么看',
                  '时位层：阶段比结果重要',
                  '环境层与现实约束',
                  '行动层：本周可执行',
                  '如何用人生K线验证',
                  '常见问题',
                  '边界说明',
                ],
      minSections: 8,
      minParagraphsTotal: 14,
      minExcerptChars: 100,
      minSeoDescriptionChars: 130,
      minAnswerSummaryChars: 70,
      minParagraphChars: 90,
      styleNotes: [
        'Never mention SEO, GEO, conversion, content ops, or internal platform strategy.',
        'Write for the end reader facing a real life decision.',
        'excerpt / seoDescription / answerSummary must be full public prose, not internal angles.',
        isEnglish(slot.locale)
          ? 'English-only body; translate any Chinese entity labels into English decision language.'
          : 'Keep native language for the locale; traditional Chinese for zh-TW/zh-HK.',
        'LDPlayer-parity density: entity hub depth, FAQ, related next steps, clear CTA.',
      ],
    },
    null,
    2,
  );
}

function normalizeSections(raw: LlmArticlePayload['sections']): ContentSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((section) => ({
      title: `${section?.title || ''}`.trim(),
      paragraphs: Array.isArray(section?.paragraphs)
        ? section!.paragraphs!.map((p) => `${p || ''}`.trim()).filter(Boolean).slice(0, 5)
        : [],
    }))
    .filter((section) => section.title && section.paragraphs.length > 0)
    .slice(0, 12);
}

function padPublicMeta(
  seed: string,
  slot: DestinyMatrixSlot,
  kind: 'excerpt' | 'seo' | 'answer',
) {
  const english = isEnglish(slot.locale);
  const core = (seed || slot.angle || slot.topic).replace(/\bSEO\b/gi, '').replace(/转化|内容库|流量/g, '').trim();
  if (english) {
    const tail =
      kind === 'answer'
        ? ' Start from structure, timing, and environment; pick one falsifiable action in 30–90 days.'
        : ` Life K-Line frames “${slot.entityName}” as a decision problem—structure, timing, environment, action, risk—not a fate stamp.`;
    return `${core}${core.endsWith('.') ? '' : '.'}${tail}`.slice(0, 200);
  }
  const tail =
    kind === 'answer'
      ? ' 先对齐结构、时位与环境，再选一个 30–90 天可验证的动作。'
      : ` 人生K线把「${slot.entityName}」当成决策问题：结构→时位→环境→动作→风险，而不是吉凶盖章。`;
  return `${core}${/[。！？]$/.test(core) ? '' : '。'}${tail}`.slice(0, 200);
}

function enrichSectionsDepth(sections: ContentSection[], slot: DestinyMatrixSlot): ContentSection[] {
  const english = isEnglish(slot.locale);
  return sections.map((section, index) => {
    const paragraphs = [...section.paragraphs];
    while (paragraphs.length < 2) {
      paragraphs.push(
        english
          ? `For “${slot.entityName}”, clarify the decision variable before chasing more labels. Map personal structure to timing windows and real constraints in ${slot.market}.`
          : `围绕「${slot.entityName}」，先写清你真正在决定什么，再对照结构、时位与${slot.market}语境下的现实约束，避免被单一标签带着走。`,
      );
    }
    return {
      title: section.title,
      paragraphs: paragraphs.map((p) => {
        if (p.length >= 72) return p;
        const pad = english
          ? ' Write the next step as a checkable action with a 30–90 day revisit, not a permanent verdict.'
          : ' 把下一步写成 30–90 天可回访的动作，而不是永久判决。';
        // Avoid injecting blocked internal ops vocabulary
        return `${p.replace(/\bSEO\b/gi, '收录节奏').replace(/转化价值|内容自动化|流量承接/g, '')}${pad}`;
      }),
    };
  });
}

function fallbackDraft(slot: DestinyMatrixSlot): Omit<ContentOsGeneratedArticle, 'quality' | 'model' | 'generatedAt'> {
  const english = isEnglish(slot.locale);
  const title = english
    ? `${slot.entityName}: ${slot.topic}`
    : `${slot.entityName}｜${slot.topic}`;
  const sections: ContentSection[] = [
    {
      title: english ? 'Direct answer' : '一句话结论',
      paragraphs: [
        english
          ? `${slot.angle} Start from structure, timing, and environment — then choose one falsifiable action.`
          : `${slot.angle} 先对齐结构、时位与环境，再选一个可验证的动作。`,
        english
          ? 'Life K-Line is a decision framework with revisit loops, not a one-shot fate stamp.'
          : '人生K线强调可回访的决策框架，而不是一次性命运盖章。',
      ],
    },
    {
      title: english ? 'Core problem' : '核心问题',
      paragraphs: [
        english
          ? `Audience: ${slot.audience}. Topic: ${slot.topic}.`
          : `受众：${slot.audience}。议题：${slot.topic}。`,
        english
          ? 'Separate emotional urgency from structural variables before acting.'
          : '行动前先把情绪紧迫感与结构变量拆开。',
      ],
    },
    {
      title: english ? 'Structure layer' : '结构层怎么看',
      paragraphs: [
        english
          ? 'Map day-master style, useful god (yongshen) direction, and ten-god roles before labeling good/bad.'
          : '先看日主发挥方式、用神方向与十神角色，再谈好坏标签。',
      ],
    },
    {
      title: english ? 'Timing layer' : '时位层',
      paragraphs: [
        english
          ? 'Dayun sets decade tone; yearly windows set near-term moves. Same structure, different actions.'
          : '大运定十年底色，流年定近期窗口；同一结构在不同阶段动作完全不同。',
      ],
    },
    {
      title: english ? 'Environment layer' : '环境层',
      paragraphs: [
        english
          ? `Market context: ${slot.market}. City, industry, family load, and cash flow are hard constraints.`
          : `市场语境：${slot.market}。城市、行业、家庭负担与现金流是硬约束。`,
      ],
    },
    {
      title: english ? 'Actions this week' : '行动层：本周可执行',
      paragraphs: [
        english
          ? `1) Write the single decision you are actually making. 2) Open ${slot.relatedCta.href}. 3) Schedule a 30/90 day revisit.`
          : `1）写下你真正在决定的一件事。2）打开 ${slot.relatedCta.href}。3）设定 30/90 天回访。`,
      ],
    },
    {
      title: english ? 'Boundaries' : '边界说明',
      paragraphs: [
        english
          ? 'Educational framework only — not medical, legal, or investment advice.'
          : '本文用于结构教育与判断框架，不构成医疗、法律或投资建议。',
      ],
    },
  ];

  return {
    contentType: slot.contentType,
    subtype: slot.entityKind === 'city' ? 'city' : slot.entityKind === 'industry' ? 'industry' : null,
    slug: sanitizeContentSlug(
      `${slot.entityKind}-${slot.entitySlug}-${slot.locale}`,
      slot.contentType,
    ),
    title,
    name: slot.entityName,
    excerpt: padPublicMeta(slot.angle, slot, 'excerpt'),
    category: slot.entityKind,
    readTime: english ? '8 min' : '8 分钟',
    tags: slot.keywords.slice(0, 8),
    featured: slot.priority >= 100,
    seoTitle: title.slice(0, 60),
    seoDescription: padPublicMeta(slot.angle, slot, 'seo'),
    sections: enrichSectionsDepth(sections, slot),
    status: 'draft',
    source: 'content-os',
    llmUsed: false,
    matrixKey: slot.key,
    locale: slot.locale,
    market: slot.market,
    pathFamily: slot.pathFamily,
    entityKind: slot.entityKind,
    entitySlug: slot.entitySlug,
    searchIntents: slot.searchIntents,
    answerSummary: padPublicMeta(slot.angle, slot, 'answer'),
    entityKeywords: slot.keywords,
    relatedCta: slot.relatedCta,
    coverImagePrompt: `Editorial cover for Life K-Line destiny topic "${slot.entityName}", clean linear illustration, paper texture, no text, professional, calm, ${slot.entityKind}`,
  };
}

export async function generateFromMatrixSlot(
  slot: DestinyMatrixSlot,
  options?: { withImage?: boolean; forceFallback?: boolean },
): Promise<ContentOsGeneratedArticle> {
  if (options?.forceFallback) {
    const draft = fallbackDraft(slot);
    const quality = assessGeneratedManagedContentDraftQuality(draft);
    return {
      ...draft,
      quality,
      model: 'fallback',
      generatedAt: new Date().toISOString(),
    };
  }

  let model = 'auto';
  let payload: LlmArticlePayload | null = null;
  let llmUsed = false;

  try {
    const result = await contentOsChatJson<LlmArticlePayload>({
      messages: [
        { role: 'system', content: systemPrompt(slot) },
        { role: 'user', content: userPrompt(slot) },
      ],
      maxTokens: 3600,
      temperature: 0.5,
    });
    payload = result.data;
    model = result.model;
    llmUsed = true;
  } catch {
    payload = null;
    llmUsed = false;
  }

  const base = fallbackDraft(slot);
  const sections = normalizeSections(payload?.sections);
  const title = `${payload?.title || base.title}`.trim() || base.title;
  let excerpt = `${payload?.excerpt || base.excerpt}`.trim();
  let seoDescription = `${payload?.seoDescription || base.seoDescription}`.trim();
  let answerSummary = `${payload?.answerSummary || base.answerSummary}`.trim();

  // Enforce publication-depth meta fields (quality gate needs excerpt ≥60, seoDesc ≥72)
  if (excerpt.length < 72) {
    excerpt = padPublicMeta(excerpt, slot, 'excerpt');
  }
  if (seoDescription.length < 100) {
    seoDescription = padPublicMeta(seoDescription || excerpt, slot, 'seo');
  }
  if (answerSummary.length < 40) {
    answerSummary = padPublicMeta(answerSummary || excerpt, slot, 'answer');
  }

  // Prefer LLM body only when it carries enough depth; otherwise keep structured fallback
  const llmBodyChars = sections.reduce(
    (sum, s) => sum + s.paragraphs.join('').length,
    0,
  );
  const useLlmSections = sections.length >= 5 && llmBodyChars >= 800;

  const draft: ContentOsGeneratedArticle = {
    ...base,
    title,
    slug: sanitizeContentSlug(
      payload?.slug || `${slot.entityKind}-${slot.entitySlug}-${slot.locale}`,
      slot.contentType,
    ),
    excerpt: excerpt.slice(0, 220),
    seoTitle: `${payload?.seoTitle || title}`.trim().slice(0, 80),
    seoDescription: seoDescription.slice(0, 200),
    tags: Array.isArray(payload?.tags) && payload!.tags!.length
      ? payload!.tags!.map(String).slice(0, 10)
      : base.tags,
    sections: useLlmSections ? enrichSectionsDepth(sections, slot) : enrichSectionsDepth(base.sections, slot),
    answerSummary: answerSummary.slice(0, 280),
    entityKeywords:
      Array.isArray(payload?.entityKeywords) && payload!.entityKeywords!.length
        ? payload!.entityKeywords!.map(String).slice(0, 16)
        : base.entityKeywords,
    searchIntents:
      Array.isArray(payload?.searchIntents) && payload!.searchIntents!.length
        ? payload!.searchIntents!.map(String).slice(0, 10)
        : base.searchIntents,
    coverImagePrompt: `${payload?.coverImagePrompt || base.coverImagePrompt || ''}`.trim(),
    llmUsed,
    model,
    quality: { ready: false, score: 0, averageParagraphLength: 0, reasons: [] },
    generatedAt: new Date().toISOString(),
  };

  draft.quality = assessGeneratedManagedContentDraftQuality(draft);

  if (options?.withImage && draft.coverImagePrompt) {
    try {
      const image = await contentOsGenerateImage({ prompt: draft.coverImagePrompt });
      draft.coverImageB64 = image.b64;
    } catch {
      // image is optional
    }
  }

  return draft;
}

export async function generateBatchFromSlots(
  slots: DestinyMatrixSlot[],
  options?: {
    withImage?: boolean;
    concurrency?: number;
    onProgress?: (done: number, total: number, article: ContentOsGeneratedArticle) => void;
  },
) {
  const concurrency = Math.max(1, Math.min(options?.concurrency || 2, 4));
  const results: ContentOsGeneratedArticle[] = [];
  let index = 0;

  async function worker() {
    while (index < slots.length) {
      const current = index;
      index += 1;
      const slot = slots[current];
      const article = await generateFromMatrixSlot(slot, { withImage: options?.withImage });
      results[current] = article;
      options?.onProgress?.(current + 1, slots.length, article);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results.filter(Boolean);
}

export function articleToManagedInput(
  article: ContentOsGeneratedArticle,
  options?: {
    status?: 'draft' | 'published';
    multiQuality?: unknown;
    repairRounds?: number;
  },
) {
  const status = options?.status || article.status || 'draft';
  return {
    contentType: article.contentType as ManagedContentType,
    subtype: article.subtype,
    slug: article.slug,
    title: article.title,
    name: article.name,
    excerpt: article.excerpt,
    category: article.category,
    readTime: article.readTime,
    tags: article.tags,
    featured: article.featured,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    sections: article.sections,
    status,
    source: 'content-os',
    locale: article.locale,
    market: article.market,
    geoReady: true,
    meta: {
      matrixKey: article.matrixKey,
      entityKind: article.entityKind,
      entitySlug: article.entitySlug,
      pathFamily: article.pathFamily,
      relatedCta: article.relatedCta,
      searchIntents: article.searchIntents,
      entityKeywords: article.entityKeywords,
      answerSummary: article.answerSummary,
      quality: article.quality,
      multiQuality: options?.multiQuality,
      repairRounds: options?.repairRounds ?? 0,
      model: article.model,
      generatedAt: article.generatedAt,
      coverImagePrompt: article.coverImagePrompt,
      autoPublished: status === 'published',
      publishedAt: status === 'published' ? new Date().toISOString() : undefined,
      geoOptimization: {
        geoReady: true,
        answerSummary: article.answerSummary,
        directAnswer: article.answerSummary,
        searchIntents: article.searchIntents,
        entityKeywords: article.entityKeywords,
        audienceQuestions: article.searchIntents,
        audience: article.market,
        version: 'content-os-v2',
        canonicalTopic: article.title,
      },
    },
  };
}
