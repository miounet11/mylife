/**
 * Report reading chrome (section titles, consultant strip, share image).
 * Not full narrative translation — engine body may remain Chinese.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { normalizeSiteLocale, toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export function resolveReportChromeLocale(locale?: string | null): SiteLocale {
  return normalizeSiteLocale(locale) || 'zh-CN';
}

/** Agent cockpit section chrome */
export function reportCockpitCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': '先看核心结论',
      'zh-Hant': '先看核心結論',
      en: 'Core verdict first',
    }),
    title: pick(locale, {
      'zh-CN': '核心结论与当前状态',
      'zh-Hant': '核心結論與目前狀態',
      en: 'Core verdict & current state',
    }),
    dayMasterSuffix: pick(locale, {
      'zh-CN': '日主',
      en: 'Day master',
    }),
    yongShen: pick(locale, {
      'zh-CN': '用神',
      en: 'Favorable',
    }),
    pending: pick(locale, {
      'zh-CN': '待定',
      en: 'TBD',
    }),
    pendingExpand: pick(locale, {
      'zh-CN': '待展开',
      'zh-Hant': '待展開',
      en: 'To expand',
    }),
    currentScore: pick(locale, {
      'zh-CN': '当前得分',
      'zh-Hant': '目前得分',
      en: 'Current score',
    }),
    peak: pick(locale, {
      'zh-CN': '高点',
      'zh-Hant': '高點',
      en: 'Peak',
    }),
    trough: pick(locale, {
      'zh-CN': '低点',
      'zh-Hant': '低點',
      en: 'Trough',
    }),
    currentPhase: pick(locale, {
      'zh-CN': '当前阶段',
      'zh-Hant': '目前階段',
      en: 'Current stage',
    }),
    yearSuffix: pick(locale, {
      'zh-CN': '年',
      en: '',
    }),
    careerRhythm: pick(locale, {
      'zh-CN': '事业节奏',
      'zh-Hant': '事業節奏',
      en: 'Career rhythm',
    }),
    relationshipMode: pick(locale, {
      'zh-CN': '关系模式',
      'zh-Hant': '關係模式',
      en: 'Relationship mode',
    }),
    yearWindow: pick(locale, {
      'zh-CN': '年度窗口',
      'zh-Hant': '年度窗口',
      en: 'Year window',
    }),
    peakYear: (year: number) =>
      pick(locale, {
        'zh-CN': `${year} 高点`,
        'zh-Hant': `${year} 高點`,
        en: `${year} peak`,
      }),
  };
}

/** Report-first-screen consultant cards */
export function reportConsultantCardsCopy(locale: SiteLocale) {
  return {
    ariaLabel: pick(locale, {
      'zh-CN': '问顾问',
      'zh-Hant': '問顧問',
      en: 'Ask a consultant',
    }),
    title: pick(locale, {
      'zh-CN': '先问一位顾问',
      'zh-Hant': '先問一位顧問',
      en: 'Ask a consultant first',
    }),
    subtitle: pick(locale, {
      'zh-CN': '事业 · 时机 · 财务 — 结合本盘开场，不预填长问',
      'zh-Hant': '事業 · 時機 · 財務 — 結合本盤開場，不預填長問',
      en: 'Career · Timing · Wealth — open with this chart; no long prefilled question',
    }),
    allTeachers: pick(locale, {
      'zh-CN': '全部老师',
      'zh-Hant': '全部老師',
      en: 'All consultants',
    }),
    illustTitle: pick(locale, {
      'zh-CN': '决策结构',
      'zh-Hant': '決策結構',
      en: 'Decision structure',
    }),
    askCareer: pick(locale, {
      'zh-CN': '问事业',
      'zh-Hant': '問事業',
      en: 'Ask career',
    }),
    askTiming: pick(locale, {
      'zh-CN': '问时机',
      'zh-Hant': '問時機',
      en: 'Ask timing',
    }),
    askWealth: pick(locale, {
      'zh-CN': '问财务',
      'zh-Hant': '問財務',
      en: 'Ask wealth',
    }),
    bestWindow: (value: string) =>
      pick(locale, {
        'zh-CN': `较有利：${value}`,
        'zh-Hant': `較有利：${value}`,
        en: `Favorable: ${value}`,
      }),
    riskWindow: (value: string) =>
      pick(locale, {
        'zh-CN': `需谨慎：${value}`,
        'zh-Hant': `需謹慎：${value}`,
        en: `Caution: ${value}`,
      }),
  };
}

