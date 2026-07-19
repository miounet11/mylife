/**
 * Generic educational lines for the public 「今日窗口」 strip.
 * Date-seeded only — never personal 日主/用神 without a real report context.
 */

import { isEnglishUiLocale } from '@/lib/i18n/teacher-copy';

export const DAILY_WINDOW_COPY_LINES = [
  '节奏先于吉凶：今天先问自己「推进、观望还是收敛」，再决定要不要用力。',
  '验证比预感可靠：把一个判断写成可回看的小动作，比空喊运势更有用。',
  '窗口不是恐吓：结构提醒你阶段与边界，而不是用恐惧逼你下单。',
  '日更的意义在轻触：一条提醒够用，不必每天重算整份命盘。',
  '先拆问题，再谈命理：卡在节奏、资源还是关系接口？结构比签文清楚。',
  '可验证才算结论：说得出「做了什么、结果如何」，才配叫判断。',
  '不把概率说成必然：窗口是倾向与条件，不是宿命剧本。',
  '年度主轴比日签重要：先看今年该冲/稳/守，再谈今天怎么排。',
  '好提醒不制造焦虑：它帮你收窄选择，而不是放大恐慌。',
  '观望也是动作：当推进代价过高时，停一步本身就是结构匹配。',
  '用复盘对抗玄学：同一类节点回头看三次，比迷信一次「准」更有价值。',
  '边界写清楚：不构成投资、医疗、法律承诺——结构判断有限，行动权在你。',
  '轻路径优先：订阅一条节奏提醒，比反复刷恐吓式内容更健康。',
  '先测年度窗口，再谈日更：没有主轴的日签，容易变成随机鸡汤。',
] as const;

export const DAILY_WINDOW_COPY_LINES_EN = [
  'Rhythm before luck labels: ask push, watch, or pull back — then decide how hard to move.',
  'Verification beats hunch: write one judgment as a small, reviewable action.',
  'Windows are not threats: structure names stage and limits — not fear sales.',
  'Daily value is a light touch: one tip is enough; no need to recompute a full chart every day.',
  'Split the problem before metaphysics: stuck on rhythm, resources, or relationships? Structure is clearer than a fortune slip.',
  'Only verifiable claims count: if you can say what you did and what happened, it is a judgment.',
  'Don’t turn probability into destiny: a window is tendency and conditions, not a fixed script.',
  'Yearly spine beats daily fortune: know this year’s push / hold / protect first, then plan today.',
  'Good reminders reduce anxiety: they narrow choices instead of amplifying panic.',
  'Watching is still an action: when push costs too much, pausing can match the structure.',
  'Review beats mysticism: re-checking the same node three times beats one “hit” superstition.',
  'Boundaries stay explicit: not investment, medical, or legal advice — judgment is limited; action is yours.',
  'Prefer the light path: one rhythm reminder beats doom-scrolling scare content.',
  'Map the year window first: daily tips without a spine turn into random comfort text.',
] as const;

/** Day-of-year in local calendar (1–366). */
export function getLocalDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Stable index from day-of-year — same tip for the whole calendar day. */
export function pickDailyWindowIndex(dayOfYear: number, length = DAILY_WINDOW_COPY_LINES.length): number {
  if (length <= 0) return 0;
  // Mild mix so consecutive days don't always step by 1 through the list.
  const mixed = (dayOfYear * 17 + 31) % length;
  return mixed < 0 ? mixed + length : mixed;
}

export function getDailyWindowCopy(
  date: Date = new Date(),
  locale?: string | null,
): {
  dayOfYear: number;
  index: number;
  text: string;
} {
  const en = isEnglishUiLocale(locale);
  const lines = en ? DAILY_WINDOW_COPY_LINES_EN : DAILY_WINDOW_COPY_LINES;
  const dayOfYear = getLocalDayOfYear(date);
  const index = pickDailyWindowIndex(dayOfYear, lines.length);
  return {
    dayOfYear,
    index,
    text: lines[index] ?? lines[0],
  };
}

export function dailyWindowChrome(locale?: string | null): {
  ariaLabel: string;
  eyebrow: string;
  disclaimer: string;
  ctaYear: string;
  ctaSubscribe: string;
} {
  if (isEnglishUiLocale(locale)) {
    return {
      ariaLabel: 'Today’s window',
      eyebrow: 'Today’s window',
      disclaimer: 'Generic rhythm tip · not a personal chart · verifiable, non-threatening',
      ctaYear: 'Map your yearly window',
      ctaSubscribe: 'Subscribe to reminders',
    };
  }
  return {
    ariaLabel: '今日窗口',
    eyebrow: '今日窗口',
    disclaimer: '通用节奏提示 · 非个人命盘 · 可验证、不恐吓',
    ctaYear: '填生日测年度窗口',
    ctaSubscribe: '订阅提醒',
  };
}
