/**
 * L2 funnel copy for home / analyze workspace.
 * Used by AnalyzeWorkspace + generateMetadata.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export const FUNNEL_META = {
  home: {
    title: {
      'zh-CN': '免费八字命理分析｜人生K线、十维度研判与流年大运',
      'zh-Hant': '免費八字命理分析｜人生K線、十維度研判與流年大運',
      en: 'Free Bazi chart & Life K-Line | Structure, timing, and next moves',
    } satisfies Tri,
    description: {
      'zh-CN':
        '免费输入出生信息生成八字命盘与人生K线运势曲线；十维度覆盖事业行业、投资节奏、婚恋、健康、起名与迁移择城，结论可回访验证，支持邮箱保存会员报告。',
      'zh-Hant':
        '免費輸入出生資訊生成八字命盤與人生K線運勢曲線；十維度覆蓋事業行業、投資節奏、婚戀、健康、起名與遷移擇城，結論可回訪驗證，支援郵箱保存會員報告。',
      en: 'Enter birth details free to generate a Bazi chart and life-rhythm curve. Ten dimensions cover career, capital, relationships, health, naming, and city fit—with verifiable predictions and optional email save.',
    } satisfies Tri,
  },
  analyze: {
    title: {
      'zh-CN': '免费八字测算工作台｜完整报告与十维度入口',
      'zh-Hant': '免費八字測算工作台｜完整報告與十維度入口',
      en: 'Free Bazi workbench | Full report and 10-dimension entry',
    } satisfies Tri,
    description: {
      'zh-CN':
        '先选事业、财运、婚恋或年度流年焦点，再填写出生信息生成完整判断报告；也可先进入十维度窄场景。时辰未知可继续，系统会标注可信度边界。',
      'zh-Hant':
        '先選事業、財運、婚戀或年度流年焦點，再填寫出生資訊生成完整判斷報告；也可先進入十維度窄場景。時辰未知可繼續，系統會標註可信度邊界。',
      en: 'Pick career, wealth, relationship, or yearly timing first, then add birth details for a full structural report—or enter a focused 10-dimension path. Unknown birth hour is OK; confidence bounds are labeled.',
    } satisfies Tri,
  },
  result: {
    title: {
      'zh-CN': '结构判断报告｜核心结论、阶段与下一步',
      'zh-Hant': '結構判斷報告｜核心結論、階段與下一步',
      en: 'Structure report | Core verdict, stage, and next moves',
    } satisfies Tri,
    description: {
      'zh-CN':
        '人生K线结构判断报告：先看核心结论，再看阶段定位与可执行动作，最后用预测回访验证。支持邮箱保存与十维度深挖。',
      'zh-Hant':
        '人生K線結構判斷報告：先看核心結論，再看階段定位與可執行動作，最後用預測回訪驗證。支援郵箱保存與十維度深挖。',
      en: 'Life K-Line structure report: start with the core verdict, then stage and actions, then verify via prediction check-in. Save by email and go deeper with 10 dimensions.',
    } satisfies Tri,
  },
  knowledge: {
    title: {
      'zh-CN': '知识库｜八字结构教育、世界易专题与十维度联动',
      'zh-Hant': '知識庫｜八字結構教育、世界易專題與十維度聯動',
      en: 'Knowledge | Bazi structure, World Yi topics, and 10-dimension paths',
    } satisfies Tri,
    description: {
      'zh-CN':
        '真太阳时、报告读法、事业财富关系、海外华人 GEO 城市观察等专题；每篇可接到十维度研判与工具中心，从阅读走向可验证判断。按简体 / 繁体 / English 分组浏览。',
      'zh-Hant':
        '真太陽時、報告讀法、事業財富關係、海外華人 GEO 城市觀察等專題；每篇可接到十維度研判與工具中心，從閱讀走向可驗證判斷。按簡體 / 繁體 / English 分組瀏覽。',
      en: 'True solar time, report reading, career/wealth/relationships, and overseas Chinese city notes—each piece links to 10-dimension tools. Browse by Simplified / Traditional / English.',
    } satisfies Tri,
  },
  cases: {
    title: {
      'zh-CN': '案例库｜事业财富关系迁移的结构判断实例',
      'zh-Hant': '案例庫｜事業財富關係遷移的結構判斷實例',
      en: 'Cases | Structure judgments for career, wealth, relationships, migration',
    } satisfies Tri,
    description: {
      'zh-CN':
        '用真实处境理解八字结构判断：事业扩张、家庭排序、迁移决策等案例，文末联动十维度与完整报告。按语言与市场分组。',
      'zh-Hant':
        '用真實處境理解八字結構判斷：事業擴張、家庭排序、遷移決策等案例，文末聯動十維度與完整報告。按語言與市場分組。',
      en: 'Learn structure judgment from real situations—career moves, family priorities, migration—then continue into 10 dimensions or a full report. Grouped by language and market.',
    } satisfies Tri,
  },
} as const;

export function funnelMeta(
  page: keyof typeof FUNNEL_META,
  locale: SiteLocale
): { title: string; description: string } {
  const block = FUNNEL_META[page];
  return {
    title: pick(locale, block.title),
    description: pick(locale, block.description),
  };
}

/** Result page chrome (L2) — used by result shell + prod metadata patch. */
export function resultCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, FUNNEL_META.result.title),
    metaDescription: pick(locale, FUNNEL_META.result.description),
    eyebrow: pick(locale, {
      'zh-CN': '判断报告',
      'zh-Hant': '判斷報告',
      en: 'Structure report',
    }),
    heroTitle: pick(locale, {
      'zh-CN': '先判断结论，再执行动作，最后用反馈验证',
      'zh-Hant': '先判斷結論，再執行動作，最後用回饋驗證',
      en: 'Verdict first, then actions, then verify with feedback',
    }),
    heroDescription: pick(locale, {
      'zh-CN':
        '先看核心结论，再执行动作，最后用反馈验证。建议 5 分钟内完成前三步；深入细节按需展开。',
      'zh-Hant':
        '先看核心結論，再執行動作，最後用回饋驗證。建議 5 分鐘內完成前三步；深入細節按需展開。',
      en: 'Read the core verdict first, take one action, then verify. Aim to finish the first three steps in five minutes; open deeper sections only as needed.',
    }),
    ctaCore: pick(locale, {
      'zh-CN': '先看核心结论',
      'zh-Hant': '先看核心結論',
      en: 'Core verdict',
    }),
    ctaActions: pick(locale, {
      'zh-CN': '下一步动作',
      'zh-Hant': '下一步動作',
      en: 'Next actions',
    }),
    ctaPredictions: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    ctaDimensions: pick(locale, {
      'zh-CN': '十维度',
      'zh-Hant': '十維度',
      en: '10 dimensions',
    }),
    ctaReanalyze: pick(locale, {
      'zh-CN': '再次分析',
      'zh-Hant': '再次分析',
      en: 'Analyze again',
    }),
    publicFallbackTitle: pick(locale, {
      'zh-CN': '您的结构判断报告',
      'zh-Hant': '您的結構判斷報告',
      en: 'Your structure report',
    }),
    brandSuffix: pick(locale, {
      'zh-CN': '人生K线',
      'zh-Hant': '人生K線',
      en: 'Life K-Line',
    }),
  };
}

