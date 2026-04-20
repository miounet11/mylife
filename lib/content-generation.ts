import { callJsonLLM } from '@/lib/agentic-report/llm-client';
import { getEntityTypeLabel, type EntityInsightType } from '@/lib/content';
import type { ContentSection } from '@/lib/content';
import type { ContentStatus, ManagedContentType } from '@/lib/content-store';
import {
  getContentGenerationMaxTokens,
  getContentGenerationModel,
  getContentGenerationModelFallbackChainRaw,
  getContentGenerationTimeoutMs,
  isContentGenerationSegmentedEnabled,
  isContentGenerationSocraticEnabled,
} from '@/lib/env';

export type ContentGenerationMode = 'single' | 'cluster';
export type ContentGenerationLocale = 'zh-CN' | 'zh-TW' | 'zh-HK' | 'zh-SG' | 'zh-MY' | 'zh-US' | 'en-US' | 'en-GB' | 'en-SG';

export interface ContentGenerationInput {
  mode?: ContentGenerationMode;
  contentType?: ManagedContentType;
  subtype?: EntityInsightType;
  topic: string;
  angle?: string;
  platform?: string;
  keywords?: string[];
  audience?: string;
  locale?: ContentGenerationLocale;
  market?: string;
  entityName?: string;
  sourceSignals?: string;
  status?: ContentStatus;
  featured?: boolean;
}

export interface GeneratedManagedContentDraft {
  contentType: ManagedContentType;
  subtype: EntityInsightType | null;
  slug: string;
  title: string;
  name: string | null;
  excerpt: string;
  category: string | null;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  sections: ContentSection[];
  status: ContentStatus;
  source: string;
  llmUsed: boolean;
}

type RawGeneratedEntry = Partial<GeneratedManagedContentDraft> & {
  tags?: unknown;
  sections?: unknown;
  paragraphs?: unknown;
};

type RawGeneratedFrame = {
  title?: unknown;
  slug?: unknown;
  name?: unknown;
  excerpt?: unknown;
  category?: unknown;
  readTime?: unknown;
  tags?: unknown;
  featured?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
};

type RawGeneratedSection = {
  title?: unknown;
  paragraphs?: unknown;
};

type RawContentReasoningPlan = {
  effectiveness?: unknown;
  frameworks?: unknown;
  emotionalTriggers?: unknown;
  logicalTriggers?: unknown;
  audienceQuestions?: unknown;
  sectionGoals?: unknown;
  conversionBridge?: unknown;
};

type ContentReasoningPlan = {
  effectiveness: string[];
  frameworks: string[];
  emotionalTriggers: string[];
  logicalTriggers: string[];
  audienceQuestions: string[];
  sectionGoals: Array<{
    title: string;
    goal: string;
    angle: string;
  }>;
  conversionBridge: string;
};

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function parseModelChain(value: string | undefined, fallback: string[]) {
  const normalized = `${value || ''}`
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const merged = normalized.length ? normalized : fallback;
  return [...new Set(merged)];
}

export function resolveContentGenerationLlmConfig() {
  const model = getContentGenerationModel();
  const modelChain = parseModelChain(
    getContentGenerationModelFallbackChainRaw(),
    [model]
  );

  return {
    model,
    modelChain: modelChain.includes(model) ? modelChain : [model, ...modelChain],
    maxTokens: getContentGenerationMaxTokens(),
    disableHealthReorder: true,
  };
}

function isSocraticPlanningEnabled() {
  return isContentGenerationSocraticEnabled();
}

function isSegmentedContentGenerationEnabled() {
  return isContentGenerationSegmentedEnabled();
}

export function isAutomatedGrowthPlatform(platform?: string) {
  const value = `${platform || ''}`.trim().toLowerCase();
  return value === 'public-growth'
    || value === 'public-growth-wave2'
    || value === 'public-growth-global';
}

export function getEffectiveContentGenerationTimeoutMs(input?: ContentGenerationInput) {
  const baseTimeoutMs = getContentGenerationTimeoutMs();

  if (!isAutomatedGrowthPlatform(input?.platform)) {
    return baseTimeoutMs;
  }

  // Auto-growth rounds should finish quickly and fall back cleanly when upstream LLMs are slow.
  return Math.min(baseTimeoutMs, 8_000);
}

function isTraditionalChineseLocale(locale?: ContentGenerationLocale) {
  return locale === 'zh-TW' || locale === 'zh-HK';
}

function isEnglishLocale(locale?: ContentGenerationLocale) {
  return locale === 'en-US' || locale === 'en-GB' || locale === 'en-SG';
}

function buildLocalizedLabels(input?: ContentGenerationInput) {
  const traditional = isTraditionalChineseLocale(input?.locale);
  const english = isEnglishLocale(input?.locale);

  return {
    traditional,
    english,
    marketLabel: `${input?.market || ''}`.trim() || (english ? 'target market' : traditional ? '目標市場' : '目标市场'),
    deepDive: english ? 'Deep Dive' : traditional ? '深度解讀' : '深度解读',
    caseReview: english ? 'Case Review' : traditional ? '案例拆解' : '案例拆解',
    trendInsight: english ? 'Trend Insight' : traditional ? '趨勢洞察' : '趋势洞察',
  };
}

