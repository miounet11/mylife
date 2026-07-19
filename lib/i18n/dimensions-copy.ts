/**
 * EN/zh chrome for dimensions hub: titles, questions, intent labels, grid UI.
 * Engine config (`lib/dimensions/config.ts`) stays Chinese; UI picks via locale.
 */

import type { DimensionMaturity, DimensionSlug } from '@/lib/dimensions/types';
import type { FunnelIntent } from '@/lib/dimensions/intent-source';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export type DimensionUiFields = {
  title: string;
  question: string;
  description: string;
  /** Optional disclaimer; empty when the dimension has none. */
  disclaimer: string;
};

type DimensionCopyEntry = {
  title: Tri;
  question: Tri;
  description: Tri;
  disclaimer?: Tri;
};

const DIMENSION_COPY: Record<DimensionSlug, DimensionCopyEntry> = {
  'fortune-rhythm': {
    title: { 'zh-CN': '运势节奏', 'zh-Hant': '運勢節奏', en: 'Fortune rhythm' },
    question: {
      'zh-CN': '我现在处在什么阶段？下一个转折点何时？',
      'zh-Hant': '我現在處在什麼階段？下一個轉折點何時？',
      en: 'What stage am I in now? When is the next turning point?',
    },
    description: {
      'zh-CN': '基于人生 K 线锚点、大运交接与流年节奏，给出阶段判断与行动窗口。',
      en: 'Stage judgment and action windows from Life K-Line anchors, luck-cycle handoffs, and yearly rhythm.',
    },
  },
  'career-industry': {
    title: { 'zh-CN': '工作行业', 'zh-Hant': '工作行業', en: 'Career & industry' },
    question: {
      'zh-CN': '我适合什么行业/岗位？什么时候适合跳槽？',
      en: 'Which industry or role fits me? When is a good time to switch?',
    },
    description: {
      'zh-CN': '用神、十神与大运窗口叠加行业五行库，给出适配行业与转换节奏。',
      en: 'Favorable elements, ten gods, and luck windows mapped to industry fit and transition timing.',
    },
  },
  investment: {
    title: { 'zh-CN': '投资理财', 'zh-Hant': '投資理財', en: 'Investment & wealth' },
    question: {
      'zh-CN': '我的资金节奏偏激进还是保守？今年宜进宜守？',
      en: 'Is my capital rhythm aggressive or conservative? Advance or hold this year?',
    },
    description: {
      'zh-CN': '财星、比劫与运势窗口映射资产类型，输出节奏建议（非投资建议）。',
      en: 'Wealth stars and cycle windows mapped to asset rhythm (not investment advice).',
    },
    disclaimer: {
      'zh-CN': '仅供节奏参考，不构成投资建议或收益承诺。',
      en: 'Rhythm reference only—not investment advice or a return promise.',
    },
  },
  naming: {
    title: { 'zh-CN': '起名 / 改名', en: 'Naming / rename' },
    question: {
      'zh-CN': '这个名字五行是否补用神？改名方向如何？',
      en: 'Does this name complement favorable elements? What rename direction?',
    },
    description: {
      'zh-CN': '用神匹配 + 字音字义结构，评估姓名对命盘的补充度。',
      en: 'Favorable-element match plus sound/meaning structure to score name support for the chart.',
    },
    disclaimer: {
      'zh-CN': '姓名五行评估仅供参考，不承诺任何具体结果。',
      en: 'Name five-element assessment is reference only; no specific outcome is promised.',
    },
  },
  health: {
    title: { 'zh-CN': '身体健康', en: 'Health' },
    question: {
      'zh-CN': '哪些系统易偏弱？何时宜体检/调养？',
      en: 'Which systems tend weaker? When to check up or recover?',
    },
    description: {
      'zh-CN': '五行生理衰减与日主对应，给出体质倾向与养生节奏（非医学诊断）。',
      en: 'Five-element constitution tendencies and recovery rhythm (not a medical diagnosis).',
    },
    disclaimer: {
      'zh-CN': '生活方式参考，不能替代医疗诊断与治疗。',
      en: 'Lifestyle reference only—not a substitute for medical diagnosis or treatment.',
    },
  },
  'study-career': {
    title: { 'zh-CN': '学业事业', en: 'Study & career' },
    question: {
      'zh-CN': '升学/考试方向？职业瓶颈如何突破？',
      en: 'Study or exam direction? How to break career plateaus?',
    },
    description: {
      'zh-CN': '印星食伤与流年文昌，匹配学科五行与备考节奏。',
      en: 'Resource and output stars with yearly study windows matched to subject rhythm.',
    },
  },
  marriage: {
    title: { 'zh-CN': '谈婚论嫁', 'zh-Hant': '談婚論嫁', en: 'Marriage & love' },
    question: {
      'zh-CN': '何时遇正缘？婚期窗口？关系节奏如何？',
      en: 'When might the right person appear? Wedding window? Relationship rhythm?',
    },
    description: {
      'zh-CN': '夫妻宫、桃花与合冲结构，输出关系节奏与沟通画像。',
      en: 'Spouse palace, romance indicators, and clash/combine structure for relationship rhythm.',
    },
  },
  partnership: {
    title: { 'zh-CN': '人际合作', en: 'Collaboration' },
    question: {
      'zh-CN': '适合与什么人合作？合伙风险在哪？',
      en: 'Who should I partner with? Where are partnership risks?',
    },
    description: {
      'zh-CN': '比劫官杀与日主刚柔，给出合作者画像与分工建议。',
      en: 'Peer and authority dynamics for collaborator profiles and division of roles.',
    },
  },
  'living-environment': {
    title: { 'zh-CN': '居家环境', 'zh-Hant': '居家環境', en: 'Living environment' },
    question: {
      'zh-CN': '方位与摆设如何补用神？何时宜搬家？',
      en: 'How to adjust space for favorable elements? When to move?',
    },
    description: {
      'zh-CN': '方位五行与用神方向，给出环境调整与搬迁择时参考。',
      en: 'Directional elements and favorable bearings for environment tweaks and move timing.',
    },
    disclaimer: {
      'zh-CN': '环境建议不构成建筑或装修专业意见。',
      en: 'Environment tips are not professional architecture or renovation advice.',
    },
  },
  'timing-selection': {
    title: { 'zh-CN': '择时办事', 'zh-Hant': '擇時辦事', en: 'Timing selection' },
    question: {
      'zh-CN': '签约、出行、手术、搬家哪天更合适？',
      en: 'Better days for contracts, travel, surgery, or moving?',
    },
    description: {
      'zh-CN': '流日干支与用神匹配评分，输出择日清单与忌讳提醒。',
      en: 'Daily stem-branch scoring vs favorable elements for pick-day lists and caution notes.',
    },
    disclaimer: {
      'zh-CN': '医疗事项请以医生建议为第一优先。',
      en: 'For medical matters, follow your doctor first.',
    },
  },
};

