/**
 * Bilingual userCopy for timing points (generation + display).
 * zh-CN is primary engine language; en is L2 decision copy (not machine-translated jargon).
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import type { TimingPoint, PastValidation, TimingType } from './types';

export type NarratorOutput = {
  title: string;
  summary: string;
  todoSuggestions: string[];
  avoidSuggestions: string[];
};

const FALLBACK_ZH: Partial<Record<TimingType, NarratorOutput>> = {
  solar_term: {
    title: '节气过渡期',
    summary: '能量切换的 7 天，作息和情绪都更敏感。',
    todoSuggestions: ['早睡早起', '减少应酬'],
    avoidSuggestions: ['熬夜决策', '签长期合约'],
  },
  tai_sui_value: {
    title: '本命年',
    summary: '这一年命理上不宜大动，主守不主进。',
    todoSuggestions: ['专注现有事的稳定', '把扩张推到明年立春后'],
    avoidSuggestions: ['一次性押注', '高杠杆决策'],
  },
  tai_sui_clash: {
    title: '冲太岁年',
    summary: '今年容易遇到外部强冲击，节奏会被打乱。',
    todoSuggestions: ['留现金流缓冲', '减少长期承诺'],
    avoidSuggestions: ['硬扛对抗', '搬迁/换工作仓促决定'],
  },
  tai_sui_punish: {
    title: '刑太岁年',
    summary: '关系/合作上摩擦多，容易被牵连进麻烦。',
    todoSuggestions: ['合作前白纸黑字', '边界写清楚'],
    avoidSuggestions: ['替人担保', '介入他人纠纷'],
  },
  tai_sui_harm: {
    title: '害太岁年',
    summary: '隐性消耗多，容易“看似平稳但持续被吃掉”。',
    todoSuggestions: ['每月盘点开支与精力', '定期清理无效关系'],
    avoidSuggestions: ['碍于面子答应不情愿的事'],
  },
  tai_sui_break: {
    title: '破太岁年',
    summary: '变化频繁，但多为小波折非大事。',
    todoSuggestions: ['留弹性空间'],
    avoidSuggestions: ['硬定死时间表'],
  },
  dayun_transition: {
    title: '换大运',
    summary: '人生节奏从此切换 10 年，前 30 天最易做错决定。',
    todoSuggestions: ['先观察 1-2 个月再下大决定', '完成手上未结的事'],
    avoidSuggestions: ['立刻换赛道', '冲动结束当前阶段'],
  },
  sui_yun_bing_lin: {
    title: '岁运并临年',
    summary: '命理大忌，能量集中度极高，容易极端化。',
    todoSuggestions: ['一切重大决策延后 30 天再看', '加强健康监测'],
    avoidSuggestions: ['任何不可逆的承诺', '过度透支'],
  },
  liuyue_clash: {
    title: '变动月',
    summary: '这个月外部冲击多，节奏被打乱。',
    todoSuggestions: ['弹性安排日程'],
    avoidSuggestions: ['锁死的承诺'],
  },
  liuyue_fuyin: {
    title: '原局加倍月',
    summary: '原本就强的特质这个月会更明显，容易“用力过猛”。',
    todoSuggestions: ['有意识地慢一档'],
    avoidSuggestions: ['争对错', '硬碰硬'],
  },
  liuyue_combine: {
    title: '能量增强月',
    summary: '资源容易聚集，适合推进已经准备好的事。',
    todoSuggestions: ['集中精力推主线'],
    avoidSuggestions: ['同时开新摊子'],
  },
  liuyue_shensha_tianyi: {
    title: '贵人月',
    summary: '这个月关键时刻容易得到帮忙，主动开口求助有效。',
    todoSuggestions: ['主动联系可能给你建议的人'],
    avoidSuggestions: ['闷头硬抗'],
  },
  liuyue_shensha_wenchang: {
    title: '灵感月',
    summary: '学习、写作、表达类的事这个月特别顺。',
    todoSuggestions: ['集中输出', '写下重要思考'],
    avoidSuggestions: ['把这种月份用来做琐事'],
  },
  liuyue_shensha_taohua: {
    title: '社交活跃月',
    summary: '人际关系活跃，容易出现机会和诱惑。',
    todoSuggestions: ['多见人但留判断力'],
    avoidSuggestions: ['冲动承诺关系'],
  },
  liuyue_shensha_yima: {
    title: '变动月',
    summary: '可能涉及出差、搬迁、远行或环境改变。',
    todoSuggestions: ['提前预留弹性'],
    avoidSuggestions: ['这个月的长期承诺'],
  },
  liuyue_shensha_jiangxing: {
    title: '担当月',
    summary: '适合主导和担纲，能量足够支撑你站出来。',
    todoSuggestions: ['接下你犹豫的责任'],
    avoidSuggestions: ['继续躲在后面'],
  },
};

/** Native English L2 presets (not literal CN translation). */
const FALLBACK_EN: Partial<Record<TimingType, NarratorOutput>> = {
  solar_term: {
    title: 'Seasonal transition',
    summary: 'A 7-day energy shift—sleep and mood run more sensitive than usual.',
    todoSuggestions: ['Keep a steadier sleep schedule', 'Cut optional social load'],
    avoidSuggestions: ['Late-night decisions', 'Signing long contracts this week'],
  },
  tai_sui_value: {
    title: 'Birth-year year',
    summary: 'A hold-and-stabilize year—prefer defense over big expansion.',
    todoSuggestions: ['Stabilize what already works', 'Push major expansion past next spring'],
    avoidSuggestions: ['All-in bets', 'High-leverage decisions'],
  },
  tai_sui_clash: {
    title: 'Clash year',
    summary: 'External shocks are likelier; your rhythm can get disrupted.',
    todoSuggestions: ['Keep cash and calendar buffers', 'Reduce long commitments'],
    avoidSuggestions: ['Hard confrontation', 'Rushed job/move decisions'],
  },
  tai_sui_punish: {
    title: 'Friction year',
    summary: 'Relationship and partnership friction rises—easy to get pulled into messes.',
    todoSuggestions: ['Put agreements in writing', 'Clarify boundaries early'],
    avoidSuggestions: ['Guaranteeing for others', 'Mediating others’ disputes'],
  },
  tai_sui_harm: {
    title: 'Drain year',
    summary: 'Quiet drains add up—things look fine while energy and money leak.',
    todoSuggestions: ['Monthly audit of spend and energy', 'Prune low-return relationships'],
    avoidSuggestions: ['Saying yes just to save face'],
  },
  tai_sui_break: {
    title: 'Choppy year',
    summary: 'Frequent small changes, usually not one big crisis.',
    todoSuggestions: ['Leave schedule slack'],
    avoidSuggestions: ['Rigid immovable plans'],
  },
  dayun_transition: {
    title: 'Decade-luck shift',
    summary: 'A 10-year rhythm change; the first 30 days are easiest to mis-decide.',
    todoSuggestions: ['Observe 1–2 months before big moves', 'Close open loops first'],
    avoidSuggestions: ['Instant track switches', 'Ending a phase on impulse'],
  },
  sui_yun_bing_lin: {
    title: 'Year–luck stacking',
    summary: 'High concentration year—outcomes can polarize.',
    todoSuggestions: ['Delay irreversible decisions 30 days', 'Increase health monitoring'],
    avoidSuggestions: ['Irreversible commitments', 'Overextending capacity'],
  },
  liuyue_clash: {
    title: 'Volatile month',
    summary: 'More external jolts this month; plans get interrupted.',
    todoSuggestions: ['Keep the calendar flexible'],
    avoidSuggestions: ['Hard-locked commitments'],
  },
  liuyue_fuyin: {
    title: 'Amplify month',
    summary: 'Your strong traits get louder—easy to overdo force.',
    todoSuggestions: ['Consciously slow one gear'],
    avoidSuggestions: ['Fighting to be right', 'Head-on collisions'],
  },
  liuyue_combine: {
    title: 'Gathering month',
    summary: 'Resources tend to cluster—push what is already prepared.',
    todoSuggestions: ['Focus on the main line'],
    avoidSuggestions: ['Opening too many new fronts'],
  },
  liuyue_shensha_tianyi: {
    title: 'Help month',
    summary: 'Help shows up more easily—asking works better than solo grinding.',
    todoSuggestions: ['Proactively contact advisors'],
    avoidSuggestions: ['Suffering in silence'],
  },
  liuyue_shensha_wenchang: {
    title: 'Insight month',
    summary: 'Learning, writing, and expression flow unusually well.',
    todoSuggestions: ['Ship focused output', 'Write down key ideas'],
    avoidSuggestions: ['Spending the month on trivia'],
  },
  liuyue_shensha_taohua: {
    title: 'Social month',
    summary: 'Networks heat up—both opportunity and temptation rise.',
    todoSuggestions: ['Meet people while keeping judgment'],
    avoidSuggestions: ['Impulse relationship promises'],
  },
  liuyue_shensha_yima: {
    title: 'Movement month',
    summary: 'Travel, relocation, or environment change is more likely.',
    todoSuggestions: ['Pre-build schedule flexibility'],
    avoidSuggestions: ['Long locks made this month'],
  },
  liuyue_shensha_jiangxing: {
    title: 'Lead month',
    summary: 'Good window to step forward and carry responsibility.',
    todoSuggestions: ['Take the role you were hesitating on'],
    avoidSuggestions: ['Staying hidden behind others'],
  },
};

