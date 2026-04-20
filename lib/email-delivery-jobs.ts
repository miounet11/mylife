import { trackServerEvent } from '@/lib/analytics';
import { emailDeliveryJobOperations } from '@/lib/database';
import {
  getEmailRetryBaseDelayMs,
  getEmailRetryBatchSize,
  getEmailRetryMaxAttempts,
} from '@/lib/env';
import { deliverMailWithRetry } from '@/lib/email';
import {
  sendReportReadyEmail,
  sendPremiumServiceAdminNotificationEmail,
  sendPremiumServiceRequestReceivedEmail,
  sendPremiumServiceStatusUpdateEmail,
  sendUserLifecycleEmail,
} from '@/lib/email';
import type { EmailDeliveryJobRecord } from '@/lib/user-types';
import { generateId } from '@/lib/utils';

const DEFAULT_MAX_ATTEMPTS = getEmailRetryMaxAttempts();
const DEFAULT_BASE_DELAY_MS = getEmailRetryBaseDelayMs();
const DEFAULT_BATCH_SIZE = getEmailRetryBatchSize();

type JobKind = EmailDeliveryJobRecord['kind'];

interface QueueEmailJobInput {
  kind: JobKind;
  to: string[];
  payload: Record<string, unknown>;
  meta?: Record<string, unknown>;
  maxAttempts?: number;
}

export function queueEmailDeliveryJob(input: QueueEmailJobInput) {
  const id = `emj_${generateId()}`;
  const now = new Date().toISOString();
  emailDeliveryJobOperations.create({
    id,
    kind: input.kind,
    status: 'pending',
    to: input.to,
    payload: input.payload,
    attempts: 0,
    maxAttempts: input.maxAttempts || DEFAULT_MAX_ATTEMPTS,
    nextRunAt: now,
    meta: input.meta || {},
  });

  trackServerEvent({
    eventName: 'email_retry_enqueued',
    page: '/admin/email/retry',
    meta: {
      jobId: id,
      kind: input.kind,
      recipients: input.to.length,
    },
  });

  return id;
}

function computeNextRunAt(attempts: number) {
  const multiplier = Math.max(1, attempts);
  return new Date(Date.now() + DEFAULT_BASE_DELAY_MS * multiplier).toISOString();
}

function getJobPage(kind: JobKind, payload: Record<string, unknown>) {
  if (kind === 'premium_service_request_receipt') {
    const reportId = typeof payload.reportId === 'string' ? payload.reportId : '';
    return reportId ? `/result/${reportId}` : '/result';
  }
  if (kind === 'report_ready') {
    const reportId = typeof payload.reportId === 'string' ? payload.reportId : '';
    return reportId ? `/result/${reportId}` : '/result';
  }
  if (kind === 'user_lifecycle') {
    const ctaHref = typeof payload.primaryCtaHref === 'string' ? payload.primaryCtaHref : '';
    if (ctaHref.startsWith('http')) {
      return '/updates';
    }
    return ctaHref || '/updates';
  }
  if (kind === 'premium_service_status_update' || kind === 'premium_service_admin_alert') {
    return '/admin/premium-services';
  }
  return '/admin/email/retry';
}

