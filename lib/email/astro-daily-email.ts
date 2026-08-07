/**
 * Public 星座日运 email — day compare + tong-shu highlights.
 * No personal bazi. Subscribers opt-in via tag `astro:daily`.
 */

import { buildDayComparePack } from '@/lib/astro/day-compare-engine';
import { formatZhDate, todayIsoLocal } from '@/lib/astro/daily-window';
import { buildAlmanacDayPack } from '@/lib/almanac/day-pack';
import {
  type EmailLocale,
  getEmailChrome,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import { escapeHtml, renderBrandedEmail } from '@/lib/email-layout';
import { getAppBaseUrl, getMailAppName } from '@/lib/env';

export type BuildAstroDailyEmailInput = {
  locale?: string | null;
  date?: string | null;
  email?: string | null;
  utmCampaign?: string;
};

export type BuildAstroDailyEmailResult = {
  subject: string;
  html: string;
  text: string;
  locale: EmailLocale;
  date: string;
  ok: boolean;
  reason?: string;
};

function stanceZh(s: string) {
  if (s === 'push') return '可推进';
  if (s === 'conserve') return '宜守成';
  return '稳节奏';
}

export function buildAstroDailyEmail(
  input: BuildAstroDailyEmailInput = {},
): BuildAstroDailyEmailResult {
  const date = (input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date)
    ? input.date
    : todayIsoLocal()
  ).trim();
  const locale = resolveEmailLocale({ locale: input.locale, email: input.email });
  const appName = getMailAppName();
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const chrome = getEmailChrome(locale);
  const campaign = (input.utmCampaign || date).trim() || date;
  const utm = new URLSearchParams({
    utm_source: 'email',
    utm_medium: 'astro_daily',
    utm_campaign: campaign,
  });

  const compare = buildDayComparePack(date);
  const almanac = buildAlmanacDayPack(date);
  if (!compare || !almanac) {
    return {
      subject: '星座日运',
      html: '',
      text: '',
      locale,
      date,
      ok: false,
      reason: 'pack_unavailable',
    };
  }

  const zhDate = formatZhDate(date);
  const compareUrl = `${baseUrl}/astro/day/${date}/compare?${utm}`;
  const almanacUrl = `${baseUrl}/almanac/${date}?${utm}`;
  const hubUrl = `${baseUrl}/astro?${utm}`;
  const birthHintUrl = `${baseUrl}/astro?${utm}`;

  const subject = pickLocaleString(locale, {
    'zh-CN': `${zhDate} · 十二星座日运简报`,
    'zh-Hant': `${zhDate} · 十二星座日運簡報`,
    en: `${date} · Zodiac daily brief`,
  });

  const topLines = compare.topSigns
    .map((r) => `${r.title} ${r.composite}（${stanceZh(r.stance)}）`)
    .join(' · ');
  const lowLines = compare.lowSigns
    .map((r) => `${r.title} ${r.composite}`)
    .join(' · ');

  const yi = almanac.yi.slice(0, 4).join(locale === 'en' ? ', ' : '、') || '—';
  const ji = almanac.ji.slice(0, 3).join(locale === 'en' ? ', ' : '、') || '—';

  const intro = pickLocaleString(locale, {
    'zh-CN':
      '今日公共层简报：通书宜忌 + 十二星座引擎排名。不含个人命盘；要点进链接看证据链。',
    'zh-Hant':
      '今日公共層簡報：通書宜忌 + 十二星座引擎排名。不含個人命盤；請點連結看證據鏈。',
    en: 'Public daily brief: tong-shu + 12-sign engine ranking. No personal chart — open links for evidence.',
  });

  const bodyHtml = `
    <p style="margin:0 0 12px;color:#444950;font-size:14px;line-height:1.6">${escapeHtml(intro)}</p>
    <p style="margin:0 0 8px;color:#1c1e21;font-size:14px"><strong>${escapeHtml(zhDate)}</strong> · 日柱 ${escapeHtml(almanac.lunar.dayGanZhi)} · 农历${escapeHtml(almanac.lunar.lunarText)}</p>
    <p style="margin:0 0 8px;color:#444950;font-size:13px">宜 ${escapeHtml(yi)}</p>
    <p style="margin:0 0 16px;color:#444950;font-size:13px">忌 ${escapeHtml(ji)}</p>
    <div style="background:#e7f0ff;border-radius:8px;padding:12px 14px;margin:0 0 12px">
      <div style="font-size:12px;color:#365899;font-weight:700;margin-bottom:6px">今日相对较顺</div>
      <div style="font-size:13px;color:#1c1e21;line-height:1.5">${escapeHtml(topLines)}</div>
    </div>
    <div style="background:#fff8e8;border-radius:8px;padding:12px 14px;margin:0 0 16px">
      <div style="font-size:12px;color:#8a6d3b;font-weight:700;margin-bottom:6px">今日宜谨慎</div>
      <div style="font-size:13px;color:#1c1e21;line-height:1.5">${escapeHtml(lowLines)}</div>
    </div>
    <p style="margin:0 0 8px;font-size:13px">
      <a href="${escapeHtml(compareUrl)}" style="color:#4267b2;font-weight:600">打开完整对比与证据页 →</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px">
      <a href="${escapeHtml(almanacUrl)}" style="color:#4267b2;font-weight:600">当日黄历撕页 →</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px">
      <a href="${escapeHtml(birthHintUrl)}" style="color:#4267b2;font-weight:600">用生日查「我的结构日运」→</a>
    </p>
    <p style="margin:16px 0 0;font-size:11px;color:#8a8d91;line-height:1.5">
      节奏参考，非医疗/投资建议。退订或改偏好请到个人设置 / 邮件偏好。
    </p>
  `;

  const branded = renderBrandedEmail({
    locale,
    email: input.email || undefined,
    appName,
    baseUrl,
    title: pickLocaleString(locale, {
      'zh-CN': '星座日运简报',
      'zh-Hant': '星座日運簡報',
      en: 'Zodiac daily brief',
    }),
    preheader: topLines.slice(0, 80),
    bodyHtml,
    primaryCta: {
      href: compareUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '查看今日对比',
        'zh-Hant': '查看今日對比',
        en: 'Open today’s ranking',
      }),
    },
    secondaryCta: {
      href: almanacUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '当日黄历',
        'zh-Hant': '當日黃曆',
        en: 'Almanac',
      }),
    },
  });

  const text = [
    subject,
    intro,
    `${zhDate} 日柱 ${almanac.lunar.dayGanZhi}`,
    `宜 ${yi}`,
    `忌 ${ji}`,
    `较顺：${topLines}`,
    `宜慎：${lowLines}`,
    `对比：${compareUrl}`,
    `黄历：${almanacUrl}`,
    `星座入口：${hubUrl}`,
    chrome.footerNote || '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    html: branded.html,
    text: branded.text || text,
    locale,
    date,
    ok: true,
  };
}