const PAST_EN: Record<string, string> = {
  pattern_weak_self:
    'People with a weaker-self structure often overdraw body or emotion under heavy external pressure',
  pattern_strong_self:
    'People with a strong-self structure often “push through” for years and burn relationships',
  shensha_yangren:
    'Blade-mark charts often show past losses from impulsive decisions',
  shensha_wenchang:
    'Literary-star charts often had unusual flashes in learning or creative work',
  shensha_tianyi:
    'Heavenly-helper charts often get proactive help at critical moments',
};

export function fallbackNarrate(point: TimingPoint, locale: SiteLocale = 'zh-CN'): NarratorOutput {
  const map = locale === 'en' ? FALLBACK_EN : FALLBACK_ZH;
  const preset = map[point.type];
  if (preset) {
    if (locale === 'zh-Hant') {
      return {
        title: toSiteLocaleText(preset.title, 'zh-Hant'),
        summary: toSiteLocaleText(preset.summary, 'zh-Hant'),
        todoSuggestions: preset.todoSuggestions.map((s) => toSiteLocaleText(s, 'zh-Hant')),
        avoidSuggestions: preset.avoidSuggestions.map((s) => toSiteLocaleText(s, 'zh-Hant')),
      };
    }
    return { ...preset, todoSuggestions: [...preset.todoSuggestions], avoidSuggestions: [...preset.avoidSuggestions] };
  }

  if (locale === 'en') {
    return {
      title: 'Watch this window',
      summary: 'A structural timing window—slow decisions and keep optionality.',
      todoSuggestions: ['Slow one gear'],
      avoidSuggestions: ['Irreversible bets this week'],
    };
  }

  const base = {
    title: '留意这段时间',
    summary: (point.rawReason || '').slice(0, 60) || '结构时点临近，宜慢不宜急。',
    todoSuggestions: ['节奏放慢一档'],
    avoidSuggestions: ['不做大决定'],
  };
  if (locale === 'zh-Hant') {
    return {
      title: toSiteLocaleText(base.title, 'zh-Hant'),
      summary: toSiteLocaleText(base.summary, 'zh-Hant'),
      todoSuggestions: base.todoSuggestions.map((s) => toSiteLocaleText(s, 'zh-Hant')),
      avoidSuggestions: base.avoidSuggestions.map((s) => toSiteLocaleText(s, 'zh-Hant')),
    };
  }
  return base;
}