/** Localized title / question / description / disclaimer for a dimension slug. */
export function dimensionUiCopy(locale: SiteLocale, slug: DimensionSlug): DimensionUiFields {
  const entry = DIMENSION_COPY[slug];
  return {
    title: pick(locale, entry.title),
    question: pick(locale, entry.question),
    description: pick(locale, entry.description),
    disclaimer: entry.disclaimer ? pick(locale, entry.disclaimer) : '',
  };
}

/** Intent hero labels, hints, and primary CTAs for the dimensions hub. */
export function intentUiCopy(locale: SiteLocale) {
  const labels: Record<FunnelIntent, string> = {
    career: pick(locale, { 'zh-CN': '事业发展', 'zh-Hant': '事業發展', en: 'Career development' }),
    wealth: pick(locale, { 'zh-CN': '财运规划', 'zh-Hant': '財運規劃', en: 'Wealth planning' }),
    relationship: pick(locale, { 'zh-CN': '婚恋关系', 'zh-Hant': '婚戀關係', en: 'Relationships' }),
    yearly: pick(locale, { 'zh-CN': '年度流年', en: 'Yearly timing' }),
    general: pick(locale, { 'zh-CN': '场景研判', en: 'Scene judgment' }),
  };

  const hints: Record<FunnelIntent, string> = {
    career: pick(locale, {
      'zh-CN': '你从「事业发展」进入。可先看工作行业与学业事业，再按需展开其他维度。',
      en: 'You entered from Career development. Start with Career & industry or Study & career, then expand as needed.',
    }),
    wealth: pick(locale, {
      'zh-CN': '你从「财运规划」进入。可先看投资理财与运势节奏，再对照行动窗口。',
      en: 'You entered from Wealth planning. Start with Investment & wealth or Fortune rhythm, then compare action windows.',
    }),
    relationship: pick(locale, {
      'zh-CN': '你从「婚恋关系」进入。可先看谈婚论嫁与人际合作，再回到结构判断。',
      en: 'You entered from Relationships. Start with Marriage & love or Collaboration, then return to structure.',
    }),
    yearly: pick(locale, {
      'zh-CN': '你从「年度流年」进入。可先看运势节奏与择时办事，再落到具体场景。',
      en: 'You entered from Yearly timing. Start with Fortune rhythm or Timing selection, then drill into scenes.',
    }),
    general: pick(locale, {
      'zh-CN': '先选一个具体问题进入。结论可回到预测回访对照。',
      en: 'Pick a concrete question to start. Check conclusions later against prediction follow-up.',
    }),
  };

  const primaryCta: Record<FunnelIntent, { href: string; label: string }> = {
    career: {
      href: '/dimensions/career-industry',
      label: pick(locale, { 'zh-CN': '进入工作行业', en: 'Open Career & industry' }),
    },
    wealth: {
      href: '/dimensions/investment',
      label: pick(locale, { 'zh-CN': '进入投资理财', en: 'Open Investment & wealth' }),
    },
    relationship: {
      href: '/dimensions/marriage',
      label: pick(locale, { 'zh-CN': '进入谈婚论嫁', en: 'Open Marriage & love' }),
    },
    yearly: {
      href: '/dimensions/fortune-rhythm',
      label: pick(locale, { 'zh-CN': '进入运势节奏', en: 'Open Fortune rhythm' }),
    },
    general: {
      href: '/dimensions/fortune-rhythm',
      label: pick(locale, { 'zh-CN': '从运势节奏开始', en: 'Start with Fortune rhythm' }),
    },
  };

  return { labels, hints, primaryCta };
}

