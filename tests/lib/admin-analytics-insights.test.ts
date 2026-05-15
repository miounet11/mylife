import { buildAdminActionItems, buildAdminOperatingInsight } from '@/lib/admin-analytics-insights';

const snapshot = {
  totals: {
    total_analyses: 120,
    analyses_last_7d: 18,
    public_reports: 36,
    valid_analyses: 108,
    valid_public_reports: 32,
    valid_analyses_last_7d: 16,
    chat_messages: 88,
    active_subscribers: 24,
    total_events: 42,
    result_report_linked_events: 12,
    chat_sourced_events: 7,
    validation_accurate: 9,
    validation_drift: 4,
    validation_pending: 11,
    total_tracked_events: 480,
    tracked_events_last_7d: 92,
  },
  pendingValidationBuckets: {
    overdue: 6,
    upcoming: 5,
    driftNeedsNotes: 2,
    driftReadyForCorrection: 3,
  },
  driftReasonBreakdown: [
    { label: '时机 / 窗口偏差', count: 3, share: 75 },
    { label: '执行 / 推进偏差', count: 1, share: 25 },
  ],
  reportVersionBreakdown: [
    { version: 'v2', count: 80, share: 67 },
    { version: 'v1', count: 40, share: 33 },
  ],
  journeyFunnel: [
    { key: 'report_viewed', label: '打开结果页', count: 20 },
    { key: 'chat_message_sent', label: '发送聊天消息', count: 5 },
    { key: 'report_event_saved_from_result', label: '结果页沉淀事件', count: 1 },
  ],
  reasoningModeBreakdown: [
    { mode: 'deterministic-expert', count: 60, share: 50 },
    { mode: 'parallel-agents', count: 40, share: 33 },
    { mode: 'engine', count: 20, share: 17 },
  ],
  chatActionBreakdown: [
    { action: 'ask', label: '直接提问', count: 40, share: 80 },
    { action: 'regenerate', label: '重生成回答', count: 10, share: 20 },
  ],
  ctaStrategyBreakdown: [
    {
      key: 'retention_workbench_resume:history_page',
      strategyKey: 'retention_workbench_resume',
      sourceFamily: 'history_page',
      clicks: 6,
      chatPageViews: 2,
      chatCompleted: 0,
      toolCardClicks: 1,
      contentCardClicks: 0,
      clickToChatRate: 33,
      chatCompletionRate: 0,
      latestAt: '2026-04-20T10:00:00.000Z',
    },
    {
      key: 'retention_workbench_resume:profile_page',
      strategyKey: 'retention_workbench_resume',
      sourceFamily: 'profile_page',
      clicks: 5,
      chatPageViews: 4,
      chatCompleted: 2,
      toolCardClicks: 1,
      contentCardClicks: 1,
      clickToChatRate: 80,
      chatCompletionRate: 50,
      latestAt: '2026-04-20T09:00:00.000Z',
    },
    {
      key: 'knowledge_to_self_judgment:knowledge_article',
      strategyKey: 'knowledge_to_self_judgment',
      sourceFamily: 'knowledge_article',
      clicks: 8,
      chatPageViews: 6,
      chatCompleted: 4,
      toolCardClicks: 2,
      contentCardClicks: 1,
      clickToChatRate: 75,
      chatCompletionRate: 67,
      latestAt: '2026-04-20T08:00:00.000Z',
    },
  ],
  deviceMeasurementSummary: {
    currentWindow: {
      coverageRate: 72,
      sessionCoverageRate: 68,
    },
    note: '设备埋点覆盖已进入可用区间。',
  },
  deviceFunnelBreakdown: [
    {
      deviceType: 'mobile',
      reportToChatRate: 18,
      reportToEventRate: 9,
      toolToRunRate: 22,
      authVerifyRate: 28,
      sampleState: 'enough',
    },
    {
      deviceType: 'desktop',
      reportToChatRate: 41,
      reportToEventRate: 20,
      toolToRunRate: 36,
      authVerifyRate: 57,
      sampleState: 'enough',
    },
  ],
  recentBehaviorShift: {
    byDevice: [
      {
        deviceType: 'mobile',
        direction: 'down',
        productEventsDelta: -8,
        reportToChatRateDelta: -6,
        toolToRunRateDelta: -4,
        authVerifyRateDelta: -3,
        sampleState: 'enough',
      },
    ],
  },
  lifecycleRecall: {
    reportFollowupBySource: [
      {
        source: 'knowledge_article:career-plan',
        sent: 3,
        chatCompletionRate: 18,
        chatToEventRate: 10,
      },
    ],
    reportFollowupByDevice: [
      {
        deviceType: 'mobile',
        sent: 3,
        chatCompletionRate: 22,
        chatToEventRate: 8,
      },
    ],
    toolInterestBySource: [
      {
        source: 'knowledge_article:career-plan',
        sent: 3,
        sentToRunRate: 14,
        runToResultRate: 50,
      },
    ],
    toolInterestByDevice: [
      {
        deviceType: 'mobile',
        sent: 3,
        sentToRunRate: 12,
        runToResultRate: 50,
      },
    ],
  },
  sourceFunnel: [
    {
      source: 'knowledge_article:career-plan',
      analyzeSessions: 6,
      reportsGenerated: 5,
      reportViewSessions: 4,
      chatSessions: 1,
      toolRunSessions: 1,
      analyzeToReportRate: 83,
      reportToViewRate: 80,
      viewToChatRate: 25,
      viewToToolRunRate: 25,
    },
  ],
  weeklySourceTrend: [
    {
      weekStart: '2026-04-14',
      weekLabel: '2026-W16',
      source: 'knowledge_article:career-plan',
      analyzeSessions: 6,
      reportsGenerated: 5,
      reportViewSessions: 4,
      chatSessions: 1,
      toolRunSessions: 1,
      analyzeToReportRate: 83,
      reportToViewRate: 80,
      viewToChatRate: 25,
      viewToToolRunRate: 25,
    },
  ],
  recentSourceShift: [
    {
      source: 'knowledge_article:career-plan',
      current: {
        analyzeSessions: 3,
        reportViewSessions: 2,
        viewToChatRate: 0,
        viewToToolRunRate: 0,
      },
      previous: {
        analyzeSessions: 6,
        reportViewSessions: 4,
        viewToChatRate: 25,
        viewToToolRunRate: 25,
      },
      analyzeSessionsDelta: -3,
      reportViewSessionsDelta: -2,
      viewToChatRateDelta: -25,
      viewToToolRunRateDelta: -25,
      direction: 'down',
      sampleState: 'enough',
    },
  ],
  sourceDeviceFunnel: [
    {
      source: 'knowledge_article:career-plan',
      deviceType: 'mobile',
      analyzeSessions: 4,
      reportsGenerated: 3,
      reportViewSessions: 2,
      chatSessions: 0,
      toolRunSessions: 0,
      analyzeToReportRate: 75,
      reportToViewRate: 67,
      viewToChatRate: 0,
      viewToToolRunRate: 0,
    },
  ],
};

