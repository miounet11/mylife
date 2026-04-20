import { trackServerEvent } from '@/lib/analytics';
import { emailSubscriptionOperations, fortuneOperations, reportMonthlyDigestRunOperations, userOperations } from '@/lib/database';
import {
  getReportMonthlyDigestBatchSize,
  getReportMonthlyDigestTimezoneOffsetMinutes,
} from '@/lib/env';
import { isEmailDeliveryConfigured, sendMonthlyReportDigestEmail } from '@/lib/email';
import { buildMonthlyWindows, buildScenarioViews } from '@/lib/report-v2';
import { backfillEmailSubscriptionsFromUsers } from '@/lib/subscription-backfill';
import { generateId, getCurrentLocalMonthKey } from '@/lib/utils';
import type { FortuneRecord } from '@/lib/user-types';

const DEFAULT_BATCH_SIZE = getReportMonthlyDigestBatchSize();
const DEFAULT_TIMEZONE_OFFSET_MINUTES = getReportMonthlyDigestTimezoneOffsetMinutes();

type CycleTrigger = 'cron' | 'manual';

export async function runReportMonthlyDigestCycle(params?: {
  trigger?: CycleTrigger;
  batchSize?: number;
  cycleDate?: Date;
}) {
  const trigger = params?.trigger || 'cron';
  const batchSize = Math.max(1, params?.batchSize || DEFAULT_BATCH_SIZE);
  const cycleDate = params?.cycleDate || new Date();
  const cycleKey = getCycleKey(cycleDate);
  const cycleLabel = getCycleLabel(cycleDate);

  if (!isEmailDeliveryConfigured()) {
    return {
      success: false,
      trigger,
      cycleKey,
      sentCount: 0,
      skippedCount: 0,
      errorCount: 0,
      reason: 'email_not_configured',
    };
  }

  const backfill = backfillEmailSubscriptionsFromUsers();

  const subscriptions = emailSubscriptionOperations.listActiveByTags(
    ['monthly_report', 'report_upgrade', 'knowledge_updates', 'updates', 'welcome'],
    Math.max(batchSize * 4, 50)
  );
  if (subscriptions.length === 0) {
    return {
      success: true,
      trigger,
      cycleKey,
      backfill,
      sentCount: 0,
      skippedCount: 0,
      errorCount: 0,
      reason: 'empty',
    };
  }

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const details: Array<{ email: string; status: 'sent' | 'skipped' | 'error'; reason: string }> = [];

  for (const subscription of subscriptions.slice(0, batchSize)) {
    const email = `${subscription.email || ''}`.trim().toLowerCase();
    if (!email) {
      skippedCount += 1;
      continue;
    }

    const existingRun = reportMonthlyDigestRunOperations.getByCycleAndEmail(cycleKey, email);
    if (existingRun?.status === 'sent') {
      skippedCount += 1;
      details.push({ email, status: 'skipped', reason: 'already_sent' });
      continue;
    }

    const user = userOperations.getByEmail(email) as { id?: string; name?: string | null } | undefined;
    if (!user?.id) {
      reportMonthlyDigestRunOperations.create({
        id: existingRun?.id || `monthly_digest_${generateId()}`,
        cycleKey,
        email,
        status: 'skipped',
        reason: 'user_not_found',
        meta: { trigger },
      });
      skippedCount += 1;
      details.push({ email, status: 'skipped', reason: 'user_not_found' });
      continue;
    }

    const report = fortuneOperations.getByUserId(user.id)[0];
    if (!report) {
      reportMonthlyDigestRunOperations.create({
        id: existingRun?.id || `monthly_digest_${generateId()}`,
        cycleKey,
        email,
        userId: user.id,
        status: 'skipped',
        reason: 'report_not_found',
        meta: { trigger },
      });
      skippedCount += 1;
      details.push({ email, status: 'skipped', reason: 'report_not_found' });
      continue;
    }

    const digest = buildDigestFromReport(report);

    try {
      const deliveryResult = await sendMonthlyReportDigestEmail({
        email,
        name: report.name || user.name || '用户',
        reportId: report.id,
        cycleLabel,
        summary: digest.summary,
        stageFocus: digest.stageFocus,
        monthlyHighlights: digest.monthlyHighlights,
      });

      if (!deliveryResult?.success) {
        reportMonthlyDigestRunOperations.create({
          id: existingRun?.id || `monthly_digest_${generateId()}`,
          cycleKey,
          email,
          userId: user.id,
          reportId: report.id,
          status: 'error',
          reason: deliveryResult?.message || 'delivery_failed',
          meta: { trigger },
        });

        trackServerEvent({
          userId: user.id,
          sessionId: user.id,
          eventName: 'email_delivery_failed',
          page: `/result/${report.id}`,
          meta: {
            channel: 'monthly_digest',
            reportId: report.id,
            cycleKey,
            emailDomain: email.split('@')[1] || '',
            reason: deliveryResult?.message || 'delivery_failed',
          },
        });

        errorCount += 1;
        details.push({ email, status: 'error', reason: deliveryResult?.message || 'delivery_failed' });
        continue;
      }

      reportMonthlyDigestRunOperations.create({
        id: existingRun?.id || `monthly_digest_${generateId()}`,
        cycleKey,
        email,
        userId: user.id,
        reportId: report.id,
        status: 'sent',
        reason: 'sent',
        meta: {
          trigger,
          qualityScore: report.analysis?.qualityAudit?.overallScore || 0,
          qualityGrade: report.analysis?.qualityAudit?.grade || 'C',
        },
      });

      trackServerEvent({
        userId: user.id,
        sessionId: user.id,
        eventName: 'report_monthly_digest_sent',
        page: `/result/${report.id}`,
        meta: {
          reportId: report.id,
          cycleKey,
          trigger,
          qualityScore: report.analysis?.qualityAudit?.overallScore || 0,
          qualityGrade: report.analysis?.qualityAudit?.grade || 'C',
        },
      });

      trackServerEvent({
        userId: user.id,
        sessionId: user.id,
        eventName: 'email_delivery_succeeded',
        page: `/result/${report.id}`,
        meta: {
          channel: 'monthly_digest',
          reportId: report.id,
          cycleKey,
          emailDomain: email.split('@')[1] || '',
        },
      });

      sentCount += 1;
      details.push({ email, status: 'sent', reason: 'sent' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reportMonthlyDigestRunOperations.create({
        id: existingRun?.id || `monthly_digest_${generateId()}`,
        cycleKey,
        email,
        userId: user.id,
        reportId: report.id,
        status: 'error',
        reason: message,
        meta: { trigger },
      });
      trackServerEvent({
        userId: user.id,
        sessionId: user.id,
        eventName: 'email_delivery_failed',
        page: `/result/${report.id}`,
        meta: {
          channel: 'monthly_digest',
          reportId: report.id,
          cycleKey,
          emailDomain: email.split('@')[1] || '',
          reason: message,
        },
      });
      errorCount += 1;
      details.push({ email, status: 'error', reason: message });
    }
  }

  return {
    success: true,
    trigger,
    cycleKey,
    backfill,
    sentCount,
    skippedCount,
    errorCount,
    reason: sentCount > 0 ? 'sent' : 'no_deliveries',
    details,
  };
}

function buildDigestFromReport(report: FortuneRecord) {
  const calendarAnchor = getCurrentLocalMonthKey() || new Date();
  const scenarioViews = buildScenarioViews({
    basic: report.bazi,
    advice: report.advice,
    fiveElements: report.fiveElements,
    pattern: report.pattern,
    fortune: report.fortune,
    klineData: report.klineData || null,
    dayun: report.dayun,
    shenSha: report.shenSha,
  });
  const monthlyWindows = buildMonthlyWindows({
    basic: report.bazi,
    advice: report.advice,
    fiveElements: report.fiveElements,
    pattern: report.pattern,
    fortune: report.fortune,
    klineData: report.klineData || null,
    dayun: report.dayun,
    shenSha: report.shenSha,
  }, calendarAnchor);

  const stageFocus = scenarioViews[0]?.summary
    || report.analysis?.opening
    || report.pattern?.description
    || '当前更适合围绕已有结构判断节奏，不宜只看单点结论。';
  const summary = report.analysis?.explanation
    || report.analysis?.qualityAudit?.summary
    || `当前阶段以 ${report.pattern?.type || '命局结构'} 为核心，建议优先结合当前行运和人生K线去安排节奏。`;
  const monthlyHighlights = monthlyWindows.slice(0, 3).map((item) => ({
    label: item.label,
    theme: item.theme,
    status: item.status,
  }));

  return {
    stageFocus,
    summary,
    monthlyHighlights,
  };
}

function getCycleKey(date: Date) {
  const shifted = new Date(date.getTime() + DEFAULT_TIMEZONE_OFFSET_MINUTES * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getCycleLabel(date: Date) {
  const shifted = new Date(date.getTime() + DEFAULT_TIMEZONE_OFFSET_MINUTES * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  return `${year}年${month}月`;
}
