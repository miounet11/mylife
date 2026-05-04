import { buildReportJourneyAnalyticsSnapshot } from '@/lib/report-journey-analytics';
import type { ReportJourneyEventRecord } from '@/lib/user-types';

describe('report journey analytics', () => {
  it('builds funnel and category summaries from journey events', () => {
    const snapshot = buildReportJourneyAnalyticsSnapshot([
      {
        id: 'rje_1',
        userId: 'user_1',
        reportId: 'report_1',
        workflowId: 'report-journey-v1',
        layerKey: 'deep-report',
        actionTarget: 'report_journey_deep_report',
      },
      {
        id: 'rje_2',
        userId: 'user_1',
        reportId: 'report_1',
        workflowId: 'report-journey-v1',
        layerKey: 'category-report',
        actionTarget: 'report_journey_primary_category',
        category: 'career',
        toolSlug: 'career-role-fit',
      },
      {
        id: 'rje_3',
        userId: 'user_2',
        reportId: 'report_2',
        workflowId: 'report-journey-v1',
        layerKey: 'category-report',
        actionTarget: 'report_journey_secondary_category',
        category: 'career',
        toolSlug: 'career-role-fit',
      },
    ] as ReportJourneyEventRecord[]);

    expect(snapshot.totalEvents).toBe(3);
    expect(snapshot.uniqueReports).toBe(2);
    expect(snapshot.uniqueUsers).toBe(2);
    expect(snapshot.funnel[0]).toEqual({
      key: 'category-report',
      label: '专项细分',
      count: 2,
      share: 67,
    });
    expect(snapshot.categories[0]).toEqual({
      category: 'career',
      count: 2,
      share: 67,
    });
    expect(snapshot.tools[0]).toEqual({
      toolSlug: 'career-role-fit',
      count: 2,
      share: 67,
    });
  });
});
