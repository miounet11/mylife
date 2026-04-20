import {
  buildEstimatedPastEventDescription,
  formatEventDateKey,
  formatEventQueueDateKey,
  getEstimatedPastEventDateKey,
  getEstimatedPastEventPrompt,
  getEventViewFocusDate,
  getEventViewSortTime,
  getEventTransportSortTime,
  isEstimatedPastEventRecord,
  normalizeEventTransportRecord,
  normalizeEventTransportRecords,
  parseEventViewDate,
  toEventViewModel,
  toEventViewModels,
} from '@/lib/event-view';

describe('event view model', () => {
  it('parses date-only event keys as local calendar dates', () => {
    const parsed = parseEventViewDate('2026-04-20');

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(3);
    expect(parsed.getDate()).toBe(20);
  });

  it('parses date and time together for sorting', () => {
    const morning = getEventViewSortTime({ dateKey: '2026-04-20', time: '09:00' });
    const evening = getEventViewSortTime({ dateKey: '2026-04-20', time: '18:00' });

    expect(morning).toBeLessThan(evening);
  });

  it('formats event date keys for display', () => {
    expect(formatEventDateKey('2026-04-20')).toBe('2026-04-20');
    expect(formatEventQueueDateKey('2026-04-20')).toBe('2026.04.20');
    expect(formatEventDateKey('')).toBe('未记录');
  });

  it('maps raw records into a normalized event view model', () => {
    const mapped = toEventViewModel({
      id: 'event_1',
      type: 'career',
      title: '测试事件',
      date: '2026-04-20',
      time: '09:30',
      description: '说明',
      impact: 'positive',
      reminder_enabled: 1,
      reminder_advance_days: 3,
      reminder_method: 'app',
      fortuneAnalysis: { reportId: 'report_1' },
      userFeedback: { wasAccurate: true },
    });

    expect(mapped.dateKey).toBe('2026-04-20');
    expect(mapped.date.getFullYear()).toBe(2026);
    expect(mapped.date.getMonth()).toBe(3);
    expect(mapped.date.getDate()).toBe(20);
    expect(mapped.time).toBe('09:30');
    expect(mapped.reminder?.enabled).toBe(true);
    expect(mapped.reminder?.advanceDays).toBe(3);
    expect(mapped.reminder?.method).toBe('app');
    expect(mapped.fortuneAnalysis?.reportId).toBe('report_1');
    expect(mapped.userFeedback?.wasAccurate).toBe(true);
  });

  it('normalizes transport records from mixed database/api shapes', () => {
    const normalized = normalizeEventTransportRecord({
      id: 'event_transport',
      user_id: 'user_1',
      type: 'career',
      title: '事件 transport',
      date: '2026-04-20',
      time: '09:30',
      description: 'transport 说明',
      impact: 'positive',
      fortune_analysis: { reportId: 'report_1' },
      user_feedback: { wasAccurate: true },
      follow_up_advice: { shortTerm: '继续跟进' },
      reminder_enabled: 1,
      reminder_advance_days: 5,
      reminder_method: 'app',
    });

    expect(normalized.userId).toBe('user_1');
    expect(normalized.type).toBe('career');
    expect(normalized.date).toBe('2026-04-20');
    expect(normalized.impact).toBe('positive');
    expect(normalized.fortuneAnalysis).toEqual({ reportId: 'report_1' });
    expect(normalized.userFeedback).toEqual({ wasAccurate: true });
    expect(normalized.followUpAdvice).toEqual({ shortTerm: '继续跟进' });
    expect(normalized.reminderEnabled).toBe(true);
    expect(normalized.reminderAdvanceDays).toBe(5);
    expect(normalized.reminderMethod).toBe('app');
  });

  it('normalizes invalid transport values into safe event defaults', () => {
    const normalized = normalizeEventTransportRecord({
      id: 123,
      type: 'invalid',
      title: null,
      date: null,
      impact: 'invalid',
      reminder_enabled: 0,
    });

    expect(normalized.id).toBe('123');
    expect(normalized.type).toBe('other');
    expect(normalized.title).toBe('');
    expect(normalized.date).toBe('');
    expect(normalized.impact).toBe('neutral');
    expect(normalized.reminderEnabled).toBe(false);
  });

  it('supports batch normalization and view mapping', () => {
    const normalized = normalizeEventTransportRecords([
      {
        id: 'event_batch',
        type: 'health',
        title: '体检复查',
        date: '2026-05-10',
        impact: 'neutral',
      },
      null,
    ]);
    const mapped = toEventViewModels(normalized);

    expect(normalized).toHaveLength(1);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]?.dateKey).toBe('2026-05-10');
    expect(mapped[0]?.title).toBe('体检复查');
  });

  it('sorts transport records by local date and time semantics', () => {
    const morning = getEventTransportSortTime({ date: '2026-04-20', time: '09:00' });
    const evening = getEventTransportSortTime({ date: '2026-04-20', time: '18:00' });

    expect(morning).toBeLessThan(evening);
  });

  it('builds explicit estimated past-event copy instead of silent fake history dates', () => {
    expect(getEstimatedPastEventDateKey(new Date(2026, 3, 20, 23, 45, 0))).toBe('2026-04-20');
    expect(buildEstimatedPastEventDescription('过去有一次岗位调整', '乙亥大运前后')).toContain('真实日期待补充');
    expect(buildEstimatedPastEventDescription('过去有一次岗位调整', '乙亥大运前后')).toContain('乙亥大运前后');
    expect(isEstimatedPastEventRecord({
      fortuneAnalysis: {
        templateKind: 'past_event',
        dateStatus: 'estimated_today_pending_correction',
      },
    })).toBe(true);
    expect(getEstimatedPastEventPrompt({
      title: '过去有一次岗位调整',
      fortuneAnalysis: {
        occurrenceWindow: '乙亥大运前后',
      },
    })).toContain('乙亥大运前后');
  });

  it('falls back invalid records to a safe normalized shape', () => {
    const mapped = toEventViewModel({
      id: 'event_2',
      type: 'invalid',
      title: '异常事件',
      date: '',
      impact: 'invalid',
    });

    expect(mapped.type).toBe('other');
    expect(mapped.impact).toBe('neutral');
    expect(mapped.dateKey).toBe('');
    expect(Number.isNaN(mapped.date.getTime())).toBe(false);
  });

  it('supports history-style records with feedback and report linkage', () => {
    const mapped = toEventViewModel({
      id: 'event_3',
      type: 'health',
      title: '历史样本',
      date: '2025-12-08',
      description: '历史说明',
      fortuneAnalysis: {
        reportId: 'report_123',
        reason: '结构判断样本',
      },
      followUpAdvice: {
        shortTerm: '继续复盘',
      },
      userFeedback: {
        wasAccurate: false,
        userNotes: '现实偏差较大',
      },
    });

    expect(mapped.type).toBe('health');
    expect(mapped.dateKey).toBe('2025-12-08');
    expect(mapped.fortuneAnalysis?.reportId).toBe('report_123');
    expect(mapped.followUpAdvice?.shortTerm).toBe('继续复盘');
    expect(mapped.userFeedback?.wasAccurate).toBe(false);
    expect(mapped.userFeedback?.userNotes).toBe('现实偏差较大');
  });

  it('focuses calendar on the nearest overdue pending event first', () => {
    const focusDate = getEventViewFocusDate([
      toEventViewModel({
        id: 'event_past',
        type: 'career',
        title: '过去事件',
        date: '2026-04-18',
      }),
      toEventViewModel({
        id: 'event_done',
        type: 'family',
        title: '已验证事件',
        date: '2026-04-19',
        userFeedback: { wasAccurate: true },
      }),
      toEventViewModel({
        id: 'event_next',
        type: 'wealth',
        title: '即将到来',
        date: '2026-04-21',
      }),
      toEventViewModel({
        id: 'event_later',
        type: 'health',
        title: '更晚事件',
        date: '2026-04-28',
      }),
    ], new Date(2026, 3, 20, 12, 0, 0));

    expect(focusDate).not.toBeNull();
    expect(focusDate?.getFullYear()).toBe(2026);
    expect(focusDate?.getMonth()).toBe(3);
    expect(focusDate?.getDate()).toBe(18);
  });
});