/** Maturity badge for non-mvp dimensions. */
export function dimensionMaturityLabel(locale: SiteLocale, maturity: DimensionMaturity): string {
  if (maturity === 'mvp') return '';
  if (maturity === 'preview') {
    return pick(locale, { 'zh-CN': '即将上线', 'zh-Hant': '即將上線', en: 'Coming soon' });
  }
  return pick(locale, { 'zh-CN': '规划中', 'zh-Hant': '規劃中', en: 'Planned' });
}

/** Section chrome on DimensionGrid. */
export function dimensionGridCopy(locale: SiteLocale) {
  return {
    recommendedFirst: pick(locale, {
      'zh-CN': '推荐优先',
      'zh-Hant': '推薦優先',
      en: 'Recommended first',
    }),
    available: pick(locale, {
      'zh-CN': '可用',
      en: 'Available',
    }),
    sortedForYou: pick(locale, {
      'zh-CN': '按你的问题排序',
      en: 'Sorted for your question',
    }),
    moreRelevant: pick(locale, {
      'zh-CN': '更相关',
      'zh-Hant': '更相關',
      en: 'More relevant',
    }),
    more: pick(locale, {
      'zh-CN': '更多',
      en: 'More',
    }),
  };
}

/** Hub page SEO when locale is en (zh stays canonical Chinese). */
export function dimensionsHubSeo(locale: SiteLocale): { title: string; description: string; keywords: string[] } {
  if (locale === 'en') {
    return {
      title: 'Ten dimensions deep dive | Fortune rhythm, career, wealth, marriage & more',
      description:
        'Life K-Line ten dimensions turn top questions into actionable scenes: fortune rhythm, career & industry, investment, marriage, health, naming, timing, and more—with conclusions, actions, and verifiable predictions.',
      keywords: [
        'ten dimensions',
        'fortune rhythm',
        'career industry bazi',
        'investment timing',
        'marriage timing',
        'naming five elements',
        'Life K-Line',
      ],
    };
  }
  return {
    title: pick(locale, {
      'zh-CN': '十维度深度研判｜运势节奏、事业行业、投资婚恋等场景入口',
      'zh-Hant': '十維度深度研判｜運勢節奏、事業行業、投資婚戀等場景入口',
      en: 'Ten dimensions deep dive | Fortune rhythm, career, wealth, marriage & more',
    }),
    description: pick(locale, {
      'zh-CN':
        '人生K线十维度把用户最关心的问题拆成可执行场景：运势节奏、工作行业、投资理财、谈婚论嫁、健康、起名、择时等。基于八字引擎输出结论、行动建议与可验证预测，并与知识库、工具中心内链互通。',
      en: 'Life K-Line ten dimensions turn top questions into actionable scenes with conclusions, actions, and verifiable predictions.',
    }),
    keywords: [
      '十维度研判',
      '运势节奏分析',
      '八字事业行业',
      '八字投资理财',
      '谈婚论嫁择时',
      '起名改名五行',
      '人生K线',
    ],
  };
}

