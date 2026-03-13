import { buildAdminActionItems, buildAdminOperatingInsight } from '@/lib/admin-analytics-insights';

const snapshot = {
  totals: {
    total_analyses: 120,
    analyses_last_7d: 18,
    public_reports: 36,
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
};

describe('admin analytics insights', () => {
  it('builds a readable operating insight summary', () => {
    const insight = buildAdminOperatingInsight(snapshot);

    expect(insight.headline).toContain('验证结果回收');
    expect(insight.summary).toContain('命中率');
    expect(insight.summary).toContain('主力推理层');
    expect(insight.priorities.length).toBeGreaterThan(1);
    expect(insight.risks[0]).toContain('偏差事件');
  });

  it('builds actionable admin tasks', () => {
    const actions = buildAdminActionItems(snapshot);

    expect(actions).toHaveLength(4);
    expect(actions[0]?.title).toBe('先追结果回收');
    expect(actions[0]?.tone).toBe('warning');
    expect(actions[1]?.detail).toContain('纠偏条件');
  });
});