/** Knowledge / cases list chrome */
export function contentHubCopy(kind: 'knowledge' | 'cases', locale: SiteLocale) {
  const isKnowledge = kind === 'knowledge';
  return {
    meta: funnelMeta(kind, locale),
    eyebrow: pick(locale, isKnowledge
      ? { 'zh-CN': '知识库', 'zh-Hant': '知識庫', en: 'Knowledge' }
      : { 'zh-CN': '案例库', 'zh-Hant': '案例庫', en: 'Cases' }),
    title: pick(locale, isKnowledge
      ? {
          'zh-CN': '把命理语言翻译成可执行判断',
          'zh-Hant': '把命理語言翻譯成可執行判斷',
          en: 'Turn destiny language into executable judgment',
        }
      : {
          'zh-CN': '用真实处境理解判断，而不是背术语',
          'zh-Hant': '用真實處境理解判斷，而不是背術語',
          en: 'Learn from real situations—not jargon lists',
        }),
    description: pick(locale, isKnowledge
      ? {
          'zh-CN':
            '每篇文章按「结构 → 时位 → 行动」组织；文末会接到十维度场景与工具，方便从阅读走向验证。可按语言市场筛选。',
          'zh-Hant':
            '每篇文章按「結構 → 時位 → 行動」組織；文末會接到十維度場景與工具，方便從閱讀走向驗證。可按語言市場篩選。',
          en: 'Each article follows structure → stage → action, then links to 10-dimension tools. Filter by language market.',
        }
      : {
          'zh-CN':
            '每个案例按结构张力、阶段匹配与行动顺序展开；文末接到十维度与完整报告。可按语言与市场分组。',
          'zh-Hant':
            '每個案例按結構張力、階段匹配與行動順序展開；文末接到十維度與完整報告。可按語言與市場分組。',
          en: 'Each case covers structural tension, stage fit, and action order—then links to dimensions or a full report. Group by language and market.',
        }),
    ctaDimensions: pick(locale, {
      'zh-CN': '十维度中心',
      'zh-Hant': '十維度中心',
      en: '10 dimensions',
    }),
    ctaTopics: pick(locale, {
      'zh-CN': '按主题浏览',
      'zh-Hant': '按主題瀏覽',
      en: 'Browse topics',
    }),
    ctaTools: pick(locale, {
      'zh-CN': '工具中心',
      'zh-Hant': '工具中心',
      en: 'Tools',
    }),
    ctaAnalyze: pick(locale, {
      'zh-CN': '生成我的报告',
      'zh-Hant': '生成我的報告',
      en: 'Generate my report',
    }),
    ctaHeader: pick(locale, {
      'zh-CN': '十维度研判',
      'zh-Hant': '十維度研判',
      en: '10 dimensions',
    }),
    sectionEyebrow: pick(locale, isKnowledge
      ? { 'zh-CN': '专题', 'zh-Hant': '專題', en: 'Topics' }
      : { 'zh-CN': '公开案例', 'zh-Hant': '公開案例', en: 'Public cases' }),
    publishedLabel: (total: number) =>
      pick(locale, isKnowledge
        ? {
            'zh-CN': `${total} 篇已发布`,
            'zh-Hant': `${total} 篇已發布`,
            en: `${total} published`,
          }
        : {
            'zh-CN': `${total} 个已发布案例`,
            'zh-Hant': `${total} 個已發布案例`,
            en: `${total} published cases`,
          }),
    pageHint: (current: number, size: number) =>
      pick(locale, {
        'zh-CN': `当前第 ${current} 页，每页 ${size} 篇`,
        'zh-Hant': `目前第 ${current} 頁，每頁 ${size} 篇`,
        en: `Page ${current} · ${size} per page`,
      }),
    readCta: pick(locale, {
      'zh-CN': '阅读 →',
      'zh-Hant': '閱讀 →',
      en: 'Read →',
    }),
    allLocales: pick(locale, {
      'zh-CN': '全部语言',
      'zh-Hant': '全部語言',
      en: 'All languages',
    }),
    geoReadyBadge: pick(locale, {
      'zh-CN': 'AI 可引用',
      'zh-Hant': 'AI 可引用',
      en: 'AI-citable',
    }),
    localeFilterHint: pick(locale, {
      'zh-CN': '按内容语言 / 市场筛选（与顶栏 UI 语言独立）',
      'zh-Hant': '按內容語言 / 市場篩選（與頂欄 UI 語言獨立）',
      en: 'Filter by content language / market (independent of UI language)',
    }),
    showcaseTitle: pick(locale, isKnowledge
      ? {
          'zh-CN': '读完知识，直接进入场景',
          'zh-Hant': '讀完知識，直接進入場景',
          en: 'From reading to a focused judgment',
        }
      : {
          'zh-CN': '案例读完后，直接做场景研判',
          'zh-Hant': '案例讀完後，直接做場景研判',
          en: 'After a case, run your own scenario',
        }),
    showcaseDesc: pick(locale, isKnowledge
      ? {
          'zh-CN': '事业 / 财富 / 运势节奏等维度与文章主题互通，结论可回访验证。',
          'zh-Hant': '事業 / 財富 / 運勢節奏等維度與文章主題互通，結論可回訪驗證。',
          en: 'Career, wealth, and rhythm dimensions connect to article topics—with checkable predictions.',
        }
      : {
          'zh-CN': '把别人的结构判断，落到你的命盘与时间窗。',
          'zh-Hant': '把別人的結構判斷，落到你的命盤與時間窗。',
          en: 'Map someone else’s structure judgment onto your chart and timing window.',
        }),
    caseBadge: pick(locale, {
      'zh-CN': '案例',
      'zh-Hant': '案例',
      en: 'Case',
    }),
    emptyGroup: pick(locale, {
      'zh-CN': '该语言分组暂无内容',
      'zh-Hant': '該語言分組暫無內容',
      en: 'No items in this language group yet',
    }),
  };
}

