import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { trackServerEvent } from '@/lib/analytics';
import { premiumServiceRequestOperations } from '@/lib/database';
import {
  deliverMailWithRetry,
  isEmailDeliveryConfigured,
  sendPremiumServiceStatusUpdateEmail,
} from '@/lib/email';
import { queueEmailDeliveryJob } from '@/lib/email-delivery-jobs';
import { getPremiumServiceLabel } from '@/lib/report-premium-services';
import type { PremiumServiceRequestRecord } from '@/lib/user-types';

function looksLikeEmail(value?: string | null) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${value || ''}`.trim());
}

function isValidStatus(value: string): value is PremiumServiceRequestRecord['status'] {
  return ['new', 'contacted', 'in_progress', 'delivered', 'closed', 'cancelled'].includes(value);
}

function isValidPriority(value: string): value is NonNullable<PremiumServiceRequestRecord['priority']> {
  return ['normal', 'high', 'urgent'].includes(value);
}

function isValidServiceKey(value: string): value is PremiumServiceRequestRecord['serviceKey'] {
  return ['event-simulation', 'event-verdict', 'event-review', 'meihua-enhancement'].includes(value);
}

function mapStatusLabel(status: PremiumServiceRequestRecord['status']) {
  switch (status) {
    case 'contacted':
      return '已跟进';
    case 'in_progress':
      return '处理中';
    case 'delivered':
      return '已交付';
    case 'closed':
      return '已结束';
    case 'cancelled':
      return '已取消';
    default:
      return '新提交';
  }
}

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

export async function GET(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const statusParam = `${searchParams.get('status') || 'all'}`;
  const serviceKeyParam = `${searchParams.get('serviceKey') || 'all'}`;
  const limitParam = Number(searchParams.get('limit') || 50);
  const status = statusParam === 'all' || isValidStatus(statusParam) ? statusParam : 'all';
  const serviceKey = serviceKeyParam === 'all' || isValidServiceKey(serviceKeyParam) ? serviceKeyParam : 'all';
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;
  const requests = premiumServiceRequestOperations.listRecent({
    limit,
    status: status as PremiumServiceRequestRecord['status'] | 'all',
    serviceKey: serviceKey as PremiumServiceRequestRecord['serviceKey'] | 'all',
  });
  const countsByStatus = premiumServiceRequestOperations.countByStatus();

  return NextResponse.json({
    success: true,
    data: requests,
    summary: {
      countsByStatus,
      totalOpen: countsByStatus.new + countsByStatus.contacted + countsByStatus.in_progress,
      totalHandled: countsByStatus.delivered + countsByStatus.closed,
    },
    filters: {
      status,
      serviceKey,
      limit,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = `${body?.id || ''}`.trim();
    const status = `${body?.status || ''}`.trim();
    const priority = `${body?.priority || ''}`.trim();
    const adminNote = `${body?.adminNote || ''}`.trim();
    const notifyUser = Boolean(body?.notifyUser);

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少需求单 ID' }, { status: 400 });
    }

    if (!isValidStatus(status)) {
      return NextResponse.json({ success: false, error: '状态非法' }, { status: 400 });
    }

    if (priority && !isValidPriority(priority)) {
      return NextResponse.json({ success: false, error: '优先级非法' }, { status: 400 });
    }

    const existing = premiumServiceRequestOperations.getById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: '需求单不存在' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const existingMeta = (existing.meta || {}) as Record<string, unknown>;
    const timeline = Array.isArray(existingMeta.statusTimeline)
      ? existingMeta.statusTimeline.filter((item) => item && typeof item === 'object')
      : [];
    const nextMeta = {
      ...existingMeta,
      adminNote: adminNote || existingMeta.adminNote || '',
      lastStatusChangedAt: now,
      lastStatusChangedBy: user.email || user.id,
      statusTimeline: [
        ...timeline,
        {
          status,
          priority: priority || existing.priority || 'normal',
          note: adminNote || '',
          updatedAt: now,
          updatedBy: user.email || user.id,
        },
      ],
    };

    premiumServiceRequestOperations.updateStatus(id, {
      status,
      priority: (priority || existing.priority || 'normal') as NonNullable<PremiumServiceRequestRecord['priority']>,
      meta: nextMeta,
    });

    const updated = premiumServiceRequestOperations.getById(id);
    trackServerEvent({
      userId: user.id,
      sessionId: user.id,
      eventName: 'premium_service_status_updated',
      page: '/admin/premium-services',
      meta: {
        requestId: id,
        serviceKey: existing.serviceKey,
        status,
        priority: priority || existing.priority || 'normal',
        notifyUser,
      },
    });

    if (
      notifyUser &&
      updated &&
      looksLikeEmail(updated.contactValue) &&
      isEmailDeliveryConfigured()
    ) {
      void deliverMailWithRetry(() => sendPremiumServiceStatusUpdateEmail({
        email: `${updated.contactValue}`,
        name: updated.contactName || '用户',
        serviceLabel: getPremiumServiceLabel(updated.serviceKey),
        statusLabel: mapStatusLabel(updated.status),
        reportId: updated.reportId,
        note: adminNote || undefined,
      })).then((deliveryResult) => {
        trackServerEvent({
          eventName: deliveryResult?.success ? 'email_delivery_succeeded' : 'email_delivery_failed',
          page: '/admin/premium-services',
          meta: {
            channel: 'premium_service_status_update',
            requestId: id,
            serviceKey: existing.serviceKey,
            emailDomain: `${updated.contactValue}`.split('@')[1] || '',
            message: deliveryResult?.message || '',
          },
        });
        if (!deliveryResult?.success) {
          queueEmailDeliveryJob({
            kind: 'premium_service_status_update',
            to: [`${updated.contactValue}`],
            payload: {
              email: `${updated.contactValue}`,
              name: updated.contactName || '用户',
              serviceLabel: getPremiumServiceLabel(updated.serviceKey),
              statusLabel: mapStatusLabel(updated.status),
              reportId: updated.reportId,
              note: adminNote || undefined,
            },
            meta: {
              requestId: id,
              serviceKey: existing.serviceKey,
            },
          });
        }
      }).catch((error) => {
        queueEmailDeliveryJob({
          kind: 'premium_service_status_update',
          to: [`${updated.contactValue}`],
          payload: {
            email: `${updated.contactValue}`,
            name: updated.contactName || '用户',
            serviceLabel: getPremiumServiceLabel(updated.serviceKey),
            statusLabel: mapStatusLabel(updated.status),
            reportId: updated.reportId,
            note: adminNote || undefined,
          },
          meta: {
            requestId: id,
            serviceKey: existing.serviceKey,
          },
        });
        trackServerEvent({
          eventName: 'email_delivery_failed',
          page: '/admin/premium-services',
          meta: {
            channel: 'premium_service_status_update',
            requestId: id,
            serviceKey: existing.serviceKey,
            emailDomain: `${updated.contactValue}`.split('@')[1] || '',
            message: error instanceof Error ? error.message : 'unknown',
          },
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[API] 更新专项服务请求失败:', error);
    return NextResponse.json({ success: false, error: '更新失败' }, { status: 500 });
  }
}