/** Share image download button + canvas chrome */
export function shareImageCopy(locale: SiteLocale) {
  return {
    brand: pick(locale, {
      'zh-CN': '人生K线',
      'zh-Hant': '人生K線',
      en: 'Life K-Line',
    }),
    label: pick(locale, {
      'zh-CN': '生成分享图',
      'zh-Hant': '生成分享圖',
      en: 'Save share image',
    }),
    generating: pick(locale, {
      'zh-CN': '生成中…',
      'zh-Hant': '生成中…',
      en: 'Generating…',
    }),
    downloaded: pick(locale, {
      'zh-CN': '已下载',
      'zh-Hant': '已下載',
      en: 'Downloaded',
    }),
    footerLeft: pick(locale, {
      'zh-CN': '结构参考',
      'zh-Hant': '結構參考',
      en: 'Structure reference',
    }),
    disclaimer: pick(locale, {
      'zh-CN': '结构与节奏参考，不替代专业医疗 / 法律 / 投资意见。',
      'zh-Hant': '結構與節奏參考，不替代專業醫療 / 法律 / 投資意見。',
      en: 'Structure and rhythm reference — not medical, legal, or investment advice.',
    }),
    fallbackLine: pick(locale, {
      'zh-CN': '结构参考 · life-kline.com',
      'zh-Hant': '結構參考 · life-kline.com',
      en: 'Structure reference · life-kline.com',
    }),
    filePrefix: pick(locale, {
      'zh-CN': '人生K线',
      'zh-Hant': '人生K線',
      en: 'Life_KLine',
    }),
  };
}

/** Classic result cockpit shell (report-cockpit.tsx) — labels / CTAs only */
export function reportCockpitShellCopy(locale: SiteLocale) {
  return {
    judgmentEyebrow: pick(locale, {
      'zh-CN': '驾驶舱判断',
      'zh-Hant': '駕駛艙判斷',
      en: 'Cockpit judgment',
    }),
    doNowEyebrow: pick(locale, {
      'zh-CN': '现在先做什么',
      'zh-Hant': '現在先做什麼',
      en: 'What to do first',
    }),
    doFirst: pick(locale, {
      'zh-CN': '先做',
      'zh-Hant': '先做',
      en: 'Do first',
    }),
    avoidFirst: pick(locale, {
      'zh-CN': '先别做',
      'zh-Hant': '先別做',
      en: 'Avoid for now',
    }),
    consultantOpening: pick(locale, {
      'zh-CN': '顾问开场',
      'zh-Hant': '顧問開場',
      en: 'Consultant opening',
    }),
    chatFallback: pick(locale, {
      'zh-CN': '进入结构追问',
      'zh-Hant': '進入結構追問',
      en: 'Ask structural follow-ups',
    }),
    eventsFallback: pick(locale, {
      'zh-CN': '记录关键事件',
      'zh-Hant': '記錄關鍵事件',
      en: 'Log key events',
    }),
    guidedPathsTitle: pick(locale, {
      'zh-CN': '阶段辅助线',
      'zh-Hant': '階段輔助線',
      en: 'Stage guides',
    }),
  };
}

