import {
  emailSubscriptionOperations,
  fortuneOperations,
  reportMonthlyDigestRunOperations,
  reportUpgradeJobOperations,
} from '@/lib/database';

export type UpdatesSummary = {
  email?: string | null;
  subscription?: {
    email: string;
    status: string;
    source?: string;
    tags?: string[];
    updatedAt?: string | null;
  } | null;
  reportCount?: number;
  activeUpgradeCount?: number;
  completedUpgradeCount?: number;
  latestReport?: {
    id: string;
    name?: string | null;
    reportVersion?: string | null;
    qualityScore?: number | null;
    qualityGrade?: string | null;
  } | null;
  latestDigest?: {
    id: string;
    cycleKey?: string | null;
    status?: string | null;
    reason?: string | null;
    reportId?: string | null;
    createdAt?: string | null;
  } | null;
  focusReport?: {
    id: string;
    name?: string | null;
    reportVersion?: string | null;
    qualityScore?: number | null;
    qualityGrade?: string | null;
    upgradeJob?: {
      status?: string | null;
      nextRunAt?: string | null;
      bestScore?: number | null;
      bestGrade?: string | null;
    } | null;
    digest?: {
      cycleKey?: string | null;
      status?: string | null;
      reason?: string | null;
      createdAt?: string | null;
    } | null;
  } | null;
} | null;

export function buildUpdatesSummary({
  userId,
  email,
  requestedReportId,
}: {
  userId: string;
  email?: string | null;
  requestedReportId?: string | null;
}): UpdatesSummary {
  const normalizedEmail = `${email || ''}`.trim().toLowerCase();
  const subscription = normalizedEmail ? emailSubscriptionOperations.getByEmail(normalizedEmail) : null;
  const reports = fortuneOperations.getByUserId(userId);
  const upgradeJobs = reportUpgradeJobOperations.listByUserId(userId, 20);
  const digestRuns = reportMonthlyDigestRunOperations.listByUserOrEmail({
    userId,
    email: normalizedEmail,
    limit: 6,
  });
  const latestReport = reports[0] || null;
  const latestDigest = digestRuns[0] || null;
  const focusReport = (requestedReportId
    ? reports.find((item) => item.id === requestedReportId)
    : latestReport) || null;
  const focusUpgradeJob = focusReport
    ? upgradeJobs.find((item) => item.reportId === focusReport.id) || null
    : null;
  const focusDigest = focusReport
    ? digestRuns.find((item) => item.reportId === focusReport.id) || null
    : null;

  return {
    email: normalizedEmail,
    subscription: subscription
      ? {
          email: subscription.email,
          status: subscription.status,
          source: subscription.source,
          tags: subscription.tags || [],
          updatedAt: subscription.updated_at || null,
        }
      : null,
    reportCount: reports.length,
    activeUpgradeCount: upgradeJobs.filter((item) => ['pending', 'running', 'retry'].includes(item.status)).length,
    completedUpgradeCount: upgradeJobs.filter((item) => item.status === 'completed').length,
    latestReport: latestReport
      ? {
          id: latestReport.id,
          name: latestReport.name,
          reportVersion: latestReport.reportVersion || 'v1',
          qualityScore: latestReport.analysis?.qualityAudit?.overallScore || null,
          qualityGrade: latestReport.analysis?.qualityAudit?.grade || null,
        }
      : null,
    latestDigest: latestDigest
      ? {
          id: latestDigest.id,
          cycleKey: latestDigest.cycleKey,
          status: latestDigest.status,
          reason: latestDigest.reason || null,
          reportId: latestDigest.reportId || null,
          createdAt: latestDigest.createdAt || null,
        }
      : null,
    focusReport: focusReport
      ? {
          id: focusReport.id,
          name: focusReport.name,
          reportVersion: focusReport.reportVersion || 'v1',
          qualityScore: focusReport.analysis?.qualityAudit?.overallScore || null,
          qualityGrade: focusReport.analysis?.qualityAudit?.grade || null,
          upgradeJob: focusUpgradeJob
            ? {
                status: focusUpgradeJob.status,
                nextRunAt: focusUpgradeJob.nextRunAt || null,
                bestScore: focusUpgradeJob.bestScore || null,
                bestGrade: focusUpgradeJob.bestGrade || null,
              }
            : null,
          digest: focusDigest
            ? {
                cycleKey: focusDigest.cycleKey,
                status: focusDigest.status,
                reason: focusDigest.reason || null,
                createdAt: focusDigest.createdAt || null,
              }
            : null,
        }
      : null,
  };
}
