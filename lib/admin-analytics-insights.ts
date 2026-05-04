import {
  compareStrongCtaStrategies,
  compareWeakCtaStrategies,
  isRetentionWorkbenchSourceFamily,
  mapCtaSourceFamilyLabel,
  mapCtaStrategyLabel,
  type CtaStrategyBreakdownRow,
} from '@/lib/cta-strategy';

export interface AdminAnalyticsSnapshot {
  totals: {
    total_analyses: number;
    analyses_last_7d: number;
    public_reports: number;
    chat_messages: number;
    active_subscribers: number;
    total_events: number;
    result_report_linked_events: number;
    chat_sourced_events: number;
    validation_accurate: number;
    validation_drift: number;
    validation_pending: number;
    total_tracked_events: number;
    tracked_events_last_7d: number;
  };
  pendingValidationBuckets: {
    overdue: number;
    upcoming: number;
    driftNeedsNotes: number;
    driftReadyForCorrection: number;
  };
  driftReasonBreakdown: Array<{
    label: string;
    count: number;
    share: number;
  }>;
  reportVersionBreakdown: Array<{
    version: string;
    count: number;
    share: number;
  }>;
  journeyFunnel?: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  reasoningModeBreakdown?: Array<{
    mode: string;
    count: number;
    share: number;
  }>;
  chatActionBreakdown?: Array<{
    action: string;
    label: string;
    count: number;
    share: number;
  }>;
  ctaStrategyBreakdown?: CtaStrategyBreakdownRow[];
  deviceMeasurementSummary?: {
    currentWindow?: {
      coverageRate: number;
      sessionCoverageRate: number;
    };
    note?: string;
  };
  deviceFunnelBreakdown?: Array<{
    deviceType: string;
    reportToChatRate: number;
    reportToEventRate: number;
    toolToRunRate: number;
    authVerifyRate: number;
    sampleState: 'enough' | 'low' | 'sparse';
  }>;
  recentBehaviorShift?: {
    window?: {
      currentStart?: string;
      currentEnd?: string;
      previousStart?: string;
      previousEnd?: string;
      compareLabel?: string;
    };
    keyMetrics?: Array<{
      key: string;
      label: string;
      currentValue: number;
      previousValue: number;
      delta: number;
      pctChange: number | null;
      direction: 'up' | 'down' | 'flat';
    }>;
    topChanges?: Array<{
      eventName: string;
      currentCount: number;
      previousCount: number;
      delta: number;
      pctChange: number | null;
      direction: 'up' | 'down' | 'flat';
      label: string;
    }>;
    funnel?: Array<{
      key: string;
      label: string;
      currentValue: number;
      previousValue: number;
      currentBase: number;
      previousBase: number;
      currentRate: number;
      previousRate: number;
      rateDelta: number;
      direction: 'up' | 'down' | 'flat';
    }>;
    byDevice?: Array<{
      deviceType: string;
      current?: unknown;
      previous?: unknown;
      direction: 'up' | 'down' | 'flat';
      productEventsDelta: number;
      reportToChatRateDelta: number;
      toolToRunRateDelta: number;
      authVerifyRateDelta: number;
      sampleState: 'enough' | 'low' | 'sparse';
    }>;
    signals?: string[];
    warnings?: string[];
  };
  lifecycleRecall?: {
    reportFollowupBySource?: Array<{
      source: string;
      sent: number;
      chatCompletionRate: number;
      chatToEventRate: number;
    }>;
    reportFollowupByDevice?: Array<{
      deviceType: string;
      sent: number;
      chatCompletionRate: number;
      chatToEventRate: number;
    }>;
    toolInterestBySource?: Array<{
      source: string;
      sent: number;
      sentToRunRate: number;
      runToResultRate: number;
    }>;
    toolInterestByDevice?: Array<{
      deviceType: string;
      sent: number;
      sentToRunRate: number;
      runToResultRate: number;
    }>;
  };
  sourceFunnel?: Array<{
    source: string;
    analyzeSessions: number;
    reportsGenerated: number;
    reportViewSessions: number;
    chatSessions: number;
    toolRunSessions: number;
    analyzeToReportRate: number;
    reportToViewRate: number;
    viewToChatRate: number;
    viewToToolRunRate: number;
  }>;
  weeklySourceTrend?: Array<{
    weekStart: string;
    weekLabel: string;
    source: string;
    analyzeSessions: number;
    reportsGenerated: number;
    reportViewSessions: number;
    chatSessions: number;
    toolRunSessions: number;
    analyzeToReportRate: number;
    reportToViewRate: number;
    viewToChatRate: number;
    viewToToolRunRate: number;
  }>;
  recentSourceShift?: Array<{
    source: string;
    current: {
      analyzeSessions: number;
      reportViewSessions: number;
      viewToChatRate: number;
      viewToToolRunRate: number;
    };
    previous: {
      analyzeSessions: number;
      reportViewSessions: number;
      viewToChatRate: number;
      viewToToolRunRate: number;
    };
    analyzeSessionsDelta: number;
    reportViewSessionsDelta: number;
    viewToChatRateDelta: number;
    viewToToolRunRateDelta: number;
    direction: 'up' | 'down' | 'flat';
    sampleState: 'enough' | 'low' | 'sparse';
  }>;
  sourceDeviceFunnel?: Array<{
    source: string;
    deviceType: string;
    analyzeSessions: number;
    reportsGenerated: number;
    reportViewSessions: number;
    chatSessions: number;
    toolRunSessions: number;
    analyzeToReportRate: number;
    reportToViewRate: number;
    viewToChatRate: number;
    viewToToolRunRate: number;
  }>;
}

