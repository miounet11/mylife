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
    threeStepsTitle: pick(locale, {
      'zh-CN': '三步走通',
      en: 'Three steps',
    }),
    threeStepsDesc: pick(locale, {
      'zh-CN': '1）填生日跑单项 → 2）看日主/用神与窗口 → 3）需要时生成完整报告并追问',
      en: '1) Enter birth date for one tool → 2) Review day master / useful god & windows → 3) Upgrade to full report & ask when needed',
    }),
    startYearlyCta: pick(locale, {
      'zh-CN': '开始：年度主窗口',
      en: 'Start: Yearly window',
    }),
    yearlyWindowTitle: pick(locale, {
      'zh-CN': '年度主窗口',
      en: 'Yearly main window',
    }),
    birthQuick: [
      {
        href: '/tools/timing-yearly-window',
        title: pick(locale, {
          'zh-CN': '年度主窗口',
          en: 'Yearly main window',
        }),
        desc: pick(locale, {
          'zh-CN': '看今年推进与防守节奏 · 填生日即可',
          en: 'This year’s push vs hold rhythm · birth date only',
        }),
        primary: true as const,
      },
      {
        href: '/tools/daily-sign',
        title: pick(locale, {
          'zh-CN': '今日一签',
          en: 'Daily sign',
        }),
        desc: pick(locale, {
          'zh-CN': '短周期节奏参考',
          en: 'Short-cycle rhythm reference',
        }),
      },
      {
        href: '/tools/career-role-fit',
        title: pick(locale, {
          'zh-CN': '岗位匹配',
          en: 'Role fit',
        }),
        desc: pick(locale, {
          'zh-CN': '事业方向与阶段动作',
          en: 'Career direction & stage actions',
        }),
      },
      {
        href: '/hehun',
        title: pick(locale, {
          'zh-CN': '合婚双盘',
          en: 'Compatibility dual chart',
        }),
        desc: pick(locale, {
          'zh-CN': '双方生日对盘，无需完整报告',
          en: 'Both birth dates; no full report needed',
        }),
      },
    ],
    scenesTitle: pick(locale, {
      'zh-CN': '场景研判',
      en: 'Scene judgment',
    }),
    scenesDesc: pick(locale, {
      'zh-CN': '运势、工作、投资等高频问题。',
      en: 'Fortune, work, investing, and other frequent questions.',
    }),
    askTeachers: pick(locale, {
      'zh-CN': '问老师',
      en: 'Ask a consultant',
    }),
    allConsultants: pick(locale, {
      'zh-CN': '全部',
      en: 'All',
    }),
    recommendedTools: pick(locale, {
      'zh-CN': '推荐工具',
      en: 'Recommended tools',
    }),
    byTheme: pick(locale, {
      'zh-CN': '按主题',
      en: 'By theme',
    }),
    footerNote: pick(locale, {
      'zh-CN': '工具结论锚定引擎真值（日主/用神/大运）。需要细拆时，再到完整报告或请老师。',
      en: 'Tool results are anchored to engine truth (day master / useful god / dayun). Go to the full report or a consultant when you need a finer breakdown.',
    }),
    seo: {
      title: pick(locale, {
        'zh-CN': '工具中心｜流年窗口、今日一签与十维度入口',
        en: 'Tools hub · Yearly window, daily sign & ten dimensions',
      }),
      description: pick(locale, {
        'zh-CN':
          '高意图免费命理工具：2026 流年主窗口、今日一签、手相观察；并与十维度深度研判、完整八字报告、预测回访互通，适合快速验证与深度判断衔接。',
        en: 'Free high-intent tools: yearly window, daily sign, palm reading; linked to ten dimensions, full Bazi reports, and prediction check-ins—from quick checks to deeper judgment.',
      }),
      keywords:
        locale === 'en'
          ? [
              'bazi tools',
              'yearly window',
              'daily sign',
              'palm reading',
              'ten dimensions',
              'free destiny tools',
            ]
          : ['八字工具', '流年窗口', '今日一签', '手相观察', '十维度', '免费命理测试'],
    },
    form: {
      title: pick(locale, {
        'zh-CN': '本页直接测',
        en: 'Try on this page',
      }),
      description: pick(locale, {
        'zh-CN': '填出生信息，即时跑「年度主窗口」；无需先出完整报告。',
        en: 'Enter birth details to run Yearly window now—no full report required.',
      }),
      rememberedHint: pick(locale, {
        'zh-CN': '已填入本机记住的出生信息，可直接运行。',
        en: 'Filled remembered birth details from this device—you can run now.',
      }),
      birthDate: pick(locale, {
        'zh-CN': '出生日期',
        en: 'Birth date',
      }),
      birthTime: pick(locale, {
        'zh-CN': '时辰',
        en: 'Time',
      }),
      gender: pick(locale, {
        'zh-CN': '性别',
        en: 'Gender',
      }),
      male: pick(locale, {
        'zh-CN': '男',
        en: 'Male',
      }),
      female: pick(locale, {
        'zh-CN': '女',
        en: 'Female',
      }),
      birthPlace: pick(locale, {
        'zh-CN': '出生地（可选，用于真太阳时）',
        en: 'Birth place (optional, for true solar time)',
      }),
      birthPlacePlaceholder: pick(locale, {
        'zh-CN': '例如：上海 或 成都 · 104.1°E',
        en: 'e.g. Shanghai or Chengdu · 104.1°E',
      }),
      trueSolarApprox: (sign: string, absMin: number, hhmm: string) =>
        pick(locale, {
          'zh-CN': `真太阳时约 ${sign}${absMin} 分 · ${hhmm}`,
          en: `True solar ≈ ${sign}${absMin} min · ${hhmm}`,
        }),
      trueSolarEngineNote: pick(locale, {
        'zh-CN': '· 引擎在地点可解析时按经度估算真太阳时',
        en: '· Engine estimates true solar time from longitude when place resolves',
      }),
      invalidBirthDate: pick(locale, {
        'zh-CN': '请填写有效出生日期',
        en: 'Enter a valid birth date',
      }),
      runFailed: pick(locale, {
        'zh-CN': '运行失败，请稍后再试',
        en: 'Run failed—try again later',
      }),
      missingSession: pick(locale, {
        'zh-CN': '结果已生成但缺少会话 ID，请重试',
        en: 'Result ready but session ID missing—retry',
      }),
      timeout: pick(locale, {
        'zh-CN': '运行等待时间过长，请稍后重试',
        en: 'Run timed out—try again later',
      }),
      networkError: pick(locale, {
        'zh-CN': '网络异常，暂时无法运行',
        en: 'Network error—cannot run right now',
      }),
      submitting: pick(locale, {
        'zh-CN': '重算中…',
        en: 'Running…',
      }),
      submit: pick(locale, {
        'zh-CN': '用出生信息测年度主窗口',
        en: 'Run yearly window with birth details',
      }),
    },
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
