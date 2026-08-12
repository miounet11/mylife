/**
 * Branded HTML email shell — Life K-Line teal brand (matches www.life-kline.com).
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

/**
 * Site brand tokens for email (hex only — CSS vars unreliable in clients).
 * Aligned with logo plate #0b5f55 + signal gold + paper.
 */
export const EMAIL_BRAND = {
  /** Brand strong (header plate / primary) */
  teal: '#0b5f55',
  tealStrong: '#0b5f55',
  tealDeep: '#074840',
  tealButton: '#127d6f',
  /** Legacy aliases so older callers using .blue still compile */
  blue: '#0b5f55',
  blueStrong: '#0b5f55',
  blueDeep: '#074840',
  blueButton: '#127d6f',
  ink1: '#0a120e',
  ink2: '#3a4a44',
  ink3: '#5c6b64',
  ink4: '#8a9690',
  border: '#d8e0dc',
  bg: '#f0f3f1',
  white: '#ffffff',
  softBlue: '#e8f5f2',
  softTeal: '#e8f5f2',
  gold: '#c9a14a',
  paper: '#f5f7f2',
} as const;

/** Absolute logo for email clients (must be public HTTPS). */
export const EMAIL_LOGO_URL =
  'https://www.life-kline.com/images/brand-immersion/email-logo.png';

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
       style="display:inline-block;padding:11px 18px;border-radius:6px;background:${EMAIL_BRAND.tealButton};color:${EMAIL_BRAND.white};text-decoration:none;font-weight:700;font-size:14px;line-height:1.2;border:1px solid ${EMAIL_BRAND.tealDeep}">
      ${escapeHtml(label)}
    </a>
  `;
}

export function renderSecondaryButton(href: string, label: string) {
  return `
    <a href="${escapeHtml(href)}"
       style="display:inline-block;padding:11px 18px;border-radius:6px;background:${EMAIL_BRAND.white};color:${EMAIL_BRAND.teal};text-decoration:none;font-weight:700;font-size:14px;line-height:1.2;border:1px solid ${EMAIL_BRAND.border}">
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
    blue: { bg: EMAIL_BRAND.softTeal, border: '#b8d9d1', title: EMAIL_BRAND.teal },
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
  const logoUrl = EMAIL_LOGO_URL;

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
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${EMAIL_BRAND.white};border:1px solid ${EMAIL_BRAND.border};border-radius:10px;overflow:hidden">
          <!-- Brand chrome — teal plate + logo + wordmark (matches site BrandLockup) -->
          <tr>
            <td style="background:${EMAIL_BRAND.teal};padding:14px 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;width:40px">
                    <a href="${escapeHtml(baseUrl)}" style="text-decoration:none">
                      <img src="${escapeHtml(logoUrl)}" width="32" height="32" alt="" style="display:block;width:32px;height:32px;border-radius:8px;border:0" />
                    </a>
                  </td>
                  <td style="vertical-align:middle;padding-left:10px">
                    <a href="${escapeHtml(baseUrl)}" style="text-decoration:none">
                      <span style="display:block;color:#fff;font-size:15px;font-weight:800;letter-spacing:0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','PingFang TC','Microsoft YaHei',sans-serif">${escapeHtml(brand)}</span>
                      <span style="display:block;color:rgba(245,247,242,0.82);font-size:10px;font-weight:700;letter-spacing:0.16em;margin-top:2px">LIFE KLINE</span>
                    </a>
                  </td>
                  <td style="vertical-align:middle;text-align:right">
                    <span style="display:inline-block;width:8px;height:8px;background:${EMAIL_BRAND.gold};transform:rotate(45deg)"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 24px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','PingFang TC','Microsoft YaHei',sans-serif;color:${EMAIL_BRAND.ink1};line-height:1.75">
              ${eyebrow ? `<div style="margin:0 0 8px;color:${EMAIL_BRAND.teal};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">${escapeHtml(eyebrow)}</div>` : ''}
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.35;font-weight:800;color:${EMAIL_BRAND.ink1}">${escapeHtml(title)}</h1>
              <div style="font-size:14.5px;color:${EMAIL_BRAND.ink2}">
                ${bodyHtml}
              </div>
              ${ctaRow}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:${EMAIL_BRAND.paper};border-top:1px solid ${EMAIL_BRAND.border};padding:16px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','PingFang TC','Microsoft YaHei',sans-serif">
              ${footerExtra ? `<div style="margin:0 0 10px;font-size:12px;color:${EMAIL_BRAND.ink3};line-height:1.6">${footerExtra}</div>` : ''}
              <div style="font-size:12px;color:${EMAIL_BRAND.ink3};line-height:1.6">
                <a href="${escapeHtml(updatesUrl)}" style="color:${EMAIL_BRAND.teal};text-decoration:none;font-weight:600">${escapeHtml(chrome.manageSubscription)}</a>
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
