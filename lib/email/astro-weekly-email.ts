/**
 * Public 星座周运简报 — week compare ranking + element cohort.
 * Opt-in tag: `astro:weekly`
 * Personal birth weeks stay page-only (no bulk email by birth date).
 */

import { ELEMENT_CATALOG } from '@/lib/astro/elements-catalog';
import { buildWeekComparePack } from '@/lib/astro/week-compare-engine';
import {
  buildAstroWeekPack,
  currentIsoWeekId,
  datesInIsoWeek,
} from '@/lib/astro/week-engine';
import {
  type EmailLocale,
  getEmailChrome,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import { escapeHtml, renderBrandedEmail } from '@/lib/email-layout';
import { getAppBaseUrl, getMailAppName } from '@/lib/env';

export type BuildAstroWeeklyEmailResult = {
  subject: string;
  html: string;
  text: string;
  locale: EmailLocale;
  weekId: string;
  ok: boolean;
  reason?: string;
};

function stanceZh(s: string) {
  if (s === 'push') return '偏推进';
  if (s === 'conserve') return '偏守成';
  return '偏稳健';
}

export function buildAstroWeeklyEmail(input: {
  weekId?: string | null;
  locale?: string | null;
  email?: string | null;
} = {}): BuildAstroWeeklyEmailResult {
  const weekId = (input.weekId || currentIsoWeekId()).trim();
  const locale = resolveEmailLocale({ locale: input.locale, email: input.email });
  const pack = buildWeekComparePack(weekId);
  const appName = getMailAppName();
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const chrome = getEmailChrome(locale);

  if (!pack) {
    return {
      subject: '星座周运',
      html: '',
      text: '',
      locale,
      weekId,
      ok: false,
      reason: 'pack_unavailable',
    };
  }

  const utm = new URLSearchParams({
    utm_source: 'email',
    utm_medium: 'astro_weekly',
    utm_campaign: weekId,
  });
  const weekUrl = `${baseUrl}/astro/week/${weekId}?${utm}`;
  const hubUrl = `${baseUrl}/astro?${utm}`;
  const dates = datesInIsoWeek(weekId);
  const range = dates.length ? `${dates[0]} ~ ${dates[6]}` : weekId;

  const top = pack.top.map((r) => `${r.title} 周均${r.avg}`).join(' · ');
  const low = pack.low.map((r) => `${r.title} 周均${r.avg}`).join(' · ');

  const elementRows = ELEMENT_CATALOG.map((e) => {
    const ep = buildAstroWeekPack(
      weekId,
      { kind: 'element', slug: e.slug },
      `${e.zh}象`,
      (date) => `/astro/elements/${e.slug}/day/${date}`,
    );
    return ep ? { slug: e.slug, zh: e.zh, avg: ep.avg } : null;
  })
    .filter((x): x is { slug: string; zh: string; avg: number } => Boolean(x))
    .sort((a, b) => b.avg - a.avg);
  const elementLine = elementRows.map((e) => `${e.zh}象${e.avg}`).join(' · ');
  const topEl = elementRows[0];
  const topElUrl = topEl
    ? `${baseUrl}/astro/elements/${topEl.slug}/week/${weekId}?${utm}`
    : weekUrl;

  const subject = pickLocaleString(locale, {
    'zh-CN': `${weekId} · 十二星座周运简报`,
    'zh-Hant': `${weekId} · 十二星座週運簡報`,
    en: `${weekId} · Zodiac weekly brief`,
  });

  const intro = pickLocaleString(locale, {
    'zh-CN':
      '本周公共层简报：十二星座周均 + 四象群组。不含个人命盘；个人周运请在站内用生日查询。',
    'zh-Hant': '本週公共層簡報：十二星座週均 + 四象。不含個人命盤。',
    en: 'Weekly public ranking of 12 signs and 4 elements. No personal chart.',
  });

  const bodyHtml = `
    <p style="margin:0 0 12px;color:#444950;font-size:14px;line-height:1.6">${escapeHtml(intro)}</p>
    <p style="margin:0 0 12px;color:#1c1e21;font-size:14px"><strong>${escapeHtml(weekId)}</strong> · ${escapeHtml(range)}</p>
    <div style="background:#e7f0ff;border-radius:8px;padding:12px 14px;margin:0 0 12px">
      <div style="font-size:12px;color:#365899;font-weight:700;margin-bottom:6px">本周均分较高</div>
      <div style="font-size:13px;color:#1c1e21;line-height:1.5">${escapeHtml(top)}</div>
    </div>
    <div style="background:#fff8e8;border-radius:8px;padding:12px 14px;margin:0 0 12px">
      <div style="font-size:12px;color:#8a6d3b;font-weight:700;margin-bottom:6px">本周宜更稳</div>
      <div style="font-size:13px;color:#1c1e21;line-height:1.5">${escapeHtml(low)}</div>
    </div>
    ${
      elementLine
        ? `<div style="background:#f3e8ff;border-radius:8px;padding:12px 14px;margin:0 0 16px">
      <div style="font-size:12px;color:#6b21a8;font-weight:700;margin-bottom:6px">四象周均</div>
      <div style="font-size:13px;color:#1c1e21;line-height:1.5">${escapeHtml(elementLine)}</div>
    </div>`
        : ''
    }
    <p style="margin:0 0 8px;font-size:13px">
      <a href="${escapeHtml(weekUrl)}" style="color:#4267b2;font-weight:600">打开完整周对比 →</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px">
      <a href="${escapeHtml(topElUrl)}" style="color:#4267b2;font-weight:600">看本周领先元素群组 →</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px">
      <a href="${escapeHtml(hubUrl)}" style="color:#4267b2;font-weight:600">用生日查个人结构日/周运 →</a>
    </p>
    <p style="margin:16px 0 0;font-size:11px;color:#8a8d91">节奏参考，非医疗投资建议。</p>
  `;

  const branded = renderBrandedEmail({
    locale,
    email: input.email || undefined,
    appName,
    baseUrl,
    title: pickLocaleString(locale, {
      'zh-CN': '星座周运简报',
      'zh-Hant': '星座週運簡報',
      en: 'Zodiac weekly brief',
    }),
    preheader: top.slice(0, 80),
    bodyHtml,
    primaryCta: {
      href: weekUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '查看本周对比',
        'zh-Hant': '查看本週對比',
        en: 'Open week ranking',
      }),
    },
  });

  const text = [
    subject,
    intro,
    `${weekId} ${range}`,
    `较高：${top}`,
    `宜稳：${low}`,
    weekUrl,
    hubUrl,
    chrome.footerNote || '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    html: branded.html,
    text: branded.text || text,
    locale,
    weekId,
    ok: true,
  };
}

// silence unused helper if tree-shaken
void stanceZh;
