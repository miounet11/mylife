/**
 * English-native teacher chrome for P0 + P1 (+ expert_chart) advisors.
 * Used by buildTeacherOpening when UI locale is English.
 * No invented 用神 / day-master claims — templates only use real slots.
 */

import type { TeacherDefinition, TeacherId, TeacherTopicChip } from '@/lib/teachers';
import { normalizeSiteLocale, type SiteLocale } from '@/lib/i18n/site-locale';

export type TeacherCopyOverlay = Pick<
  TeacherDefinition,
  'name' | 'tagline' | 'boundary' | 'starters' | 'firstMes' | 'alternateGreetings' | 'topicChips'
>;

/** True when UI should use English teacher strings (locale starts with en). */
export function isEnglishUiLocale(locale?: string | null): boolean {
  const n = normalizeSiteLocale(locale);
  if (n === 'en') return true;
  const raw = `${locale || ''}`.trim().toLowerCase();
  return raw === 'en' || raw.startsWith('en-') || raw.startsWith('en_');
}

export function resolveUiLocale(locale?: string | null): SiteLocale {
  return normalizeSiteLocale(locale) || 'zh-CN';
}

const CHIP_LABELS_EN: Partial<Record<TeacherId, string>> = {
  overview: 'Overview',
  career: 'Career',
  wealth: 'Wealth',
  relationship: 'Relationships',
  timing: 'Timing',
  health: 'Rhythm',
  practice: 'Practice',
  geo: 'Place',
  hehun: 'Compatibility',
  study: 'Study',
  partnership: 'Partnership',
  naming: 'Naming',
  timing_selection: 'Date pick',
  guide: 'Report path',
  terms: 'Terms',
  expert_chart: 'Chart',
};

function chips(
  items: Array<{ id: string; teacherId: TeacherId }>,
): TeacherTopicChip[] {
  return items.map((item) => ({
    id: item.id,
    teacherId: item.teacherId,
    label: CHIP_LABELS_EN[item.teacherId] || item.id,
  }));
}

/**
 * P0 + P1 (+ expert_chart) English overlays: name, tagline, boundary, starters, firstMes.
 * Placeholders match fillTeacherTemplate ({{name}}, {{dayMaster}}, …).
 */
