import { analyticsOperations, fortuneOperations, reportUpgradeJobOperations } from '@/lib/database';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import { isLikelyTestReportName } from '@/lib/report-sample-classifier';
import type { FortuneRecord } from '@/lib/user-types';

export interface RealUserReportUpgradeCandidate {
  report: FortuneRecord;
  viewedCount: number;
  latestViewedAt?: string | null;
  priorityScore: number;
  reasons: string[];
}

export interface RealUserReportUpgradeResult {
  windowDays: number;
  candidates: Array<{
    reportId: string;
    name: string;
    viewedCount: number;
    latestViewedAt?: string | null;
    priorityScore: number;
    reasons: string[];
    queued: boolean;
    queueReason: string;
  }>;
  queuedCount: number;
  skippedCount: number;
}

export function listRealUserReportUpgradeCandidates(windowDays = 7, limit = 12): RealUserReportUpgradeCandidate[] {
  const viewedRows = analyticsOperations.rawQuery(`
    SELECT
      json_extract(meta, '$.reportId') AS report_id,
      COUNT(*) AS viewed_count,
      MAX(created_at) AS latest_viewed_at
    FROM analytics_events
    WHERE event_name = 'report_viewed'
      AND datetime(created_at) >= datetime('now', ?)
      AND json_extract(meta, '$.reportId') IS NOT NULL
    GROUP BY json_extract(meta, '$.reportId')
  `, [`-${windowDays} days`]) as Array<{
    report_id?: string | null;
    viewed_count?: number | null;
    latest_viewed_at?: string | null;
  }>;

  return viewedRows
    .map((row): RealUserReportUpgradeCandidate | null => {
      const reportId = `${row.report_id || ''}`.trim();
      const report = reportId ? fortuneOperations.getById(reportId) : null;
      if (!report || isLikelyTestReportName(report.name)) {
        return null;
      }

      const qualityAudit = report.analysis?.qualityAudit;
      const score = qualityAudit?.overallScore || 0;
      const deliveryTier = qualityAudit?.deliveryTier || 'basic';
      const llmUsed = !!report.analysis?.llmUsed;
      const targetAchieved = !!qualityAudit?.targetAchieved;
      const reasons: string[] = [];
      let priorityScore = 0;

      if (deliveryTier === 'basic') {
        priorityScore += 70;
        reasons.push('真实用户已查看但仍是 basic');
      }
      if (!llmUsed) {
        priorityScore += 55;
        reasons.push('首版未使用 LLM 增强');
      }
      if (score > 0 && score < 85) {
        priorityScore += 35;
        reasons.push(`质量分 ${score} 低于 85`);
      }
      if (!targetAchieved) {
        priorityScore += 20;
        reasons.push('尚未达到专家目标');
      }
      priorityScore += Math.min(30, (row.viewed_count || 0) * 10);

      if (priorityScore <= 0 || targetAchieved) {
        return null;
      }

      // Skip reports already terminal on quality plateau / exhausted attempts.
      const existingJob = reportUpgradeJobOperations.getByReportId(report.id);
      if (existingJob) {
        const best = Number(existingJob.bestScore || 0);
        const target = Number(existingJob.targetScore || 95);
        const err = `${existingJob.lastError || ''}`;
        const attemptsExhausted =
          (existingJob.attempts || 0) >= (existingJob.maxAttempts || 0);
        const plateau =
          err.includes('QUALITY_PLATEAU')
          || err.includes('TARGET_NOT_REACHED')
          || err.includes('OPS_CANCEL')
          || err.includes('PLATEAU')
          || best >= target - 5
          || (best >= 90 && attemptsExhausted);
        if (
          ['cancelled', 'failed'].includes(existingJob.status)
          && (plateau || attemptsExhausted)
        ) {
          return null;
        }
        if (['pending', 'running', 'retry'].includes(existingJob.status)) {
          return null;
        }
      }

      return {
        report,
        viewedCount: row.viewed_count || 0,
        latestViewedAt: row.latest_viewed_at || null,
        priorityScore,
        reasons,
      };
    })
    .filter((item): item is RealUserReportUpgradeCandidate => Boolean(item))
    .sort((left, right) => right.priorityScore - left.priorityScore || right.viewedCount - left.viewedCount)
    .slice(0, limit);
}

export function enqueueRealUserReportUpgradeCandidates(params: {
  windowDays?: number;
  limit?: number;
  force?: boolean;
} = {}): RealUserReportUpgradeResult {
  const windowDays = params.windowDays || 7;
  const candidates = listRealUserReportUpgradeCandidates(windowDays, params.limit || 8);
  let queuedCount = 0;
  let skippedCount = 0;

  const rows = candidates.map((candidate) => {
    const queued = enqueueReportUpgrade({
      report: candidate.report,
      reason: 'real_user_viewed_priority',
      force: params.force,
      meta: {
        realUserPriority: true,
        viewedCount: candidate.viewedCount,
        latestViewedAt: candidate.latestViewedAt || null,
        priorityScore: candidate.priorityScore,
        reasons: candidate.reasons,
      },
    });

    if (queued.queued) {
      queuedCount += 1;
    } else {
      skippedCount += 1;
    }

    return {
      reportId: candidate.report.id,
      name: candidate.report.name,
      viewedCount: candidate.viewedCount,
      latestViewedAt: candidate.latestViewedAt,
      priorityScore: candidate.priorityScore,
      reasons: candidate.reasons,
      queued: queued.queued,
      queueReason: queued.reason,
    };
  });

  return {
    windowDays,
    candidates: rows,
    queuedCount,
    skippedCount,
  };
}