/** Attach bilingual fallback copy at generation time. */
export function withBilingualUserCopy(point: TimingPoint): TimingPoint {
  const zh = point.userCopy || fallbackNarrate(point, 'zh-CN');
  const en = point.userCopyEn || fallbackNarrate(point, 'en');
  return {
    ...point,
    userCopy: zh,
    userCopyEn: en,
  };
}

export function localizeUserCopy(
  point: TimingPoint,
  locale: SiteLocale
): NarratorOutput {
  if (locale === 'en') {
    return point.userCopyEn || fallbackNarrate(point, 'en');
  }
  const zh = point.userCopy || fallbackNarrate(point, 'zh-CN');
  if (locale === 'zh-Hant') {
    return {
      title: toSiteLocaleText(zh.title, 'zh-Hant'),
      summary: toSiteLocaleText(zh.summary, 'zh-Hant'),
      todoSuggestions: zh.todoSuggestions.map((s) => toSiteLocaleText(s, 'zh-Hant')),
      avoidSuggestions: zh.avoidSuggestions.map((s) => toSiteLocaleText(s, 'zh-Hant')),
    };
  }
  return zh;
}

export function localizePastTemplate(
  validation: PastValidation,
  locale: SiteLocale
): string {
  if (locale === 'en') {
    if (validation.rawTemplateEn) return validation.rawTemplateEn;
    if (PAST_EN[validation.id]) return PAST_EN[validation.id];
    // dayun imprint dynamic
    if (validation.id === 'dayun_imprint_recent_good') {
      const gz = `${validation.context?.ganZhi || ''}`.trim();
      return gz
        ? `In the past decade (${gz} luck), you likely had a stretch where work felt relatively smooth`
        : 'In the past decade you likely had a stretch where work felt relatively smooth';
    }
    return 'A structural pattern from your chart that often shows up in real life';
  }
  if (locale === 'zh-Hant') return toSiteLocaleText(validation.rawTemplate, 'zh-Hant');
  return validation.rawTemplate;
}