async function executeJob(job: EmailDeliveryJobRecord) {
  const payload = (job.payload || {}) as Record<string, unknown>;
  switch (job.kind) {
    case 'premium_service_request_receipt':
      return deliverMailWithRetry(() => sendPremiumServiceRequestReceivedEmail({
        email: `${payload.email || job.to[0] || ''}`,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        requestId: `${payload.requestId || ''}`,
        reportId: typeof payload.reportId === 'string' ? payload.reportId : undefined,
        serviceLabel: `${payload.serviceLabel || '专项服务'}`,
        question: `${payload.question || ''}`,
      }));
    case 'premium_service_admin_alert':
      return deliverMailWithRetry(() => sendPremiumServiceAdminNotificationEmail({
        emails: job.to,
        requestId: `${payload.requestId || ''}`,
        reportId: typeof payload.reportId === 'string' ? payload.reportId : undefined,
        serviceLabel: `${payload.serviceLabel || '专项服务'}`,
        question: `${payload.question || ''}`,
        contactName: typeof payload.contactName === 'string' ? payload.contactName : undefined,
        contactValue: `${payload.contactValue || ''}`,
        preferredContact: typeof payload.preferredContact === 'string' ? payload.preferredContact : undefined,
      }));
    case 'premium_service_status_update':
      return deliverMailWithRetry(() => sendPremiumServiceStatusUpdateEmail({
        email: `${payload.email || job.to[0] || ''}`,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        serviceLabel: `${payload.serviceLabel || '专项服务'}`,
        statusLabel: `${payload.statusLabel || '处理中'}`,
        reportId: typeof payload.reportId === 'string' ? payload.reportId : undefined,
        note: typeof payload.note === 'string' ? payload.note : undefined,
      }));
    case 'report_ready':
      return deliverMailWithRetry(() => sendReportReadyEmail({
        email: `${payload.email || job.to[0] || ''}`,
        name: `${payload.name || '用户'}`,
        reportId: `${payload.reportId || ''}`,
        score: typeof payload.score === 'number' ? payload.score : undefined,
        grade: ['S', 'A', 'B', 'C'].includes(`${payload.grade || ''}`)
          ? `${payload.grade}` as 'S' | 'A' | 'B' | 'C'
          : undefined,
        deliveryTier: ['basic', 'enhanced', 'expert'].includes(`${payload.deliveryTier || ''}`)
          ? `${payload.deliveryTier}` as 'basic' | 'enhanced' | 'expert'
          : undefined,
        queuedUpgrade: payload.queuedUpgrade === true,
      }));
    case 'user_lifecycle':
      return deliverMailWithRetry(() => sendUserLifecycleEmail({
        email: `${payload.email || job.to[0] || ''}`,
        name: `${payload.name || '用户'}`,
        stageKey: `${payload.stageKey || 'lifecycle'}`,
        stageLabel: `${payload.stageLabel || '后续提醒'}`,
        subject: `${payload.subject || '人生K线提醒'}`,
        previewText: `${payload.previewText || ''}`,
        intro: `${payload.intro || '有一个后续动作值得继续完成'}`,
        detail: `${payload.detail || ''}`,
        primaryCtaLabel: `${payload.primaryCtaLabel || '继续查看'}`,
        primaryCtaHref: `${payload.primaryCtaHref || '/updates'}`,
        secondaryCtaLabel: typeof payload.secondaryCtaLabel === 'string' ? payload.secondaryCtaLabel : undefined,
        secondaryCtaHref: typeof payload.secondaryCtaHref === 'string' ? payload.secondaryCtaHref : undefined,
        bullets: Array.isArray(payload.bullets)
          ? payload.bullets.filter((item): item is string => typeof item === 'string')
          : [],
        reportId: typeof payload.reportId === 'string' ? payload.reportId : undefined,
      }));
    default:
      return {
        success: false,
        message: `unsupported job kind: ${job.kind}`,
      };
  }
}

export async function runEmailDeliveryRetryCycle(params?: {
  batchSize?: number;
}) {
  const batchSize = params?.batchSize || DEFAULT_BATCH_SIZE;
  const jobs = emailDeliveryJobOperations.acquireDueBatch(batchSize);
  const results: Array<{ id: string; kind: string; status: string; message?: string }> = [];

  for (const job of jobs) {
    const payload = (job.payload || {}) as Record<string, unknown>;
    const page = getJobPage(job.kind, payload);

    try {
      const deliveryResult = await executeJob(job);
      if (deliveryResult?.success) {
        emailDeliveryJobOperations.markSent(job.id, {
          deliveredAt: new Date().toISOString(),
          lastResultMessage: deliveryResult.message || '',
        });
        trackServerEvent({
          eventName: 'email_delivery_succeeded',
          page,
          meta: {
            channel: job.kind,
            retryJobId: job.id,
            emailDomain: (job.to[0] || '').split('@')[1] || '',
          },
        });
        trackServerEvent({
          eventName: 'email_retry_processed',
          page: '/admin/email/retry',
          meta: {
            jobId: job.id,
            kind: job.kind,
            status: 'sent',
          },
        });
        results.push({ id: job.id, kind: job.kind, status: 'sent' });
        continue;
      }

      const errorMessage = `${deliveryResult?.message || 'delivery_failed'}`;
      emailDeliveryJobOperations.markRetryableFailure(job.id, {
        lastError: errorMessage,
        nextRunAt: computeNextRunAt(job.attempts || 1),
      });
      trackServerEvent({
        eventName: 'email_delivery_failed',
        page,
        meta: {
          channel: job.kind,
          retryJobId: job.id,
          emailDomain: (job.to[0] || '').split('@')[1] || '',
          message: errorMessage,
        },
      });
      trackServerEvent({
        eventName: 'email_retry_processed',
        page: '/admin/email/retry',
        meta: {
          jobId: job.id,
          kind: job.kind,
          status: 'retry_scheduled',
          message: errorMessage,
        },
      });
      results.push({ id: job.id, kind: job.kind, status: 'retry_scheduled', message: errorMessage });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      emailDeliveryJobOperations.markRetryableFailure(job.id, {
        lastError: message,
        nextRunAt: computeNextRunAt(job.attempts || 1),
      });
      trackServerEvent({
        eventName: 'email_delivery_failed',
        page,
        meta: {
          channel: job.kind,
          retryJobId: job.id,
          emailDomain: (job.to[0] || '').split('@')[1] || '',
          message,
        },
      });
      trackServerEvent({
        eventName: 'email_retry_processed',
        page: '/admin/email/retry',
        meta: {
          jobId: job.id,
          kind: job.kind,
          status: 'retry_scheduled',
          message,
        },
      });
      results.push({ id: job.id, kind: job.kind, status: 'retry_scheduled', message });
    }
  }

  return {
    success: true,
    processedCount: jobs.length,
    results,
  };
}