/** Detail page chrome: hero CTAs, eyebrows, body states, errors. */
export function dimensionDetailCopy(locale: SiteLocale) {
  return {
    allDimensions: pick(locale, {
      'zh-CN': '全部维度',
      'zh-Hant': '全部維度',
      en: 'All dimensions',
    }),
    predictions: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    fullReport: pick(locale, {
      'zh-CN': '完整报告',
      'zh-Hant': '完整報告',
      en: 'Full report',
    }),
    tools: pick(locale, {
      'zh-CN': '工具',
      en: 'Tools',
    }),
    consultants: pick(locale, {
      'zh-CN': '请老师',
      'zh-Hant': '請老師',
      en: 'Consultants',
    }),
    eyebrowP0: pick(locale, {
      'zh-CN': '推荐 · 维度',
      'zh-Hant': '推薦 · 維度',
      en: 'Recommended · Dimension',
    }),
    eyebrowDefault: pick(locale, {
      'zh-CN': '维度',
      'zh-Hant': '維度',
      en: 'Dimension',
    }),
    capabilityTitle: (title: string) =>
      pick(locale, {
        'zh-CN': `${title}：能解决什么`,
        'zh-Hant': `${title}：能解決什麼`,
        en: `${title}: what it solves`,
      }),
    askTeacher: pick(locale, {
      'zh-CN': '问老师继续拆',
      'zh-Hant': '問老師繼續拆',
      en: 'Ask a consultant to dig deeper',
    }),
    askTeacherHint: (title: string) =>
      pick(locale, {
        'zh-CN': `进入顾问开场，围绕「${title}」继续对齐节奏与动作。`,
        'zh-Hant': `進入顧問開場，圍繞「${title}」繼續對齊節奏與動作。`,
        en: `Open a consultant session to align rhythm and next steps for “${title}”.`,
      }),
    teacherWindow: (title: string) =>
      pick(locale, {
        'zh-CN': title ? `当前维度「${title}」` : '',
        en: title ? `Current dimension: “${title}”` : '',
      }),
    loading: (title: string) =>
      pick(locale, {
        'zh-CN': `正在基于你的命盘生成「${title}」研判…`,
        'zh-Hant': `正在基於你的命盤生成「${title}」研判…`,
        en: `Generating “${title}” analysis from your chart…`,
      }),
    notReady: (title: string) =>
      pick(locale, {
        'zh-CN': `「${title}」深度研判正在开发中。当前可先通过工作台生成完整报告，或关注后续版本更新。`,
        'zh-Hant': `「${title}」深度研判正在開發中。當前可先通過工作台生成完整報告，或關注後續版本更新。`,
        en: `“${title}” deep analysis is in development. Generate a full report from the workbench for now, or check back later.`,
      }),
    generateReport: pick(locale, {
      'zh-CN': '用工作台生成报告',
      'zh-Hant': '用工作台生成報告',
      en: 'Generate report in workbench',
    }),
    backToHub: pick(locale, {
      'zh-CN': '返回十维度',
      'zh-Hant': '返回十維度',
      en: 'Back to ten dimensions',
    }),
    completeProfile: pick(locale, {
      'zh-CN': '完善档案',
      'zh-Hant': '完善檔案',
      en: 'Complete profile',
    }),
    retry: pick(locale, {
      'zh-CN': '重试',
      'zh-Hant': '重試',
      en: 'Retry',
    }),
    errorProfileRead: pick(locale, {
      'zh-CN': '无法读取档案资料，请先到「我的档案」完善出生信息。',
      'zh-Hant': '無法讀取檔案資料，請先到「我的檔案」完善出生信息。',
      en: 'Could not read profile data. Complete birth info in My profile first.',
    }),
    errorNoBirth: pick(locale, {
      'zh-CN': '还没有出生资料，请先创建档案或前往工作台填写。',
      'zh-Hant': '還沒有出生資料，請先建立檔案或前往工作台填寫。',
      en: 'No birth data yet. Create a profile or fill it in on the workbench.',
    }),
    errorAnalyzeFail: pick(locale, {
      'zh-CN': '研判生成失败，请稍后重试。',
      'zh-Hant': '研判生成失敗，請稍後重試。',
      en: 'Analysis failed. Please try again later.',
    }),
    errorNetwork: pick(locale, {
      'zh-CN': '加载失败，请检查网络后重试。',
      'zh-Hant': '載入失敗，請檢查網路後重試。',
      en: 'Load failed. Check your network and try again.',
    }),
    afterRailTitle: pick(locale, {
      'zh-CN': '研判之后：继续联动',
      'zh-Hant': '研判之後：繼續聯動',
      en: 'After analysis: keep going',
    }),
    afterRailDescription: pick(locale, {
      'zh-CN': '相邻维度、免费工具与完整报告，帮助你把单一场景结论扩展成完整行动链路。',
      'zh-Hant': '相鄰維度、免費工具與完整報告，幫助你把單一場景結論擴展成完整行動鏈路。',
      en: 'Related dimensions, free tools, and the full report turn one scene into a full action path.',
    }),
  };
}