export interface AdminOperatingInsight {
  headline: string;
  summary: string;
  priorities: string[];
  risks: string[];
}

export interface AdminActionItem {
  key: string;
  title: string;
  detail: string;
  tone: 'accent' | 'warning' | 'success' | 'neutral';
}

function getCtaStrategyItems(snapshot: AdminAnalyticsSnapshot) {
  return (snapshot.ctaStrategyBreakdown || []).filter((item) => item.clicks > 0 || item.chatPageViews > 0);
}

function getWeakestRetentionWorkbenchItem(snapshot: AdminAnalyticsSnapshot) {
  return getCtaStrategyItems(snapshot)
    .filter((item) => item.strategyKey === 'retention_workbench_resume' && isRetentionWorkbenchSourceFamily(item.sourceFamily))
    .sort(compareWeakCtaStrategies)[0];
}

function getStrongestCtaStrategyItem(snapshot: AdminAnalyticsSnapshot) {
  return getCtaStrategyItems(snapshot)
    .sort(compareStrongCtaStrategies)[0];
}

function isWeakRetentionWorkbenchItem(item?: CtaStrategyBreakdownRow | null) {
  if (!item) {
    return false;
  }
  return item.chatCompletionRate < 40 || item.clickToChatRate < 60;
}

function buildRetentionWorkbenchPriorityText(item: CtaStrategyBreakdownRow) {
  const label = mapCtaSourceFamilyLabel(item.sourceFamily);
  if (item.sourceFamily === 'profile_page') {
    return `复访工作台里的“${label}”CTA -> 聊天只有 ${item.clickToChatRate}%，完成只有 ${item.chatCompletionRate}%，先把最近报告、最近聊天和直接继续追问的入口压到档案页第一屏。`;
  }
  if (item.sourceFamily === 'history_page') {
    return `复访工作台里的“${label}”CTA -> 聊天只有 ${item.clickToChatRate}%，完成只有 ${item.chatCompletionRate}%，先把待纠偏样本、最近漂移和“继续纠偏”入口合成一个恢复块。`;
  }
  if (item.sourceFamily === 'events_page') {
    return `复访工作台里的“${label}”CTA -> 聊天只有 ${item.clickToChatRate}%，完成只有 ${item.chatCompletionRate}%，先把临近事件、过期待验证和“围绕这个节点继续判断”入口前移到上半屏。`;
  }
  return `复访工作台里的“${label}”当前承接偏弱，CTA -> 聊天只有 ${item.clickToChatRate}%，完成只有 ${item.chatCompletionRate}%，需要优先把恢复入口前移。`;
}

function buildRetentionWorkbenchRiskText(item: CtaStrategyBreakdownRow) {
  return `复访工作台里的“${mapCtaSourceFamilyLabel(item.sourceFamily)}”回访后仍没有形成继续使用，这会直接伤害留存和召回效率。`;
}

