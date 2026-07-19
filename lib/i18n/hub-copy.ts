/**
 * Short EN/zh chrome for hub pages + report cover / chart panels.
 * Keep user names, pillars, and engine data as-is.
 * zh-Hant falls back to simplified unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Teachers gallery (/teachers) */
export function teachersHubCopy(locale: SiteLocale) {
  return {
    title: pick(locale, {
      'zh-CN': '请老师',
      'zh-Hant': '請老師',
      en: 'Consultants',
    }),
    description: pick(locale, {
      'zh-CN': '一位老师专一事。有报告时会带上你的盘与记录；不预填长问题，老师先开场。',
      'zh-Hant': '一位老師專一事。有報告時會帶上你的盤與記錄；不預填長問題，老師先開場。',
      en: 'One consultant per focus. With a report we load your chart and notes; no long prefilled question—the consultant opens first.',
    }),
    ctaGenerate: pick(locale, {
      'zh-CN': '生成报告',
      en: 'Generate report',
    }),
    linkOverviewOpen: pick(locale, {
      'zh-CN': '总览开场',
      en: 'Overview opening',
    }),
    linkProfile: pick(locale, {
      'zh-CN': '我的资料',
      en: 'My profile',
    }),
    intentEyebrow: pick(locale, {
      'zh-CN': '按意图开场',
      en: 'Open by intent',
    }),
    recommendedPrefix: pick(locale, {
      'zh-CN': '推荐',
      en: 'Recommended',
    }),
    currentIntentPrefix: pick(locale, {
      'zh-CN': '当前意图',
      en: 'Current intent',
    }),
    withReportCtx: pick(locale, {
      'zh-CN': '已带报告上下文',
      en: 'Report context loaded',
    }),
    withoutReportCtx: pick(locale, {
      'zh-CN': '暂无报告时也可先开场',
      en: 'You can open without a report',
    }),
    startOpening: pick(locale, {
      'zh-CN': '开始开场 →',
      en: 'Start opening →',
    }),
    galleryTitle: pick(locale, {
      'zh-CN': '常用',
      en: 'Common',
    }),
    gallerySubtitle: pick(locale, {
      'zh-CN': '点老师进入顾问卡开场（一键议题 / 一键开口）',
      en: 'Tap a consultant to open (topic chips / one-tap start)',
    }),
    moreTitle: pick(locale, {
      'zh-CN': '更多',
      en: 'More',
    }),
    intents: {
      career: pick(locale, { 'zh-CN': '事业方向', en: 'Career' }),
      wealth: pick(locale, { 'zh-CN': '财务取舍', en: 'Wealth' }),
      relationship: pick(locale, { 'zh-CN': '关系决策', en: 'Relationships' }),
      timing: pick(locale, { 'zh-CN': '时机窗口', en: 'Timing' }),
      health: pick(locale, { 'zh-CN': '节律健康', en: 'Rhythm' }),
      practice: pick(locale, { 'zh-CN': '验证复盘', en: 'Practice' }),
    } as const,
  };
}

/** Ten dimensions hub (/dimensions) */
export function dimensionsHubCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': '十维度',
      'zh-Hant': '十維度',
      en: 'Ten dimensions',
    }),
    titleGeneral: pick(locale, {
      'zh-CN': '场景研判',
      en: 'Scene judgment',
    }),
    ctaFullReport: pick(locale, {
      'zh-CN': '完整报告',
      en: 'Full report',
    }),
    linkPredictions: pick(locale, {
      'zh-CN': '预测回访',
      en: 'Prediction check-in',
    }),
    linkTools: pick(locale, {
      'zh-CN': '工具',
      en: 'Tools',
    }),
    askTeachers: pick(locale, {
      'zh-CN': '问老师',
      en: 'Ask a consultant',
    }),
    askTeachersDesc: pick(locale, {
      'zh-CN': '先选场景研判，或直接进入顾问开场继续拆。',
      en: 'Pick a scene first, or open a consultant to go deeper.',
    }),
    allConsultants: pick(locale, {
      'zh-CN': '全部',
      en: 'All',
    }),
    consultants: {
      overview: pick(locale, { 'zh-CN': '总览', en: 'Overview' }),
      career: pick(locale, { 'zh-CN': '事业', en: 'Career' }),
      timing: pick(locale, { 'zh-CN': '时机', en: 'Timing' }),
      wealth: pick(locale, { 'zh-CN': '财务', en: 'Wealth' }),
    } as const,
    linkTeachers: pick(locale, {
      'zh-CN': '请老师',
      en: 'Consultants',
    }),
    linkHehun: pick(locale, {
      'zh-CN': '合婚',
      en: 'Compatibility',
    }),
    linkLearn: pick(locale, {
      'zh-CN': '专题',
      en: 'Topics',
    }),
    openScenes: (count: number) =>
      pick(locale, {
        'zh-CN': `已开放 ${count} 个可用场景`,
        en: `${count} scenes available`,
      }),
    commonPrefix: pick(locale, {
      'zh-CN': '常用',
      en: 'Common',
    }),
    expandingCount: (n: number) =>
      pick(locale, {
        'zh-CN': `另有 ${n} 个在扩展`,
        en: `${n} more expanding`,
      }),
    sourceWorkbench: (label: string) =>
      pick(locale, {
        'zh-CN': `来源：工作台主题「${label}」。下面已把更相关的维度排在前面，也可直接`,
        en: `From workbench theme “${label}”. More relevant dimensions are listed first; or go to`,
      }),
  };
}

