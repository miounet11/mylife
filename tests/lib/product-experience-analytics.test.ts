import { buildProductExperienceAnalyticsSnapshot } from '@/lib/product-experience-analytics';

describe('product experience analytics', () => {
  it('maps surface views and actions into health rows', () => {
    const snapshot = buildProductExperienceAnalyticsSnapshot([
      ...Array.from({ length: 10 }, (_, index) => ({
        event_name: 'home_page_viewed',
        page: '/',
        meta: JSON.stringify({ surfaceKey: 'landing' }),
        created_at: `2026-05-01 10:00:${String(index).padStart(2, '0')}`,
      })),
      {
        event_name: 'analyze_submitted',
        page: '/analyze',
        meta: JSON.stringify({ source: 'home_direct' }),
        created_at: '2026-05-01 10:02:00',
      },
      {
        event_name: 'report_generated',
        page: '/result/report_1',
        meta: JSON.stringify({ source: 'home_direct' }),
        created_at: '2026-05-01 10:03:00',
      },
      {
        event_name: 'content_card_clicked',
        page: '/',
        meta: JSON.stringify({ target: '/knowledge/a' }),
        created_at: '2026-05-01 10:04:00',
      },
      ...Array.from({ length: 6 }, (_, index) => ({
        event_name: 'chat_page_viewed',
        page: '/chat',
        meta: '{}',
        created_at: `2026-05-01 11:00:${String(index).padStart(2, '0')}`,
      })),
      {
        event_name: 'chat_message_sent',
        page: '/chat',
        meta: JSON.stringify({ source: 'result_report_followup' }),
        created_at: '2026-05-01 11:02:00',
      },
    ], {
      days: 30,
      generatedAt: '2026-05-02T00:00:00.000Z',
    });

    const home = snapshot.rows.find((item) => item.surface === 'home');
    const chat = snapshot.rows.find((item) => item.surface === 'chat');

    expect(home).toMatchObject({
      label: '入口页',
      views: 10,
      primaryActions: 2,
      secondaryActions: 1,
      conversionRate: 20,
      health: 'warning',
    });
    expect(chat).toMatchObject({
      views: 6,
      primaryActions: 1,
      conversionRate: 17,
      health: 'critical',
    });
    expect(snapshot.totals.views).toBeGreaterThanOrEqual(16);
    expect(snapshot.totals.warning).toBeGreaterThanOrEqual(1);
    expect(snapshot.totals.critical).toBeGreaterThanOrEqual(1);
  });

  it('keeps low-sample surfaces neutral instead of marking them broken', () => {
    const snapshot = buildProductExperienceAnalyticsSnapshot([
      {
        event_name: 'report_viewed',
        page: '/result/report_1',
        meta: JSON.stringify({ reportId: 'report_1' }),
        created_at: '2026-05-01 10:00:00',
      },
      {
        event_name: 'result_cta_clicked',
        page: '/result/report_1',
        meta: JSON.stringify({ target: 'result_top_followup_chat' }),
        created_at: '2026-05-01 10:01:00',
      },
    ]);

    const result = snapshot.rows.find((item) => item.surface === 'result');

    expect(result).toMatchObject({
      views: 1,
      primaryActions: 1,
      conversionRate: 100,
      health: 'neutral',
    });
    expect(result?.action).toContain('样本不足');
  });

  it('counts result-to-chat start and completion as result next-step actions', () => {
    const snapshot = buildProductExperienceAnalyticsSnapshot([
      ...Array.from({ length: 5 }, (_, index) => ({
        event_name: 'report_viewed',
        page: `/result/report_${index}`,
        meta: JSON.stringify({ reportId: `report_${index}` }),
        created_at: `2026-05-01 12:00:0${index}`,
      })),
      {
        event_name: 'result_chat_started',
        page: '/r/report_1',
        meta: JSON.stringify({ reportId: 'report_1', source: 'result_report_followup' }),
        created_at: '2026-05-01 12:05:00',
      },
      {
        event_name: 'report_to_chat_completed',
        page: '/chat',
        meta: JSON.stringify({ reportId: 'report_1', source: 'result_report_followup:knowledge_article:a' }),
        created_at: '2026-05-01 12:06:00',
      },
    ]);

    const result = snapshot.rows.find((item) => item.surface === 'result');

    expect(result).toMatchObject({
      views: 5,
      primaryActions: 0,
      nextStepActions: 2,
      totalActions: 2,
      health: 'critical',
    });
  });

  it('attributes tool-result premium requests through remembered attribution', () => {
    const snapshot = buildProductExperienceAnalyticsSnapshot([
      ...Array.from({ length: 5 }, (_, index) => ({
        event_name: 'tool_result_viewed',
        page: `/tool-result/tool_${index}`,
        meta: JSON.stringify({ toolSlug: 'career-role-fit' }),
        created_at: `2026-05-01 09:00:0${index}`,
      })),
      {
        event_name: 'premium_service_requested',
        page: '/result/report_1',
        meta: JSON.stringify({
          attribution: {
            eventName: 'result_cta_clicked',
            page: '/tool-result/tool_1',
            target: 'tool_premium_request_submit',
          },
        }),
        created_at: '2026-05-01 09:05:00',
      },
    ]);

    const toolResult = snapshot.rows.find((item) => item.surface === 'toolResult');

    expect(toolResult?.views).toBe(5);
    expect(toolResult?.secondaryActions).toBe(1);
    expect(toolResult?.totalActions).toBe(1);
    expect(toolResult?.health).toBe('critical');
  });
});