export function buildAdminOperatingInsight(snapshot: AdminAnalyticsSnapshot): AdminOperatingInsight {
  const validatedTotal = snapshot.totals.validation_accurate + snapshot.totals.validation_drift;
  const accuracyRate = validatedTotal > 0
    ? Math.round((snapshot.totals.validation_accurate / validatedTotal) * 100)
    : 0;
  const topDriftReason = snapshot.driftReasonBreakdown[0];
  const topVersion = snapshot.reportVersionBreakdown[0];
  const resultViews = snapshot.journeyFunnel?.find((item) => item.key === 'report_viewed')?.count || 0;
  const chatTurns = snapshot.journeyFunnel?.find((item) => item.key === 'chat_message_sent')?.count || 0;
  const resultEventSaves = snapshot.journeyFunnel?.find((item) => item.key === 'report_event_saved_from_result')?.count || 0;
  const topReasoningMode = snapshot.reasoningModeBreakdown?.[0];
  const topChatAction = snapshot.chatActionBreakdown?.[0];
  const viewToChatRate = resultViews > 0 ? Math.round((chatTurns / resultViews) * 100) : 0;
  const chatToEventRate = chatTurns > 0 ? Math.round((resultEventSaves / chatTurns) * 100) : 0;
  const deviceCoverageRate = snapshot.deviceMeasurementSummary?.currentWindow?.coverageRate || 0;
  const weakestDeviceFunnel = (snapshot.deviceFunnelBreakdown || [])
    .filter((item) => item.sampleState !== 'sparse')
    .sort((left, right) => {
      const leftWeakness = Math.min(left.reportToChatRate, left.toolToRunRate, left.authVerifyRate);
      const rightWeakness = Math.min(right.reportToChatRate, right.toolToRunRate, right.authVerifyRate);
      return leftWeakness - rightWeakness;
    })[0];
  const strongestDeviceShift = (snapshot.recentBehaviorShift?.byDevice || [])
    .filter((item) => item.sampleState !== 'sparse')
    .sort((left, right) => {
      const rightMagnitude =
        Math.abs(right.productEventsDelta)
        + Math.abs(right.reportToChatRateDelta)
        + Math.abs(right.toolToRunRateDelta)
        + Math.abs(right.authVerifyRateDelta);
      const leftMagnitude =
        Math.abs(left.productEventsDelta)
        + Math.abs(left.reportToChatRateDelta)
        + Math.abs(left.toolToRunRateDelta)
        + Math.abs(left.authVerifyRateDelta);
      return rightMagnitude - leftMagnitude;
    })[0];
  const weakestLifecycleReportSource = (snapshot.lifecycleRecall?.reportFollowupBySource || [])
    .filter((item) => item.sent >= 2)
    .sort((left, right) => left.chatCompletionRate - right.chatCompletionRate || right.sent - left.sent)[0];
  const weakestLifecycleToolSource = (snapshot.lifecycleRecall?.toolInterestBySource || [])
    .filter((item) => item.sent >= 2)
    .sort((left, right) => left.sentToRunRate - right.sentToRunRate || right.sent - left.sent)[0];
  const weakestLifecycleReportDevice = (snapshot.lifecycleRecall?.reportFollowupByDevice || [])
    .filter((item) => item.sent >= 2)
    .sort((left, right) => left.chatCompletionRate - right.chatCompletionRate || right.sent - left.sent)[0];
  const weakestLifecycleToolDevice = (snapshot.lifecycleRecall?.toolInterestByDevice || [])
    .filter((item) => item.sent >= 2)
    .sort((left, right) => left.sentToRunRate - right.sentToRunRate || right.sent - left.sent)[0];
  const weakestSourceFunnel = (snapshot.sourceFunnel || [])
    .filter((item) => item.analyzeSessions >= 2)
    .sort((left, right) => left.viewToChatRate - right.viewToChatRate || right.analyzeSessions - left.analyzeSessions)[0];
  const weakestSourceDeviceFunnel = (snapshot.sourceDeviceFunnel || [])
    .filter((item) => item.analyzeSessions >= 2)
    .sort((left, right) => left.viewToChatRate - right.viewToChatRate || right.analyzeSessions - left.analyzeSessions)[0];
  const strongestSourceShift = (snapshot.recentSourceShift || [])
    .filter((item) => item.sampleState !== 'sparse')
    .sort((left, right) => {
      const rightMagnitude =
        Math.abs(right.analyzeSessionsDelta)
        + Math.abs(right.reportViewSessionsDelta)
        + Math.abs(right.viewToChatRateDelta)
        + Math.abs(right.viewToToolRunRateDelta);
      const leftMagnitude =
        Math.abs(left.analyzeSessionsDelta)
        + Math.abs(left.reportViewSessionsDelta)
        + Math.abs(left.viewToChatRateDelta)
        + Math.abs(left.viewToToolRunRateDelta);
      return rightMagnitude - leftMagnitude;
    })[0];
  const weakestWeeklySource = (snapshot.weeklySourceTrend || [])
    .filter((item) => item.analyzeSessions >= 2)
    .sort((left, right) => left.viewToChatRate - right.viewToChatRate || right.analyzeSessions - left.analyzeSessions)[0];
  const weakestRetentionWorkbenchItem = getWeakestRetentionWorkbenchItem(snapshot);
  const strongestCtaStrategyItem = getStrongestCtaStrategyItem(snapshot);

  let headline = '当前经营状态以继续验证样本、扩大闭环为主。';
  if (snapshot.pendingValidationBuckets.overdue >= 5) {
    headline = '当前最大的短板不是获客，而是验证结果回收不够。';
  } else if (deviceCoverageRate > 0 && deviceCoverageRate < 60) {
    headline = '设备视角已经接上，但覆盖率还不够高，先继续把测量质量做实。';
  } else if (isWeakRetentionWorkbenchItem(weakestRetentionWorkbenchItem)) {
    headline = '复访工作台已经把用户带回来，但最弱入口还没有接成继续使用。';
  } else if (weakestLifecycleReportSource && weakestLifecycleReportSource.chatCompletionRate < 30) {
    headline = '生命周期召回已经发出，但部分来源回流到聊天的承接明显偏弱。';
  } else if (weakestLifecycleToolSource && weakestLifecycleToolSource.sentToRunRate < 20) {
    headline = '工具召回不是没有发送，而是某些来源回流后仍停在“看过但没开跑”。';
  } else if (weakestSourceFunnel && weakestSourceFunnel.viewToChatRate < 25) {
    headline = '主漏斗已经能看到具体弱来源，下一步应该直接修最弱来源的结果页和聊天承接。';
  } else if (strongestSourceShift && strongestSourceShift.direction === 'down') {
    headline = '最近的回落已经能定位到具体来源，应该按来源重写承接而不是泛化改版。';
  } else if (weakestDeviceFunnel && weakestDeviceFunnel.authVerifyRate < 35) {
    headline = '当前明显的增长卡点已经落到具体设备注册链路，应该先修最弱设备端的验证完成率。';
  } else if (strongestDeviceShift && strongestDeviceShift.direction === 'down') {
    headline = '最近的波动不是全局性的，而是某个设备端在回落，应该按设备修问题。';
  } else if (snapshot.pendingValidationBuckets.driftReadyForCorrection >= 3) {
    headline = '当前已经积累出足够的偏差样本，应该优先把纠偏链路做深。';
  } else if (accuracyRate >= 70 && snapshot.totals.result_report_linked_events >= 10) {
    headline = '当前闭环健康度不错，可以继续放大报告到事件的转化。';
  } else if (resultViews >= 10 && viewToChatRate < 35) {
    headline = '结果页被看到了，但用户还没有足够顺滑地继续进入聊天或事件闭环。';
  }

  return {
    headline,
    summary: [
      validatedTotal > 0 ? `已回收验证结果 ${validatedTotal} 个，当前命中率 ${accuracyRate}%。` : '当前还没有足够多的验证样本。',
      topDriftReason ? `最常见偏差原因是“${topDriftReason.label}”。` : '',
      topVersion ? `目前主力报告版本为 ${topVersion.version}。` : '',
      topReasoningMode ? `当前主力推理层为 ${mapReasoningModeLabel(topReasoningMode.mode)}。` : '',
      topChatAction ? `聊天里最常见的动作是“${topChatAction.label}”。` : '',
      deviceCoverageRate > 0 ? `最近设备事件覆盖率 ${deviceCoverageRate}%。` : '',
      strongestCtaStrategyItem ? `当前承接最好的 CTA 策略是“${mapCtaStrategyLabel(strongestCtaStrategyItem.strategyKey)} / ${mapCtaSourceFamilyLabel(strongestCtaStrategyItem.sourceFamily)}”。` : '',
      weakestRetentionWorkbenchItem ? `复访工作台里最弱入口是“${mapCtaSourceFamilyLabel(weakestRetentionWorkbenchItem.sourceFamily)}”，CTA -> 聊天 ${weakestRetentionWorkbenchItem.clickToChatRate}%，聊天完成 ${weakestRetentionWorkbenchItem.chatCompletionRate}%。` : '',
      weakestDeviceFunnel ? `当前最弱设备链路在${mapDeviceTypeLabel(weakestDeviceFunnel.deviceType)}。` : '',
      weakestLifecycleReportSource ? `报告召回里最弱来源是“${weakestLifecycleReportSource.source}”。` : '',
      weakestLifecycleToolSource ? `工具召回里最弱来源是“${weakestLifecycleToolSource.source}”。` : '',
      weakestSourceFunnel ? `主漏斗里最弱来源是“${weakestSourceFunnel.source}”。` : '',
      weakestSourceDeviceFunnel ? `来源×设备里最弱组合是“${weakestSourceDeviceFunnel.source} @ ${mapDeviceTypeLabel(weakestSourceDeviceFunnel.deviceType)}”。` : '',
      weakestWeeklySource ? `周趋势里持续最弱来源是“${weakestWeeklySource.source}”。` : '',
      strongestSourceShift ? `最近变化最大的来源是“${strongestSourceShift.source}”。` : '',
    ].filter(Boolean).join(' '),
    priorities: [
      snapshot.pendingValidationBuckets.overdue > 0 ? `先回收 ${snapshot.pendingValidationBuckets.overdue} 个已过期待验证事件。` : '',
      snapshot.pendingValidationBuckets.driftReadyForCorrection > 0 ? `把 ${snapshot.pendingValidationBuckets.driftReadyForCorrection} 个已写明偏差的事件推进到纠偏分析。` : '',
      deviceCoverageRate > 0 && deviceCoverageRate < 60
        ? `最近设备事件覆盖率只有 ${deviceCoverageRate}%，先把设备测量质量提到可用区间。`
        : '',
      isWeakRetentionWorkbenchItem(weakestRetentionWorkbenchItem)
        ? buildRetentionWorkbenchPriorityText(weakestRetentionWorkbenchItem!)
        : '',
      weakestLifecycleReportSource && weakestLifecycleReportSource.chatCompletionRate < 35
        ? `来源“${weakestLifecycleReportSource.source}”的报告召回完成率只有 ${weakestLifecycleReportSource.chatCompletionRate}%，先重写这类入口回流到聊天的邮件和结果页承接。`
        : '',
      weakestLifecycleToolSource && weakestLifecycleToolSource.sentToRunRate < 25
        ? `来源“${weakestLifecycleToolSource.source}”的工具召回 sent->run 只有 ${weakestLifecycleToolSource.sentToRunRate}%，先修这类内容入口回流后的工具首屏承接。`
        : '',
      weakestLifecycleReportDevice && weakestLifecycleReportDevice.chatCompletionRate < 35
        ? `${mapDeviceTypeLabel(weakestLifecycleReportDevice.deviceType)}上的报告召回完成率只有 ${weakestLifecycleReportDevice.chatCompletionRate}%，先修这端邮件回流后的聊天承接。`
        : '',
      weakestLifecycleToolDevice && weakestLifecycleToolDevice.sentToRunRate < 25
        ? `${mapDeviceTypeLabel(weakestLifecycleToolDevice.deviceType)}上的工具召回开跑率只有 ${weakestLifecycleToolDevice.sentToRunRate}%，先修这端工具回流首屏。`
        : '',
      weakestSourceFunnel && weakestSourceFunnel.viewToChatRate < 30
        ? `来源“${weakestSourceFunnel.source}”在主漏斗里的结果页->聊天只有 ${weakestSourceFunnel.viewToChatRate}%，先修这类来源用户看到的结果页首屏与继续提问承接。`
        : '',
      weakestSourceDeviceFunnel && weakestSourceDeviceFunnel.viewToChatRate < 25
        ? `${mapDeviceTypeLabel(weakestSourceDeviceFunnel.deviceType)}上的“${weakestSourceDeviceFunnel.source}”结果页->聊天只有 ${weakestSourceDeviceFunnel.viewToChatRate}%，需要按端单独修。`
        : '',
      strongestSourceShift && strongestSourceShift.direction === 'down'
        ? `来源“${strongestSourceShift.source}”最近 3 天 analyze ${strongestSourceShift.analyzeSessionsDelta > 0 ? '+' : ''}${strongestSourceShift.analyzeSessionsDelta}，结果页到聊天 ${strongestSourceShift.viewToChatRateDelta > 0 ? '+' : ''}${strongestSourceShift.viewToChatRateDelta}pt，先按来源单独修承接。`
        : '',
      weakestWeeklySource && weakestWeeklySource.viewToChatRate < 30
        ? `来源“${weakestWeeklySource.source}”在最近周趋势里结果页->聊天只有 ${weakestWeeklySource.viewToChatRate}%，说明不是偶发波动，而是持续接不住。`
        : '',
      weakestDeviceFunnel
        ? buildWeakestDevicePriority(weakestDeviceFunnel)
        : '',
      snapshot.totals.result_report_linked_events < Math.max(8, Math.round(snapshot.totals.total_events * 0.45))
        ? '继续提高结果页到事件中心的转化，不要让高价值判断停在报告页。'
        : '',
      snapshot.totals.chat_sourced_events < Math.max(5, Math.round(snapshot.totals.total_events * 0.2))
        ? '继续提高聊天结论存事件的比例，让 AI 真正进入闭环。'
        : '',
      resultViews > 0 && viewToChatRate < 35
        ? `结果页到聊天的转化仅 ${viewToChatRate}%，需要继续压缩用户从看报告到继续深问的阻力。`
        : '',
      chatTurns > 0 && chatToEventRate < 15
        ? `聊天到事件沉淀的转化仅 ${chatToEventRate}%，需要继续强化“存为事件”和验证引导。`
        : '',
    ].filter(Boolean).slice(0, 4),
    risks: [
      snapshot.pendingValidationBuckets.driftNeedsNotes > 0 ? `${snapshot.pendingValidationBuckets.driftNeedsNotes} 个偏差事件还没备注原因，后续很难做结构化纠偏。` : '',
      topDriftReason && topDriftReason.share >= 40 ? `偏差高度集中在“${topDriftReason.label}”，说明当前引擎或引导在这个环节还有系统性短板。` : '',
      strongestSourceShift && strongestSourceShift.direction === 'down'
        ? `来源“${strongestSourceShift.source}”最近短周期在回落，继续放量这个来源前应先修入口承接与结果页首屏。`
        : '',
      weakestRetentionWorkbenchItem && weakestRetentionWorkbenchItem.chatCompletionRate < 25
        ? buildRetentionWorkbenchRiskText(weakestRetentionWorkbenchItem)
        : '',
      topVersion && topVersion.version === 'v1' && topVersion.share >= 30 ? '仍有较多旧版报告在流通，会影响用户体验一致性。' : '',
      topReasoningMode && topReasoningMode.mode === 'engine' && topReasoningMode.share >= 30 ? '仍有较多报告停留在基础引擎层，专家层覆盖度还不够。' : '',
      strongestDeviceShift && strongestDeviceShift.direction === 'down'
        ? `${mapDeviceTypeLabel(strongestDeviceShift.deviceType)}最近出现回落，应该单独查看这端的结果页、工具页和注册完成情况。`
        : '',
      weakestLifecycleReportSource && weakestLifecycleReportSource.chatCompletionRate < 25
        ? `来源“${weakestLifecycleReportSource.source}”的报告召回已发出但没被有效接住，这会让 GEO/SEO 新流量难以转成二次使用。`
        : '',
      weakestSourceFunnel && weakestSourceFunnel.reportToViewRate < 60
        ? `来源“${weakestSourceFunnel.source}”提交分析后打开结果页的比例偏低，说明从生成到查看之间还有断链。`
        : '',
    ].filter(Boolean).slice(0, 3),
  };
}