/** Detail page SEO; EN when locale is en (zh stays identical to dimensionSeo). */
export function dimensionDetailSeo(
  locale: SiteLocale,
  slug: DimensionSlug,
): { title: string; description: string; keywords: string[] } {
  const ui = dimensionUiCopy(locale, slug);
  if (locale === 'en') {
    return {
      title: `${ui.title} deep dive | ${ui.question.replace(/\?/g, '')}`,
      description: `${ui.description} Based on Bazi favorable elements, luck cycles, and Life K-Line—core conclusions, actions, and verifiable predictions for “${ui.title}”.`,
      keywords: [
        ui.title,
        ui.question.replace(/[？?]/g, ''),
        `${ui.title} analysis`,
        `${ui.title} timing`,
        'ten dimensions',
        'Life K-Line',
        'Bazi analysis',
      ],
    };
  }
  return {
    title: `${ui.title}深度研判｜${ui.question.replace(/？/g, '')}`,
    description: `${ui.description} 基于八字用神、大运流年与人生K线引擎，输出核心结论、行动建议与可验证预测。适合需要「${ui.title}」具体判断的用户。`,
    keywords: [
      ui.title,
      ui.question.replace(/[？?]/g, ''),
      `${ui.title}分析`,
      `${ui.title}运势`,
      '十维度研判',
      '人生K线',
      '八字分析',
    ],
  };
}