/** Validation / confidence layer shell */
export function reportValidationCopy(locale: SiteLocale) {
  return {
    ariaLabel: pick(locale, {
      'zh-CN': '验证与可信层',
      'zh-Hant': '驗證與可信層',
      en: 'Validation & confidence',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '验证与可信层',
      'zh-Hant': '驗證與可信層',
      en: 'Validation & confidence',
    }),
    title: pick(locale, {
      'zh-CN': '先信主轴，再用事件持续校正',
      'zh-Hant': '先信主軸，再用事件持續校正',
      en: 'Trust the main line; refine with events',
    }),
    confidenceFallback: pick(locale, {
      'zh-CN': '可信度待补充',
      'zh-Hant': '可信度待補充',
      en: 'Confidence TBD',
    }),
    summaryFallback: pick(locale, {
      'zh-CN': '当前先按主线推进，并持续记录验证事件。',
      'zh-Hant': '目前先按主線推進，並持續記錄驗證事件。',
      en: 'Follow the main line for now, and keep logging validation events.',
    }),
    highLabel: pick(locale, {
      'zh-CN': '高可信点',
      'zh-Hant': '高可信點',
      en: 'High-confidence points',
    }),
    sensitiveLabel: pick(locale, {
      'zh-CN': '敏感点',
      'zh-Hant': '敏感點',
      en: 'Sensitive points',
    }),
    correctionLabel: pick(locale, {
      'zh-CN': '纠偏提示',
      'zh-Hant': '糾偏提示',
      en: 'Correction notes',
    }),
    eventPromptsLabel: pick(locale, {
      'zh-CN': '事件提示',
      'zh-Hant': '事件提示',
      en: 'Event prompts',
    }),
    highFallback: pick(locale, {
      'zh-CN': '核心结构判断可先作为行动基线。',
      'zh-Hant': '核心結構判斷可先作為行動基線。',
      en: 'Use the core structural read as your action baseline.',
    }),
    sensitiveFallback: pick(locale, {
      'zh-CN': '短期时机和执行节奏需要持续复核。',
      'zh-Hant': '短期時機和執行節奏需要持續複核。',
      en: 'Near-term timing and execution rhythm need ongoing review.',
    }),
    promptsFallback: pick(locale, {
      'zh-CN': '遇到关键变化时及时记录：转岗、合作、关系推进或健康波动。',
      'zh-Hant': '遇到關鍵變化時及時記錄：轉崗、合作、關係推進或健康波動。',
      en: 'Log key shifts promptly: role change, partnership, relationship progress, or health swings.',
    }),
    /** Agent verify panel chrome */
    agentEyebrow: pick(locale, {
      'zh-CN': '验证层',
      'zh-Hant': '驗證層',
      en: 'Validation layer',
    }),
    agentTitle: pick(locale, {
      'zh-CN': '规则校验结果',
      'zh-Hant': '規則校驗結果',
      en: 'Rule verification result',
    }),
    agentRulesSummary: (passed: number, total: number) =>
      pick(locale, {
        'zh-CN': `通过 ${passed}/${total} 条规则 · 结论：`,
        'zh-Hant': `通過 ${passed}/${total} 條規則 · 結論：`,
        en: `Passed ${passed}/${total} rules · Verdict:`,
      }),
  };
}

/** 12-month rhythm timeline shell */
export function reportRhythmCopy(locale: SiteLocale) {
  return {
    ariaLabel: pick(locale, {
      'zh-CN': '未来十二个月节奏板',
      'zh-Hant': '未來十二個月節奏板',
      en: 'Next 12 months rhythm board',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '节奏时间板',
      'zh-Hant': '節奏時間板',
      en: 'Rhythm board',
    }),
    headlineFallback: pick(locale, {
      'zh-CN': '未来 12 个月节奏板',
      'zh-Hant': '未來 12 個月節奏板',
      en: 'Next 12 months rhythm',
    }),
    listAria: pick(locale, {
      'zh-CN': '每月节奏项',
      'zh-Hant': '每月節奏項',
      en: 'Monthly rhythm items',
    }),
    monthFallback: pick(locale, {
      'zh-CN': '本月',
      'zh-Hant': '本月',
      en: 'This month',
    }),
    statusFallback: pick(locale, {
      'zh-CN': '稳住',
      'zh-Hant': '穩住',
      en: 'Steady',
    }),
    themeFallback: pick(locale, {
      'zh-CN': '先聚焦一个关键主题。',
      'zh-Hant': '先聚焦一個關鍵主題。',
      en: 'Focus on one key theme first.',
    }),
    empty: pick(locale, {
      'zh-CN': '暂无月度节奏项，先按当前阶段主线执行最小可验证动作。',
      'zh-Hant': '暫無月度節奏項，先按目前階段主線執行最小可驗證動作。',
      en: 'No monthly rhythm items yet — run the smallest verifiable action along the current stage line.',
    }),
    /** Agent rhythm shell */
    agentEyebrow: pick(locale, {
      'zh-CN': '节奏',
      'zh-Hant': '節奏',
      en: 'Rhythm',
    }),
    agentTitle: pick(locale, {
      'zh-CN': '阶段与窗口',
      'zh-Hant': '階段與窗口',
      en: 'Phases & windows',
    }),
    agentDescription: pick(locale, {
      'zh-CN': '人生 K 线的阶段划分与关键时间窗口。',
      'zh-Hant': '人生 K 線的階段劃分與關鍵時間窗口。',
      en: 'Life K-Line phase splits and key time windows.',
    }),
    avgScore: pick(locale, {
      'zh-CN': '均分',
      'zh-Hant': '均分',
      en: 'avg',
    }),
    score: pick(locale, {
      'zh-CN': '得分',
      'zh-Hant': '得分',
      en: 'score',
    }),
    trendUp: pick(locale, { 'zh-CN': '上升', en: 'Rising' }),
    trendDown: pick(locale, { 'zh-CN': '下行', en: 'Declining' }),
    trendFlat: pick(locale, { 'zh-CN': '平稳', 'zh-Hant': '平穩', en: 'Steady' }),
    windowPeak: pick(locale, {
      'zh-CN': '高点窗口',
      'zh-Hant': '高點窗口',
      en: 'Peak window',
    }),
    windowTrough: pick(locale, {
      'zh-CN': '低点窗口',
      'zh-Hant': '低點窗口',
      en: 'Trough window',
    }),
    windowTurning: pick(locale, {
      'zh-CN': '转折窗口',
      'zh-Hant': '轉折窗口',
      en: 'Turning window',
    }),
    windowStable: pick(locale, {
      'zh-CN': '稳定窗口',
      'zh-Hant': '穩定窗口',
      en: 'Stable window',
    }),
  };
}

