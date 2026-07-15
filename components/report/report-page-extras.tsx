'use client';

import RelatedDimensionsPanel from '@/components/dimensions/related-dimensions-panel';
import ReportMembershipPanel from '@/components/membership/report-membership-panel';
import ReportSubscriptionPanel from '@/components/report-subscription-panel';
import TimingSubscribeBar from '@/components/result-v2/timing-subscribe-bar';

export default function ReportPageExtras({
  reportId,
  canManage = false,
  deliveryTierLabel = '结构版',
  qualityScore,
  targetAchieved = false,
  upgradeStatusLabel = '可订阅补全',
  monthlyHighlights = [],
  focusOptions = [],
}: {
  reportId: string;
  /** True when cookie guest/user owns this report — not "logged in". */
  canManage?: boolean;
  deliveryTierLabel?: string;
  qualityScore?: number;
  targetAchieved?: boolean;
  upgradeStatusLabel?: string;
  monthlyHighlights?: string[];
  focusOptions?: Array<{ key: string; label: string; value: string }>;
}) {
  return (
    <>
      <ReportMembershipPanel reportId={reportId} source="result_page_extras" />
      <RelatedDimensionsPanel
        title="用十维度继续拆解这份报告"
        description="事业 / 投资 / 运势节奏等场景会复用你的命盘，并生成可回访预测。"
        limit={3}
      />
      <ReportSubscriptionPanel
        reportId={reportId}
        canManage={canManage}
        deliveryTierLabel={deliveryTierLabel}
        qualityScore={qualityScore}
        targetAchieved={targetAchieved}
        upgradeStatusLabel={upgradeStatusLabel}
        monthlyHighlights={monthlyHighlights}
        focusOptions={focusOptions}
        ctaStrategyKey="result_subscription"
        sourceFamily="report"
      />
      <TimingSubscribeBar surfaceKey="result_page" reportId={reportId} />
    </>
  );
}