export const TEACHER_COPY_EN: Partial<Record<TeacherId, TeacherCopyOverlay>> = {
  overview: {
    name: 'Overview Guide',
    tagline: 'Pull the full report into one clear priority line',
    boundary: 'Priority and next steps only — detail can go to other guides',
    firstMes:
      "I'm the Overview Guide. I've loaded {{name}}'s chart: day master {{dayMaster}}, pattern {{pattern}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nStructure for reference — it doesn't replace your real-world choices.\n\nFirst align: are you stuck on \"what to do first\", or \"I know but can't move\"?\nReply A / B, or tap a starter below.",
    alternateGreetings: [
      "Overview here. Day master {{dayMaster}}, luck cycle {{currentDaYun}} loaded. {{bestWindowLine}}{{riskWindowLine}}\nIf we push only one thread, is it career, wealth, or relationships & rhythm? Pick a topic or a starter.",
      "No jargon first. From your report: conclusion → basis → next step. {{yongShenLine}}Want a 30-day checklist, or a check on whether the direction is off?",
    ],
    starters: [
      'From this report, what should I handle first right now?',
      'If I can only do one thing in the next 30 days, what is it?',
      'How do I tell whether I am on a fitting path?',
    ],
    topicChips: chips([
      { id: 'overview', teacherId: 'overview' },
      { id: 'career', teacherId: 'career' },
      { id: 'wealth', teacherId: 'wealth' },
      { id: 'relationship', teacherId: 'relationship' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'health', teacherId: 'health' },
    ]),
  },
  career: {
    name: 'Career Guide',
    tagline: 'Work rhythm, role fit, and move windows',
    boundary: 'Industry and rhythm reference — not hiring guarantees',
    firstMes:
      "I'm the Career Guide. Looking at {{name}}'s chart: day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{bestWindowLine}}{{riskWindowLine}}{{windowHint}}\nRhythm and conditions only — no offer guarantees.\n\nStuck on direction (switch or stay) or timing (when to move)?\nReply A direction / B timing, or tap a starter.",
    alternateGreetings: [
      'Career alignment: deepen, switch, or stabilize first — which leans closer? {{bestWindowLine}}One line on your situation; I close with structure.',
      'If only one proactive move in 3–6 months: fear missing a window, or moving the wrong way? {{riskWindowLine}}Pick one; I split conditions and pitfalls.',
    ],
    starters: [
      'In the next 3–6 months, should I deepen, switch, or stabilize first?',
      'Given my city and industry, how should I read a job-switch window? What signals worry you most?',
      'No fluff: give me career steps for today / 7 days / 30 days.',
    ],
    topicChips: chips([
      { id: 'career', teacherId: 'career' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'wealth', teacherId: 'wealth' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  wealth: {
    name: 'Wealth Guide',
    tagline: 'Cash rhythm, leverage limits, and steady plans',
    boundary: 'Rhythm and discipline only — not investment advice or return promises',
    firstMes:
      "I'm the Wealth Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nRhythm and discipline only — not investment advice.\n\nDo you need to protect the base (cash flow / debt), or try a small monetization step?\nReply \"hold\" or \"try\", or tap a starter.",
    alternateGreetings: [
      'Wealth boundary: next half-year, fear tight cash more, or reckless leverage? {{riskWindowLine}}Pick one; we talk structure.',
      'No \"must win\" talk. {{yongShenLine}}Better fit: saving, skill monetization, or controlled experiments? Tell me the recent picture.',
    ],
    starters: [
      'By my structure, is saving, skill monetization, or a small trial a better fit now?',
      'Given living costs, what should I protect first financially?',
      'Which money moves need extra caution in the next six months?',
    ],
    topicChips: chips([
      { id: 'wealth', teacherId: 'wealth' },
      { id: 'career', teacherId: 'career' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  relationship: {
    name: 'Relationship Guide',
    tagline: 'Relationship pace, boundaries, and communication',
    boundary: 'Pace and boundaries only — cannot replace either person’s real choice',
    firstMes:
      "I'm the Relationship Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nPace and boundaries only — not a substitute for either person’s choice.\n\nDo you need to advance expression/commitment, or clarify your own pace and limits first?\nReply \"advance\" or \"clarify\", or tap a starter.",
    alternateGreetings: [
      'Relationship close: stuck on \"continue or not\", or \"how to talk without draining\"? {{bestWindowLine}}One line on reality — I won’t invent the other person.',
      'If half a year allows only one class of moves: serious dating, cool-down watch, or self-first — which leans closer?',
    ],
    starters: [
      'At this stage, should I advance the relationship or sort my own rhythm first?',
      'What boundary should I hold in communication? What counts as pushing too hard?',
      'How should I judge windows for serious dating or commitment over the next six months?',
    ],
    topicChips: chips([
      { id: 'relationship', teacherId: 'relationship' },
      { id: 'health', teacherId: 'health' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  health: {
    name: 'Rhythm Guide',
    tagline: 'Sleep, load, and recovery pace',
    boundary: 'Lifestyle reference only — not medical diagnosis or treatment',
    firstMes:
      "I'm the Rhythm Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nSleep and load only — I don’t diagnose illness.\n\nLately more: poor sleep, tight nerves, or an overloaded calendar?\nOne word, or tap a starter; medical care is not decided here.",
    alternateGreetings: [
      'Rhythm first: sleep, movement, or stress/boundaries? Pick one main cut; I sketch a 7/30-day plan (non-medical).',
      'If 90 days allow one lifestyle rhythm change, what do you want to stabilize first? Describe the current state.',
    ],
    starters: [
      'Should I adjust sleep, exercise, or stress management first?',
      'How should a 90-day care plan look so it stays sustainable? Give checkable markers.',
      'Which life signals deserve priority attention (explicitly not disease judgment)?',
    ],
    topicChips: chips([
      { id: 'health', teacherId: 'health' },
      { id: 'career', teacherId: 'career' },
      { id: 'relationship', teacherId: 'relationship' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  timing: {
    name: 'Timing Guide',
    tagline: 'This month and quarter: when to push, when to pull back',
    boundary: 'Window and cost reference — major decisions still need real-world conditions',
    firstMes:
      "I'm the Timing Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{bestWindowLine}}{{riskWindowLine}}{{windowHint}}\nWindows and costs only — layer real conditions on major calls.\n\nJudge this month: what class of things to push, or what must pause?\nReply \"push\" or \"pause\", or tap a starter.",
    alternateGreetings: [
      'Time-window alignment: any dated move (sign, switch jobs, move home)? {{bestWindowLine}}If yes, say the date; if not, start with \"what to push this month\".',
      'Short cycle: in 7–30 days, fear moving early or late more? {{riskWindowLine}}Pick one; I split probe vs hold.',
    ],
    starters: [
      'What should I push this month? What is better deferred?',
      'Over the next quarter, how should I time signing or public expression?',
      'If the phase is defensive, how should work and life rhythm look in practice?',
    ],
    topicChips: chips([
      { id: 'timing', teacherId: 'timing' },
      { id: 'career', teacherId: 'career' },
      { id: 'wealth', teacherId: 'wealth' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  geo: {
    name: 'Place Guide',
    tagline: 'City fit, direction, and home/work environment rhythm',
    boundary: 'Environment and rhythm only — not real-estate, renovation, or immigration advice',
    firstMes:
      "I'm the Place Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nEnvironment and rhythm only — not property or immigration advice.\n\nMore about city fit, a possible move, or small desk/home adjustments without relocating?\nReply with one focus, or tap a starter.",
    alternateGreetings: [
      'Place alignment: city match first, or micro-environment (desk / bedroom orientation) first? {{bestWindowLine}}One line on where you are.',
      'Not moving yet is fine. What one environment tweak would reduce friction most in the next 30 days?',
    ],
    starters: [
      'Does my current city match the rhythm of this chart?',
      'If I consider a city change or move, which conditions come first?',
      'Without relocating, what office or home direction tweaks help?',
    ],
    topicChips: chips([
      { id: 'geo', teacherId: 'geo' },
      { id: 'career', teacherId: 'career' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  practice: {
    name: 'Practice Guide',
    tagline: 'Compare what you already did, then adjust the next move',
    boundary: 'Adjusts from your records and feedback — no destiny verdicts',
    firstMes:
      "I'm the Practice Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{windowHint}}\nWe go record → compare → correct — no destiny verdicts.\n\nThis time: review why things drifted, or plan the next verifiable action?\nReply \"review\" or \"next\", or tap a starter.",
    alternateGreetings: [
      'Practice check: put outcomes back into structure. {{yongShenLine}}Was the drift more timing, execution, or information judgment? Pick a cut.',
      'Hits and misses both matter. Name one recent event; I split what held and what to change.',
    ],
    starters: [
      'Against the last advice, how did my last 30 days go? What should change next?',
      'From recent events, should I push or pull back?',
      'Where things missed: more timing, execution, or information judgment?',
    ],
    topicChips: chips([
      { id: 'practice', teacherId: 'practice' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'career', teacherId: 'career' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  // ── P1 ──
  hehun: {
    name: 'Compatibility Guide',
    tagline: 'Two-person rhythm differences and how to align',
    boundary: 'Pace and difference reference only — cannot replace either person’s real choice',
    firstMes:
      "I'm the Compatibility Guide. Looking at {{name}}'s chart: day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nDifferences and pace only — not a substitute for either person’s choice.\n\nMore stuck on where the two of you diverge, or whether to push commitment vs clarify boundaries first?\nReply with one focus, or tap a starter.",
    starters: [
      'Where do our rhythms differ most, and how can we align?',
      'At this stage, should we advance commitment or clarify boundaries first?',
    ],
    topicChips: chips([
      { id: 'hehun', teacherId: 'hehun' },
      { id: 'relationship', teacherId: 'relationship' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  study: {
    name: 'Study Guide',
    tagline: 'Learning, exams, and direction rhythm',
    boundary: 'Direction and pace reference only — no exam-result promises',
    firstMes:
      "I'm the Study Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nPace and direction only — I don’t promise scores or admissions.\n\nMore about exam prep rhythm, or a longer study/career direction choice?\nReply with one focus, or tap a starter.",
    starters: [
      'In this exam or admissions phase, how should I pace my study?',
      'Given my structure, should I deepen a track or keep options open for now?',
    ],
    topicChips: chips([
      { id: 'study', teacherId: 'study' },
      { id: 'career', teacherId: 'career' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  partnership: {
    name: 'Partnership Guide',
    tagline: 'Collaborator fit and division-of-labor boundaries',
    boundary: 'Collaboration profile only — not due diligence or legal advice',
    firstMes:
      "I'm the Partnership Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nCollaboration fit and boundaries only — not legal or diligence advice.\n\nStuck on who to partner with, or how to split roles and risk?\nReply with one focus, or tap a starter.",
    starters: [
      'What type of person am I better suited to partner with long term?',
      'How should I set role and risk boundaries before deepening a collaboration?',
    ],
    topicChips: chips([
      { id: 'partnership', teacherId: 'partnership' },
      { id: 'career', teacherId: 'career' },
      { id: 'wealth', teacherId: 'wealth' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  naming: {
    name: 'Naming Guide',
    tagline: 'How a name relates to favorable-element direction',
    boundary: 'Cultural and structural reference only — no fortune-result promises',
    firstMes:
      "I'm the Naming Guide. Day master {{dayMaster}}, pattern {{pattern}}. {{yongShenLine}}{{windowHint}}\nStructure and cultural fit only — I don’t promise destiny outcomes.\n\nReviewing an existing name, or choosing among shortlisted options?\nReply with one focus, or tap a starter.",
    starters: [
      'Does this name align with the favorable direction of my chart?',
      'What structural checks should I use when comparing name options?',
    ],
    topicChips: chips([
      { id: 'naming', teacherId: 'naming' },
      { id: 'terms', teacherId: 'terms' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  timing_selection: {
    name: 'Date Selection Guide',
    tagline: 'Event windows ranked with do/avoid notes',
    boundary: 'Time-window reference only — medical and legal matters follow professionals first',
    firstMes:
      "I'm the Date Selection Guide. Day master {{dayMaster}}, luck cycle {{currentDaYun}}. {{bestWindowLine}}{{riskWindowLine}}{{windowHint}}\nWindows and costs only — medical/legal calls stay with professionals.\n\nDo you have a dated event (sign, move, ceremony), or need a 90-day ranking first?\nReply with the event type or a date, or tap a starter.",
    starters: [
      'In the next 90 days, which windows better fit signing or moving?',
      'If I must pick a date, what should I prioritize and what should I avoid?',
    ],
    topicChips: chips([
      { id: 'timing_selection', teacherId: 'timing_selection' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'career', teacherId: 'career' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  guide: {
    name: 'Report Guide',
    tagline: 'Which parts of this report to read first',
    boundary: 'Reading path only — does not re-cast the chart',
    firstMes:
      "I'm the Report Guide. Chart loaded for {{name}}: day master {{dayMaster}}, pattern {{pattern}}, luck cycle {{currentDaYun}}. {{windowHint}}\nI only map a reading path — I won’t re-cast or invent structure.\n\nShort on time, or want a full tour in order?\nReply \"short\" or \"full\", or tap a starter.",
    starters: [
      'In what order should I read this report?',
      'If I only have 10 minutes, which sections matter most right now?',
    ],
    topicChips: chips([
      { id: 'guide', teacherId: 'guide' },
      { id: 'overview', teacherId: 'overview' },
      { id: 'terms', teacherId: 'terms' },
      { id: 'expert_chart', teacherId: 'expert_chart' },
    ]),
  },
  terms: {
    name: 'Terms Guide',
    tagline: 'Day master, favorable elements, luck cycles — plain language',
    boundary: 'Concept explainers only, illustrated with fields from this chart',
    firstMes:
      "I'm the Terms Guide. On this chart: day master {{dayMaster}}, pattern {{pattern}}, luck cycle {{currentDaYun}}. {{yongShenLine}}\nConcepts plus your fields only — not a full life verdict.\n\nWhich term is unclear: day master, favorable focus, or luck cycle?\nName one, or tap a starter.",
    starters: [
      'What does “favorable focus” mean on my chart specifically?',
      'In plain language, what do day master and luck cycle tell me?',
    ],
    topicChips: chips([
      { id: 'terms', teacherId: 'terms' },
      { id: 'guide', teacherId: 'guide' },
      { id: 'expert_chart', teacherId: 'expert_chart' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
  // ── P2 ──
  expert_chart: {
    name: 'Chart Guide',
    tagline: 'Pillars, ten gods, and year/luck deep read',
    boundary: 'Professional structure reference for users who want deeper chart detail',
    firstMes:
      "I'm the Chart Guide. Day master {{dayMaster}}, pattern {{pattern}}, luck cycle {{currentDaYun}}. {{yongShenLine}}{{windowHint}}\nStructure deep-read only — still not a substitute for real-world choices.\n\nWant pillar-by-pillar structure, or current year/luck interaction first?\nReply \"pillars\" or \"stage\", or tap a starter.",
    starters: [
      'Walk me through the structural points of my current stage via pillars and year/luck.',
      'How should I read ten gods against my day master without drowning in jargon?',
    ],
    topicChips: chips([
      { id: 'expert_chart', teacherId: 'expert_chart' },
      { id: 'terms', teacherId: 'terms' },
      { id: 'timing', teacherId: 'timing' },
      { id: 'overview', teacherId: 'overview' },
    ]),
  },
};

/** UI-facing name / tagline / boundary (list cards, hub, picker). */
export type TeacherPresentation = Pick<TeacherDefinition, 'name' | 'tagline' | 'boundary'>;

/**
 * Resolve display name/tagline/boundary for a teacher at the given UI locale.
 * EN uses TEACHER_COPY_EN overlays; teachers without overlay soft-rename "老师" → " Guide".
 */
export function resolveTeacherPresentation(
  teacher: TeacherDefinition,
  locale?: string | null,
): TeacherPresentation {
  if (!isEnglishUiLocale(locale)) {
    return {
      name: teacher.name,
      tagline: teacher.tagline,
      boundary: teacher.boundary,
    };
  }
  const en = TEACHER_COPY_EN[teacher.id];
  if (!en) {
    return {
      name: teacher.name.replace(/老师$/, ' Guide'),
      tagline: teacher.tagline,
      boundary: teacher.boundary,
    };
  }
  return {
    name: en.name,
    tagline: en.tagline,
    boundary: en.boundary,
  };
}

/** Merge EN overlay onto a teacher definition (zh fields remain default). */
export function localizeTeacher(
  teacher: TeacherDefinition,
  locale?: string | null,
): TeacherDefinition {
  if (!isEnglishUiLocale(locale)) return teacher;
  const presentation = resolveTeacherPresentation(teacher, locale);
  const en = TEACHER_COPY_EN[teacher.id];
  if (!en) {
    // Soft fallback for non-P0: translate display name lightly via generic frame
    return {
      ...teacher,
      ...presentation,
      // keep Chinese tagline/starters if no overlay — better than inventing claims
    };
  }
  return {
    ...teacher,
    name: presentation.name,
    tagline: presentation.tagline,
    boundary: presentation.boundary,
    starters: en.starters?.length ? en.starters : teacher.starters,
    firstMes: en.firstMes ?? teacher.firstMes,
    alternateGreetings: en.alternateGreetings ?? teacher.alternateGreetings,
    topicChips: en.topicChips ?? teacher.topicChips,
  };
}

export function defaultOpeningChipsEn(): TeacherTopicChip[] {
  return chips([
    { id: 'overview', teacherId: 'overview' },
    { id: 'career', teacherId: 'career' },
    { id: 'wealth', teacherId: 'wealth' },
    { id: 'relationship', teacherId: 'relationship' },
    { id: 'timing', teacherId: 'timing' },
    { id: 'health', teacherId: 'health' },
  ]);
}

/** Unbound (no report) first-message template — English. */
export function unboundFirstMesEn(teacherName: string): string {
  return `I'm ${teacherName}. No report is linked yet — I won't invent day master or favorable elements.\nFor a personalized rhythm, create a chart first. To think with a general framework, tap a starter below.`;
}

export function unboundStartersEn(): string[] {
  return [
    'Using a general framework: should I push forward or stabilize first?',
    'Without a chart, how do I set a 7-day checkpoint I can verify?',
  ];
}

export function continuationStartersEn(teacherStarters: string[]): string[] {
  const base = [
    'Break the last conclusion into today / 7 days / 30 days — make it actionable.',
    'What misread should I guard against most? Give one verifiable checkpoint.',
  ];
  const fromTeacher = (teacherStarters || []).slice(1, 3);
  return Array.from(new Set([...base, ...fromTeacher])).slice(0, 3);
}