describe('admin analytics insights', () => {
  it('builds a readable operating insight summary', () => {
    const insight = buildAdminOperatingInsight(snapshot as Parameters<typeof buildAdminOperatingInsight>[0]);

    expect(insight.headline).toContain('验证结果回收');
    expect(insight.summary).toContain('命中率');
    expect(insight.summary).toContain('主力推理层');
    expect(insight.summary).toContain('最近设备事件覆盖率');
    expect(insight.summary).toContain('复访工作台里最弱入口');
    expect(insight.summary).toContain('报告召回里最弱来源');
    expect(insight.summary).toContain('主漏斗里最弱来源');
    expect(insight.summary).toContain('最近变化最大的来源');
    expect(insight.priorities.length).toBeGreaterThan(1);
    expect(insight.priorities.join(' ')).toContain('历史复盘来源');
    expect(insight.summary).toContain('历史复盘来源');
    expect(insight.risks.join(' ')).toContain('最近短周期在回落');
  });

  it('builds actionable admin tasks', () => {
    const actions = buildAdminActionItems(snapshot as Parameters<typeof buildAdminActionItems>[0]);

    expect(actions).toHaveLength(4);
    expect(actions[0]?.title).toBe('先追结果回收');
    expect(actions[0]?.tone).toBe('warning');
    expect(actions[1]?.detail).toContain('纠偏条件');
    expect(actions[2]?.detail).toContain('历史复盘来源');
    expect(actions[2]?.title).toBe('先修复访工作台');
  });
});