/** Timing map tabs shell (classic result + agent domain tabs) */
export function reportTimingCopy(locale: SiteLocale) {
  return {
    ariaLabel: pick(locale, {
      'zh-CN': '时间地图',
      'zh-Hant': '時間地圖',
      en: 'Timing map',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '时间地图',
      'zh-Hant': '時間地圖',
      en: 'Timing map',
    }),
    title: pick(locale, {
      'zh-CN': '从今天，到未来 5 年',
      'zh-Hant': '從今天，到未來 5 年',
      en: 'From today to the next 5 years',
    }),
    tablistAria: pick(locale, {
      'zh-CN': '时间地图视角切换',
      'zh-Hant': '時間地圖視角切換',
      en: 'Timing map view switch',
    }),
    tab30d: pick(locale, {
      'zh-CN': '近 30 天',
      'zh-Hant': '近 30 天',
      en: 'Next 30 days',
    }),
    tab30dHint: pick(locale, {
      'zh-CN': '本月可执行的关键节点',
      'zh-Hant': '本月可執行的關鍵節點',
      en: 'Actionable nodes this month',
    }),
    tab12m: pick(locale, {
      'zh-CN': '近 12 月',
      'zh-Hant': '近 12 月',
      en: 'Next 12 months',
    }),
    tab12mHint: pick(locale, {
      'zh-CN': '半年到一年的窗口',
      'zh-Hant': '半年到一年的窗口',
      en: '6–12 month windows',
    }),
    tab5y: pick(locale, {
      'zh-CN': '近 5 年',
      'zh-Hant': '近 5 年',
      en: 'Next 5 years',
    }),
    tab5yHint: pick(locale, {
      'zh-CN': '人生阶段切换',
      'zh-Hant': '人生階段切換',
      en: 'Life-stage shifts',
    }),
    /** Agent domain timing tabs */
    agentTitle: pick(locale, {
      'zh-CN': '时间窗口',
      'zh-Hant': '時間窗口',
      en: 'Time windows',
    }),
    agentDescription: pick(locale, {
      'zh-CN': '按主题查看关键年份窗口与得分。',
      'zh-Hant': '按主題查看關鍵年份窗口與得分。',
      en: 'Browse key year windows and scores by theme.',
    }),
    agentDescriptionCalibrated: pick(locale, {
      'zh-CN': '已校准用户可优先按月细读窗口；此处按主题汇总关键年份与得分。',
      'zh-Hant': '已校準用戶可優先按月細讀窗口；此處按主題匯總關鍵年份與得分。',
      en: 'Calibrated users can drill monthly windows first; here themes summarize key years and scores.',
    }),
    agentEmpty: pick(locale, {
      'zh-CN': '该主题暂无窗口数据。',
      'zh-Hant': '該主題暫無窗口數據。',
      en: 'No window data for this theme yet.',
    }),
    domainCareer: pick(locale, { 'zh-CN': '事业', 'zh-Hant': '事業', en: 'Career' }),
    domainWealth: pick(locale, { 'zh-CN': '财富', 'zh-Hant': '財富', en: 'Wealth' }),
    domainRelationship: pick(locale, { 'zh-CN': '关系', 'zh-Hant': '關係', en: 'Relationships' }),
    domainHealth: pick(locale, { 'zh-CN': '健康', en: 'Health' }),
  };
}

