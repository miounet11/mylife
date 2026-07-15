import { getAppBaseUrl, getMailAppName } from '@/lib/env';
import { dimensionLabel } from './dimension-source';
import type { DueReminderBucket, DueReminderItem } from './due-reminder';
import {
  type EmailLocale,
  getEmailChrome,
  localizeText,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import { escapeHtml, renderBrandedEmail, renderInfoCard } from '@/lib/email-layout';

const CATEGORY_LABELS: Record<EmailLocale, Record<string, string>> = {
  'zh-CN': {
    career: '事业',
    wealth: '财富',
    marriage: '关系',
    health: '健康',
    timing: '时序',
  },
  'zh-Hant': {
    career: '事業',
    wealth: '財富',
    marriage: '關係',
    health: '健康',
    timing: '時序',
  },
  en: {
    career: 'Career',
    wealth: 'Wealth',
    marriage: 'Relationships',
    health: 'Health',
    timing: 'Timing',
  },
};

function formatDueLabel(item: DueReminderItem, bucket: DueReminderBucket, locale: EmailLocale): string {
  if (item.window) return localizeText(item.window, locale);
  if (bucket === 'overdue') {
    return pickLocaleString(locale, {
      'zh-CN': `已于 ${item.dueDate} 到期`,
      'zh-Hant': `已於 ${item.dueDate} 到期`,
      en: `Due on ${item.dueDate}`,
    });
  }
  return pickLocaleString(locale, {
    'zh-CN': `将于 ${item.dueDate} 到期`,
    'zh-Hant': `將於 ${item.dueDate} 到期`,
    en: `Due ${item.dueDate}`,
  });
}

export function buildPredictionDueReminderEmail(params: {
  email: string;
  userName?: string | null;
  items: Array<{ item: DueReminderItem; bucket: DueReminderBucket }>;
  utmCampaign: string;
  locale?: string | null;
  language?: string | null;
  acceptLanguage?: string | null;
}) {
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const appName = getMailAppName();
  const locale = resolveEmailLocale({
    email: params.email,
    locale: params.locale,
    language: params.language,
    acceptLanguage: params.acceptLanguage,
  });
  const chrome = getEmailChrome(locale);
  const cats = CATEGORY_LABELS[locale];

  const firstDimension = params.items.find((entry) => entry.item.dimensionSlug)?.item.dimensionSlug;
  const predictionsQuery = new URLSearchParams({
    utm_source: 'email',
    utm_medium: 'prediction_due',
    utm_campaign: params.utmCampaign,
  });
  if (firstDimension) predictionsQuery.set('dimension', firstDimension);

  const predictionsUrl = `${baseUrl}/predictions?${predictionsQuery.toString()}`;
  const dimensionsUrl = `${baseUrl}/dimensions?utm_source=email&utm_medium=prediction_due&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
  const safeName = escapeHtml(params.userName || chrome.defaultGreetingName);
  const upcoming = params.items.filter((entry) => entry.bucket === 'upcoming');
  const overdue = params.items.filter((entry) => entry.bucket === 'overdue');

  const renderList = (entries: typeof params.items) =>
    entries
      .slice(0, 4)
      .map(({ item, bucket }) => {
        const category = cats[item.category] || item.category;
        const dimTitle = item.dimensionSlug
          ? localizeText(dimensionLabel(item.dimensionSlug), locale)
          : '';
        const reportUrl = item.dimensionSlug
          ? `${baseUrl}/dimensions/${encodeURIComponent(item.dimensionSlug)}?utm_source=email&utm_medium=prediction_due&utm_campaign=${encodeURIComponent(params.utmCampaign)}`
          : `${baseUrl}/result/${encodeURIComponent(item.reportId)}?utm_source=email&utm_medium=prediction_due&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
        const sourceLabel = dimTitle ? `${category} · ${dimTitle}` : category;
        const openLabel = dimTitle
          ? pickLocaleString(locale, {
              'zh-CN': '查看维度研判 →',
              'zh-Hant': '查看維度研判 →',
              en: 'Open dimension →',
            })
          : pickLocaleString(locale, {
              'zh-CN': '查看原报告 →',
              'zh-Hant': '查看原報告 →',
              en: 'Open report →',
            });
        return `
      <li style="margin:0 0 16px;list-style:none;padding-left:12px;border-left:3px solid #3b5998">
        <div style="font-size:12px;color:#65676b;margin-bottom:4px">${escapeHtml(sourceLabel)} · ${escapeHtml(formatDueLabel(item, bucket, locale))}</div>
        <div style="font-size:15px;font-weight:700;color:#1c1e21;margin-bottom:6px;line-height:1.6">${escapeHtml(localizeText(item.statement, locale))}</div>
        <a href="${escapeHtml(reportUrl)}" style="font-size:13px;color:#3b5998;text-decoration:none;font-weight:600">${openLabel}</a>
      </li>
    `;
      })
      .join('');

  const subject =
    overdue.length > 0
      ? pickLocaleString(locale, {
          'zh-CN': `有 ${overdue.length} 条预测等你验证，回来看看准了吗？`,
          'zh-Hant': `有 ${overdue.length} 條預測等你驗證，回來看看準了嗎？`,
          en: `${overdue.length} predictions await your check-in`,
        })
      : pickLocaleString(locale, {
          'zh-CN': `有 ${upcoming.length} 条预测即将到期，提前对照一下`,
          'zh-Hant': `有 ${upcoming.length} 條預測即將到期，提前對照一下`,
          en: `${upcoming.length} predictions are coming due`,
        });

  const intro =
    overdue.length > 0
      ? pickLocaleString(locale, {
          'zh-CN': `你有 ${overdue.length} 条预测已经到期但还没反馈。你的每一次打分，都会让下一轮判断更贴近现实。`,
          'zh-Hant': `你有 ${overdue.length} 條預測已經到期但還沒反饋。你的每一次打分，都會讓下一輪判斷更貼近現實。`,
          en: `You have ${overdue.length} due predictions without feedback. Each score makes the next cycle more grounded.`,
        })
      : pickLocaleString(locale, {
          'zh-CN': `你有 ${upcoming.length} 条预测将在近期到期。提前对照现实变化，到期后回来打分即可。`,
          'zh-Hant': `你有 ${upcoming.length} 條預測將在近期到期。提前對照現實變化，到期後回來打分即可。`,
          en: `You have ${upcoming.length} predictions coming due soon. Compare with reality, then score when ready.`,
        });

  const title = pickLocaleString(locale, {
    'zh-CN': '预测回访提醒',
    'zh-Hant': '預測回訪提醒',
    en: 'Prediction check-in',
  });

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#65676b">${safeName}${locale === 'en' ? ',' : '，'}${escapeHtml(intro)}</p>
    ${
      overdue.length
        ? `${renderInfoCard({
            tone: 'amber',
            title: pickLocaleString(locale, {
              'zh-CN': '已到期未反馈',
              'zh-Hant': '已到期未反饋',
              en: 'Overdue — needs feedback',
            }),
            bodyHtml: `<ul style="margin:0;padding:0">${renderList(overdue)}</ul>`,
          })}`
        : ''
    }
    ${
      upcoming.length
        ? `${renderInfoCard({
            tone: 'green',
            title: pickLocaleString(locale, {
              'zh-CN': '即将到期',
              'zh-Hant': '即將到期',
              en: 'Coming due',
            }),
            bodyHtml: `<ul style="margin:0;padding:0">${renderList(upcoming)}</ul>`,
          })}`
        : ''
    }
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: subject,
    title,
    bodyHtml,
    primaryCta: {
      href: predictionsUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '去预测回访中心打分',
        'zh-Hant': '去預測回訪中心打分',
        en: 'Score in prediction center',
      }),
    },
    secondaryCta: {
      href: dimensionsUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '继续十维度研判',
        'zh-Hant': '繼續十維度研判',
        en: 'Continue 10 dimensions',
      }),
    },
    showUnsubscribe: true,
  });

  return { subject, html, text, locale };
}
