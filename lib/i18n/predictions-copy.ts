/**
 * EN/zh chrome for predictions revisit hub (/predictions).
 * Keep prediction.statement / evidence / checklist body as user/engine data.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import type { Prediction, PredictionOutcome } from '@/lib/predictions/types';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export type PredictionCategory = Prediction['category'];
export type PredictionResolvedOutcome = Exclude<PredictionOutcome, 'pending'>;

/** Page hero + SEO for /predictions */
export function predictionsPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '对照报告中的时间窗判断，记录命中、部分命中或未命中，帮助系统持续校准。',
      'zh-Hant': '對照報告中的時間窗判斷，記錄命中、部分命中或未命中，幫助系統持續校準。',
      en: 'Check timed judgments from your reports, mark hit / partial / miss, and help the system calibrate.',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '验证',
      'zh-Hant': '驗證',
      en: 'Verify',
    }),
    title: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    description: pick(locale, {
      'zh-CN': '报告与十维度中的时间窗判断会归档到这里。到期前后对照现实节点反馈。',
      'zh-Hant': '報告與十維度中的時間窗判斷會歸檔到這裡。到期前後對照現實節點回饋。',
      en: 'Timed judgments from reports and ten dimensions land here. Check them against real milestones around the due date.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '十维度',
      'zh-Hant': '十維度',
      en: 'Ten dimensions',
    }),
    linkDimensions: pick(locale, {
      'zh-CN': '十维度',
      'zh-Hant': '十維度',
      en: 'Ten dimensions',
    }),
    linkAnnualReview: pick(locale, {
      'zh-CN': '年度复盘',
      'zh-Hant': '年度復盤',
      en: 'Annual review',
    }),
    linkHistory: pick(locale, {
      'zh-CN': '报告历史',
      'zh-Hant': '報告歷史',
      en: 'Report history',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '回访闭环',
      'zh-Hant': '回訪閉環',
      en: 'Check-in loop',
    }),
    loadingList: pick(locale, {
      'zh-CN': '加载预测清单…',
      'zh-Hant': '載入預測清單…',
      en: 'Loading predictions…',
    }),
  };
}

/** Category labels (career / wealth / marriage / health / timing) */
export function predictionCategoryLabels(
  locale: SiteLocale,
): Record<PredictionCategory, string> {
  return {
    career: pick(locale, { 'zh-CN': '事业', 'zh-Hant': '事業', en: 'Career' }),
    wealth: pick(locale, { 'zh-CN': '财富', 'zh-Hant': '財富', en: 'Wealth' }),
    marriage: pick(locale, { 'zh-CN': '关系', 'zh-Hant': '關係', en: 'Relationships' }),
    health: pick(locale, { 'zh-CN': '健康', en: 'Health' }),
    timing: pick(locale, { 'zh-CN': '时序', 'zh-Hant': '時序', en: 'Timing' }),
  };
}

/** Outcome labels (fulfilled / partial / missed) */
export function predictionOutcomeLabels(
  locale: SiteLocale,
): Record<PredictionResolvedOutcome, string> {
  return {
    fulfilled: pick(locale, { 'zh-CN': '命中', en: 'Hit' }),
    partial: pick(locale, { 'zh-CN': '部分', 'zh-Hant': '部分', en: 'Partial' }),
    missed: pick(locale, { 'zh-CN': '未命中', en: 'Miss' }),
  };
}

