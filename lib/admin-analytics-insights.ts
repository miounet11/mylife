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

export function buildAdminOperatingInsight(snapshot: AdminAnalyticsSnapshot): AdminOperatingInsight {
  const validatedTotal = snapshot.totals.validation_accurate + snapshot.totals.validation_drift;
  const accuracyRate = validatedTotal > 0
    ? Math.round((snapshot.totals.validation_accurate / validatedTotal) * 100)
    : 0;
  const topDriftReason = snapshot.driftReasonBreakdown[0];
  const topVersion = snapshot.reportVersionBreakdown[0];

  let headline = '当前经营状态以继续验证样本、扩大闭环为主。';
  if (snapshot.pendingValidationBuckets.overdue >= 5) {
    headline = '当前最大的短板不是获客，而是验证结果回收不够。';
  } else if (snapshot.pendingValidationBuckets.driftReadyForCorrection >= 3) {
    headline = '当前已经积累出足够的偏差样本，应该优先把纠偏链路做深。';
  } else if (accuracyRate >= 70 && snapshot.totals.result_report_linked_events >= 10) {
    headline = '当前闭环健康度不错，可以继续放大报告到事件的转化。';
  }

  return {
    headline,
    summary: [
      validatedTotal > 0 ? `已回收验证结果 ${validatedTotal} 个，当前命中率 ${accuracyRate}%。` : '当前还没有足够多的验证样本。',
      topDriftReason ? `最常见偏差原因是“${topDriftReason.label}”。` : '',
      topVersion ? `目前主力报告版本为 ${topVersion.version}。` : '',
    ].filter(Boolean).join(' '),
    priorities: [
      snapshot.pendingValidationBuckets.overdue > 0 ? `先回收 ${snapshot.pendingValidationBuckets.overdue} 个已过期待验证事件。` : '',
      snapshot.pendingValidationBuckets.driftReadyForCorrection > 0 ? `把 ${snapshot.pendingValidationBuckets.driftReadyForCorrection} 个已写明偏差的事件推进到纠偏分析。` : '',
      snapshot.totals.result_report_linked_events < Math.max(8, Math.round(snapshot.totals.total_events * 0.45))
        ? '继续提高结果页到事件中心的转化，不要让高价值判断停在报告页。'
        : '',
      snapshot.totals.chat_sourced_events < Math.max(5, Math.round(snapshot.totals.total_events * 0.2))
        ? '继续提高聊天结论存事件的比例，让 AI 真正进入闭环。'
        : '',
    ].filter(Boolean).slice(0, 4),
    risks: [
      snapshot.pendingValidationBuckets.driftNeedsNotes > 0 ? `${snapshot.pendingValidationBuckets.driftNeedsNotes} 个偏差事件还没备注原因，后续很难做结构化纠偏。` : '',
      topDriftReason && topDriftReason.share >= 40 ? `偏差高度集中在“${topDriftReason.label}”，说明当前引擎或引导在这个环节还有系统性短板。` : '',
      topVersion && topVersion.version === 'v1' && topVersion.share >= 30 ? '仍有较多旧版报告在流通，会影响用户体验一致性。' : '',
    ].filter(Boolean).slice(0, 3),
  };
}

export function buildAdminActionItems(snapshot: AdminAnalyticsSnapshot): AdminActionItem[] {
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
      key: 'report_to_event',
      title: '提升报告转事件',
      detail: snapshot.totals.result_report_linked_events > 0
        ? `当前已有 ${snapshot.totals.result_report_linked_events} 个报告绑定事件，继续把结果页的判断落成验证样本。`
        : '当前几乎没有报告绑定事件，结果页价值还没有被真正沉淀下来。',
      tone: snapshot.totals.result_report_linked_events > 0 ? 'accent' : 'warning',
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