export function localizeRawReason(reason: string, locale: SiteLocale): string {
  if (!reason) return '';
  if (locale === 'zh-Hant') return toSiteLocaleText(reason, 'zh-Hant');
  if (locale !== 'en') return reason;

  // Light structured EN for common detector phrases
  let out = reason;
  out = out.replace(/进入(.+?)大运（(\d+)-(\d+)岁），10 年人生节奏切换/g,
    'Enter $1 decade luck (ages $2–$3)—a 10-year rhythm shift');
  out = out.replace(/(.+?)节气过渡期，命理上能量切换的关键 7 天/g,
    '$1 solar-term transition—key 7 days of energy shift');
  out = out.replace(/(.+?)年（(.+?)）大运干支与流年干支完全相同，命理称岁运并临/g,
    'In $1 ($2), decade luck matches the year pillar (year–luck stacking)');
  out = out.replace(/本命年/g, 'birth-year');
  out = out.replace(/冲太岁/g, 'clash Tai Sui');
  out = out.replace(/刑太岁/g, 'punish Tai Sui');
  out = out.replace(/害太岁/g, 'harm Tai Sui');
  out = out.replace(/破太岁/g, 'break Tai Sui');
  // If still pure Chinese without replacement hits, keep original (engine truth)
  return out;
}

export const TIMING_NARRATOR_SYSTEM_EN = `You translate Bazi timing windows into practical life language for international users.

Hard rules:
1. No jargon walls: do not dump ten-gods lists; explain impact in plain English.
2. Stems/branches may appear as time tags (e.g. "Bing-Wu year (2026)") but do not stack technical clash jargon.
3. Time anchors at week/month granularity (e.g. "mid-to-late May"), never "sometime later".
4. Must give concrete Do and Avoid actions (2–4 total), not empty "stay healthy".
5. summary one sentence ≤ 25 words.
6. title 2–6 words, decisive.

Output JSON only:
{
  "title": "<2-6 words>",
  "summary": "<one sentence>",
  "todoSuggestions": ["<action 1>", "<action 2>"],
  "avoidSuggestions": ["<avoid 1>", "<avoid 2>"]
}`;