/** List page: CTAs, filters, empty states, section chrome */
export function predictionsListCopy(locale: SiteLocale) {
  return {
    loading: pick(locale, {
      'zh-CN': '正在加载预测清单…',
      'zh-Hant': '正在載入預測清單…',
      en: 'Loading prediction list…',
    }),

    // Consultant strip
    consultantEyebrow: pick(locale, {
      'zh-CN': '顾问',
      'zh-Hant': '顧問',
      en: 'Consultant',
    }),
    consultantTitle: pick(locale, {
      'zh-CN': '带报告回聊',
      'zh-Hant': '帶報告回聊',
      en: 'Continue with report',
    }),
    consultantDescWithReport: pick(locale, {
      'zh-CN': '对照预测命中结果，结合本盘开场再问总览或实践老师',
      'zh-Hant': '對照預測命中結果，結合本盤開場再問總覽或實踐老師',
      en: 'Use hit results with this chart to reopen overview or practice consultants',
    }),
    consultantDescWithoutReport: pick(locale, {
      'zh-CN': '验证后可带报告继续聊；暂无报告时先选一位顾问开场',
      'zh-Hant': '驗證後可帶報告繼續聊；暫無報告時先選一位顧問開場',
      en: 'After verifying, continue with a report—or open a consultant if you have none yet',
    }),
    continueChat: pick(locale, {
      'zh-CN': '继续聊 →',
      'zh-Hant': '繼續聊 →',
      en: 'Continue chat →',
    }),
    askConsultant: pick(locale, {
      'zh-CN': '问顾问 →',
      'zh-Hant': '問顧問 →',
      en: 'Ask consultant →',
    }),
    allTeachers: pick(locale, {
      'zh-CN': '全部老师',
      'zh-Hant': '全部老師',
      en: 'All consultants',
    }),
    practiceTeacher: pick(locale, {
      'zh-CN': '实践老师',
      'zh-Hant': '實踐老師',
      en: 'Practice consultant',
    }),

    // Accuracy strip
    hitRateEyebrow: pick(locale, {
      'zh-CN': '命中率',
      'zh-Hant': '命中率',
      en: 'Hit rate',
    }),
    feedbackSummary: (total: number, filterLabel: string) =>
      pick(locale, {
        'zh-CN': `已反馈 ${total} 条 · 当前筛选：${filterLabel}`,
        'zh-Hant': `已回饋 ${total} 條 · 目前篩選：${filterLabel}`,
        en: `${total} feedback · filter: ${filterLabel}`,
      }),
    allFilter: pick(locale, {
      'zh-CN': '全部',
      en: 'All',
    }),
    allSources: pick(locale, {
      'zh-CN': '全部来源',
      'zh-Hant': '全部來源',
      en: 'All sources',
    }),
    fullReport: pick(locale, {
      'zh-CN': '完整报告',
      'zh-Hant': '完整報告',
      en: 'Full report',
    }),
    filterByDimension: pick(locale, {
      'zh-CN': '按维度筛选',
      'zh-Hant': '按維度篩選',
      en: 'Filter by dimension',
    }),
    generateMorePredictions: pick(locale, {
      'zh-CN': '去十维度生成更多预测 →',
      'zh-Hant': '去十維度生成更多預測 →',
      en: 'Generate more via ten dimensions →',
    }),

    // Empty states
    emptyBody: pick(locale, {
      'zh-CN':
        '还没有可回访的预测项。可先生成完整报告，或进入十维度场景研判（会自动同步预测）。',
      'zh-Hant':
        '還沒有可回訪的預測項。可先生成完整報告，或進入十維度場景研判（會自動同步預測）。',
      en: 'No predictions to check in yet. Generate a full report or run a ten-dimension scene—predictions sync automatically.',
    }),
    ctaDimensions: pick(locale, {
      'zh-CN': '十维度研判',
      'zh-Hant': '十維度研判',
      en: 'Ten-dimension scenes',
    }),
    ctaFullReport: pick(locale, {
      'zh-CN': '生成完整报告',
      'zh-Hant': '生成完整報告',
      en: 'Generate full report',
    }),
    emptyFilterPrefix: (filterLabel: string) =>
      pick(locale, {
        'zh-CN': `当前筛选「${filterLabel}」下没有预测项。`,
        'zh-Hant': `目前篩選「${filterLabel}」下沒有預測項。`,
        en: `No predictions under “${filterLabel}”.`,
      }),
    viewAll: pick(locale, {
      'zh-CN': '查看全部',
      'zh-Hant': '查看全部',
      en: 'View all',
    }),

    // Sections
    upcomingEyebrow: pick(locale, {
      'zh-CN': '即将到期',
      'zh-Hant': '即將到期',
      en: 'Due soon',
    }),
    upcomingTitle: pick(locale, {
      'zh-CN': '7 天内',
      'zh-Hant': '7 天內',
      en: 'Next 7 days',
    }),
    upcomingDesc: pick(locale, {
      'zh-CN': '提前对照清单，记录现实变化。',
      'zh-Hant': '提前對照清單，記錄現實變化。',
      en: 'Review early and note real-world changes.',
    }),
    dueEyebrow: pick(locale, {
      'zh-CN': '已到期未反馈',
      'zh-Hant': '已到期未回饋',
      en: 'Due, no feedback',
    }),
    dueTitle: pick(locale, {
      'zh-CN': '待你验证',
      'zh-Hant': '待你驗證',
      en: 'Awaiting you',
    }),
    dueDesc: pick(locale, {
      'zh-CN': '点击命中 / 部分 / 未命中，帮助系统校准。',
      'zh-Hant': '點擊命中 / 部分 / 未命中，幫助系統校準。',
      en: 'Mark hit / partial / miss to calibrate the system.',
    }),
    historyEyebrow: pick(locale, {
      'zh-CN': '历史已反馈',
      'zh-Hant': '歷史已回饋',
      en: 'Past feedback',
    }),
    historyCount: (n: number) =>
      pick(locale, {
        'zh-CN': `${n} 条`,
        'zh-Hant': `${n} 條`,
        en: `${n} items`,
      }),
    collapse: pick(locale, {
      'zh-CN': '收起',
      en: 'Collapse',
    }),
    expand: pick(locale, {
      'zh-CN': '展开',
      'zh-Hant': '展開',
      en: 'Expand',
    }),
    historyCollapsedHint: pick(locale, {
      'zh-CN': '已反馈记录默认折叠，点击展开查看。',
      'zh-Hant': '已回饋記錄預設摺疊，點擊展開查看。',
      en: 'Feedback history is collapsed by default—expand to view.',
    }),

    // Related dimensions panel
    relatedTitle: pick(locale, {
      'zh-CN': '继续场景研判',
      'zh-Hant': '繼續場景研判',
      en: 'Continue scene judgment',
    }),
    relatedDesc: pick(locale, {
      'zh-CN': '维度预测会自动进入本页；优先打磨运势节奏、工作行业、投资理财。',
      'zh-Hant': '維度預測會自動進入本頁；優先打磨運勢節奏、工作行業、投資理財。',
      en: 'Dimension predictions land here automatically—start with fortune rhythm, career, and investment.',
    }),
  };
}

