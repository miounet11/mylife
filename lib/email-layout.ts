/**
 * Branded HTML email shell aligned with www.life-kline.com
 * (FB-blue chrome header + white card + light footer).
 */

import {
  type EmailLocale,
  getEmailChrome,
  htmlLang,
  localizeText,
} from '@/lib/email-locale';

export function escapeHtml(value: string) {
  return `${value || ''}`
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Site brand tokens (email-safe hex, matching app/globals.css). */
export const EMAIL_BRAND = {
  blue: '#3b5998',
  blueStrong: '#365899',
  blueDeep: '#29487d',
  blueButton: '#4267b2',
  ink1: '#1c1e21',
  ink2: '#444950',
  ink3: '#65676b',
  ink4: '#8a8d91',
  border: '#dddfe2',
  bg: '#f0f2f5',
  white: '#ffffff',
  softBlue: '#e7f0ff',
  gold: '#f7d3a1',
} as const;

export type EmailCta = { href: string; label: string };

export type RenderBrandedEmailInput = {
  locale: EmailLocale;
  appName: string;
  baseUrl: string;
  /** Hidden preheader for inbox previews */
  preheader?: string;
  /** Small uppercase eyebrow above title */
  eyebrow?: string;
  title: string;
  /** Main HTML body (paragraphs, lists, cards). Already escaped by caller. */
  bodyHtml: string;
  primaryCta?: EmailCta;
  secondaryCta?: EmailCta;
  /** Extra footer line (HTML allowed, keep simple). */
  footerExtra?: string;
  showUnsubscribe?: boolean;
  email?: string;
  /** Optional plain-text body; auto-built from title+strip if omitted. */
  textBody?: string;
};

function stripTags(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function renderPrimaryButton(href: string, label: string) {
  return `
    <a href="${escapeHtml(href)}"
       style="display:inline-block;padding:11px 18px;border-radius:4px;background:${EMAIL_BRAND.blueButton};color:${EMAIL_BRAND.white};text-decoration:none;font-weight:700;font-size:14px;line-height:1.2;border:1px solid ${EMAIL_BRAND.blueDeep}">
      ${escapeHtml(label)}
    </a>
  `;
}

export function renderSecondaryButton(href: string, label: string) {
  return `
    <a href="${escapeHtml(href)}"
       style="display:inline-block;padding:11px 18px;border-radius:4px;background:${EMAIL_BRAND.white};color:${EMAIL_BRAND.blue};text-decoration:none;font-weight:700;font-size:14px;line-height:1.2;border:1px solid ${EMAIL_BRAND.border}">
      ${escapeHtml(label)}
    </a>
  `;
}

/** Soft info card used for codes, tips, lists. */
export function renderInfoCard(opts: {
  title?: string;
  bodyHtml: string;
  tone?: 'neutral' | 'blue' | 'amber' | 'green' | 'rose';
}) {
  const tones = {
    neutral: { bg: '#f7f8fa', border: EMAIL_BRAND.border, title: EMAIL_BRAND.ink3 },
    blue: { bg: EMAIL_BRAND.softBlue, border: '#c5d8f5', title: EMAIL_BRAND.blue },
    amber: { bg: '#fdf8f0', border: '#e8d5b8', title: '#b56a1a' },
    green: { bg: '#f3faf6', border: '#d8efe3', title: '#2f9e6b' },
    rose: { bg: '#fef2f2', border: '#fecaca', title: '#b91c1c' },
  } as const;
  const t = tones[opts.tone || 'neutral'];
  return `
    <div style="background:${t.bg};border:1px solid ${t.border};border-radius:8px;padding:14px 16px;margin:0 0 16px">
      ${opts.title ? `<div style="font-size:12px;font-weight:700;color:${t.title};margin:0 0 8px;letter-spacing:0.04em">${escapeHtml(opts.title)}</div>` : ''}
      <div style="font-size:14px;color:${EMAIL_BRAND.ink1};line-height:1.7">${opts.bodyHtml}</div>
    </div>
  `;
}

/**
 * Full branded HTML document + plain-text fallback.
 */
export function renderBrandedEmail(input: RenderBrandedEmailInput): { html: string; text: string } {
  const locale = input.locale;
  const chrome = getEmailChrome(locale);
  const brand = localizeText(input.appName || chrome.brandMark, locale);
  const baseUrl = (input.baseUrl || 'https://www.life-kline.com').replace(/\/$/, '');
  const preheader = input.preheader
    ? localizeText(input.preheader, locale)
    : '';
  const title = localizeText(input.title, locale);
  const eyebrow = input.eyebrow ? localizeText(input.eyebrow, locale) : '';
  const bodyHtml = locale === 'zh-Hant' ? localizeText(input.bodyHtml, locale) : input.bodyHtml;
  const footerExtra = input.footerExtra
    ? (locale === 'zh-Hant' ? localizeText(input.footerExtra, locale) : input.footerExtra)
    : '';

  const primary = input.primaryCta
    ? renderPrimaryButton(input.primaryCta.href, localizeText(input.primaryCta.label, locale))
    : '';
  const secondary = input.secondaryCta
    ? renderSecondaryButton(input.secondaryCta.href, localizeText(input.secondaryCta.label, locale))
    : '';
  const ctaRow = primary || secondary
    ? `<div style="margin:22px 0 0">${primary}${secondary ? `<span style="display:inline-block;width:10px"></span>${secondary}` : ''}</div>`
    : '';

  const updatesUrl = `${baseUrl}/updates`;
  const unsubUrl = input.email
    ? `${baseUrl}/unsubscribe?email=${encodeURIComponent(input.email)}`
    : `${baseUrl}/updates`;

  const html = `<!DOCTYPE html>
<html lang="${htmlLang(locale)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_BRAND.bg};-webkit-text-size-adjust:100%;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${EMAIL_BRAND.bg};padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:8px;overflow:hidden">
          <!-- Brand chrome (matches site header) -->
          <tr>
            <td style="background:${EMAIL_BRAND.blue};padding:14px 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle">
                    <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:4px;background:rgba(255,255,255,0.14);color:#fff;font-weight:900;font-size:15px;font-family:Georgia,'Times New Roman',serif">K</span>
                    <span style="display:inline-block;vertical-align:middle;margin-left:10px">
                      <span style="display:block;color:#fff;font-size:15px;font-weight:800;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','PingFang TC','Microsoft YaHei',sans-serif">${escapeHtml(brand)}</span>
                      <span style="display:block;color:rgba(255,255,255,0.78);font-size:10px;font-weight:700;letter-spacing:0.16em;margin-top:2px">${escapeHtml(chrome.brandSub)}</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 24px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','PingFang TC','Microsoft YaHei',sans-serif;color:${EMAIL_BRAND.ink1};line-height:1.75">
              ${eyebrow ? `<div style="margin:0 0 8px;color:${EMAIL_BRAND.blue};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">${escapeHtml(eyebrow)}</div>` : ''}
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;font-weight:800;color:${EMAIL_BRAND.ink1}">${escapeHtml(title)}</h1>
              <div style="font-size:14.5px;color:${EMAIL_BRAND.ink2}">
                ${bodyHtml}
              </div>
              ${ctaRow}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f6f7f9;border-top:1px solid ${EMAIL_BRAND.border};padding:16px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','PingFang TC','Microsoft YaHei',sans-serif">
              ${footerExtra ? `<div style="margin:0 0 10px;font-size:12px;color:${EMAIL_BRAND.ink3};line-height:1.6">${footerExtra}</div>` : ''}
              <div style="font-size:12px;color:${EMAIL_BRAND.ink3};line-height:1.6">
                <a href="${escapeHtml(updatesUrl)}" style="color:${EMAIL_BRAND.blue};text-decoration:none;font-weight:600">${escapeHtml(chrome.manageSubscription)}</a>
                ${input.showUnsubscribe !== false && input.email
                  ? ` &nbsp;·&nbsp; <a href="${escapeHtml(unsubUrl)}" style="color:${EMAIL_BRAND.ink4};text-decoration:none">${escapeHtml(chrome.unsubscribe)}</a>`
                  : ''}
                &nbsp;·&nbsp;
                <a href="${escapeHtml(baseUrl)}" style="color:${EMAIL_BRAND.ink4};text-decoration:none">${escapeHtml(chrome.openSite)}</a>
              </div>
              <div style="margin-top:10px;font-size:11px;color:${EMAIL_BRAND.ink4};line-height:1.55">
                ${escapeHtml(chrome.autoNotice)}<br/>
                ${escapeHtml(chrome.legal)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    title,
    '',
    input.textBody || stripTags(bodyHtml),
    '',
    input.primaryCta ? `${localizeText(input.primaryCta.label, locale)}: ${input.primaryCta.href}` : '',
    input.secondaryCta ? `${localizeText(input.secondaryCta.label, locale)}: ${input.secondaryCta.href}` : '',
    '',
    `${chrome.manageSubscription}: ${updatesUrl}`,
    input.email && input.showUnsubscribe !== false ? `${chrome.unsubscribe}: ${unsubUrl}` : '',
  ].filter(Boolean);

  return { html, text: textParts.join('\n') };
}