/** Action execution board shell */
export function reportActionBoardCopy(locale: SiteLocale) {
  return {
    ariaLabel: pick(locale, {
      'zh-CN': '行动执行板',
      'zh-Hant': '行動執行板',
      en: 'Action board',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '行动执行板',
      'zh-Hant': '行動執行板',
      en: 'Action board',
    }),
    title: pick(locale, {
      'zh-CN': '按时间顺序推进，不要四列硬塞',
      'zh-Hant': '按時間順序推進，不要四列硬塞',
      en: 'Move in time order — don’t force all four lanes at once',
    }),
    laneNow: pick(locale, { 'zh-CN': '现在', 'zh-Hant': '現在', en: 'Now' }),
    lane30: pick(locale, { 'zh-CN': '30 天', en: '30 days' }),
    lane90: pick(locale, { 'zh-CN': '90 天', en: '90 days' }),
    laneAvoid: pick(locale, {
      'zh-CN': '先别做',
      'zh-Hant': '先別做',
      en: 'Avoid',
    }),
    emptyDefault: pick(locale, {
      'zh-CN': '先做一个最小可验证动作，再根据反馈放大。',
      'zh-Hant': '先做一個最小可驗證動作，再根據反饋放大。',
      en: 'Start with one smallest verifiable action, then scale from feedback.',
    }),
    emptyAvoid: pick(locale, {
      'zh-CN': '避免在时机未确认前并行高成本动作。',
      'zh-Hant': '避免在時機未確認前並行高成本動作。',
      en: 'Avoid stacking high-cost moves before timing is confirmed.',
    }),
    /** Agent multi-domain board */
    agentTitle: pick(locale, {
      'zh-CN': '分域动作板',
      'zh-Hant': '分域動作板',
      en: 'Domain action board',
    }),
    agentDescription: pick(locale, {
      'zh-CN': '各 Agent 模块提炼的可执行建议。',
      'zh-Hant': '各 Agent 模組提煉的可執行建議。',
      en: 'Executable suggestions distilled from each agent module.',
    }),
    domainCore: pick(locale, {
      'zh-CN': '核心体质',
      'zh-Hant': '核心體質',
      en: 'Core constitution',
    }),
    domainCareerWealth: pick(locale, {
      'zh-CN': '事业财富',
      'zh-Hant': '事業財富',
      en: 'Career & wealth',
    }),
    domainRelationship: pick(locale, {
      'zh-CN': '关系家庭',
      'zh-Hant': '關係家庭',
      en: 'Relationships & family',
    }),
    domainHealth: pick(locale, {
      'zh-CN': '健康生活',
      'zh-Hant': '健康生活',
      en: 'Health & lifestyle',
    }),
    domainStrategy: pick(locale, {
      'zh-CN': '策略建议',
      'zh-Hant': '策略建議',
      en: 'Strategy',
    }),
    domainTemporal: pick(locale, {
      'zh-CN': '时空环境',
      'zh-Hant': '時空環境',
      en: 'Time & space',
    }),
  };
}

/** Floating chapter dock chrome */
export function reportChapterDockCopy(locale: SiteLocale) {
  return {
    titleDefault: pick(locale, {
      'zh-CN': '章节',
      'zh-Hant': '章節',
      en: 'Chapters',
    }),
    jumpHint: pick(locale, {
      'zh-CN': '点选跳转',
      'zh-Hant': '點選跳轉',
      en: 'Tap to jump',
    }),
    collapse: pick(locale, {
      'zh-CN': '收起章节',
      'zh-Hant': '收起章節',
      en: 'Close chapters',
    }),
    chapterWith: (label: string) =>
      pick(locale, {
        'zh-CN': `章节 · ${label}`,
        'zh-Hant': `章節 · ${label}`,
        en: `Chapters · ${label}`,
      }),
  };
}