export function funnelCopy(locale: SiteLocale) {
  return {
    heroEyebrow: pick(locale, {
      'zh-CN': '世界易学说 · 命理门户',
      'zh-Hant': '世界易學說 · 命理門戶',
      en: 'World Yi · Destiny structure portal',
    }),
    heroTitle: pick(locale, {
      'zh-CN': '一处看清你的结构、阶段与下一步',
      'zh-Hant': '一處看清你的結構、階段與下一步',
      en: 'See your structure, stage, and next move in one place',
    }),
    heroDescription: pick(locale, {
      'zh-CN': '先补齐出生时间与地点，再选择判断主题。不需要一次填完所有信息，高级选项可稍后展开。',
      'zh-Hant': '先補齊出生時間與地點，再選擇判斷主題。不需要一次填完所有資訊，高級選項可稍後展開。',
      en: 'Add birth time and place first, then choose a focus. You do not need every field at once—advanced options can wait.',
    }),
    howTo: pick(locale, { 'zh-CN': '使用方法', en: 'How to use' }),
    trueSolar: pick(locale, {
      'zh-CN': '真太阳时说明',
      'zh-Hant': '真太陽時說明',
      en: 'True solar time',
    }),
    stepBirth: pick(locale, {
      'zh-CN': '出生信息',
      'zh-Hant': '出生資訊',
      en: 'Birth info',
    }),
    stepTheme: pick(locale, {
      'zh-CN': '判断主题',
      'zh-Hant': '判斷主題',
      en: 'Focus',
    }),
    stepReport: pick(locale, {
      'zh-CN': '生成报告',
      'zh-Hant': '生成報告',
      en: 'Report',
    }),
    birthTime: pick(locale, {
      'zh-CN': '出生时间',
      'zh-Hant': '出生時間',
      en: 'Birth time',
    }),
    timeUnknown: pick(locale, {
      'zh-CN': '时辰未知',
      'zh-Hant': '時辰未知',
      en: 'Hour unknown',
    }),
    birthPlace: pick(locale, {
      'zh-CN': '出生地点',
      'zh-Hant': '出生地點',
      en: 'Birth place',
    }),
    placePlaceholder: pick(locale, {
      'zh-CN': '例如：上海',
      'zh-Hant': '例如：上海',
      en: 'e.g. Shanghai',
    }),
    placeHint: pick(locale, {
      'zh-CN': '影响真太阳时与时区校正',
      'zh-Hant': '影響真太陽時與時區校正',
      en: 'Used for true solar time and timezone correction',
    }),
    cityQuickPick: pick(locale, {
      'zh-CN': '常用城市',
      'zh-Hant': '常用城市',
      en: 'Quick cities',
    }),
    trueSolarAppliedNote: pick(locale, {
      'zh-CN': '已按出生地经度估算真太阳时（时辰已知时用于排盘）',
      'zh-Hant': '已按出生地經度估算真太陽時（時辰已知時用於排盤）',
      en: 'True solar time is estimated from birth-place longitude (applied when hour is known)',
    }),
    trueSolarNeedPlace: pick(locale, {
      'zh-CN': '选择或填写出生地后，可预览真太阳时修正',
      'zh-Hant': '選擇或填寫出生地後，可預覽真太陽時修正',
      en: 'Pick a city or enter place to preview true solar correction',
    }),
    trueSolarSkippedUnknownHour: pick(locale, {
      'zh-CN': '时辰未知：不应用真太阳时，优先年/月/日结构',
      'zh-Hant': '時辰未知：不應用真太陽時，優先年/月/日結構',
      en: 'Hour unknown: true solar is not applied; year/month/day structure is prioritized',
    }),
    gender: pick(locale, { 'zh-CN': '性别', 'zh-Hant': '性別', en: 'Gender' }),
    male: pick(locale, { 'zh-CN': '男', en: 'Male' }),
    female: pick(locale, { 'zh-CN': '女', en: 'Female' }),
    whoseChart: pick(locale, {
      'zh-CN': '这是谁的命盘？（可选）',
      'zh-Hant': '這是誰的命盤？（可選）',
      en: 'Whose chart? (optional)',
    }),
    themeLabel: pick(locale, {
      'zh-CN': '判断主题',
      'zh-Hant': '判斷主題',
      en: 'Focus theme',
    }),
    dimensionsShortcut: pick(locale, {
      'zh-CN': '或先用十维度窄场景 →',
      'zh-Hant': '或先用十維度窄場景 →',
      en: 'Or start with a 10-dimension focus →',
    }),
    themeHint: pick(locale, {
      'zh-CN': '完整报告适合全局结构；十维度适合「起名 / 行业 / 投资 / 婚恋」等具体问题，结论可回访验证。',
      'zh-Hant': '完整報告適合全局結構；十維度適合「起名 / 行業 / 投資 / 婚戀」等具體問題，結論可回訪驗證。',
      en: 'Full reports cover global structure; 10 dimensions fit naming, industry, capital, or relationship questions—with checkable predictions.',
    }),
    advanced: pick(locale, {
      'zh-CN': '高级选项',
      'zh-Hant': '高級選項',
      en: 'Advanced options',
    }),
    nameOptional: pick(locale, {
      'zh-CN': '命主姓名（可选）',
      'zh-Hant': '命主姓名（可選）',
      en: 'Name (optional)',
    }),
    emailRecommend: pick(locale, {
      'zh-CN': '邮箱（推荐，用于保存）',
      'zh-Hant': '郵箱（推薦，用於保存）',
      en: 'Email (recommended to save)',
    }),
    emailPlaceholder: pick(locale, {
      'zh-CN': 'you@email.com — 跨设备找回报告',
      'zh-Hant': 'you@email.com — 跨裝置找回報告',
      en: 'you@email.com — reopen on any device',
    }),
    emailHint: pick(locale, {
      'zh-CN':
        '像 Notion 保存文档一样：填邮箱后报告可跨设备找回，并可选接收窗口提醒。不填也能生成，仅保存在本浏览器会话。',
      'zh-Hant':
        '像 Notion 保存文件一樣：填郵箱後報告可跨裝置找回，並可選接收窗口提醒。不填也能生成，僅保存在本瀏覽器會話。',
      en: 'Like saving a doc: with email you can reopen this report anywhere and opt into timing alerts. Skip to keep a browser-only guest session.',
    }),
    emailStripTitle: pick(locale, {
      'zh-CN': '可选：用邮箱保存报告',
      'zh-Hant': '可選：用郵箱保存報告',
      en: 'Optional: save report to email',
    }),
    emailStripBody: pick(locale, {
      'zh-CN': '关掉浏览器也不会丢；之后用同一邮箱登录即可回看。无需密码，随时可退订提醒。',
      'zh-Hant': '關掉瀏覽器也不會丟；之後用同一郵箱登入即可回看。無需密碼，隨時可退訂提醒。',
      en: 'Survive tab closes. Sign in later with the same email. No password; alerts are optional.',
    }),
    solarDefault: pick(locale, {
      'zh-CN': '默认使用真太阳时校正。夏令时、早晚子时等边界情况会在报告中标注。',
      'zh-Hant': '預設使用真太陽時校正。夏令時、早晚子時等邊界情況會在報告中標註。',
      en: 'True solar time is on by default. DST and early/late Zi-hour edge cases are labeled in the report.',
    }),
    submitLoading: pick(locale, { 'zh-CN': '生成中…', 'zh-Hant': '生成中…', en: 'Generating…' }),
    submitReady: pick(locale, {
      'zh-CN': '生成判断报告',
      'zh-Hant': '生成判斷報告',
      en: 'Generate report',
    }),
    submitDisabled: pick(locale, {
      'zh-CN': '请先确认出生时间与地点',
      'zh-Hant': '請先確認出生時間與地點',
      en: 'Add birth time and place first',
    }),
    dimRecTitle: pick(locale, {
      'zh-CN': '按当前主题推荐十维度',
      'zh-Hant': '按目前主題推薦十維度',
      en: 'Recommended dimensions for this focus',
    }),
    dimRecDesc: pick(locale, {
      'zh-CN': '先解决一个具体问题：结论自动进预测回访，后续可再生成完整报告。',
      'zh-Hant': '先解決一個具體問題：結論自動進預測回訪，後續可再生成完整報告。',
      en: 'Solve one concrete question first. Predictions enter check-in automatically; generate a full report later if needed.',
    }),
    openDimensions: pick(locale, {
      'zh-CN': '打开十维度中心',
      'zh-Hant': '打開十維度中心',
      en: 'Open 10 dimensions',
    }),
    predictions: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    knowledge: pick(locale, {
      'zh-CN': '知识库',
      'zh-Hant': '知識庫',
      en: 'Knowledge',
    }),
    toolsEyebrow: pick(locale, {
      'zh-CN': '免费高意图工具',
      'zh-Hant': '免費高意圖工具',
      en: 'Free high-intent tools',
    }),
    toolsTitle: pick(locale, {
      'zh-CN': '轻量测试入口',
      'zh-Hant': '輕量測試入口',
      en: 'Lightweight entry tools',
    }),
    allTools: pick(locale, { 'zh-CN': '全部工具', en: 'All tools' }),
    methodEyebrow: pick(locale, {
      'zh-CN': '判断依据',
      'zh-Hant': '判斷依據',
      en: 'How we judge',
    }),
    methodTitle: pick(locale, {
      'zh-CN': '不是直接给结论，而是说明判断从哪里来',
      'zh-Hant': '不是直接給結論，而是說明判斷從哪裡來',
      en: 'Not a bare verdict—we show where the judgment comes from',
    }),
    faqEyebrow: pick(locale, {
      'zh-CN': '常见疑虑',
      'zh-Hant': '常見疑慮',
      en: 'FAQ',
    }),
    faqTitle: pick(locale, {
      'zh-CN': '常见疑虑先看这里',
      'zh-Hant': '常見疑慮先看這裡',
      en: 'Common questions first',
    }),
    loadingWorkspace: pick(locale, {
      'zh-CN': '加载工作台…',
      'zh-Hant': '載入工作台…',
      en: 'Loading workbench…',
    }),
    ctaStart: pick(locale, {
      'zh-CN': '立即开始',
      'zh-Hant': '立即開始',
      en: 'Get started',
    }),
    guestName: pick(locale, { 'zh-CN': '访客', 'zh-Hant': '訪客', en: 'Guest' }),
    defaultPlace: pick(locale, { 'zh-CN': '北京', en: 'Beijing' }),
    intent: {
      career: pick(locale, { 'zh-CN': '事业发展', 'zh-Hant': '事業發展', en: 'Career' }),
      wealth: pick(locale, { 'zh-CN': '财运规划', 'zh-Hant': '財運規劃', en: 'Wealth' }),
      relationship: pick(locale, { 'zh-CN': '婚恋关系', 'zh-Hant': '婚戀關係', en: 'Relationships' }),
      yearly: pick(locale, { 'zh-CN': '年度流年', 'zh-Hant': '年度流年', en: 'Yearly timing' }),
    },
    relation: {
      self: pick(locale, { 'zh-CN': '自己', en: 'Self' }),
      spouse: pick(locale, { 'zh-CN': '伴侣', 'zh-Hant': '伴侶', en: 'Partner' }),
      child: pick(locale, { 'zh-CN': '孩子', en: 'Child' }),
      parent: pick(locale, { 'zh-CN': '父母', en: 'Parents' }),
      sibling: pick(locale, { 'zh-CN': '兄弟姐妹', en: 'Sibling' }),
      friend: pick(locale, { 'zh-CN': '朋友', en: 'Friend' }),
      colleague: pick(locale, { 'zh-CN': '同事', en: 'Colleague' }),
      other: pick(locale, { 'zh-CN': '其他', en: 'Other' }),
    },
    methodSteps: [
      pick(locale, { 'zh-CN': '命盘底座', 'zh-Hant': '命盤底座', en: 'Chart base' }),
      pick(locale, { 'zh-CN': '结构定性', 'zh-Hant': '結構定性', en: 'Structure' }),
      pick(locale, { 'zh-CN': '阶段定位', 'zh-Hant': '階段定位', en: 'Stage' }),
      pick(locale, { 'zh-CN': '专家交叉校验', 'zh-Hant': '專家交叉校驗', en: 'Expert cross-check' }),
      pick(locale, { 'zh-CN': '现实回测', 'zh-Hant': '現實回測', en: 'Reality check' }),
    ],
    faq: [
      [
        pick(locale, {
          'zh-CN': '我不知道准确的出生时辰怎么办？',
          'zh-Hant': '我不知道準確的出生時辰怎麼辦？',
          en: 'What if I do not know the exact birth hour?',
        }),
        pick(locale, {
          'zh-CN': '可以先勾选「时辰未知」，系统会降低时柱权重，优先给出年/月/日结构判断。',
          'zh-Hant': '可以先勾選「時辰未知」，系統會降低時柱權重，優先給出年/月/日結構判斷。',
          en: 'Check “Hour unknown”. We down-weight the hour pillar and prioritize year/month/day structure.',
        }),
      ],
      [
        pick(locale, {
          'zh-CN': '真太阳时校正会不会让结果差很多？',
          'zh-Hant': '真太陽時校正會不會讓結果差很多？',
          en: 'Will true solar time change the result a lot?',
        }),
        pick(locale, {
          'zh-CN': '在时辰边界附近影响明显。默认开启真太阳时，报告会标注校正依据。',
          'zh-Hant': '在時辰邊界附近影響明顯。預設開啟真太陽時，報告會標註校正依據。',
          en: 'Impact is largest near hour boundaries. True solar time is on by default; the report labels the basis.',
        }),
      ],
      [
        pick(locale, {
          'zh-CN': '为什么建议先选问题再填出生信息？',
          'zh-Hant': '為什麼建議先選問題再填出生資訊？',
          en: 'Why choose a focus before birth details?',
        }),
        pick(locale, {
          'zh-CN': '问题类型决定报告侧重点，避免生成一堆术语但答不到你的核心疑问。',
          'zh-Hant': '問題類型決定報告側重點，避免生成一堆術語但答不到你的核心疑問。',
          en: 'Focus sets report emphasis so you get decisions—not a wall of jargon.',
        }),
      ],
      [
        pick(locale, {
          'zh-CN': '免费版和会员版有什么区别？',
          'zh-Hant': '免費版和會員版有什麼區別？',
          en: 'Free vs membership?',
        }),
        pick(locale, {
          'zh-CN':
            '免费 guest 可在本浏览器完整生成与查看报告；订阅用于跨设备提醒与深度更新。登录主要用于账号合并与订阅，不是生成门槛。',
          'zh-Hant':
            '免費 guest 可在本瀏覽器完整生成與查看報告；訂閱用於跨裝置提醒與深度更新。登入主要用於帳號合併與訂閱，不是生成門檻。',
          en: 'Guests can generate and view full reports in this browser. Membership adds cross-device alerts and deeper updates. Login merges accounts—it is not a paywall to generate.',
        }),
      ],
    ] as Array<[string, string]>,
    tools: [
      {
        title: pick(locale, {
          'zh-CN': '2026 流年 / 年度主窗口',
          en: '2026 yearly main windows',
        }),
        text: pick(locale, {
          'zh-CN': '看今年事业、关系、财富的主窗口与节奏。',
          'zh-Hant': '看今年事業、關係、財富的主窗口與節奏。',
          en: 'See this year’s career, relationship, and wealth windows.',
        }),
        href: '/tools/timing-yearly-window',
        cta: pick(locale, {
          'zh-CN': '免费测 2026 年度主窗口',
          'zh-Hant': '免費測 2026 年度主窗口',
          en: 'Free 2026 yearly windows',
        }),
      },
      {
        title: pick(locale, {
          'zh-CN': '手相结构观察',
          'zh-Hant': '手相結構觀察',
          en: 'Palm structure reading',
        }),
        text: pick(locale, {
          'zh-CN': '上传手掌照片，获得结构层面的辅助观察。',
          'zh-Hant': '上傳手掌照片，獲得結構層面的輔助觀察。',
          en: 'Upload a palm photo for structural observation (not medical diagnosis).',
        }),
        href: '/tools/application-palmistry-reading',
        cta: pick(locale, {
          'zh-CN': '上传手相照片免费测',
          'zh-Hant': '上傳手相照片免費測',
          en: 'Upload palm photo free',
        }),
      },
    ],
    banner: {
      chat: pick(locale, {
        'zh-CN': '你从追问页进入：先补齐出生信息生成报告，再回去追问会更有结构依据。',
        'zh-Hant': '你從追問頁進入：先補齊出生資訊生成報告，再回去追問會更有結構依據。',
        en: 'You came from Q&A: complete birth info for a report, then follow-ups rest on structure.',
      }),
      content: pick(locale, {
        'zh-CN': '你从内容页进入：主题已预选，补齐出生时间与地点即可生成针对性报告。',
        'zh-Hant': '你從內容頁進入：主題已預選，補齊出生時間與地點即可生成針對性報告。',
        en: 'You came from content: focus is preselected—add birth time and place for a tailored report.',
      }),
      tool: pick(locale, {
        'zh-CN': '你从工具/维度进入：主题已对齐，补齐出生信息后生成完整结构报告。',
        'zh-Hant': '你從工具/維度進入：主題已對齊，補齊出生資訊後生成完整結構報告。',
        en: 'You came from a tool/dimension: focus is aligned—add birth info for the full structural report.',
      }),
    },
    errors: {
      generateFailed: pick(locale, {
        'zh-CN': '生成失败',
        'zh-Hant': '生成失敗',
        en: 'Generation failed',
      }),
      missingId: pick(locale, {
        'zh-CN': '报告已生成但缺少报告 ID，请稍后在历史记录中查看',
        'zh-Hant': '報告已生成但缺少報告 ID，請稍後在歷史記錄中查看',
        en: 'Report created but ID missing—check history shortly',
      }),
      retry: pick(locale, {
        'zh-CN': '生成失败，请稍后重试',
        'zh-Hant': '生成失敗，請稍後重試',
        en: 'Generation failed. Please retry.',
      }),
    },
  };
}

export type FunnelCopy = ReturnType<typeof funnelCopy>;