export function sanitizeContentSlug(value: string, fallbackPrefix: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  if (normalized) {
    return normalized.slice(0, 80);
  }

  return `${fallbackPrefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function sanitizeParagraphs(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function sanitizeReasoningList(value: unknown, minItems: number, maxItems: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  const items = value
    .map((item) => `${item || ''}`.trim())
    .filter(Boolean)
    .slice(0, maxItems);

  return items.length >= minItems ? items : [];
}

function sanitizeReasoningSectionGoals(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const title = `${(item as { title?: string })?.title || ''}`.trim();
      const goal = `${(item as { goal?: string })?.goal || ''}`.trim();
      const angle = `${(item as { angle?: string })?.angle || ''}`.trim();

      if (!title || !goal || !angle) {
        return null;
      }

      return { title, goal, angle };
    })
    .filter((item): item is ContentReasoningPlan['sectionGoals'][number] => !!item)
    .slice(0, 6);
}

function normalizeSections(
  value: unknown,
  topic: string,
  contentType: ManagedContentType,
  input?: ContentGenerationInput
) {
  if (!Array.isArray(value)) {
    return buildFallbackSections(topic, contentType, input);
  }

  const sections = value
    .map((item) => {
      const title = `${(item as { title?: string })?.title || ''}`.trim();
      const paragraphs = sanitizeParagraphs((item as { paragraphs?: unknown })?.paragraphs);

      if (!title || !paragraphs.length) {
        return null;
      }

      return {
        title,
        paragraphs,
      };
    })
    .filter((item): item is ContentSection => !!item)
    .slice(0, 6);

  return sections.length >= 4 ? sections : buildFallbackSections(topic, contentType, input);
}

const META_SECTION_TITLE_PATTERN = /为什么这个案例值得看|為什麼這個案例值得看|用户下一步应该做什么|下一步應該做什麼|如何转成个人分析|如何进入个人分析|如何進入個人分析|如何自然進入個人分析|如何與個人命盤結合|這個主題為什麼值得看|这个热点为什么值得看|這類內容有轉化價值|这类洞察有转化价值|这一页为什么值得被发布|為什麼這一頁值得長期發布|用户能从中得到什么|使用者能從中得到什麼/;

const META_SECTION_PARAGRAPH_PATTERN = /内容自动化|值得被发布|轉化價值|转化价值|內容頁和分析頁必須打通|内容页和分析页必须打通|成熟產品的承接|成熟产品的承接|站點內容庫|站点内容库/;

function sanitizePublicFacingSections(
  sections: ContentSection[],
  topic: string,
  contentType: ManagedContentType,
  input?: ContentGenerationInput
) {
  const fallbackSections = buildFallbackSections(topic, contentType, input);

  return sections.map((section, index) => {
    const fallbackSection = fallbackSections[index] || fallbackSections[fallbackSections.length - 1];
    const shouldReplace = (
      META_SECTION_TITLE_PATTERN.test(section.title)
      || section.paragraphs.some((paragraph) => META_SECTION_PARAGRAPH_PATTERN.test(paragraph))
    );

    if (!shouldReplace || !fallbackSection) {
      return section;
    }

    return fallbackSection;
  });
}

function mergeSectionsWithFallback(
  generatedSections: ContentSection[],
  topic: string,
  contentType: ManagedContentType,
  input?: ContentGenerationInput
) {
  const fallbackSections = buildFallbackSections(topic, contentType, input);
  const merged = [...generatedSections];
  const usedTitles = new Set(generatedSections.map((section) => section.title));

  for (const fallbackSection of fallbackSections) {
    if (merged.length >= 6) {
      break;
    }

    if (usedTitles.has(fallbackSection.title)) {
      continue;
    }

    merged.push(fallbackSection);
    usedTitles.add(fallbackSection.title);
  }

  return merged;
}

function formatReadTime(sections: ContentSection[], input?: ContentGenerationInput) {
  const paragraphCount = sections.reduce((sum, section) => sum + section.paragraphs.length, 0);
  const minutes = Math.max(4, Math.min(10, paragraphCount + 2));
  return isEnglishLocale(input?.locale) ? `${minutes} min read` : `${minutes} 分钟`;
}

function defaultCategory(contentType: ManagedContentType, subtype: EntityInsightType | null, input?: ContentGenerationInput) {
  if (isEnglishLocale(input?.locale)) {
    if (contentType === 'knowledge') {
      return 'Knowledge';
    }

    if (contentType === 'case') {
      return 'Case Study';
    }

    return 'Insight';
  }

  if (contentType === 'knowledge') {
    return '热点解读';
  }

  if (contentType === 'case') {
    return '真实场景';
  }

  return getEntityTypeLabel(subtype || 'industry');
}

function padParagraphForPublicationDepth(paragraph: string, input?: ContentGenerationInput) {
  const text = `${paragraph || ''}`.trim();
  if (text.length >= 36) {
    return text;
  }

  if (isEnglishLocale(input?.locale)) {
    return `${text} This is exactly why the reader still needs a fuller decision frame before acting.`;
  }

  if (isTraditionalChineseLocale(input?.locale)) {
    return `${text} 這也是為什麼讀者仍需要回到更完整的判斷框架再做決定。`;
  }

  return `${text} 这也是为什么读者仍需要回到更完整的判断框架再做决定。`;
}

function normalizeFallbackSectionsDepth(sections: ContentSection[], input?: ContentGenerationInput) {
  return sections.map((section) => ({
    ...section,
    paragraphs: (section.paragraphs || []).map((paragraph) => padParagraphForPublicationDepth(paragraph, input)),
  }));
}

function buildFallbackSections(topic: string, contentType: ManagedContentType, input?: ContentGenerationInput): ContentSection[] {
  const { traditional, english, marketLabel } = buildLocalizedLabels(input);

  if (english && contentType === 'case') {
    return normalizeFallbackSectionsDepth([
      {
        title: 'Why this pressure keeps intensifying',
        paragraphs: [
          `Around "${topic}", ${marketLabel} are rarely struggling with a single event. The real pressure usually comes from several forces stacking at once: market uncertainty, timing confusion, identity or family constraints, and the fear of making the wrong move too late.`,
          'Once people cannot tell whether they are facing a short-term dip, a structural shift, or a badly timed decision window, anxiety compounds quickly and turns even manageable choices into chronic hesitation.',
        ],
      },
      {
        title: 'Which variables matter first',
        paragraphs: [
          'The useful question is not "Should I act right now?" but "What exactly am I deciding between?" In most real cases, the key variables are direction, timing, downside cost, and how much runway a person actually has.',
          'A strong public-facing case study should therefore help readers separate emotional urgency from decision structure, so they can see which part of the problem is strategic and which part is merely reactive.',
        ],
      },
      {
        title: 'The most common mistakes and costs',
        paragraphs: [
          'People often borrow someone else’s playbook, mistake temporary stress for a long-term verdict, or assume that more information automatically means better decisions. In practice, these habits usually create more noise, not more clarity.',
          'When birth timing, location, current life stage, and real constraints are ignored, a useful framework becomes distorted. That distortion is what makes many readers feel they are "thinking harder" while actually getting less precise.',
        ],
      },
      {
        title: 'How to turn this into a personal decision',
        paragraphs: [
          'Public content can help readers understand the logic of a situation, but it cannot replace a decision calibrated to their own timing and context. The practical next step is to test the same variables against personal birth data, location, and the decision they are facing now.',
          'That is where a general framework becomes useful instead of decorative: readers move from broad recognition to a specific decision path, with clearer trade-offs, clearer timing, and fewer avoidable mistakes.',
        ],
      },
    ], input);
  }

  if (english && contentType === 'insight') {
    return normalizeFallbackSectionsDepth([
      {
        title: 'What this external shift is really changing',
        paragraphs: [
          `The point of "${topic}" is not that it is trending. The real issue is that it changes the decision environment for ${marketLabel}: what feels urgent, what becomes risky, and what kind of timing starts to matter more than before.`,
          'Good insight content should therefore translate a trend into decision conditions, instead of merely repeating headlines or dressing up uncertainty as destiny.',
        ],
      },
      {
        title: 'Should readers start with the market or with themselves',
        paragraphs: [
          'External conditions define the density of opportunity and risk, but they do not fully explain whether a specific person should advance, pause, or reconfigure their plan. That still depends on personal structure, life stage, and available margin for error.',
          'Readers need both layers: the environment to avoid blind optimism, and the personal lens to avoid mistaking a public trend for a private conclusion.',
        ],
      },
      {
        title: 'Which variables people overlook most often',
        paragraphs: [
          'The most expensive blind spots are usually not theoretical. They are practical: timezone differences, migration timing, family obligations, financial runway, and whether the current environment magnifies or suppresses a person’s strengths.',
          'Insight content becomes genuinely useful when it surfaces those ignored variables before a reader makes a high-cost decision.',
        ],
      },
      {
        title: 'How to convert a trend into personal judgment',
        paragraphs: [
          'The right next step is not to ask whether a trend matters in the abstract, but to identify which part of life it is changing: direction, timing, place, or resource allocation. That shift turns content into a usable diagnostic tool.',
          'Once readers can name the variables they need to check in their own case, they are far more likely to move from passive reading into structured personal analysis.',
        ],
      },
    ], input);
  }

  if (english) {
    return normalizeFallbackSectionsDepth([
      {
        title: 'What problem sits underneath the trend',
        paragraphs: [
          `Interest in "${topic}" keeps rising because readers are not really looking for jargon. They are looking for a more stable way to think through uncertainty, timing, and judgment without getting lost in oversimplified claims.`,
          'Strong evergreen content should therefore explain why the topic matters now, what kind of decisions it affects, and where readers are most likely to misunderstand it.',
        ],
      },
      {
        title: 'How a practical reader should interpret it',
        paragraphs: [
          'The most useful reading approach is to focus on structure, timing conditions, and decision boundaries instead of isolated labels or dramatic one-line predictions. That is how abstract metaphysical language becomes decision language.',
          'In other words, readers need a framework that helps them translate theory into application, rather than collect fragments that sound insightful but do not improve judgment.',
        ],
      },
      {
        title: 'Which variables build a real framework',
        paragraphs: [
          'A working framework needs at least three layers: baseline structure, time-based triggers, and real-world constraints. If one of those layers is missing, even a sophisticated concept becomes easy to misapply.',
          'Readers benefit most when content shows which factors are stable, which are temporary, and which ones can only be evaluated in a personal chart or case.',
        ],
      },
      {
        title: 'How to turn public knowledge into personal use',
        paragraphs: [
          'Public content should build orientation, not pretend to replace personal judgment. The next useful move is to test the framework against one’s own birth timing, location, and current decision pressure.',
          'That is how a knowledge page becomes conversion-ready without turning into hard sell copy: it gives enough clarity for readers to know why a personal reading would answer a different level of question.',
        ],
      },
    ], input);
  }

  if (contentType === 'case') {
    if (traditional) {
      return normalizeFallbackSectionsDepth([
        {
          title: '這類焦慮為什麼會持續放大',
          paragraphs: [
            `圍繞「${topic}」的諮詢裡，${marketLabel}真正承受的壓力，通常不是單一事件，而是外部環境變化、個人節奏失衡與判斷失據同時疊加的結果。`,
            '當一個人長期無法分辨自己面對的是短期波動、結構轉向還是窗口錯配，焦慮就會持續放大，甚至讓本來可以調整的問題變成被動承受。',
          ],
        },
        {
          title: '真正該先判斷哪些變量',
          paragraphs: [
            '比起急著問「要不要立刻行動」，更重要的是先分清楚：問題來自方向選錯、時機未到，還是現實條件根本沒有準備好。',
            '只要先抓住結構、時間窗口與代價三個核心變量，多數案例就能從情緒判斷轉回到更穩定的決策框架。',
          ],
        },
        {
          title: '最常見的誤區與代價',
          paragraphs: [
            '很多人會把短期焦慮誤讀成長期結論，或者把別人的成功/失敗路徑直接套用到自己身上，結果越看越亂。',
            '如果忽略出生時間、所處環境與當前階段的差異，原本用來輔助判斷的框架，反而會變成新的心理負擔與決策噪音。',
          ],
        },
        {
          title: '怎樣把判斷轉成下一步行動',
          paragraphs: [
            '公共案例最適合幫你建立判斷順序，但真正要做決定時，還是要把自己的出生資料、現實處境與關鍵問題一起放進去看。',
            '更務實的做法，是先用案例確定要核對的變量，再把個人資料帶入完整分析，確認哪些風險值得提前處理，哪些變化其實可以順勢而為。',
          ],
        },
      ], input);
    }

    return normalizeFallbackSectionsDepth([
      {
        title: '这类焦虑为什么会持续放大',
        paragraphs: [
          `围绕“${topic}”的咨询里，${marketLabel}真正承受的压力，往往不是单一事件，而是外部环境变化、个人节奏失衡和判断失据叠加后的结果。`,
          '当一个人分不清自己面对的是短期波动、结构转向还是窗口错配时，焦虑就会持续放大，甚至让原本可调的问题演变成被动局面。',
        ],
      },
      {
        title: '真正该先判断哪些变量',
        paragraphs: [
          '比起急着问“现在要不要行动”，更重要的是先分清楚问题来自方向选错、时机未到，还是现实条件根本没有准备好。',
          '只要先抓住结构、时间窗口和代价三类核心变量，多数案例就能从情绪判断转回到更稳定的决策框架。',
        ],
      },
      {
        title: '最常见的误区与代价',
        paragraphs: [
          '很多人会把短期焦虑误读成长期结论，或者直接套用别人的路径，结果越看越乱、越判断越失真。',
          '如果忽略出生时间、所处环境和当前阶段的差异，原本用来辅助判断的框架，反而会变成新的心理负担和决策噪音。',
        ],
      },
      {
        title: '怎样把判断转成下一步行动',
        paragraphs: [
          '公共案例最适合帮你建立判断顺序，但真正要做决定时，还是要把自己的出生资料、现实处境和关键问题一起放进去看。',
          '更务实的做法，是先用案例确定要核对的变量，再把个人资料带入完整分析，确认哪些风险值得提前处理，哪些变化其实可以顺势而为。',
        ],
      },
    ], input);
  }

  if (contentType === 'insight') {
    if (traditional) {
      return normalizeFallbackSectionsDepth([
        {
          title: '這個外部變化真正影響了什麼',
          paragraphs: [
            `「${topic}」之所以值得被關注，不是因為它一時熱門，而是因為它實際改變了${marketLabel}面對環境、節奏與選擇時的判斷條件。`,
            '真正有用的洞察，不是重複新聞事件，而是說清楚這個外部變化到底改動了哪些現實變量。',
          ],
        },
        {
          title: '一般使用者應先看環境還是先看自己',
          paragraphs: [
            '外部環境能決定機會與風險的密度，但真正決定你是否適合主動、觀望或修正的，仍然是個人結構與當下階段。',
            '先看大環境能避免逆勢行動，先看自己則能避免把公共趨勢錯當成個人命運，兩者缺一不可。',
          ],
        },
        {
          title: '哪些變量最容易被忽略',
          paragraphs: [
            '很多人只注意外部事件本身，卻忽略了時間窗口、所在地差異、身份轉換和家庭責任這些會改變決策成本的關鍵條件。',
            '洞察文章的價值，就在於把這些平常最容易被忽略、但真正影響結果的變量提前攤開。',
          ],
        },
        {
          title: '如何把外部趨勢轉成個人判斷',
          paragraphs: [
            '最務實的做法，不是只問這個趨勢會不會影響我，而是把它拆成自己需要核對的幾個問題：它影響的是時間、方向、地點，還是資源配置。',
            '當外部趨勢被翻譯成可核對的個人問題後，後續無論是自我規劃還是進一步分析，都會更有依據。',
          ],
        },
      ], input);
    }

    return normalizeFallbackSectionsDepth([
      {
        title: '这个外部变化真正影响了什么',
        paragraphs: [
          `“${topic}”值得被关注，不是因为它一时热门，而是因为它实际改变了${marketLabel}面对环境、节奏和选择时的判断条件。`,
          '真正有用的洞察，不是重复新闻现象，而是说清楚这个外部变化到底改动了哪些现实变量。',
        ],
      },
      {
        title: '普通用户应先看环境还是先看自己',
        paragraphs: [
          '外部环境会决定机会和风险的密度，但真正决定你是否适合主动、观望或修正的，仍然是个人结构和当前阶段。',
          '先看大环境能避免逆势行动，先看自己则能避免把公共趋势误当成个人命运，这两个步骤缺一不可。',
        ],
      },
      {
        title: '哪些变量最容易被忽略',
        paragraphs: [
          '很多人只注意外部事件本身，却忽略了时间窗口、所在地差异、身份转换和家庭责任这些会改变决策成本的关键条件。',
          '洞察内容真正的价值，就在于把这些平常最容易被忽略、但最影响结果的变量提前摊开。',
        ],
      },
      {
        title: '如何把外部趋势转成个人判断',
        paragraphs: [
          '最务实的做法，不是只问这个趋势会不会影响我，而是把它拆成自己需要核对的几个问题：它影响的是时间、方向、地理位置，还是资源配置。',
          '当外部趋势被翻译成可核对的个人问题后，后续无论是自我规划还是进一步分析，都会更有依据。',
        ],
      },
    ], input);
  }

  if (traditional) {
    return normalizeFallbackSectionsDepth([
      {
        title: '這個問題為什麼在此刻值得看',
        paragraphs: [
          `圍繞「${topic}」的搜尋和討論之所以持續升溫，核心不是術語本身，而是${marketLabel}希望找到更穩定的判斷框架。`,
          '成熟產品的內容，不應該放大焦慮，而應該幫助使用者更快抓住真正重要的變量。',
        ],
      },
      {
        title: '一般使用者應該怎麼理解',
        paragraphs: [
          '閱讀這類內容時，優先看結構、時機與風險邊界，而不是只盯著一個標籤或一句斷語。',
          '只有把命理語言翻譯成現實決策語言，內容才真正有用。',
        ],
      },
      {
        title: '建立判斷框架時要抓住哪些變量',
        paragraphs: [
          '真正有用的框架，至少要同時看結構、時間條件與現實限制，否則再多概念也很難轉成穩定判斷。',
          '當你能分清楚哪些是長期底層條件、哪些是短期觸發因素，閱讀這類內容才不會只停在知道名詞。',
        ],
      },
      {
        title: '如何把公共知識轉成個人判斷',
        paragraphs: [
          '公共知識最適合幫你建立理解邊界，但一旦進入具體人生選擇，仍需要回到出生資訊、所處環境與當下問題重新核對。',
          '更有效的學習方式，是先用公共內容建立框架，再用個人資料驗證哪些判斷真正適用於自己。',
        ],
      },
    ], input);
  }

  return normalizeFallbackSectionsDepth([
    {
      title: '热点背后的真实问题',
      paragraphs: [
        `围绕“${topic}”的讨论之所以持续升温，核心不是术语本身，而是${marketLabel}希望找到更稳定的判断框架。`,
        '一个成熟产品的内容，不应该放大焦虑，而应该帮助用户更快抓住关键变量。',
      ],
    },
    {
      title: '普通用户应该怎么理解',
      paragraphs: [
        '阅读这类内容时，优先看结构、时机和风险边界，而不是只盯着一个标签或一句断语。',
        '只有把命理语言翻译成现实决策语言，内容才真正有用。',
      ],
    },
    {
      title: '建立判断框架时要抓住哪些变量',
      paragraphs: [
        '真正有用的框架，至少要同时看结构、时间条件和现实限制，否则再多概念也很难转成稳定判断。',
        '当你能分清哪些是长期底层条件、哪些是短期触发因素，阅读这类内容才不会只停留在知道名词。',
      ],
    },
    {
      title: '如何把公共知识转成个人判断',
      paragraphs: [
        '公共知识最适合帮你建立理解边界，但一旦进入具体人生选择，仍需要回到出生信息、所处环境和当前问题重新核对。',
        '更有效的学习方式，是先用公共内容建立框架，再用个人资料验证哪些判断真正适用于自己。',
      ],
    },
  ], input);
}

function buildFallbackExcerpt(topic: string, contentType: ManagedContentType, input?: ContentGenerationInput) {
  const { traditional, english, marketLabel } = buildLocalizedLabels(input);

  if (english && contentType === 'case') {
    return `A grounded case-based explanation of "${topic}" for ${marketLabel}, showing where pressure builds, which variables matter first, and how public insight should translate into personal decision-making.`;
  }
  if (english && contentType === 'insight') {
    return `An insight-led breakdown of "${topic}" for ${marketLabel}, focused on how external change reshapes timing, risk, and judgment before readers move into a more personal analysis.`;
  }
  if (english) {
    return `A practical guide to "${topic}" for ${marketLabel}, clarifying the real question, the most common misunderstandings, and how public knowledge should connect to more personal judgment.`;
  }

  if (contentType === 'case') {
    return traditional
      ? `圍繞「${topic}」拆解${marketLabel}真正卡住的問題、判斷路徑與時間窗口，幫助讀者把案例理解快速轉成自己的下一步測算動作。`
      : `围绕“${topic}”的现实场景拆解${marketLabel}真正卡住的问题、判断路径与时间窗口，帮助读者把案例理解快速转成自己的下一步测算动作。`;
  }
  if (contentType === 'insight') {
    return traditional
      ? `圍繞「${topic}」提煉環境變化、熱點趨勢與個人決策之間的關係，幫助${marketLabel}把外部資訊轉成更清晰的個人判斷框架。`
      : `围绕“${topic}”提炼环境变化、热点趋势与个人决策之间的关系，帮助${marketLabel}把外部信息转换成更清晰的个人判断框架。`;
  }

  return traditional
    ? `圍繞「${topic}」解釋${marketLabel}最容易遇到的理解障礙、真實問題與常見誤區，並說清楚為什麼這類內容最終仍要回到個人生日測算才能得到更具體的判斷。`
    : `围绕“${topic}”解释${marketLabel}最容易遇到的理解障碍、真实问题与常见误区，并说明为什么这类内容最终仍要回到个人生日测算才能得到更具体的判断。`;
}

function buildFallbackSeoTitle(topic: string, contentType: ManagedContentType, input?: ContentGenerationInput) {
  const { traditional, english } = buildLocalizedLabels(input);

  if (english && contentType === 'case') {
    return `${topic}: How to judge timing, pressure, and the next move`;
  }
  if (english && contentType === 'insight') {
    return `${topic}: How external change affects personal judgment`;
  }
  if (english) {
    return `${topic}: A practical framework for understanding and applying it`;
  }

  if (contentType === 'case') {
    return traditional ? `${topic}案例拆解：一般使用者該如何看節奏與下一步` : `${topic}案例拆解：普通用户该如何看节奏与下一步`;
  }
  if (contentType === 'insight') {
    return traditional ? `${topic}趨勢洞察：環境變化怎樣影響個人判斷` : `${topic}趋势洞察：环境变化怎样影响个人判断`;
  }

  return traditional ? `${topic}深度解讀：一般使用者應該怎樣理解與應用` : `${topic}深度解读：普通用户应该怎样理解与应用`;
}

function buildFallbackSeoDescription(topic: string, contentType: ManagedContentType, input?: ContentGenerationInput) {
  const { traditional, english, marketLabel } = buildLocalizedLabels(input);

  if (english && contentType === 'case') {
    return `A practical case-led page on "${topic}" for ${marketLabel}, explaining where pressure comes from, which variables should be judged first, and how to convert public insight into a personal next step.`;
  }
  if (english && contentType === 'insight') {
    return `A decision-focused insight page on "${topic}" for ${marketLabel}, translating external change into the timing, risk, and judgment variables readers actually need to check.`;
  }
  if (english) {
    return `A practical knowledge page on "${topic}" for ${marketLabel}, clarifying the real question, the main misunderstandings, and how public learning should connect to personal analysis.`;
  }

  if (contentType === 'case') {
    return traditional
      ? `從「${topic}」這個現實場景出發，拆解${marketLabel}真正關心的風險、節奏與判斷邊界，並自然承接到更適合個人驗證的生日測算流程。`
      : `从“${topic}”这个现实场景出发，拆解${marketLabel}真正关心的风险、节奏和判断边界，并自然承接到更适合个人验证的生日测算流程。`;
  }
  if (contentType === 'insight') {
    return traditional
      ? `從「${topic}」延伸到外部環境、產業趨勢或地理變化，幫助${marketLabel}理解這個主題為什麼重要，以及如何進一步進入個人命盤分析。`
      : `从“${topic}”延伸到外部环境、行业趋势或地理变化，帮助${marketLabel}理解这个主题为什么重要，以及如何进一步进入个人命盘分析。`;
  }

  return traditional
    ? `圍繞「${topic}」提供更完整的問題解釋、誤區澄清與決策轉化路徑，幫助${marketLabel}從內容閱讀順暢過渡到自己的完整分析流程。`
    : `围绕“${topic}”提供更完整的问题解释、误区澄清和决策转化路径，帮助${marketLabel}从内容阅读顺畅过渡到自己的完整分析流程。`;
}

function buildFallbackReasoningPlan(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null
): ContentReasoningPlan {
  const traditional = isTraditionalChineseLocale(input.locale);
  const english = isEnglishLocale(input.locale);
  const marketLabel = input.market || (traditional ? '目標讀者' : '目标读者');
  const englishMarketLabel = input.market || 'target readers';

  if (english) {
    const sectionGoals = buildFallbackSections(input.topic, contentType, input).map((section) => ({
      title: section.title,
      goal: section.paragraphs[0] || 'Build a usable decision framework',
      angle: section.paragraphs[1] || 'Translate theory back into reader context',
    }));

    return {
      effectiveness: contentType === 'case'
        ? [
            'Case content should resolve a real decision knot before it introduces theory.',
            'Readers trust content more when it translates pressure, timing, and trade-offs into plain decision language.',
          ]
        : [
            'High-quality content should explain why the topic matters before it explains technical terms.',
            'Readers stay engaged when abstract metaphysical language is translated into a practical judgment framework.',
          ],
      frameworks: [
        'Define the real problem first, then clarify misunderstandings, then show application.',
        'Balance search intent, reading value, and the bridge into personal analysis.',
      ],
      emotionalTriggers: [
        `${englishMarketLabel} want clarity without being manipulated by vague certainty.`,
        'Readers want to understand which variables deserve attention right now.',
      ],
      logicalTriggers: [
        'Clarify timing conditions, decision boundaries, and common sources of error.',
        'Make the difference between public education and personal analysis explicit.',
      ],
      audienceQuestions: [
        'Why does this topic matter to me right now?',
        'Where am I most likely to misunderstand or misuse it?',
        'What should I do after reading this page?',
      ],
      sectionGoals,
      conversionBridge: 'End by showing how the public framework becomes more useful when applied to the reader’s own birth timing, place, and current decision context.',
    };
  }

  const effectiveness = contentType === 'case'
    ? [
        traditional ? '案例內容要先回答使用者當下卡點，而不是先堆理論' : '案例内容要先回答用户当下卡点，而不是先堆理论',
        traditional ? '判斷路徑必須能落回現實決策、時間窗口與代價權衡' : '判断路径必须能落回现实决策、时间窗口与代价权衡',
      ]
    : [
        traditional ? '高質量內容要先解釋這個問題為什麼重要' : '高质量内容要先解释这个问题为什么重要',
        traditional ? '要把抽象術語翻譯成一般使用者能操作的判斷框架' : '要把抽象术语翻译成普通用户能操作的判断框架',
      ];
  const frameworks = [
    traditional ? '先界定問題，再拆誤區，最後給出應用路徑' : '先界定问题，再拆误区，最后给出应用路径',
    traditional ? '兼顧搜尋意圖、閱讀價值與轉化承接' : '兼顾搜索意图、阅读价值与转化承接',
  ];
  const emotionalTriggers = [
    traditional ? `${marketLabel}希望更安心，不想被空泛說法帶著走` : `${marketLabel}希望更安心，不想被空泛说法带着走`,
    traditional ? '讀者想更快看懂自己真正該確認的變量' : '读者想更快看懂自己真正该确认的变量',
  ];
  const logicalTriggers = [
    traditional ? '說清楚判斷邊界、時間條件與常見誤差來源' : '说清楚判断边界、时间条件与常见误差来源',
    traditional ? '把公共內容與個人分析之間的分工交代清楚' : '把公共内容与个人分析之间的分工交代清楚',
  ];
  const audienceQuestions = [
    traditional ? '這個主題到底和我有什麼關係？' : '这个主题到底和我有什么关系？',
    traditional ? '我最容易看錯、用錯的地方在哪裡？' : '我最容易看错、用错的地方在哪里？',
    traditional ? '看完之後下一步應該怎麼做？' : '看完之后下一步应该怎么做？',
  ];
  const sectionGoals = buildFallbackSections(input.topic, contentType, input).map((section) => ({
    title: section.title,
    goal: section.paragraphs[0] || (traditional ? '補足理解框架' : '补足理解框架'),
    angle: section.paragraphs[1] || (traditional ? '把內容落回使用情境' : '把内容落回使用情境'),
  }));

  return {
    effectiveness,
    frameworks,
    emotionalTriggers,
    logicalTriggers,
    audienceQuestions,
    sectionGoals,
    conversionBridge: traditional
      ? '結尾要自然引導讀者把公共內容中的框架，帶回自己的生日與問題做進一步分析。'
      : '结尾要自然引导读者把公共内容中的框架，带回自己的生日与问题做进一步分析。',
  };
}

function normalizeReasoningPlan(
  value: RawContentReasoningPlan | null,
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null
) {
  const fallback = buildFallbackReasoningPlan(input, contentType, subtype);
  const effectiveness = sanitizeReasoningList(value?.effectiveness, 2, 4);
  const frameworks = sanitizeReasoningList(value?.frameworks, 2, 4);
  const emotionalTriggers = sanitizeReasoningList(value?.emotionalTriggers, 2, 4);
  const logicalTriggers = sanitizeReasoningList(value?.logicalTriggers, 2, 4);
  const audienceQuestions = sanitizeReasoningList(value?.audienceQuestions, 3, 5);
  const sectionGoals = sanitizeReasoningSectionGoals(value?.sectionGoals);
  const conversionBridge = `${value?.conversionBridge || ''}`.trim();

  return {
    effectiveness: effectiveness.length >= 2 ? effectiveness : fallback.effectiveness,
    frameworks: frameworks.length >= 2 ? frameworks : fallback.frameworks,
    emotionalTriggers: emotionalTriggers.length >= 2 ? emotionalTriggers : fallback.emotionalTriggers,
    logicalTriggers: logicalTriggers.length >= 2 ? logicalTriggers : fallback.logicalTriggers,
    audienceQuestions: audienceQuestions.length >= 3 ? audienceQuestions : fallback.audienceQuestions,
    sectionGoals: sectionGoals.length >= 4 ? sectionGoals : fallback.sectionGoals,
    conversionBridge: conversionBridge || fallback.conversionBridge,
  };
}

export function buildReasoningPlanPrompt(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null
) {
  const locale = input.locale || 'zh-CN';
  const traditionalChinese = locale === 'zh-TW' || locale === 'zh-HK';
  const english = isEnglishLocale(locale);
  const languageRule = english
    ? 'Please output the reasoning framework in English.'
    : traditionalChinese
      ? '請用繁體中文輸出思考框架。'
      : '请用简体中文输出思考框架。';

  return {
    system: [
      '你是 Life Kline 的内容策略主编。先不要直接写文章，而是先用苏格拉底式方式思考什么样的内容才真正有效。',
      '你要先回答：什么让这种内容有效；什么原则和框架适用；如何把这些原则应用到当前具体主题。',
      '输出必须具体、可执行、面向内容编辑，不要空泛。',
      english ? 'Write all JSON string values in natural English.' : '',
      languageRule,
      '只输出 JSON，不要输出 markdown，不要输出解释。',
    ].join('\n'),
    user: [
      '请先完成一份内容推理方案，再用于后续写作。',
      JSON.stringify({
        topic: input.topic,
        angle: input.angle || '',
        platform: input.platform || '',
        keywords: input.keywords || [],
        audience: input.audience || '',
        locale,
        market: input.market || '',
        entityName: input.entityName || '',
        sourceSignals: input.sourceSignals || '',
        contentType,
        subtype,
      }, null, 2),
      '严格输出以下 JSON 结构：',
      JSON.stringify({
        effectiveness: ['这种内容为什么有效', '这种内容为什么能建立信任'],
        frameworks: ['适用原则 1', '适用原则 2'],
        emotionalTriggers: ['应触发的情绪 1', '应触发的情绪 2'],
        logicalTriggers: ['应满足的理性判断 1', '应满足的理性判断 2'],
        audienceQuestions: ['读者最关心的问题 1', '读者最关心的问题 2', '读者最关心的问题 3'],
        sectionGoals: [
          {
            title: '小节标题',
            goal: '这一节要解决什么问题',
            angle: '这一节从什么角度切入',
          },
        ],
        conversionBridge: '如何自然承接到用户继续个人分析',
      }, null, 2),
    ].join('\n\n'),
  };
}

function serializeReasoningPlan(plan: ContentReasoningPlan) {
  return [
    '先基于以下前置推理方案写作，不要跳过：',
    `1. 内容为什么有效：${plan.effectiveness.join('；')}`,
    `2. 应采用的原则/框架：${plan.frameworks.join('；')}`,
    `3. 应触发的情绪线索：${plan.emotionalTriggers.join('；')}`,
    `4. 应满足的理性判断：${plan.logicalTriggers.join('；')}`,
    `5. 读者最关心的问题：${plan.audienceQuestions.join('；')}`,
    '6. 分节目标：',
    ...plan.sectionGoals.map((section, index) => `${index + 1}) ${section.title}｜目标：${section.goal}｜角度：${section.angle}`),
    `7. 转化承接：${plan.conversionBridge}`,
  ].join('\n');
}

function buildFramePrompt(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null,
  reasoningPlan: ContentReasoningPlan
) {
  const locale = input.locale || 'zh-CN';
  const traditionalChinese = locale === 'zh-TW' || locale === 'zh-HK';
  const english = isEnglishLocale(locale);
  const requestedShape = {
    title: english ? 'English title' : '中文标题',
    slug: 'english-slug-only',
    name: contentType === 'insight' ? (english ? 'Entity name' : '实体名') : null,
    excerpt: english ? '90 to 180 character excerpt' : '60到110字的摘要',
    category: english ? 'Category or scenario' : '分类或场景',
    readTime: contentType === 'knowledge' ? (english ? '6 min read' : '6 分钟') : null,
    tags: english ? ['tag 1', 'tag 2', 'tag 3', 'tag 4'] : ['标签1', '标签2', '标签3', '标签4'],
    featured: false,
    seoTitle: english ? 'SEO title' : 'SEO标题',
    seoDescription: english ? 'SEO description' : 'SEO描述',
  };

  return {
    system: [
      '你是 Life Kline 的内容总编。现在不要写整篇文章，只生成文章框架元信息。',
      english ? 'Use natural English.' : traditionalChinese ? '使用繁體中文。' : '使用简体中文。',
      '标题、摘要、SEO 标题、SEO 描述要成熟、专业、可搜索，不要写成口播标题党。',
      'slug 必须是英文小写连字符格式。',
      '只输出 JSON，不要输出 markdown，不要输出解释。',
    ].join('\n'),
    user: [
      '请基于以下推理方案生成文章框架元信息。',
      JSON.stringify({
        topic: input.topic,
        angle: input.angle || '',
        platform: input.platform || '',
        keywords: input.keywords || [],
        audience: input.audience || '',
        locale,
        market: input.market || '',
        entityName: input.entityName || '',
        sourceSignals: input.sourceSignals || '',
        contentType,
        subtype,
      }, null, 2),
      serializeReasoningPlan(reasoningPlan),
      '严格输出以下 JSON 结构：',
      JSON.stringify(requestedShape, null, 2),
    ].join('\n\n'),
  };
}

function buildSectionPrompt(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  sectionGoal: ContentReasoningPlan['sectionGoals'][number],
  reasoningPlan: ContentReasoningPlan
) {
  const locale = input.locale || 'zh-CN';
  const traditionalChinese = locale === 'zh-TW' || locale === 'zh-HK';
  const english = isEnglishLocale(locale);

  return {
    system: [
      '你是 Life Kline 的内容编辑。现在只写单个 section，不要输出整篇文章。',
      english ? 'Use natural English.' : traditionalChinese ? '使用繁體中文。' : '使用简体中文。',
      '每个 section 必须有 2 段完整文字，每段要有信息密度，不要短句堆砌。',
      '语言要克制、可信、可读，避免玄虚和空泛。',
      '只输出 JSON，不要输出 markdown，不要输出解释。',
    ].join('\n'),
    user: [
      '请基于以下主题和推理方案，只生成一个 section。',
      JSON.stringify({
        topic: input.topic,
        angle: input.angle || '',
        audience: input.audience || '',
        market: input.market || '',
        locale,
        contentType,
        sectionGoal,
      }, null, 2),
      serializeReasoningPlan(reasoningPlan),
      '严格输出以下 JSON 结构：',
      JSON.stringify({
        title: sectionGoal.title,
        paragraphs: english ? ['Paragraph one', 'Paragraph two'] : ['第一段', '第二段'],
      }, null, 2),
    ].join('\n\n'),
  };
}

function buildTypePrompt(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null,
  reasoningPlan?: ContentReasoningPlan | null
) {
  const locale = input.locale || 'zh-CN';
  const traditionalChinese = locale === 'zh-TW' || locale === 'zh-HK';
  const english = isEnglishLocale(locale);
  const languageRule = english
    ? 'Title, excerpt, SEO fields, and body must use natural English; slug must be lowercase kebab-case.'
    : traditionalChinese
      ? '标题、摘要、正文用繁体中文；slug 必须是英文小写连字符格式。'
      : '标题、摘要、正文用简体中文；slug 必须是英文小写连字符格式。';
  const marketRule = input.market
    ? english
      ? `The content must match the real context, vocabulary, and decision pressure of ${input.market}; do not write generic internet copy.`
      : `内容必须贴合${input.market}的现实场景、问题表达和用词习惯，不能只写成大陆通用模板。`
    : english
      ? 'The content must reflect the real context and language of the target reader; do not write generic filler.'
      : '内容必须贴合目标用户的现实场景和问题表达，不能写成空泛模板。';
  const localeRule = locale === 'zh-US'
    ? '如果主题涉及海外华人，优先解释时区、夏令时、出生地、海外迁移、跨文化关系等真实变量。'
    : locale === 'en-US' || locale === 'en-GB' || locale === 'en-SG'
      ? 'Use natural English. If the topic touches Bazi, true solar time, relocation, diaspora identity, or cross-cultural relationships, explain those concepts clearly instead of assuming prior Chinese metaphysics knowledge.'
    : locale === 'zh-TW'
      ? '使用台湾用户更自然的表达，例如命盤、排盤、流年、工作、感情等，不要混入明显大陆口语。'
      : locale === 'zh-HK'
        ? '使用香港用户更自然的表达，例如轉工、事業、感情、時機、移居等，不要写成大陆资讯站口吻。'
        : locale === 'zh-SG' || locale === 'zh-MY'
          ? '适当贴合新马华人的工作、家庭、跨城通勤与教育场景，但不要堆砌地域标签。'
          : '';
  const commonRules = [
    '你是 Life Kline 的内容总编与增长策略专家，擅长把社交媒体热点转成成熟、可信、可转化、可 SEO 的站点内容。',
    '目标读者是普通用户，不是专业术数研究者。',
    '文风要克制、专业、清楚，避免浮夸营销、神神叨叨、绝对化宿命论。',
    '内容需要自然承接“用户继续填写生日并进入个人分析”的动作，但不能写成硬广。',
    '写作前先依据“为什么有效、遵循什么框架、如何应用到当前主题”的顺序组织内容。',
    languageRule,
    marketRule,
    localeRule,
    'tags 输出 4 到 8 个，不要重复。',
    'sections 输出 4 到 6 个，每个 section 2 段，每段都要完整、可读、不是短句。',
    '正文必须兼顾热度和常青价值，不能只像一条短视频口播稿。',
    '只输出 JSON，不要输出 markdown，不要输出解释。',
  ].filter(Boolean);

  const typeRules = contentType === 'knowledge'
    ? [
        english
          ? 'This is a knowledge article. Explain why the topic matters, how a practical reader should understand it, and where the common mistakes appear.'
          : '这是知识文章，重点是解释一个热点话题为什么重要、普通用户应该怎么理解、如何避免误区。',
        english
          ? 'Use category labels such as Knowledge / Foundations / Decision Framework / Interpretation / Method.'
          : 'category 适合写成“基础认知 / 热点解读 / 决策应用 / 结果解读 / 产品方法”等。',
        english ? 'readTime must be present, for example "6 min read".' : 'readTime 必须给出，例如“6 分钟”。',
        english ? 'name must be null.' : 'name 必须为 null。',
      ]
    : contentType === 'case'
    ? [
        english
          ? 'This is a case article. Focus on a real scenario, the reader’s decision knot, the judgment path, and how public insight bridges into personal analysis.'
          : '这是案例文章，重点是现实场景、用户问题、判断路径、产品如何承接。',
        english
          ? 'category should describe the real scenario, such as Career Shift, Relationship Timing, Relocation Decision, or Education Choice.'
          : 'category 要写成案例场景，例如“职业转岗”“婚恋关系”“升学决策”。',
        english ? 'readTime must be null.' : 'readTime 必须为 null。',
        english ? 'name must be null.' : 'name 必须为 null。',
      ]
    : [
        english ? `This is an insight article. subtype=${subtype || 'industry'}.` : `这是洞察文章，subtype=${subtype || 'industry'}。`,
        english ? 'category must be Insight.' : `category 必须使用 ${getEntityTypeLabel(subtype || 'industry')}。`,
        english ? 'title should clearly name the entity or subject; name should contain the entity or insight object.' : 'title 需要体现实体或主题，name 需要是实体名或该洞察对象名。',
        english ? 'readTime must be null.' : 'readTime 必须为 null。',
      ];

  const requestedShape = {
    title: english ? 'English title' : '中文标题',
    slug: 'english-slug-only',
    name: contentType === 'insight' ? (english ? 'Entity name' : '实体名') : null,
    excerpt: english ? '90 to 180 character excerpt' : '60到110字的摘要',
    category: english ? 'Category or scenario' : '分类或场景',
    readTime: contentType === 'knowledge' ? (english ? '6 min read' : '6 分钟') : null,
    tags: english ? ['tag 1', 'tag 2', 'tag 3', 'tag 4'] : ['标签1', '标签2', '标签3', '标签4'],
    featured: false,
    seoTitle: english ? 'SEO title' : 'SEO标题',
    seoDescription: english ? 'SEO description' : 'SEO描述',
    sections: [
      {
        title: english ? 'Section title' : '小节标题',
        paragraphs: english ? ['Paragraph one', 'Paragraph two'] : ['第一段', '第二段'],
      },
    ],
  };

  return {
    system: [...commonRules, ...typeRules].join('\n'),
    user: [
      '请根据以下输入生成一篇适合发布到 Life Kline 的内容草稿。',
      JSON.stringify({
        topic: input.topic,
        angle: input.angle || '',
        platform: input.platform || '',
        keywords: input.keywords || [],
        audience: input.audience || '',
        locale,
        market: input.market || '',
        entityName: input.entityName || '',
        sourceSignals: input.sourceSignals || '',
        contentType,
        subtype,
      }, null, 2),
      reasoningPlan ? serializeReasoningPlan(reasoningPlan) : '',
      '严格输出以下 JSON 结构：',
      JSON.stringify(requestedShape, null, 2),
    ].join('\n\n'),
  };
}

export function normalizeGeneratedContentDraft(params: {
  raw: RawGeneratedEntry | null;
  input: ContentGenerationInput;
  contentType: ManagedContentType;
  subtype: EntityInsightType | null;
  llmUsed: boolean;
}): GeneratedManagedContentDraft {
  const topic = params.input.topic.trim();
  const labels = buildLocalizedLabels(params.input);
  const sections = normalizeSections(params.raw?.sections, topic, params.contentType, params.input);
  const fallbackPrefix = params.contentType === 'insight'
    ? `${params.subtype || 'insight'}-insight`
    : params.contentType;
  const title = `${params.raw?.title || ''}`.trim() || (
    labels.english
      ? `${topic} ${params.contentType === 'case' ? labels.caseReview : params.contentType === 'insight' ? labels.trendInsight : labels.deepDive}`
      : `${topic}的${params.contentType === 'case' ? labels.caseReview : params.contentType === 'insight' ? labels.trendInsight : labels.deepDive}`
  );
  const slug = sanitizeContentSlug(`${params.raw?.slug || ''}`, fallbackPrefix);
  const tags = uniqueStrings(
    Array.isArray(params.raw?.tags)
      ? params.raw.tags.map((item) => `${item || ''}`)
      : [...(params.input.keywords || []), topic, params.input.platform || '命理']
  ).slice(0, 8);
  const excerpt = `${params.raw?.excerpt || ''}`.trim() || buildFallbackExcerpt(topic, params.contentType, params.input);
  const category = `${params.raw?.category || ''}`.trim() || defaultCategory(params.contentType, params.subtype, params.input);
  const readTime = params.contentType === 'knowledge'
    ? `${params.raw?.readTime || ''}`.trim() || formatReadTime(sections, params.input)
    : null;
  const seoTitle = `${params.raw?.seoTitle || ''}`.trim() || buildFallbackSeoTitle(topic, params.contentType, params.input);
  const seoDescription = `${params.raw?.seoDescription || ''}`.trim() || buildFallbackSeoDescription(topic, params.contentType, params.input);
  const name = params.contentType === 'insight'
    ? `${params.raw?.name || ''}`.trim() || params.input.entityName?.trim() || title.replace(/趋势|洞察|解读/g, '').trim() || title
    : null;
  const publicFacingSections = sanitizePublicFacingSections(sections, topic, params.contentType, params.input);

  return {
    contentType: params.contentType,
    subtype: params.contentType === 'insight' ? (params.subtype || 'industry') : null,
    slug,
    title,
    name,
    excerpt,
    category,
    readTime,
    tags: tags.length ? tags : [topic, '命理'],
    featured: params.input.featured === true || params.raw?.featured === true,
    seoTitle,
    seoDescription,
    sections: publicFacingSections,
    status: params.input.status || 'draft',
    source: params.llmUsed
      ? `agent-llm:${params.input.platform || 'site'}`
      : `agent-fallback:${params.input.platform || 'site'}`,
    llmUsed: params.llmUsed,
  };
}

async function generateSegmentedDraft(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null,
  reasoningPlan: ContentReasoningPlan,
  timeoutMs: number,
  llmConfig: ReturnType<typeof resolveContentGenerationLlmConfig>
) {
  const framePrompt = buildFramePrompt(input, contentType, subtype, reasoningPlan);
  const frame = await callJsonLLM<RawGeneratedFrame>({
    system: framePrompt.system,
    user: framePrompt.user,
    temperature: 0.45,
    timeoutMs: Math.min(timeoutMs, 90_000),
    maxTokens: Math.min(1000, llmConfig.maxTokens),
    model: llmConfig.model,
    modelChain: llmConfig.modelChain,
    traceLabel: `content-frame:${contentType}`,
    scope: 'agent',
    disableHealthReorder: llmConfig.disableHealthReorder,
  });

  const sectionGoals = reasoningPlan.sectionGoals.slice(0, 4);
  const generatedSections: ContentSection[] = [];

  for (const [index, sectionGoal] of sectionGoals.entries()) {
    const sectionPrompt = buildSectionPrompt(input, contentType, sectionGoal, reasoningPlan);
    const section = await callJsonLLM<RawGeneratedSection>({
      system: sectionPrompt.system,
      user: sectionPrompt.user,
      temperature: 0.55,
      timeoutMs: Math.min(timeoutMs, 75_000),
      maxTokens: Math.min(900, llmConfig.maxTokens),
      model: llmConfig.model,
      modelChain: llmConfig.modelChain,
      traceLabel: `content-section:${contentType}:${index + 1}`,
      scope: 'agent',
      disableHealthReorder: llmConfig.disableHealthReorder,
    });

    const title = `${section?.title || sectionGoal.title}`.trim();
    const paragraphs = sanitizeParagraphs(section?.paragraphs);
    if (title && paragraphs.length >= 2) {
      generatedSections.push({
        title,
        paragraphs,
      });
    }
  }

  if (!frame && generatedSections.length === 0) {
    return null;
  }

  return {
    ...frame,
    sections: mergeSectionsWithFallback(
      generatedSections,
      input.topic.trim(),
      contentType,
      input
    ),
  } as RawGeneratedEntry;
}

async function generateDraftForType(
  input: ContentGenerationInput,
  contentType: ManagedContentType,
  subtype: EntityInsightType | null
) {
  const timeoutMs = getEffectiveContentGenerationTimeoutMs(input);
  const llmConfig = resolveContentGenerationLlmConfig();
  const useFastDraftPath = isAutomatedGrowthPlatform(input.platform);
  const planningEnabled = isSocraticPlanningEnabled() && !useFastDraftPath;
  const segmentedEnabled = isSegmentedContentGenerationEnabled() && !useFastDraftPath;
  const reasoningPrompt = buildReasoningPlanPrompt(input, contentType, subtype);
  const reasoningPlan = planningEnabled
    ? normalizeReasoningPlan(
        await callJsonLLM<RawContentReasoningPlan>({
          system: reasoningPrompt.system,
          user: reasoningPrompt.user,
          temperature: 0.35,
          timeoutMs: Math.min(timeoutMs, 90_000),
          maxTokens: Math.min(1200, llmConfig.maxTokens),
          model: llmConfig.model,
          modelChain: llmConfig.modelChain,
          traceLabel: `content-plan:${contentType}`,
          scope: 'agent',
          disableHealthReorder: llmConfig.disableHealthReorder,
        }),
        input,
        contentType,
        subtype
      )
    : null;
  const result = reasoningPlan && segmentedEnabled
    ? await generateSegmentedDraft(
        input,
        contentType,
        subtype,
        reasoningPlan,
        timeoutMs,
        llmConfig
      )
    : await (async () => {
        const prompt = buildTypePrompt(input, contentType, subtype, reasoningPlan);
        return callJsonLLM<RawGeneratedEntry>({
          system: prompt.system,
          user: prompt.user,
          temperature: 0.55,
          timeoutMs,
          maxTokens: llmConfig.maxTokens,
          model: llmConfig.model,
          modelChain: llmConfig.modelChain,
          traceLabel: `content:${contentType}`,
          scope: 'agent',
          disableHealthReorder: llmConfig.disableHealthReorder,
        });
      })();

  return normalizeGeneratedContentDraft({
    raw: result,
    input,
    contentType,
    subtype,
    llmUsed: !!result,
  });
}

function resolveRequestedTypes(input: ContentGenerationInput) {
  if (input.mode === 'cluster') {
    return ['knowledge', 'case', 'insight'] as ManagedContentType[];
  }

  return [input.contentType || 'knowledge'];
}

export async function generateManagedContentDrafts(input: ContentGenerationInput) {
  const requestedTypes = resolveRequestedTypes(input);
  const subtype = input.subtype || 'industry';
  const entries = await Promise.all(
    requestedTypes.map((contentType) =>
      generateDraftForType(input, contentType, contentType === 'insight' ? subtype : null)
    )
  );

  const llmSucceededCount = entries.filter((item) => item.llmUsed).length;

  return {
    entries,
    llmSucceededCount,
    fallbackCount: entries.length - llmSucceededCount,
  };
}