/** Agent reading path shell */
export function reportReadingPathCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, { 'zh-CN': '读法', 'zh-Hant': '讀法', en: 'How to read' }),
    title: pick(locale, {
      'zh-CN': '5 分钟阅读路径',
      'zh-Hant': '5 分鐘閱讀路徑',
      en: '5-minute reading path',
    }),
    description: pick(locale, {
      'zh-CN': '按顺序展开，避免一次消化全部术语。',
      'zh-Hant': '按順序展開，避免一次消化全部術語。',
      en: 'Follow in order — don’t try to absorb every term at once.',
    }),
    steps: [
      {
        anchor: '#cockpit',
        label: pick(locale, {
          'zh-CN': '核心结论',
          'zh-Hant': '核心結論',
          en: 'Core verdict',
        }),
        detail: pick(locale, {
          'zh-CN': '确认报告是否回答了你的核心问题。',
          'zh-Hant': '確認報告是否回答了你的核心問題。',
          en: 'Check whether the report answers your core question.',
        }),
      },
      {
        anchor: '#current-state',
        label: pick(locale, {
          'zh-CN': '当前状态',
          'zh-Hant': '目前狀態',
          en: 'Current state',
        }),
        detail: pick(locale, {
          'zh-CN': '对照时位信号与现实处境。',
          'zh-Hant': '對照時位信號與現實處境。',
          en: 'Match timing signals with your real situation.',
        }),
      },
      {
        anchor: '#rhythm',
        label: pick(locale, {
          'zh-CN': '阶段节奏',
          'zh-Hant': '階段節奏',
          en: 'Stage rhythm',
        }),
        detail: pick(locale, {
          'zh-CN': '理解当前处于哪个阶段窗口。',
          'zh-Hant': '理解目前處於哪個階段窗口。',
          en: 'See which stage window you are in now.',
        }),
      },
      {
        anchor: '#actions',
        label: pick(locale, {
          'zh-CN': '下一步动作',
          'zh-Hant': '下一步動作',
          en: 'Next actions',
        }),
        detail: pick(locale, {
          'zh-CN': '把判断落成 1–3 个可验证动作。',
          'zh-Hant': '把判斷落成 1–3 個可驗證動作。',
          en: 'Turn the judgment into 1–3 verifiable actions.',
        }),
      },
      {
        anchor: '#validation',
        label: pick(locale, {
          'zh-CN': '验证反馈',
          'zh-Hant': '驗證回饋',
          en: 'Validation feedback',
        }),
        detail: pick(locale, {
          'zh-CN': '用事件日历记录节点，回测判断。',
          'zh-Hant': '用事件日曆記錄節點，回測判斷。',
          en: 'Log milestones on the event calendar and back-test the read.',
        }),
      },
    ],
  };
}

/** Agent next-actions shell */
export function reportNextActionsCopy(locale: SiteLocale) {
  return {
    title: pick(locale, {
      'zh-CN': '下一步动作',
      'zh-Hant': '下一步動作',
      en: 'Next actions',
    }),
    description: pick(locale, {
      'zh-CN': '把判断落成可执行的三步顺序。',
      'zh-Hant': '把判斷落成可執行的三步順序。',
      en: 'Turn the judgment into a three-step executable sequence.',
    }),
    consultantOpening: pick(locale, {
      'zh-CN': '顾问开场',
      'zh-Hant': '顧問開場',
      en: 'Consultant opening',
    }),
    logEvents: pick(locale, {
      'zh-CN': '记录事件',
      'zh-Hant': '記錄事件',
      en: 'Log events',
    }),
    fallbacks: [
      pick(locale, {
        'zh-CN': '先确认本次报告最想解决的问题是否匹配你的现实处境。',
        'zh-Hant': '先確認本次報告最想解決的問題是否匹配你的現實處境。',
        en: 'Confirm the report’s core question still matches your real situation.',
      }),
      pick(locale, {
        'zh-CN': '把一项可验证的事件记入事件日历，用于后续回测。',
        'zh-Hant': '把一項可驗證的事件記入事件日曆，用於後續回測。',
        en: 'Log one verifiable event on the calendar for later back-testing.',
      }),
      pick(locale, {
        'zh-CN': '用结构追问把结论拆成更具体的行动顺序。',
        'zh-Hant': '用結構追問把結論拆成更具體的行動順序。',
        en: 'Use structural follow-ups to break the conclusion into a clearer action order.',
      }),
    ],
  };
}

/**
 * Classic result page shell (app/result/[id]/page.tsx):
 * jump chips, numbered section titles/subtitles, chapter dock labels.
 * Not engine narrative body.
 */