function mapReasoningModeLabel(mode: string) {
  if (mode === 'parallel-agents') return '并发 Agent';
  if (mode === 'deterministic-expert') return 'Deterministic 专家层';
  if (mode === 'engine') return '基础引擎';
  return mode;
}

function mapDeviceTypeLabel(deviceType: string) {
  if (deviceType === 'mobile') return '移动端';
  if (deviceType === 'desktop') return '桌面端';
  if (deviceType === 'tablet') return '平板';
  if (deviceType === 'bot') return '机器人';
  return '未知设备';
}

function buildWeakestDevicePriority(item: {
  deviceType: string;
  reportToChatRate: number;
  reportToEventRate: number;
  toolToRunRate: number;
  authVerifyRate: number;
}) {
  const label = mapDeviceTypeLabel(item.deviceType);
  if (item.authVerifyRate <= item.reportToChatRate && item.authVerifyRate <= item.toolToRunRate) {
    return `${label}验证码完成率仅 ${item.authVerifyRate}%，先修这端注册完成链路。`;
  }
  if (item.toolToRunRate <= item.reportToChatRate) {
    return `${label}工具详情到开跑仅 ${item.toolToRunRate}%，先修这端工具启动承接。`;
  }
  return `${label}结果页到聊天仅 ${item.reportToChatRate}%，先修这端结果页追问承接。`;
}

