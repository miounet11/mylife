/**
 * Consultant-card opening — first_mes + starters + topic chips + mid-chat rails.
 * Tavern/Character.AI mechanics; advisor content only; slots from report truth.
 */

import {
  buildMemoryNarrative,
  type MemoryNarrativeInput,
} from '@/lib/chat/memory-narrative';
import {
  continuationStartersEn,
  defaultOpeningChipsEn,
  isEnglishUiLocale,
  localizeTeacher,
  unboundFirstMesEn,
  unboundStartersEn,
} from '@/lib/i18n/teacher-copy';
import {
  getTeacher,
  listReportTeachers,
  type TeacherDefinition,
  type TeacherId,
  type TeacherTopicChip,
} from '@/lib/teachers';

export type TeacherOpeningSlots = {
  name?: string | null;
  dayMaster?: string | null;
  pattern?: string | null;
  currentDaYun?: string | null;
  /** free-form hint (URL window / topic) */
  windowHint?: string | null;
  yongShen?: string[] | string | null;
  bestWindow?: string | null;
  riskWindow?: string | null;
  currentLiuNian?: string | null;
};

export type TeacherOpeningView = {
  teacher: TeacherDefinition;
  teacherId: TeacherId;
  firstMes: string;
  starters: string[];
  /** Mid-conversation short continuations */
  continuationStarters: string[];
  chips: TeacherTopicChip[];
  greetingIndex: number;
  greetingCount: number;
  hasReportSlots: boolean;
  /**
   * Archive/revisit memory line when real validation stats exist.
   * Surfaced as a blue chip in opening chrome — never invents numbers.
   */
  memoryLine?: string | null;
};

function asList(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.map((x) => `${x || ''}`.trim()).filter(Boolean);
  const raw = `${value || ''}`.trim();
  if (!raw) return [];
  return raw.split(/[、,，/\s]+/).map((x) => x.trim()).filter(Boolean);
}

function ensureSentence(text: string, en: boolean): string {
  const t = text.trim();
  if (!t) return '';
  if (en) return /[.!?]$/.test(t) ? t : `${t}.`;
  return /[。！？]$/.test(t) ? t : `${t}。`;
}

export function fillTeacherTemplate(
  template: string,
  slots: TeacherOpeningSlots = {},
  locale?: string | null,
): string {
  const en = isEnglishUiLocale(locale);
  const name = `${slots.name || ''}`.trim() || (en ? 'you' : '你');
  const dayMaster = `${slots.dayMaster || ''}`.trim() || '—';
  const pattern = `${slots.pattern || ''}`.trim() || '—';
  const currentDaYun = `${slots.currentDaYun || ''}`.trim() || '—';
  const currentLiuNian = `${slots.currentLiuNian || ''}`.trim();
  const yong = asList(slots.yongShen);
  const bestWindow = `${slots.bestWindow || ''}`.trim();
  const riskWindow = `${slots.riskWindow || ''}`.trim();
  const windowHint = ensureSentence(`${slots.windowHint || ''}`.trim(), en);

  const yongJoin = en ? yong.join(', ') : yong.join('、');
  const yongShenLine = yong.length
    ? en
      ? `Favorable focus leans toward “${yongJoin}”. `
      : `用神偏「${yongJoin}」。`
    : '';
  const bestWindowLine = bestWindow
    ? en
      ? `More favorable window: ${bestWindow}. `
      : `较有利窗口：${bestWindow}。`
    : '';
  const riskWindowLine = riskWindow
    ? en
      ? `Use more caution: ${riskWindow}. `
      : `更需谨慎：${riskWindow}。`
    : '';
  const liuNianLine = currentLiuNian
    ? en
      ? `Current year pillar ${currentLiuNian}. `
      : `流年 ${currentLiuNian}。`
    : '';

  // Compose default windowHint if empty but we have engine windows
  let effectiveWindowHint = windowHint;
  if (!effectiveWindowHint && (bestWindowLine || riskWindowLine || liuNianLine || yongShenLine)) {
    effectiveWindowHint = `${yongShenLine}${liuNianLine}${bestWindowLine}${riskWindowLine}`;
  }
  if (!effectiveWindowHint) {
    effectiveWindowHint = en
      ? 'I’ll answer with structure, stage, and a practical next step.'
      : '我会按结构、阶段与可执行下一步来答。';
  }

  return template
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{dayMaster\}\}/g, dayMaster)
    .replace(/\{\{pattern\}\}/g, pattern)
    .replace(/\{\{currentDaYun\}\}/g, currentDaYun)
    .replace(/\{\{currentLiuNian\}\}/g, currentLiuNian || '—')
    .replace(/\{\{yongShen\}\}/g, yong.length ? yongJoin : '—')
    .replace(/\{\{yongShenLine\}\}/g, yongShenLine)
    .replace(/\{\{bestWindow\}\}/g, bestWindow || '—')
    .replace(/\{\{riskWindow\}\}/g, riskWindow || '—')
    .replace(/\{\{bestWindowLine\}\}/g, bestWindowLine)
    .replace(/\{\{riskWindowLine\}\}/g, riskWindowLine)
    .replace(/\{\{windowHint\}\}/g, effectiveWindowHint)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function allGreetings(teacher: TeacherDefinition, en: boolean): string[] {
  const list = [teacher.firstMes, ...(teacher.alternateGreetings || [])].filter(
    (x): x is string => Boolean(x && `${x}`.trim()),
  );
  if (list.length) return list;
  if (en) {
    return [
      `I'm ${teacher.name}. ${teacher.tagline}. ${teacher.boundary}.\n\nSay the one thing stuck right now, or tap a ready-made starter below.`,
    ];
  }
  return [
    `我是${teacher.name}。${teacher.tagline}。${teacher.boundary}。\n\n你可以直接说当下最卡的一点，或点下面一句现成的话。`,
  ];
}