/** Panel item chrome (placeholders, due labels, event log) — not statement body */
export function predictionsPanelCopy(locale: SiteLocale) {
  return {
    empty: pick(locale, {
      'zh-CN': '暂无可验证预测项。生成报告后会自动抽取带时间窗的判断。',
      'zh-Hant': '暫無可驗證預測項。生成報告後會自動抽取帶時間窗的判斷。',
      en: 'No verifiable predictions yet. Timed judgments are extracted after you generate a report.',
    }),
    duePrefix: pick(locale, {
      'zh-CN': '到期',
      en: 'Due',
    }),
    daysLeft: (days: number) =>
      pick(locale, {
        'zh-CN': `剩余 ${days} 天`,
        'zh-Hant': `剩餘 ${days} 天`,
        en: `${days}d left`,
      }),
    evidencePrefix: pick(locale, {
      'zh-CN': '依据：',
      'zh-Hant': '依據：',
      en: 'Basis: ',
    }),
    feedbackPlaceholder: pick(locale, {
      'zh-CN': '补充说明（可选）',
      'zh-Hant': '補充說明（可選）',
      en: 'Optional note',
    }),
    feedbackDone: pick(locale, {
      'zh-CN': '已反馈：',
      'zh-Hant': '已回饋：',
      en: 'Logged: ',
    }),
    loggedToEvents: pick(locale, {
      'zh-CN': '已写入事件本',
      'zh-Hant': '已寫入事件本',
      en: 'Saved to event log',
    }),
    localSuffix: pick(locale, {
      'zh-CN': '（本机）',
      'zh-Hant': '（本機）',
      en: ' (local)',
    }),
    viewEvents: pick(locale, {
      'zh-CN': '查看事件',
      'zh-Hant': '查看事件',
      en: 'View events',
    }),
    logToEvents: pick(locale, {
      'zh-CN': '记入事件本 →',
      'zh-Hant': '記入事件本 →',
      en: 'Log to events →',
    }),
  };
}

/** Accuracy dashboard (membership / shared surface) */
export function accuracyDashboardCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': '预测命中率',
      'zh-Hant': '預測命中率',
      en: 'Prediction hit rate',
    }),
    withFeedback: (total: number) =>
      pick(locale, {
        'zh-CN': `已反馈 ${total} 条预测 · 反馈越多，下一轮判断越贴近你的现实节奏`,
        'zh-Hant': `已回饋 ${total} 條預測 · 回饋越多，下一輪判斷越貼近你的現實節奏`,
        en: `${total} predictions with feedback · more feedback sharpens the next round`,
      }),
    withoutFeedback: pick(locale, {
      'zh-CN': '完成预测回访后，这里会显示你的分类命中率',
      'zh-Hant': '完成預測回訪後，這裡會顯示你的分類命中率',
      en: 'After prediction check-in, category hit rates appear here',
    }),
    freeUnlock: pick(locale, {
      'zh-CN': '限时免费 · 0 元开通看全 5 类',
      'zh-Hant': '限時免費 · 0 元開通看全 5 類',
      en: 'Limited free · unlock all 5 categories',
    }),
    memberFullView: pick(locale, {
      'zh-CN': '会员全量视图',
      'zh-Hant': '會員全量視圖',
      en: 'Full member view',
    }),
    pendingFeedback: pick(locale, {
      'zh-CN': '待反馈',
      'zh-Hant': '待回饋',
      en: 'Pending',
    }),
    memberTrendNote: pick(locale, {
      'zh-CN': '历史趋势会随你的回访持续更新，并写入年度复盘与下一份报告的表达权重。',
      'zh-Hant': '歷史趨勢會隨你的回訪持續更新，並寫入年度復盤與下一份報告的表達權重。',
      en: 'Trends update with each check-in and feed annual review plus the next report’s weighting.',
    }),
    goCheckIn: pick(locale, {
      'zh-CN': '去预测回访',
      'zh-Hant': '去預測回訪',
      en: 'Go to prediction check-in',
    }),
  };
}

/** Convenience: all chrome for the hub list surface */
export function predictionsHubCopy(locale: SiteLocale) {
  return {
    page: predictionsPageCopy(locale),
    list: predictionsListCopy(locale),
    panel: predictionsPanelCopy(locale),
    accuracy: accuracyDashboardCopy(locale),
    categories: predictionCategoryLabels(locale),
    outcomes: predictionOutcomeLabels(locale),
  };
}