export function reportResultPageCopy(locale: SiteLocale) {
  return {
    chapterDockTitle: pick(locale, {
      'zh-CN': '报告章节',
      'zh-Hant': '報告章節',
      en: 'Report chapters',
    }),

    /** Chapter dock — classic/expert view */
    dockAskConsultant: pick(locale, {
      'zh-CN': '问顾问',
      'zh-Hant': '問顧問',
      en: 'Consultants',
    }),
    dockPaipan: pick(locale, {
      'zh-CN': '排盘',
      'zh-Hant': '排盤',
      en: 'Chart',
    }),
    dockDayun: pick(locale, {
      'zh-CN': '大运',
      'zh-Hant': '大運',
      en: 'Dayun',
    }),
    dockCosmos: pick(locale, {
      'zh-CN': '时空',
      'zh-Hant': '時空',
      en: 'Cosmos',
    }),
    dockDomains: pick(locale, {
      'zh-CN': '专项',
      'zh-Hant': '專項',
      en: 'Domains',
    }),
    dockProbe: pick(locale, {
      'zh-CN': '点盘',
      'zh-Hant': '點盤',
      en: 'Probe',
    }),
    dockPrint: pick(locale, {
      'zh-CN': '打印',
      'zh-Hant': '列印',
      en: 'Print',
    }),

    /** Chapter dock — mass/pro view */
    dockAction: pick(locale, {
      'zh-CN': '行动',
      'zh-Hant': '行動',
      en: 'Actions',
    }),
    dockGuide: pick(locale, {
      'zh-CN': '结论',
      'zh-Hant': '結論',
      en: 'Verdict',
    }),
    dockKline: pick(locale, {
      'zh-CN': 'K线',
      'zh-Hant': 'K線',
      en: 'K-line',
    }),
    dockOverview: pick(locale, {
      'zh-CN': '总评',
      'zh-Hant': '總評',
      en: 'Overview',
    }),
    dockElements: pick(locale, {
      'zh-CN': '喜用',
      'zh-Hant': '喜用',
      en: 'Favorable',
    }),
    dockTime: pick(locale, {
      'zh-CN': '时间',
      'zh-Hant': '時間',
      en: 'Timing',
    }),
    dockCalibration: pick(locale, {
      'zh-CN': '校准',
      'zh-Hant': '校準',
      en: 'Calibrate',
    }),

    /** Post-cockpit jump chips */
    jumpAskConsultant: pick(locale, {
      'zh-CN': '先问一位顾问',
      'zh-Hant': '先問一位顧問',
      en: 'Ask a consultant first',
    }),
    jumpTimingMap: pick(locale, {
      'zh-CN': '下一步 → 看时间地图',
      'zh-Hant': '下一步 → 看時間地圖',
      en: 'Next → Timing map',
    }),
    jumpStructure: pick(locale, {
      'zh-CN': '或 → 看结构节奏',
      'zh-Hant': '或 → 看結構節奏',
      en: 'Or → Structure & rhythm',
    }),
    jumpAiDeepAsk: pick(locale, {
      'zh-CN': '去 AI 深问',
      'zh-Hant': '去 AI 深問',
      en: 'Ask AI in depth',
    }),

    /** Numbered section chrome */
    timingTitle: pick(locale, {
      'zh-CN': '② 时间地图',
      'zh-Hant': '② 時間地圖',
      en: '② Timing map',
    }),
    timingSubtitle: pick(locale, {
      'zh-CN': '未来 30 天 / 12 个月 / 5 年关键时点。先定位窗口，再读结构细节。',
      'zh-Hant': '未來 30 天 / 12 個月 / 5 年關鍵時點。先定位窗口，再讀結構細節。',
      en: 'Key points across the next 30 days / 12 months / 5 years. Locate the window first, then read structural detail.',
    }),
    structureTitle: pick(locale, {
      'zh-CN': '③ 结构与节奏',
      'zh-Hant': '③ 結構與節奏',
      en: '③ Structure & rhythm',
    }),
    structureSubtitle: pick(locale, {
      'zh-CN': '命盘底层、阶段节奏、当前状态与四场景判断。同一结论只在这里展开一次。',
      'zh-Hant': '命盤底層、階段節奏、目前狀態與四場景判斷。同一結論只在這裡展開一次。',
      en: 'Chart foundation, stage rhythm, current state, and four-scenario reads. Each conclusion expands here once.',
    }),
    actionTitle: pick(locale, {
      'zh-CN': '④ 行动与验证',
      'zh-Hant': '④ 行動與驗證',
      en: '④ Action & validation',
    }),
    actionSubtitle: pick(locale, {
      'zh-CN': '对应「治疗方案 / 干预建议」：先做什么、不做什么，以及可信度与阶段进度。',
      'zh-Hant': '對應「治療方案 / 干預建議」：先做什麼、不做什麼，以及可信度與階段進度。',
      en: 'Like a treatment / intervention plan: what to do first, what to avoid, plus confidence and stage progress.',
    }),

    /** Jump chips under action section */
    jumpSampleCalibration: pick(locale, {
      'zh-CN': '下一步 → 样本回填校准',
      'zh-Hant': '下一步 → 樣本回填校準',
      en: 'Next → Sample backfill & calibration',
    }),
    jumpServices: pick(locale, {
      'zh-CN': '或 → 回访与专项服务',
      'zh-Hant': '或 → 回訪與專項服務',
      en: 'Or → Follow-up & specialty services',
    }),

    /** ⑤ sample backfill */
    sampleTitle: pick(locale, {
      'zh-CN': '⑤ 样本回填',
      'zh-Hant': '⑤ 樣本回填',
      en: '⑤ Sample backfill',
    }),
    sampleSubtitle: pick(locale, {
      'zh-CN': '对应「病史核对 / 基线样本」：把报告判断与真实经历对齐，供后续纠偏。',
      'zh-Hant': '對應「病史核對 / 基線樣本」：把報告判斷與真實經歷對齊，供後續糾偏。',
      en: 'Like “history check / baseline samples”: align report judgments with real experience for later correction.',
    }),

    /** ⑥ evidence appendix */
    evidenceTitle: pick(locale, {
      'zh-CN': '⑥ 证据附录',
      'zh-Hant': '⑥ 證據附錄',
      en: '⑥ Evidence appendix',
    }),
    evidenceDescription: pick(locale, {
      'zh-CN': '四柱、五行、大运、窗口与可信度——技术细节放在结论之后，默认按需展开。',
      'zh-Hant': '四柱、五行、大運、窗口與可信度——技術細節放在結論之後，預設按需展開。',
      en: 'Four pillars, five elements, dayun, windows, and confidence — technical detail after the verdict; expand on demand.',
    }),

    /** Follow-up & services block */
    servicesTitle: pick(locale, {
      'zh-CN': '回访与服务',
      'zh-Hant': '回訪與服務',
      en: 'Follow-up & services',
    }),
    servicesSubtitle: pick(locale, {
      'zh-CN': '读完主判断后再处理：会员权限、深度专项、订阅提醒与延伸工具。',
      'zh-Hant': '讀完主判斷後再處理：會員權限、深度專項、訂閱提醒與延伸工具。',
      en: 'After the main verdict: membership access, specialty depth, subscription alerts, and related tools.',
    }),
    membershipTitle: pick(locale, {
      'zh-CN': '会员与权限',
      'zh-Hant': '會員與權限',
      en: 'Membership & access',
    }),
    premiumServicesTitle: pick(locale, {
      'zh-CN': '深度专项服务',
      'zh-Hant': '深度專項服務',
      en: 'Specialty depth services',
    }),

    /** Subscription + next steps chrome */
    subscriptionTitle: pick(locale, {
      'zh-CN': '订阅与更新',
      'zh-Hant': '訂閱與更新',
      en: 'Subscribe & updates',
    }),
    nextStepTitle: pick(locale, {
      'zh-CN': '延伸与下一步',
      'zh-Hant': '延伸與下一步',
      en: 'Extend & next steps',
    }),
    nextStepSubtitle: pick(locale, {
      'zh-CN': '可执行清单、路径与延伸阅读，按需展开。',
      'zh-Hant': '可執行清單、路徑與延伸閱讀，按需展開。',
      en: 'Action lists, paths, and further reading — expand as needed.',
    }),
    sidebarSampleBackfill: pick(locale, {
      'zh-CN': '去样本回填',
      'zh-Hant': '去樣本回填',
      en: 'Sample backfill',
    }),
    sidebarCalibration: pick(locale, {
      'zh-CN': '去校准互动',
      'zh-Hant': '去校準互動',
      en: 'Calibration',
    }),
    againAnalyze: pick(locale, {
      'zh-CN': '再次分析',
      'zh-Hant': '再次分析',
      en: 'Analyze again',
    }),
  };
}

export type ReportCockpitCopy = ReturnType<typeof reportCockpitCopy>;
export type ReportCockpitShellCopy = ReturnType<typeof reportCockpitShellCopy>;
export type ReportConsultantCardsCopy = ReturnType<typeof reportConsultantCardsCopy>;
export type ShareImageCopy = ReturnType<typeof shareImageCopy>;
export type ReportValidationCopy = ReturnType<typeof reportValidationCopy>;
export type ReportRhythmCopy = ReturnType<typeof reportRhythmCopy>;
export type ReportTimingCopy = ReturnType<typeof reportTimingCopy>;
export type ReportActionBoardCopy = ReturnType<typeof reportActionBoardCopy>;
export type ReportChapterDockCopy = ReturnType<typeof reportChapterDockCopy>;
export type ReportReadingPathCopy = ReturnType<typeof reportReadingPathCopy>;
export type ReportNextActionsCopy = ReturnType<typeof reportNextActionsCopy>;
export type ReportResultPageCopy = ReturnType<typeof reportResultPageCopy>;