export function defaultOpeningChips(locale?: string | null): TeacherTopicChip[] {
  if (isEnglishUiLocale(locale)) return defaultOpeningChipsEn();
  return listReportTeachers().map((t) => ({
    id: t.id,
    label: t.name.replace(/老师$/, '') || t.name,
    teacherId: t.id,
  }));
}

/** Short follow-ups to raise multi-turn rate after first reply */
export function buildContinuationStarters(
  teacher: TeacherDefinition,
  locale?: string | null,
): string[] {
  if (isEnglishUiLocale(locale)) {
    return continuationStartersEn(teacher.starters || []);
  }
  const base = [
    '请把刚才的结论拆成今天 / 7 天 / 30 天三步，要可执行。',
    '我最需要防的误判是什么？给一个可验证的检查点。',
  ];
  const fromTeacher = (teacher.starters || []).slice(1, 3);
  return Array.from(new Set([...base, ...fromTeacher])).slice(0, 3);
}

export function buildTeacherOpening(params: {
  teacherId?: string | null;
  slots?: TeacherOpeningSlots | null;
  greetingIndex?: number;
  chipTeacherId?: string | null;
  /**
   * Optional revisit / archive stats. Safe defaults → no line when empty.
   * Prefer memoryInputFromChatContext(context) from lib/chat/memory-narrative.
   */
  memory?: MemoryNarrativeInput | null;
  /** UI locale — English when starts with `en` (?lang=en or /en/chat). */
  locale?: string | null;
}): TeacherOpeningView {
  const en = isEnglishUiLocale(params.locale);
  const resolvedId = `${params.chipTeacherId || params.teacherId || 'overview'}`.trim();
  const baseTeacher = getTeacher(resolvedId);
  const teacher = localizeTeacher(baseTeacher, params.locale);
  const greetings = allGreetings(teacher, en);
  const rawIndex = Number(params.greetingIndex) || 0;
  const greetingIndex = ((rawIndex % greetings.length) + greetings.length) % greetings.length;
  const template = greetings[greetingIndex] || greetings[0];
  const slots = params.slots || {};
  const hasReportSlots = Boolean(
    `${slots.dayMaster || ''}`.trim() ||
      `${slots.pattern || ''}`.trim() ||
      `${slots.currentDaYun || ''}`.trim(),
  );

  const chips =
    teacher.topicChips && teacher.topicChips.length > 0
      ? teacher.topicChips
      : defaultOpeningChips(params.locale);

  const starters = hasReportSlots
    ? (teacher.starters || []).filter(Boolean).slice(0, 3)
    : en
      ? unboundStartersEn()
      : [
          // Primary path after 去排盘 is analyze; starters are soft fallback only
          '我先用通用框架：现在更该推进还是先稳住？',
          '没有命盘时，怎么设一个 7 天可验证点？',
        ];

  const memoryLine = buildMemoryNarrative(params.memory || {}, params.locale) || null;

  // Unbound: short, no fake 日主— ; banner owns 去排盘 CTA
  // memoryLine stays separate (blue chip) so we don't double-print stats in firstMes.
  const firstMes = hasReportSlots
    ? fillTeacherTemplate(template, slots, params.locale)
    : en
      ? unboundFirstMesEn(teacher.name)
      : `我是${teacher.name}。还没绑定报告，不会编造日主/用神。\n个性化节奏请先去排盘；若只想先理清思路，可点下面一句用通用框架开聊。`;

  return {
    teacher,
    teacherId: teacher.id,
    firstMes,
    starters,
    continuationStarters: buildContinuationStarters(teacher, params.locale),
    chips,
    greetingIndex,
    greetingCount: hasReportSlots ? greetings.length : 1,
    hasReportSlots,
    memoryLine,
  };
}

export function slotsFromChatReport(
  report: {
    name?: string | null;
    dayMaster?: string | null;
    pattern?: string | null;
    currentDaYun?: string | null;
    currentLiuNian?: string | null;
    yongShen?: string[] | string | null;
    bestWindow?: string | null;
    riskWindow?: string | null;
    windowHint?: string | null;
    focusWindow?: string | null;
    recentWindow?: string | null;
    topScenario?: string | null;
  } | null | undefined,
  extra?: { windowHint?: string | null; locale?: string | null },
): TeacherOpeningSlots {
  if (!report && !extra?.windowHint) return {};
  const en = isEnglishUiLocale(extra?.locale);
  const urlHint = `${extra?.windowHint || ''}`.trim();
  const best = `${report?.bestWindow || ''}`.trim();
  const risk = `${report?.riskWindow || ''}`.trim();
  const composed =
    urlHint ||
    `${report?.windowHint || report?.focusWindow || report?.recentWindow || ''}`.trim() ||
    (best || risk
      ? en
        ? `Push reference “${best || '—'}”; caution reference “${risk || '—'}”`
        : `推进参考「${best || '—'}」；谨慎参考「${risk || '—'}」`
      : report?.topScenario
        ? en
          ? `Main scenario: ${report.topScenario}`
          : `主场景：${report.topScenario}`
        : '');

  return {
    name: report?.name,
    dayMaster: report?.dayMaster,
    pattern: report?.pattern,
    currentDaYun: report?.currentDaYun,
    currentLiuNian: report?.currentLiuNian,
    yongShen: report?.yongShen,
    bestWindow: report?.bestWindow,
    riskWindow: report?.riskWindow,
    windowHint: composed || null,
  };
}
