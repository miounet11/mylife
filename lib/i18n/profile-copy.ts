/**
 * EN/zh chrome for /profile hub (top fold, rail, main CTAs).
 * Keep user names, fortunes, pattern types, and API payloads as-is.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Top-fold hero, CTAs, priority sections, rail, and load errors for /profile */
export function profilePageCopy(locale: SiteLocale) {
  return {
    // —— Header / FocusHero ——
    headerCtaOpen: pick(locale, {
      'zh-CN': '顾问开场',
      'zh-Hant': '顧問開場',
      en: 'Consultant open',
    }),
    headerCtaAsk: pick(locale, {
      'zh-CN': '问顾问',
      'zh-Hant': '問顧問',
      en: 'Ask consultant',
    }),
    heroEyebrow: pick(locale, {
      'zh-CN': '我的档案',
      'zh-Hant': '我的檔案',
      en: 'My profile',
    }),
    heroTitle: pick(locale, {
      'zh-CN': '恢复下一步',
      'zh-Hant': '恢復下一步',
      en: 'Resume next step',
    }),
    heroDescription: pick(locale, {
      'zh-CN': '续接最新报告、工具历史与事件反馈。',
      'zh-Hant': '續接最新報告、工具歷史與事件回饋。',
      en: 'Continue from your latest report, tool history, and event feedback.',
    }),
    openLatestReport: pick(locale, {
      'zh-CN': '打开最新报告',
      'zh-Hant': '打開最新報告',
      en: 'Open latest report',
    }),
    startAnalyze: pick(locale, {
      'zh-CN': '开始分析',
      'zh-Hant': '開始分析',
      en: 'Start analysis',
    }),
    consultantOpen: pick(locale, {
      'zh-CN': '顾问开场',
      'zh-Hant': '顧問開場',
      en: 'Consultant open',
    }),
    editProfile: pick(locale, {
      'zh-CN': '编辑资料',
      'zh-Hant': '編輯資料',
      en: 'Edit details',
    }),
    askTeachers: pick(locale, {
      'zh-CN': '请老师',
      'zh-Hant': '請老師',
      en: 'Consultants',
    }),

    // —— Errors ——
    loadFailed: pick(locale, {
      'zh-CN': '加载档案失败',
      'zh-Hant': '載入檔案失敗',
      en: 'Failed to load profile',
    }),
    networkError: pick(locale, {
      'zh-CN': '网络异常，无法加载档案',
      'zh-Hant': '網路異常，無法載入檔案',
      en: 'Network error — could not load profile',
    }),

    // —— Illustration strip ——
    stripTitle: pick(locale, {
      'zh-CN': '资料怎么补',
      'zh-Hant': '資料怎麼補',
      en: 'How to complete your profile',
    }),

    // —— Retention resume panel ——
    resumeTitleWithReport: pick(locale, {
      'zh-CN': '接着你的最新报告继续推进',
      'zh-Hant': '接著你的最新報告繼續推進',
      en: 'Continue from your latest report',
    }),
    resumeTitleWithoutReport: pick(locale, {
      'zh-CN': '先生成第一份个人底盘',
      'zh-Hant': '先生成第一份個人底盤',
      en: 'Generate your first personal baseline',
    }),
    resumeDescWithReport: pick(locale, {
      'zh-CN':
        '档案页的价值不是静态查看，而是直接恢复上次没完成的判断任务。先接回聊天，再回到报告和事件验证，不要重新从零浏览。',
      'zh-Hant':
        '檔案頁的價值不是靜態查看，而是直接恢復上次沒完成的判斷任務。先接回聊天，再回到報告和事件驗證，不要重新從零瀏覽。',
      en: 'This page is for resuming unfinished judgment work—not static browsing. Reopen chat first, then report and event checks; don’t start from zero.',
    }),
    resumeDescWithoutReport: pick(locale, {
      'zh-CN':
        '还没有报告时，档案页不能形成复访闭环。先完成第一份分析，再让报告、事件、工具和邮件召回形成连续路径。',
      'zh-Hant':
        '還沒有報告時，檔案頁不能形成複訪閉環。先完成第一份分析，再讓報告、事件、工具和郵件召回形成連續路徑。',
      en: 'Without a report, this page can’t form a return loop. Finish a first analysis so reports, events, tools, and email recall connect.',
    }),
    statReports: pick(locale, {
      'zh-CN': '历史报告',
      'zh-Hant': '歷史報告',
      en: 'Past reports',
    }),
    statReportsHelper: pick(locale, {
      'zh-CN': '可恢复的判断底盘',
      'zh-Hant': '可恢復的判斷底盤',
      en: 'Recoverable judgment baseline',
    }),
    statEvents: pick(locale, {
      'zh-CN': '关键事件',
      'zh-Hant': '關鍵事件',
      en: 'Key events',
    }),
    statEventsHelper: pick(locale, {
      'zh-CN': '可验证和纠偏的节点',
      'zh-Hant': '可驗證和糾偏的節點',
      en: 'Nodes you can verify and correct',
    }),
    statSubscription: pick(locale, {
      'zh-CN': '订阅状态',
      'zh-Hant': '訂閱狀態',
      en: 'Subscription',
    }),
    subscriptionActive: pick(locale, {
      'zh-CN': '已激活',
      'zh-Hant': '已啟用',
      en: 'Active',
    }),
    subscriptionInactive: pick(locale, {
      'zh-CN': '未激活',
      'zh-Hant': '未啟用',
      en: 'Inactive',
    }),
    emailUnbound: pick(locale, {
      'zh-CN': '尚未绑定邮箱',
      'zh-Hant': '尚未綁定郵箱',
      en: 'Email not linked yet',
    }),
    openWithReport: pick(locale, {
      'zh-CN': '带报告开场',
      'zh-Hant': '帶報告開場',
      en: 'Open with report',
    }),
    askHowToArchive: pick(locale, {
      'zh-CN': '先问顾问如何建档',
      'zh-Hant': '先問顧問如何建檔',
      en: 'Ask how to build your profile',
    }),
    startFirstAnalyze: pick(locale, {
      'zh-CN': '开始第一份分析',
      'zh-Hant': '開始第一份分析',
      en: 'Start first analysis',
    }),
    enterEventVerify: pick(locale, {
      'zh-CN': '进入事件验证',
      'zh-Hant': '進入事件驗證',
      en: 'Event verification',
    }),

    // —— Dimension recommendations ——
    dimensionsTitle: pick(locale, {
      'zh-CN': '下一步：进入场景维度研判',
      'zh-Hant': '下一步：進入場景維度研判',
      en: 'Next: scene dimension judgment',
    }),
    dimensionsDescription: pick(locale, {
      'zh-CN': '结合你的档案主题与已探索进度，优先推荐最值得先做的窄场景研判。',
      'zh-Hant': '結合你的檔案主題與已探索進度，優先推薦最值得先做的窄場景研判。',
      en: 'Based on your profile themes and progress, prioritize the narrowest high-value scenes first.',
    }),

    // —— Long-term archive section ——
    longTermEyebrow: pick(locale, {
      'zh-CN': '长期档案',
      'zh-Hant': '長期檔案',
      en: 'Long-term archive',
    }),
    longTermDesc: pick(locale, {
      'zh-CN': '记录真实人生事件、验证历史预测，让下次报告记住你的处境与命中率。',
      'zh-Hant': '記錄真實人生事件、驗證歷史預測，讓下次報告記住你的處境與命中率。',
      en: 'Log real life events and check past predictions so the next report remembers your context and hit rate.',
    }),
    lifeEventsBackfill: pick(locale, {
      'zh-CN': '人生事件回填',
      'zh-Hant': '人生事件回填',
      en: 'Backfill life events',
    }),
    predictionVerify: pick(locale, {
      'zh-CN': '预测验证',
      'zh-Hant': '預測驗證',
      en: 'Prediction check-in',
    }),

    // —— Stats ——
    statsEyebrow: pick(locale, {
      'zh-CN': '个人底盘指标',
      'zh-Hant': '個人底盤指標',
      en: 'Baseline metrics',
    }),
    statAnalyses: pick(locale, {
      'zh-CN': '累计分析',
      'zh-Hant': '累計分析',
      en: 'Analyses',
    }),
    statTrendYears: pick(locale, {
      'zh-CN': '趋势年份',
      'zh-Hant': '趨勢年份',
      en: 'Trend years',
    }),
    statLatestPattern: pick(locale, {
      'zh-CN': '最近格局',
      'zh-Hant': '最近格局',
      en: 'Latest pattern',
    }),
    patternPending: pick(locale, {
      'zh-CN': '待生成',
      'zh-Hant': '待生成',
      en: 'Pending',
    }),

    // —— Priority disclosure: continue actions ——
    priorityLabel: pick(locale, {
      'zh-CN': '继续操作',
      'zh-Hant': '繼續操作',
      en: 'Continue',
    }),
    priorityTitle: pick(locale, {
      'zh-CN': '工具、事件、历史和订阅',
      'zh-Hant': '工具、事件、歷史和訂閱',
      en: 'Tools, events, history & subscription',
    }),
    priorityDescription: pick(locale, {
      'zh-CN': '主动作已经放在顶部；低频入口默认收起。',
      'zh-Hant': '主動作已經放在頂部；低頻入口預設收起。',
      en: 'Primary actions are at the top; lower-frequency entries stay compact.',
    }),
    toolsCenter: pick(locale, {
      'zh-CN': '工具中心',
      'zh-Hant': '工具中心',
      en: 'Tools hub',
    }),
    manageEvents: pick(locale, {
      'zh-CN': '管理事件',
      'zh-Hant': '管理事件',
      en: 'Manage events',
    }),
    viewHistory: pick(locale, {
      'zh-CN': '查看历史',
      'zh-Hant': '查看歷史',
      en: 'View history',
    }),
    manageSubscription: pick(locale, {
      'zh-CN': '管理订阅',
      'zh-Hant': '管理訂閱',
      en: 'Manage subscription',
    }),
    bindEmail: pick(locale, {
      'zh-CN': '绑定邮箱',
      'zh-Hant': '綁定郵箱',
      en: 'Link email',
    }),
    viewLatestReport: pick(locale, {
      'zh-CN': '查看最新报告',
      'zh-Hant': '查看最新報告',
      en: 'View latest report',
    }),

    // —— Tool history panel ——
    toolHistoryTitle: pick(locale, {
      'zh-CN': '工具运行结果',
      'zh-Hant': '工具運行結果',
      en: 'Tool run results',
    }),
    toolHistoryDescription: pick(locale, {
      'zh-CN': '已完成的工具结论可点开回看；浏览记录附在下方。',
      'zh-Hant': '已完成的工具結論可點開回看；瀏覽記錄附在下方。',
      en: 'Open finished tool conclusions; browse history is listed below.',
    }),

    // —— Journey disclosure (section chrome only) ——
    journeyLabel: pick(locale, {
      'zh-CN': '个人路径',
      'zh-Hant': '個人路徑',
      en: 'Your path',
    }),
    journeyTitle: pick(locale, {
      'zh-CN': '工具、文章和案例推荐',
      'zh-Hant': '工具、文章和案例推薦',
      en: 'Tools, articles & case picks',
    }),
    journeyDescription: pick(locale, {
      'zh-CN': '用户先恢复任务，再展开推荐路径。',
      'zh-Hant': '用戶先恢復任務，再展開推薦路徑。',
      en: 'Resume tasks first, then expand recommended paths.',
    }),
    journeyHubTitle: pick(locale, {
      'zh-CN': '你的主测算、工具和文章已经开始形成个人路径',
      'zh-Hant': '你的主測算、工具和文章已經開始形成個人路徑',
      en: 'Your main chart, tools, and reading are forming a personal path',
    }),
    journeyHubDescription: pick(locale, {
      'zh-CN':
        '这里会把主报告、工具结果和阅读记录接回一条持续复访的个人路径，不再是分散的单次页面。',
      'zh-Hant':
        '這裡會把主報告、工具結果和閱讀記錄接回一條持續複訪的個人路徑，不再是分散的單次頁面。',
      en: 'Main reports, tool results, and reading notes reconnect into one return path—not scattered one-off pages.',
    }),

    // —— Updates status (chrome only; values stay API-driven) ——
    updatesEyebrow: pick(locale, {
      'zh-CN': '更新状态',
      'zh-Hant': '更新狀態',
      en: 'Update status',
    }),
    updatesTitle: pick(locale, {
      'zh-CN': '我的更新状态',
      'zh-Hant': '我的更新狀態',
      en: 'My updates',
    }),
    updatesDescription: pick(locale, {
      'zh-CN': '订阅、月度回执与最新可回访报告一览。',
      'zh-Hant': '訂閱、月度回執與最新可回訪報告一覽。',
      en: 'Subscription, monthly receipts, and latest re-openable reports.',
    }),
    enterUpdatesCenter: pick(locale, {
      'zh-CN': '进入更新中心',
      'zh-Hant': '進入更新中心',
      en: 'Open updates center',
    }),
    loginForUpdates: pick(locale, {
      'zh-CN': '登录查看更新',
      'zh-Hant': '登入查看更新',
      en: 'Sign in for updates',
    }),
    tileSubscription: pick(locale, {
      'zh-CN': '订阅状态',
      'zh-Hant': '訂閱狀態',
      en: 'Subscription',
    }),
    tileUpgradeActive: pick(locale, {
      'zh-CN': '内容补全中',
      'zh-Hant': '內容補全中',
      en: 'Filling in content',
    }),
    tileUpgradeHelper: pick(locale, {
      'zh-CN': '正在继续完善的报告数量',
      'zh-Hant': '正在繼續完善的報告數量',
      en: 'Reports still being enriched',
    }),
    tileLatestDigest: pick(locale, {
      'zh-CN': '最近月度更新',
      'zh-Hant': '最近月度更新',
      en: 'Latest monthly update',
    }),
    tileLatestReport: pick(locale, {
      'zh-CN': '最新报告',
      'zh-Hant': '最新報告',
      en: 'Latest report',
    }),
    reportReopenable: pick(locale, {
      'zh-CN': '可回访',
      'zh-Hant': '可回訪',
      en: 'Re-openable',
    }),
    reportPending: pick(locale, {
      'zh-CN': '待生成',
      'zh-Hant': '待生成',
      en: 'Not generated',
    }),
    qualityScore: (score: number) =>
      pick(locale, {
        'zh-CN': `可信度 ${score}`,
        'zh-Hant': `可信度 ${score}`,
        en: `Confidence ${score}`,
      }),
    noReopenableYet: pick(locale, {
      'zh-CN': '还没有生成可复访的结果',
      'zh-Hant': '還沒有生成可複訪的結果',
      en: 'No re-openable result yet',
    }),
    noneYet: pick(locale, {
      'zh-CN': '暂无',
      'zh-Hant': '暫無',
      en: 'None yet',
    }),
    latestReopenableReport: pick(locale, {
      'zh-CN': '最近一次可回访报告',
      'zh-Hant': '最近一次可回訪報告',
      en: 'Latest re-openable report',
    }),
    latestReportContinue: (name: string) =>
      pick(locale, {
        'zh-CN': `${name}，可以继续回看和追问。`,
        'zh-Hant': `${name}，可以繼續回看和追問。`,
        en: `${name} — reopen and follow up anytime.`,
      }),
    defaultReportName: pick(locale, {
      'zh-CN': '我的报告',
      'zh-Hant': '我的報告',
      en: 'My report',
    }),
    noLatestReport: pick(locale, {
      'zh-CN': '当前还没有最近报告。',
      'zh-Hant': '目前還沒有最近報告。',
      en: 'No recent report yet.',
    }),
    latestDigestReceipt: pick(locale, {
      'zh-CN': '最近一次更新回执',
      'zh-Hant': '最近一次更新回執',
      en: 'Latest update receipt',
    }),
    thisCycle: pick(locale, {
      'zh-CN': '本周期',
      'zh-Hant': '本週期',
      en: 'This cycle',
    }),
    noDigestYet: pick(locale, {
      'zh-CN': '当前还没有月度更新回执。',
      'zh-Hant': '目前還沒有月度更新回執。',
      en: 'No monthly update receipt yet.',
    }),
    noReceiptNote: pick(locale, {
      'zh-CN': '暂无回执说明',
      'zh-Hant': '暫無回執說明',
      en: 'No receipt note',
    }),
    digestSent: pick(locale, {
      'zh-CN': '已发送',
      'zh-Hant': '已發送',
      en: 'Sent',
    }),
    digestError: pick(locale, {
      'zh-CN': '发送失败',
      'zh-Hant': '發送失敗',
      en: 'Send failed',
    }),
    digestSkipped: pick(locale, {
      'zh-CN': '本轮跳过',
      'zh-Hant': '本輪跳過',
      en: 'Skipped this cycle',
    }),
    digestNone: pick(locale, {
      'zh-CN': '暂无记录',
      'zh-Hant': '暫無記錄',
      en: 'No record',
    }),

    // —— Product surface role ——
    roleTitle: pick(locale, {
      'zh-CN': '档案页先恢复任务，不做静态资料堆叠',
      'zh-Hant': '檔案頁先恢復任務，不做靜態資料堆疊',
      en: 'This page resumes tasks—not a static data dump',
    }),
    roleDescription: pick(locale, {
      'zh-CN':
        '用户回到这里时，最重要的是续接最新报告、工具历史和事件反馈，而不是重新理解整套系统。',
      'zh-Hant':
        '用戶回到這裡時，最重要的是續接最新報告、工具歷史和事件回饋，而不是重新理解整套系統。',
      en: 'When you return, continue from the latest report, tool history, and event feedback—not relearn the whole system.',
    }),

    // —— Empty state ——
    emptyTitle: pick(locale, {
      'zh-CN': '你的档案还没有形成',
      'zh-Hant': '你的檔案還沒有形成',
      en: 'Your profile is not formed yet',
    }),
    emptyDescription: pick(locale, {
      'zh-CN': '完成第一次分析后，报告、事件和工具历史会在这里形成可恢复的连续路径。',
      'zh-Hant': '完成第一次分析後，報告、事件和工具歷史會在這裡形成可恢復的連續路徑。',
      en: 'After your first analysis, reports, events, and tool history form a recoverable path here.',
    }),
    emptyCta: pick(locale, {
      'zh-CN': '开始第一次分析',
      'zh-Hant': '開始第一次分析',
      en: 'Start first analysis',
    }),

    // —— Right rail ——
    rail: {
      quickResume: pick(locale, {
        'zh-CN': '快速恢复',
        'zh-Hant': '快速恢復',
        en: 'Quick resume',
      }),
      openLatestReport: pick(locale, {
        'zh-CN': '打开最新报告',
        'zh-Hant': '打開最新報告',
        en: 'Open latest report',
      }),
      startFirstAnalyze: pick(locale, {
        'zh-CN': '开始第一次分析',
        'zh-Hant': '開始第一次分析',
        en: 'Start first analysis',
      }),
      openWithReport: pick(locale, {
        'zh-CN': '带报告开场',
        'zh-Hant': '帶報告開場',
        en: 'Open with report',
      }),
      askConsultant: pick(locale, {
        'zh-CN': '问顾问',
        'zh-Hant': '問顧問',
        en: 'Ask consultant',
      }),
      editChartDetails: pick(locale, {
        'zh-CN': '编辑测算资料',
        'zh-Hant': '編輯測算資料',
        en: 'Edit chart details',
      }),
      verifyAndTools: pick(locale, {
        'zh-CN': '验证与工具',
        'zh-Hant': '驗證與工具',
        en: 'Verify & tools',
      }),
      eventCalendar: pick(locale, {
        'zh-CN': '事件日历',
        'zh-Hant': '事件日曆',
        en: 'Event calendar',
      }),
      toolsCenter: pick(locale, {
        'zh-CN': '工具中心',
        'zh-Hant': '工具中心',
        en: 'Tools hub',
      }),
      deepLearnMap: pick(locale, {
        'zh-CN': '深度学习地图',
        'zh-Hant': '深度學習地圖',
        en: 'Deep learning map',
      }),
    },
  };
}

export function profileDigestStatusLabel(
  locale: SiteLocale,
  status?: string | null
): string {
  const copy = profilePageCopy(locale);
  if (status === 'sent') return copy.digestSent;
  if (status === 'error') return copy.digestError;
  if (status === 'skipped') return copy.digestSkipped;
  return copy.digestNone;
}
