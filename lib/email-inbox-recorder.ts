import { emailInboxStore } from '@/lib/email-inbox-store';

export function recordTimingEmailToInbox(input: {
  email: string;
  reportId?: string | null;
  sourceLogId?: string | null;
  category: string;
  campaign?: string | null;
  subject: string;
  preview: string;
  bodyText?: string;
  bodyHtml?: string;
  focusItems?: Array<{ label: string; value: string }>;
}) {
  try {
    return emailInboxStore.recordOutboundMessage({
      email: input.email,
      reportId: input.reportId || null,
      sourceLogId: input.sourceLogId || null,
      category: input.category,
      campaign: input.campaign || null,
      subject: input.subject,
      preview: input.preview,
      bodyText: input.bodyText || input.preview,
      bodyHtml: input.bodyHtml || null,
      meta: {
        focusItems: input.focusItems || [],
        preview: input.preview,
      },
    });
  } catch (error) {
    console.error('[EmailInbox] record timing email failed:', error);
    return null;
  }
}