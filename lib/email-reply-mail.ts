import { sendMailV2 } from '@/mail';
import { getAppBaseUrl, getMailAppName } from '@/lib/env';
import {
  type EmailLocale,
  getEmailChrome,
  localizeText,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import { escapeHtml, renderBrandedEmail, renderInfoCard } from '@/lib/email-layout';

export async function sendEmailReplyAnswerMail(params: {
  email: string;
  subject: string;
  originalPreview: string;
  userQuestion: string;
  answer: string;
  messageId: string;
  reportId?: string | null;
  locale?: string | null;
  language?: string | null;
  acceptLanguage?: string | null;
}) {
  const appName = getMailAppName();
  const baseUrl = getAppBaseUrl();
  const locale: EmailLocale = resolveEmailLocale({
    email: params.email,
    locale: params.locale,
    language: params.language,
    acceptLanguage: params.acceptLanguage,
  });
  const chrome = getEmailChrome(locale);
  const threadUrl = `${baseUrl}/updates/messages?email=${encodeURIComponent(params.email)}&message=${encodeURIComponent(params.messageId)}`;

  const title = pickLocaleString(locale, {
    'zh-CN': '针对你的追问，我们的专业解读',
    'zh-Hant': '針對你的追問，我們的專業解讀',
    en: 'Our take on your follow-up',
  });

  const bodyHtml = `
    ${renderInfoCard({
      tone: 'blue',
      title: pickLocaleString(locale, {
        'zh-CN': '你的问题',
        'zh-Hant': '你的問題',
        en: 'Your question',
      }),
      bodyHtml: escapeHtml(params.userQuestion),
    })}
    <div style="font-size:15px;color:#1c1e21;white-space:pre-wrap;line-height:1.75">${escapeHtml(localizeText(params.answer, locale))}</div>
    <div style="margin:18px 0 0;padding-top:14px;border-top:1px solid #dddfe2;font-size:12px;color:#65676b">
      ${pickLocaleString(locale, {
        'zh-CN': '原邮件摘要',
        'zh-Hant': '原郵件摘要',
        en: 'Original preview',
      })}：${escapeHtml(localizeText(params.originalPreview, locale))}
    </div>
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: title,
    eyebrow: pickLocaleString(locale, {
      'zh-CN': `${appName} · 专业回复`,
      'zh-Hant': `${appName} · 專業回覆`,
      en: `${appName} · Expert reply`,
    }),
    title,
    bodyHtml,
    primaryCta: {
      href: threadUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '在站内查看完整邮件往来',
        'zh-Hant': '在站內查看完整郵件往來',
        en: 'View full thread on site',
      }),
    },
    footerExtra: pickLocaleString(locale, {
      'zh-CN': '你也可以继续回复此邮件，或在站内追问。我们会基于你的报告上下文持续提供专业建议。',
      'zh-Hant': '你也可以繼續回覆此郵件，或在站內追問。我們會基於你的報告上下文持續提供專業建議。',
      en: 'Reply to this email or continue on site. We answer from your report context.',
    }),
    showUnsubscribe: false,
    textBody: [
      pickLocaleString(locale, {
        'zh-CN': `你追问：${params.userQuestion}`,
        'zh-Hant': `你追問：${params.userQuestion}`,
        en: `You asked: ${params.userQuestion}`,
      }),
      '',
      params.answer,
      '',
      `${chrome.viewOnSite}: ${threadUrl}`,
    ].join('\n'),
  });

  return sendMailV2({
    to: params.email,
    subject: `Re: ${localizeText(params.subject, locale)}`,
    subtype: 'html',
    text,
    content: html,
  });
}
