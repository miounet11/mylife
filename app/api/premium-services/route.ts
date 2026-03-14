import { NextRequest, NextResponse } from 'next/server';
import { trackServerEvent } from '@/lib/analytics';
import {
  deliverMailWithRetry,
  isEmailDeliveryConfigured,
  sendPremiumServiceAdminNotificationEmail,
  sendPremiumServiceRequestReceivedEmail,
} from '@/lib/email';
import { queueEmailDeliveryJob } from '@/lib/email-delivery-jobs';
import {
  emailSubscriptionOperations,
  fortuneOperations,
  premiumServiceRequestOperations,
  userOperations,
} from '@/lib/database';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { getPremiumServiceLabel } from '@/lib/report-premium-services';
import { normalizeChatIntent } from '@/lib/chat-intent';

function normalizeContactValue(value?: string | null) {
  return `${value || ''}`.trim();
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPremiumAdminEmails() {
  const raw = `${process.env.PREMIUM_SERVICE_ALERT_EMAILS || process.env.ADMIN_EMAILS || process.env.MAIL_FROM || ''}`;
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function trackEmailDelivery(params: {
  success: boolean;
  channel: string;
  page: string;
  email: string;
  serviceKey: string;
  message?: string;
}) {
  trackServerEvent({
    eventName: params.success ? 'email_delivery_succeeded' : 'email_delivery_failed',
    page: params.page,
    meta: {
      channel: params.channel,
      emailDomain: params.email.split('@')[1] || '',
      serviceKey: params.serviceKey,
      message: params.message || '',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const reportId = new URL(request.url).searchParams.get('reportId') || '';
    const requests = reportId
      ? premiumServiceRequestOperations.listByUserAndReport(userId, reportId, 10)
      : premiumServiceRequestOperations.listByUser(userId, 10);

    return NextResponse.json({
      success: true,
      data: requests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 获取专项服务请求失败:', error);
    return NextResponse.json(
      { success: false, error: '获取专项服务请求失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getOrCreateGuestUserId();
    const body = await request.json();
    const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
    const serviceKey = normalizeChatIntent(typeof body?.serviceKey === 'string' ? body.serviceKey : undefined);
    const question = `${body?.question || ''}`.trim();
    const contactName = `${body?.contactName || ''}`.trim();
    const contactValueInput = normalizeContactValue(typeof body?.contactValue === 'string' ? body.contactValue : undefined);
    const preferredContact = `${body?.preferredContact || ''}`.trim();

    if (!serviceKey) {
      return NextResponse.json({ success: false, error: '缺少专项服务类型' }, { status: 400 });
    }

    if (question.length < 8) {
      return NextResponse.json({ success: false, error: '请至少描述 8 个字，说明你想解决的具体事情' }, { status: 400 });
    }

    const currentUser = userOperations.getById(userId) as { email?: string | null } | null;
    const contactValue = contactValueInput || `${currentUser?.email || ''}`.trim().toLowerCase();
    if (!contactValue) {
      return NextResponse.json({ success: false, error: '请留下邮箱、微信或手机号，方便后续跟进' }, { status: 400 });
    }

    if (reportId) {
      const report = fortuneOperations.getById(reportId);
      if (!report) {
        return NextResponse.json({ success: false, error: '关联报告不存在' }, { status: 404 });
      }
      if (report.isPublic === false && report.userId !== userId) {
        return NextResponse.json({ success: false, error: '无权提交这份私密报告的专项请求' }, { status: 403 });
      }
    }

    const requestId = `psr_${generateId()}`;
    premiumServiceRequestOperations.create({
      id: requestId,
      userId,
      reportId: reportId || undefined,
      serviceKey,
      status: 'new',
      priority: 'normal',
      contactName: contactName || undefined,
      contactValue,
      intake: {
        question,
        preferredContact: preferredContact || undefined,
      },
      meta: {
        source: 'result_report',
      },
    });

    if (looksLikeEmail(contactValue)) {
      emailSubscriptionOperations.upsert(contactValue, 'premium_service_request', [
        'premium_service',
        serviceKey,
        'updates',
      ]);
    }

    trackServerEvent({
      userId,
      sessionId: userId,
      eventName: 'premium_service_requested',
      page: reportId ? `/result/${reportId}` : '/result',
      meta: {
        reportId: reportId || null,
        serviceKey,
        serviceLabel: getPremiumServiceLabel(serviceKey),
        hasEmailContact: looksLikeEmail(contactValue),
        preferredContact: preferredContact || null,
      },
    });

    const created = premiumServiceRequestOperations.getById(requestId);
    const emailConfigured = isEmailDeliveryConfigured();
    const serviceLabel = getPremiumServiceLabel(serviceKey);

    if (emailConfigured && created) {
      if (looksLikeEmail(contactValue)) {
        void deliverMailWithRetry(() => sendPremiumServiceRequestReceivedEmail({
          email: contactValue,
          name: contactName || '用户',
          requestId,
          reportId: reportId || undefined,
          serviceLabel,
          question,
        })).then((deliveryResult) => {
          trackEmailDelivery({
            success: !!deliveryResult?.success,
            channel: 'premium_service_request_receipt',
            page: reportId ? `/result/${reportId}` : '/result',
            email: contactValue,
            serviceKey,
            message: deliveryResult?.message || '',
          });
          if (!deliveryResult?.success) {
            queueEmailDeliveryJob({
              kind: 'premium_service_request_receipt',
              to: [contactValue],
              payload: {
                email: contactValue,
                name: contactName || '用户',
                requestId,
                reportId: reportId || undefined,
                serviceLabel,
                question,
              },
              meta: {
                source: 'premium_service_request',
                serviceKey,
              },
            });
          }
        }).catch((error) => {
          queueEmailDeliveryJob({
            kind: 'premium_service_request_receipt',
            to: [contactValue],
            payload: {
              email: contactValue,
              name: contactName || '用户',
              requestId,
              reportId: reportId || undefined,
              serviceLabel,
              question,
            },
            meta: {
              source: 'premium_service_request',
              serviceKey,
            },
          });
          trackEmailDelivery({
            success: false,
            channel: 'premium_service_request_receipt',
            page: reportId ? `/result/${reportId}` : '/result',
            email: contactValue,
            serviceKey,
            message: error instanceof Error ? error.message : 'unknown',
          });
        });
      }

      const adminEmails = getPremiumAdminEmails();
      if (adminEmails.length > 0) {
        void deliverMailWithRetry(() => sendPremiumServiceAdminNotificationEmail({
          emails: adminEmails,
          requestId,
          reportId: reportId || undefined,
          serviceLabel,
          question,
          contactName: contactName || undefined,
          contactValue,
          preferredContact: preferredContact || undefined,
        })).then((deliveryResult) => {
          trackEmailDelivery({
            success: !!deliveryResult?.success,
            channel: 'premium_service_admin_alert',
            page: '/admin/premium-services',
            email: adminEmails[0],
            serviceKey,
            message: deliveryResult?.message || '',
          });
          if (!deliveryResult?.success) {
            queueEmailDeliveryJob({
              kind: 'premium_service_admin_alert',
              to: adminEmails,
              payload: {
                requestId,
                reportId: reportId || undefined,
                serviceLabel,
                question,
                contactName: contactName || undefined,
                contactValue,
                preferredContact: preferredContact || undefined,
              },
              meta: {
                source: 'premium_service_request',
                serviceKey,
              },
            });
          }
        }).catch((error) => {
          queueEmailDeliveryJob({
            kind: 'premium_service_admin_alert',
            to: adminEmails,
            payload: {
              requestId,
              reportId: reportId || undefined,
              serviceLabel,
              question,
              contactName: contactName || undefined,
              contactValue,
              preferredContact: preferredContact || undefined,
            },
            meta: {
              source: 'premium_service_request',
              serviceKey,
            },
          });
          trackEmailDelivery({
            success: false,
            channel: 'premium_service_admin_alert',
            page: '/admin/premium-services',
            email: adminEmails[0],
            serviceKey,
            message: error instanceof Error ? error.message : 'unknown',
          });
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: created,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 创建专项服务请求失败:', error);
    return NextResponse.json(
      { success: false, error: '创建专项服务请求失败' },
      { status: 500 }
    );
  }
}
