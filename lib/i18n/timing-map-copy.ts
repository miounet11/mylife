/**
 * L2 chrome for /r timing-map blocks (portrait, past, 30d, 12m, 5y, fold).
 * Dynamic engine sentences: zh-Hant via chinese-conv; en keeps technical CN
 * with chrome in English (decision path still readable).
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import { translatePatternType } from '@/lib/i18n/public-report-seo';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Dynamic engine text: traditionalize for zh-Hant; leave as-is for en/zh-CN. */
export function localizeEngineText(text: string | null | undefined, locale: SiteLocale): string {
  if (!text) return '';
  if (locale === 'zh-Hant') return toSiteLocaleText(text, 'zh-Hant');
  return text;
}

export function timingMapCopy(locale: SiteLocale) {
  return {
    portraitEyebrow: pick(locale, {
      'zh-CN': '你是这样的人',
      'zh-Hant': '你是這樣的人',
      en: 'How you work',
    }),
    portraitWithPattern: (pattern: string) => {
      const p =
        locale === 'en'
          ? translatePatternType(pattern, 'en')
          : localizeEngineText(pattern, locale);
      if (locale === 'en') {
        return `${p}: you win with rhythm and compounding, not brute force.`;
      }
      return pick(locale, {
        'zh-CN': `${p}结构：你不是靠拼命赢的人，你的发力靠节奏和复利。`,
        'zh-Hant': `${p}結構：你不是靠拼命贏的人，你的發力靠節奏和複利。`,
        en: '',
      });
    },
    portraitFallback: pick(locale, {
      'zh-CN': '你的命局有清晰的结构，发力点不在硬扛，在节奏。',
      'zh-Hant': '你的命局有清晰的結構，發力點不在硬扛，在節奏。',
      en: 'Your chart has a clear structure—power comes from rhythm, not hard grinding.',
    }),
    baziLabel: pick(locale, {
      'zh-CN': '八字',
      'zh-Hant': '八字',
      en: 'Four Pillars',
    }),
    pastEyebrow: pick(locale, {
      'zh-CN': '过去你应该多次经历过',
      'zh-Hant': '過去你應該多次經歷過',
      en: 'Patterns you have likely seen before',
    }),
    next30Eyebrow: pick(locale, {
      'zh-CN': '未来 30 天',
      'zh-Hant': '未來 30 天',
      en: 'Next 30 days',
    }),
    next30Title: (n: number) =>
      n > 0
        ? pick(locale, {
            'zh-CN': `你会有 ${n} 个值得留意的时点`,
            'zh-Hant': `你會有 ${n} 個值得留意的時點`,
            en: `${n} timing point${n === 1 ? '' : 's'} worth watching`,
          })
        : pick(locale, {
            'zh-CN': '这一段相对平稳',
            'zh-Hant': '這一段相對平穩',
            en: 'This stretch looks relatively steady',
          }),
    next12Eyebrow: pick(locale, {
      'zh-CN': '未来 12 个月时间地图',
      'zh-Hant': '未來 12 個月時間地圖',
      en: 'Next 12 months map',
    }),
    next12Title: (months: number, points: number) =>
      pick(locale, {
        'zh-CN': `${months} 个月里有 ${points} 个时点`,
        'zh-Hant': `${months} 個月裡有 ${points} 個時點`,
        en: `${points} point${points === 1 ? '' : 's'} across ${months} month${months === 1 ? '' : 's'}`,
      }),
    next12Empty: pick(locale, {
      'zh-CN': '这一段时期相对平稳。',
      'zh-Hant': '這一段時期相對平穩。',
      en: 'This period looks relatively steady.',
    }),
    formatMonth: (ym: string) => {
      const [y, m] = ym.split('-');
      const month = parseInt(m || '1', 10);
      if (locale === 'en') {
        const names = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        return `${names[month - 1] || m} ${y}`;
      }
      return pick(locale, {
        'zh-CN': `${y} 年 ${month} 月`,
        'zh-Hant': `${y} 年 ${month} 月`,
        en: `${y}-${m}`,
      });
    },
    next5Eyebrow: pick(locale, {
      'zh-CN': '未来 5 年（大运层面）',
      'zh-Hant': '未來 5 年（大運層面）',
      en: 'Next 5 years (decade luck)',
    }),
    next5Empty: pick(locale, {
      'zh-CN': '未来 5 年命理层面无重大转折信号',
      'zh-Hant': '未來 5 年命理層面無重大轉折信號',
      en: 'No major structural turning signals in the next 5 years',
    }),
    next5Title: (n: number) =>
      pick(locale, {
        'zh-CN': `${n} 个值得留意的关键年份`,
        'zh-Hant': `${n} 個值得留意的關鍵年份`,
        en: `${n} key year${n === 1 ? '' : 's'} to watch`,
      }),
    ageLabel: (age: number) =>
      pick(locale, {
        'zh-CN': `${age} 岁`,
        'zh-Hant': `${age} 歲`,
        en: `age ${age}`,
      }),
    chartLabel: pick(locale, {
      'zh-CN': '命盘',
      'zh-Hant': '命盤',
      en: 'Chart',
    }),
    transitionType: {
      dayun_shift: pick(locale, {
        'zh-CN': '换大运',
        'zh-Hant': '換大運',
        en: 'Luck shift',
      }),
      tai_sui_year: pick(locale, {
        'zh-CN': '太岁年',
        'zh-Hant': '太歲年',
        en: 'Tai Sui year',
      }),
      sui_yun_bing_lin: pick(locale, {
        'zh-CN': '岁运并临',
        'zh-Hant': '歲運並臨',
        en: 'Year–luck clash',
      }),
    } as Record<string, string>,
    detailTitle: pick(locale, {
      'zh-CN': '详细命理依据',
      'zh-Hant': '詳細命理依據',
      en: 'Technical basis',
    }),
    detailBody: pick(locale, {
      'zh-CN':
        '这个版本的报告优先展示「未来你会怎样」。完整的八字、五行、十神、神煞详情会在后续版本里补充到这里。',
      'zh-Hant':
        '這個版本的報告優先展示「未來你會怎樣」。完整的八字、五行、十神、神煞詳情會在後續版本裡補充到這裡。',
      en: 'This version prioritizes “what happens next.” Full pillar, element, ten-god, and spirit details will expand here in later depth views.',
    }),
    yourBazi: pick(locale, {
      'zh-CN': '你的八字',
      'zh-Hant': '你的八字',
      en: 'Your pillars',
    }),
    severity: {
      notice: pick(locale, { 'zh-CN': '提示', en: 'Note' }),
      caution: pick(locale, { 'zh-CN': '留意', 'zh-Hant': '留意', en: 'Watch' }),
      critical: pick(locale, { 'zh-CN': '关键', 'zh-Hant': '關鍵', en: 'Key' }),
    } as Record<string, string>,
    todoLabel: pick(locale, {
      'zh-CN': '该做',
      'zh-Hant': '該做',
      en: 'Do',
    }),
    avoidLabel: pick(locale, {
      'zh-CN': '该避',
      'zh-Hant': '該避',
      en: 'Avoid',
    }),
    dateTo: pick(locale, {
      'zh-CN': '至',
      en: '–',
    }),
    engineNote: pick(locale, {
      'zh-CN': '',
      en: '',
    }),
    subscribeTitle: pick(locale, {
      'zh-CN': '关键时点邮件提醒',
      'zh-Hant': '關鍵時點郵件提醒',
      en: 'Email me key timing windows',
    }),
    subscribeHint: pick(locale, {
      'zh-CN': '免费 · 可退订',
      'zh-Hant': '免費 · 可退訂',
      en: 'Free · cancel anytime',
    }),
    subscribeCta: pick(locale, {
      'zh-CN': '订阅',
      'zh-Hant': '訂閱',
      en: 'Subscribe',
    }),
    subscribePlaceholder: pick(locale, {
      'zh-CN': '你的邮箱',
      'zh-Hant': '你的郵箱',
      en: 'Your email',
    }),
  };
}

export type TimingMapCopy = ReturnType<typeof timingMapCopy>;