export function buildAdminActionItems(snapshot: AdminAnalyticsSnapshot): AdminActionItem[] {
  const deviceCoverageRate = snapshot.deviceMeasurementSummary?.currentWindow?.coverageRate || 0;
  const weakestDeviceFunnel = (snapshot.deviceFunnelBreakdown || [])
    .filter((item) => item.sampleState !== 'sparse')
    .sort((left, right) => {
      const leftWeakness = Math.min(left.reportToChatRate, left.toolToRunRate, left.authVerifyRate);
      const rightWeakness = Math.min(right.reportToChatRate, right.toolToRunRate, right.authVerifyRate);
      return leftWeakness - rightWeakness;
    })[0];
  const weakestLifecycleReportSource = (snapshot.lifecycleRecall?.reportFollowupBySource || [])
    .filter((item) => item.sent >= 2)
    .sort((left, right) => left.chatCompletionRate - right.chatCompletionRate || right.sent - left.sent)[0];
  const weakestSourceFunnel = (snapshot.sourceFunnel || [])
    .filter((item) => item.analyzeSessions >= 2)
    .sort((left, right) => left.viewToChatRate - right.viewToChatRate || right.analyzeSessions - left.analyzeSessions)[0];
  const strongestSourceShift = (snapshot.recentSourceShift || [])
    .filter((item) => item.sampleState !== 'sparse')
    .sort((left, right) => {
      const rightMagnitude =
        Math.abs(right.analyzeSessionsDelta)
        + Math.abs(right.reportViewSessionsDelta)
        + Math.abs(right.viewToChatRateDelta)
        + Math.abs(right.viewToToolRunRateDelta);
      const leftMagnitude =
        Math.abs(left.analyzeSessionsDelta)
        + Math.abs(left.reportViewSessionsDelta)
        + Math.abs(left.viewToChatRateDelta)
        + Math.abs(left.viewToToolRunRateDelta);
      return rightMagnitude - leftMagnitude;
    })[0];
  const weakestRetentionWorkbenchItem = getWeakestRetentionWorkbenchItem(snapshot);
  const hasWeakRetentionWorkbench = isWeakRetentionWorkbenchItem(weakestRetentionWorkbenchItem);
  const flowTitle = hasWeakRetentionWorkbench
    ? '先修复访工作台'
    : weakestLifecycleReportSource && weakestLifecycleReportSource.chatCompletionRate < 35
      ? '先修召回入口'
      : weakestSourceFunnel && weakestSourceFunnel.viewToChatRate < 30
        ? '先修最弱来源漏斗'
        : strongestSourceShift && strongestSourceShift.direction === 'down'
          ? '先修回落来源'
          : deviceCoverageRate > 0 && deviceCoverageRate < 60
            ? '先补设备覆盖'
            : '按设备修主断点';
  const flowDetail = deviceCoverageRate > 0 && deviceCoverageRate < 60
    ? `最近设备事件覆盖率只有 ${deviceCoverageRate}%，先把设备测量质量拉到可用区间，再判断哪端在掉。`
    : hasWeakRetentionWorkbench && weakestRetentionWorkbenchItem
      ? buildRetentionWorkbenchPriorityText(weakestRetentionWorkbenchItem)
      : weakestLifecycleReportSource && weakestLifecycleReportSource.chatCompletionRate < 35
        ? `来源“${weakestLifecycleReportSource.source}”的报告召回完成率只有 ${weakestLifecycleReportSource.chatCompletionRate}%，先重写这类 GEO/SEO 入口的邮件文案、结果页回流文案和继续追问承接。`
        : weakestSourceFunnel && weakestSourceFunnel.viewToChatRate < 30
          ? `来源“${weakestSourceFunnel.source}”当前 analyze ${weakestSourceFunnel.analyzeSessions}，报告查看率 ${weakestSourceFunnel.reportToViewRate}%，结果页到聊天仅 ${weakestSourceFunnel.viewToChatRate}%，先修主结果页承接。`
          : strongestSourceShift && strongestSourceShift.direction === 'down'
            ? `来源“${strongestSourceShift.source}”最近 3 天 analyze ${strongestSourceShift.analyzeSessionsDelta > 0 ? '+' : ''}${strongestSourceShift.analyzeSessionsDelta}，结果页到聊天 ${strongestSourceShift.viewToChatRateDelta > 0 ? '+' : ''}${strongestSourceShift.viewToChatRateDelta}pt，应该按来源单独重写入口文案、首屏承接和追问理由。`
            : weakestDeviceFunnel
              ? buildWeakestDevicePriority(weakestDeviceFunnel)
              : snapshot.totals.result_report_linked_events > 0
                ? `当前已有 ${snapshot.totals.result_report_linked_events} 个报告绑定事件，继续把结果页的判断落成验证样本。`
                : '当前几乎没有报告绑定事件，结果页价值还没有被真正沉淀下来。';
  const flowTone = hasWeakRetentionWorkbench || weakestLifecycleReportSource || weakestSourceFunnel || strongestSourceShift || weakestDeviceFunnel || (deviceCoverageRate > 0 && deviceCoverageRate < 60)
    ? 'warning'
    : snapshot.totals.result_report_linked_events > 0
      ? 'accent'
      : 'warning';
  return [
    {
      key: 'overdue_validation',
      title: '先追结果回收',
      detail: snapshot.pendingValidationBuckets.overdue > 0
        ? `优先处理 ${snapshot.pendingValidationBuckets.overdue} 个已过期待验证事件，把“准 / 偏”状态补回来。`
        : '当前没有已过期待验证事件，这一项压力较小。',
      tone: snapshot.pendingValidationBuckets.overdue > 0 ? 'warning' : 'success',
    },
    {
      key: 'drift_correction',
      title: '推进偏差纠偏',
      detail: snapshot.pendingValidationBuckets.driftReadyForCorrection > 0
        ? `已经有 ${snapshot.pendingValidationBuckets.driftReadyForCorrection} 个偏差事件具备纠偏条件，应该引导用户回到聊天继续拆解。`
        : '当前可直接纠偏的样本还不多，先继续积累备注完整的偏差事件。',
      tone: snapshot.pendingValidationBuckets.driftReadyForCorrection > 0 ? 'accent' : 'neutral',
    },
    {
      key: 'device_or_report_flow',
      title: flowTitle,
      detail: flowDetail,
      tone: flowTone,
    },
    {
      key: 'version_upgrade',
      title: '统一报告版本',
      detail: snapshot.reportVersionBreakdown.length > 0
        ? `主力版本为 ${snapshot.reportVersionBreakdown[0].version}，要持续降低旧版本报告占比。`
        : '当前还没有版本分布数据。',
      tone: ['v2', 'v3'].includes(snapshot.reportVersionBreakdown[0]?.version || '') ? 'success' : 'neutral',
    },
  ];
}
