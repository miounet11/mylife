/**
 * Notify ops of new anonymous feedback.
 * Destination email is server-only — never returned to clients.
 */

import { sendMailV2 } from '@/mail';
import { isEmailDeliveryConfigured } from '@/lib/email';
import {
  getFeedbackCategoryLabel,
  type SiteFeedbackRecord,
} from '@/lib/user-feedback-types';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Ops inbox — not exposed to end users. Override with FEEDBACK_NOTIFY_EMAIL. */
export function getFeedbackNotifyEmail() {
  // Prefer explicit feedback inbox, then first admin email from env, then legacy default.
  const fromList = (process.env.ADMIN_EMAILS || '')
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)[0];
  return (
    process.env.FEEDBACK_NOTIFY_EMAIL?.trim() ||
    process.env.ADMIN_FEEDBACK_EMAIL?.trim() ||
    fromList ||
    '9248293@gmail.com'
  );
}

export async function notifyFeedbackReceived(record: SiteFeedbackRecord) {
  const to = getFeedbackNotifyEmail();
  if (!to) {
    return { sent: false, reason: 'no_notify_email' as const };
  }

  if (!isEmailDeliveryConfigured()) {
    console.info('[feedback] mail not configured; stored only', {
      id: record.id,
      category: record.category,
      pageUrl: record.pageUrl,
    });
    return { sent: false, reason: 'mail_not_configured' as const };
  }

  const categoryLabel = getFeedbackCategoryLabel(record.category);
  const subject = `[人生K线反馈] ${categoryLabel} · ${record.id}`;
  const text = [
    `分类：${categoryLabel}`,
    `页面：${record.pageUrl || '（未提供）'}`,
    `时间：${record.createdAt}`,
    `IP：${record.clientIp || '—'}`,
    `用户：${record.userId || '匿名'}`,
    '',
    record.message,
    '',
    `后台：https://www.life-kline.com/admin/feedback`,
  ].join('\n');

  const content = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.7;max-width:640px">
      <h2 style="margin:0 0 12px;font-size:18px;color:#111827">新的匿名反馈</h2>
      <p style="margin:0 0 8px"><strong>分类：</strong>${escapeHtml(categoryLabel)}</p>
      <p style="margin:0 0 8px"><strong>页面：</strong>${escapeHtml(record.pageUrl || '（未提供）')}</p>
      <p style="margin:0 0 8px"><strong>时间：</strong>${escapeHtml(record.createdAt)}</p>
      <p style="margin:0 0 8px"><strong>IP：</strong>${escapeHtml(record.clientIp || '—')}</p>
      <p style="margin:0 0 8px"><strong>用户：</strong>${escapeHtml(record.userId || '匿名')}</p>
      <div style="margin:16px 0;padding:12px 14px;border-radius:8px;background:#f3f4f6;white-space:pre-wrap">${escapeHtml(record.message)}</div>
      <p style="margin:0">
        <a href="https://www.life-kline.com/admin/feedback" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          打开反馈后台
        </a>
      </p>
      <p style="margin:12px 0 0;font-size:12px;color:#6b7280">ID: ${escapeHtml(record.id)}</p>
    </div>
  `;

  try {
    await sendMailV2({
      to,
      subject,
      subtype: 'html',
      text,
      content,
    });
    return { sent: true as const };
  } catch (error) {
    console.error('[feedback] notify failed', error);
    return {
      sent: false as const,
      reason: 'send_failed' as const,
      error: error instanceof Error ? error.message : 'unknown',
    };
  }
}