/** Tools hub (/tools) */
export function toolsHubCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': '工具',
      en: 'Tools',
    }),
    title: pick(locale, {
      'zh-CN': '填生日即可测',
      en: 'Try with birth date only',
    }),
    description: pick(locale, {
      'zh-CN':
        '不用先出完整报告。选一个问题，填出生信息，引擎即时给主题判断；需要时再升级完整报告与老师追问。',
      en: 'No full report required. Pick a question, enter birth details, get a topic read—upgrade to full report or consultants when you need depth.',
    }),
    ctaBirth: pick(locale, {
      'zh-CN': '填生日测',
      en: 'Try with birth date',
    }),
    heroYearly: pick(locale, {
      'zh-CN': '先测年度主窗口',
      en: 'Yearly window first',
    }),
    linkDimensions: pick(locale, {
      'zh-CN': '十维度',
      en: 'Ten dimensions',
    }),
    linkFullReport: pick(locale, {
      'zh-CN': '完整报告',
      en: 'Full report',
    }),
    linkHehun: pick(locale, {
      'zh-CN': '合婚',
      en: 'Compatibility',
    }),
    consultants: {
      career: pick(locale, { 'zh-CN': '事业', en: 'Career' }),
      timing: pick(locale, { 'zh-CN': '时机', en: 'Timing' }),
      wealth: pick(locale, { 'zh-CN': '财务', en: 'Wealth' }),
    } as const,
  };
}

/** Report cover + share strip static chrome */
export function reportCoverCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': '人生K线 · 判断报告',
      'zh-Hant': '人生K線 · 判斷報告',
      en: 'Life K-Line · Decision report',
    }),
    wordmarkEn: 'LIFE KLINE · DECISION REPORT',
    reportOf: pick(locale, {
      'zh-CN': '的判断报告',
      'zh-Hant': '的判斷報告',
      en: '· Decision report',
    }),
    birthTime: pick(locale, {
      'zh-CN': '出生时间',
      en: 'Birth time',
    }),
    birthPlace: pick(locale, {
      'zh-CN': '出生地点',
      en: 'Birth place',
    }),
    generatedAt: pick(locale, {
      'zh-CN': '生成时间',
      en: 'Generated',
    }),
    defaultName: pick(locale, {
      'zh-CN': '你的命盘',
      en: 'Your chart',
    }),
    shareDefaultTitle: pick(locale, {
      'zh-CN': '人生K线结构结论',
      en: 'Life K-Line structure conclusion',
    }),
    shareEyebrow: pick(locale, {
      'zh-CN': '人生K线 · 结构结论',
      en: 'Life K-Line · Structure conclusion',
    }),
    pillarsLabel: (summary: string) =>
      pick(locale, {
        'zh-CN': `四柱要点：${summary}`,
        en: `Pillars: ${summary}`,
      }),
    stageFallback: pick(locale, {
      'zh-CN': '阶段与窗口以报告正文为准',
      en: 'Stage and windows follow the full report',
    }),
    shareDisclaimer: pick(locale, {
      'zh-CN': '结构参考 · 可回访验证，不是宿命定论',
      en: 'Structure reference · verifiable—not destiny fixed',
    }),
  };
}

/** Dense 四柱一屏 panel chrome */
export function proBaziChartCopy(locale: SiteLocale) {
  return {
    structureLabel: pick(locale, {
      'zh-CN': '命盘结构',
      en: 'Chart structure',
    }),
    title: pick(locale, {
      'zh-CN': '四柱一屏',
      en: 'Four pillars at a glance',
    }),
    ariaLabel: pick(locale, {
      'zh-CN': '四柱一屏',
      en: 'Four pillars at a glance',
    }),
    dayMaster: (dm: string) =>
      pick(locale, {
        'zh-CN': `日主 ${dm}`,
        en: `Day master ${dm}`,
      }),
    emptyTitle: pick(locale, {
      'zh-CN': '四柱数据待生成',
      en: 'Pillars not generated yet',
    }),
    emptyDesc: pick(locale, {
      'zh-CN': '排盘完成后将在此展示年/月/日/时柱、十神与当前大运。',
      en: 'After charting, year/month/day/hour pillars, ten gods, and current luck cycle appear here.',
    }),
    yongShen: pick(locale, {
      'zh-CN': '用神',
      en: 'Favorable elements',
    }),
    pending: pick(locale, {
      'zh-CN': '待定',
      en: 'TBD',
    }),
    currentDaYun: pick(locale, {
      'zh-CN': '当前大运',
      en: 'Current luck cycle',
    }),
    nextWindow: pick(locale, {
      'zh-CN': '下一窗口',
      en: 'Next window',
    }),
    pillarLabels: [
      pick(locale, { 'zh-CN': '年柱', en: 'Year' }),
      pick(locale, { 'zh-CN': '月柱', en: 'Month' }),
      pick(locale, { 'zh-CN': '日柱', en: 'Day' }),
      pick(locale, { 'zh-CN': '时柱', en: 'Hour' }),
    ] as [string, string, string, string],
  };
}
