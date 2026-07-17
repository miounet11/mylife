/**
 * Consultant-card opening (P0): first_mes + starters + topic chips.
 * Tavern/Character.AI style mechanics, advisor content only.
 */

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
  /** e.g. 近期关注某窗口；可空 */
  windowHint?: string | null;
};

export type TeacherOpeningView = {
  teacher: TeacherDefinition;
  teacherId: TeacherId;
  firstMes: string;
  starters: string[];
  chips: TeacherTopicChip[];
  greetingIndex: number;
  greetingCount: number;
  hasReportSlots: boolean;
};

const SLOT_DEFAULTS: Required<Record<keyof TeacherOpeningSlots, string>> = {
  name: '你',
  dayMaster: '—',
  pattern: '—',
  currentDaYun: '—',
  windowHint: '',
};

export function fillTeacherTemplate(template: string, slots: TeacherOpeningSlots = {}): string {
  const merged = {
    name: `${slots.name || ''}`.trim() || SLOT_DEFAULTS.name,
    dayMaster: `${slots.dayMaster || ''}`.trim() || SLOT_DEFAULTS.dayMaster,
    pattern: `${slots.pattern || ''}`.trim() || SLOT_DEFAULTS.pattern,
    currentDaYun: `${slots.currentDaYun || ''}`.trim() || SLOT_DEFAULTS.currentDaYun,
    windowHint: `${slots.windowHint || ''}`.trim(),
  };
  let windowHintText = merged.windowHint;
  if (windowHintText && !/[。！？]$/.test(windowHintText)) {
    windowHintText = `${windowHintText}。`;
  }

  return template
    .replace(/\{\{name\}\}/g, merged.name)
    .replace(/\{\{dayMaster\}\}/g, merged.dayMaster)
    .replace(/\{\{pattern\}\}/g, merged.pattern)
    .replace(/\{\{currentDaYun\}\}/g, merged.currentDaYun)
    .replace(/\{\{windowHint\}\}/g, windowHintText)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function allGreetings(teacher: TeacherDefinition): string[] {
  const list = [teacher.firstMes, ...(teacher.alternateGreetings || [])].filter(
    (x): x is string => Boolean(x && `${x}`.trim()),
  );
  if (list.length) return list;
  // Fallback for teachers without firstMes yet
  return [
    `我是${teacher.name}。${teacher.tagline}。${teacher.boundary}。\n\n你可以直接说当下最卡的一点，或点下面一句现成的话。`,
  ];
}

/** Default chips: P0 report teachers */
export function defaultOpeningChips(): TeacherTopicChip[] {
  return listReportTeachers().map((t) => ({
    id: t.id,
    label: t.name.replace(/老师$/, '') || t.name,
    teacherId: t.id,
  }));
}

export function buildTeacherOpening(params: {
  teacherId?: string | null;
  slots?: TeacherOpeningSlots | null;
  greetingIndex?: number;
  /** When chip points to another teacher */
  chipTeacherId?: string | null;
}): TeacherOpeningView {
  const resolvedId = `${params.chipTeacherId || params.teacherId || 'overview'}`.trim();
  const teacher = getTeacher(resolvedId);
  const greetings = allGreetings(teacher);
  const rawIndex = Number(params.greetingIndex) || 0;
  const greetingIndex = ((rawIndex % greetings.length) + greetings.length) % greetings.length;
  const template = greetings[greetingIndex] || greetings[0];
  const slots = params.slots || {};
  const hasReportSlots = Boolean(
    `${slots.dayMaster || ''}`.trim() || `${slots.pattern || ''}`.trim() || `${slots.currentDaYun || ''}`.trim(),
  );

  const chips =
    teacher.topicChips && teacher.topicChips.length > 0
      ? teacher.topicChips
      : defaultOpeningChips();

  const starters = (teacher.starters || []).filter(Boolean).slice(0, 3);

  return {
    teacher,
    teacherId: teacher.id,
    firstMes: fillTeacherTemplate(template, slots),
    starters,
    chips,
    greetingIndex,
    greetingCount: greetings.length,
    hasReportSlots,
  };
}

export function slotsFromChatReport(report: {
  name?: string | null;
  dayMaster?: string | null;
  pattern?: string | null;
  currentDaYun?: string | null;
  windowHint?: string | null;
  focusWindow?: string | null;
  recentWindow?: string | null;
} | null | undefined): TeacherOpeningSlots {
  if (!report) return {};
  const windowHint =
    `${report.windowHint || report.focusWindow || report.recentWindow || ''}`.trim() ||
    '我会按结构、阶段与可执行下一步来答，';
  return {
    name: report.name,
    dayMaster: report.dayMaster,
    pattern: report.pattern,
    currentDaYun: report.currentDaYun,
    windowHint,
  };
}
