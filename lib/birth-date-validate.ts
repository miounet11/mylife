/**
 * Shared birth-date validation for free tools, hehun, and APIs.
 * Calendar-safe (local YYYY-MM-DD), rejects future / pre-1900 / absurd ages.
 */

export type BirthDateIssue =
  | 'empty'
  | 'format'
  | 'invalid_calendar'
  | 'too_early'
  | 'future'
  | 'too_old';

export type BirthDateValidation = {
  ok: boolean;
  issue?: BirthDateIssue;
  message?: string;
  /** Normalized YYYY-MM-DD when parseable */
  dateKey?: string;
  /** Local midnight Date when ok or calendar-valid */
  date?: Date;
  /** Whole years of age when ok */
  ageYears?: number;
};

export const BIRTH_DATE_MIN_YEAR = 1900;
export const BIRTH_DATE_MAX_AGE = 120;

const ISSUE_MESSAGE: Record<BirthDateIssue, string> = {
  empty: '请填写出生日期',
  format: '出生日期格式应为 YYYY-MM-DD',
  invalid_calendar: '出生日期不是有效日历日',
  too_early: '出生年份不能早于 1900 年',
  future: '出生日期不能是未来',
  too_old: `年龄超过 ${BIRTH_DATE_MAX_AGE} 岁，请核对出生日期`,
};

export function birthDateIssueMessage(issue: BirthDateIssue): string {
  return ISSUE_MESSAGE[issue];
}

/** Local calendar date key YYYY-MM-DD */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function birthDateInputMin(): string {
  return `${BIRTH_DATE_MIN_YEAR}-01-01`;
}

export function birthDateInputMax(now = new Date()): string {
  return toLocalDateKey(now);
}

function parseCalendarDateKey(value: string): { year: number; month: number; day: number } | null {
  const matched = `${value || ''}`.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!matched) return null;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day };
}

function wholeAgeYears(birth: Date, now: Date): number {
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * Validate a birth date string (prefers YYYY-MM-DD).
 * Future dates are rejected (today is allowed).
 */
export function validateBirthDateString(value: unknown, now = new Date()): BirthDateValidation {
  const raw = `${value ?? ''}`.trim();
  if (!raw) {
    return { ok: false, issue: 'empty', message: ISSUE_MESSAGE.empty };
  }

  const parts = parseCalendarDateKey(raw);
  if (!parts) {
    return { ok: false, issue: 'format', message: ISSUE_MESSAGE.format };
  }

  const { year, month, day } = parts;
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { ok: false, issue: 'invalid_calendar', message: ISSUE_MESSAGE.invalid_calendar };
  }

  const dateKey = toLocalDateKey(date);

  if (year < BIRTH_DATE_MIN_YEAR) {
    return {
      ok: false,
      issue: 'too_early',
      message: ISSUE_MESSAGE.too_early,
      dateKey,
      date,
    };
  }

  const todayKey = toLocalDateKey(now);
  if (dateKey > todayKey) {
    return {
      ok: false,
      issue: 'future',
      message: ISSUE_MESSAGE.future,
      dateKey,
      date,
    };
  }

  const ageYears = wholeAgeYears(date, now);
  if (ageYears > BIRTH_DATE_MAX_AGE) {
    return {
      ok: false,
      issue: 'too_old',
      message: ISSUE_MESSAGE.too_old,
      dateKey,
      date,
      ageYears,
    };
  }

  return {
    ok: true,
    dateKey,
    date,
    ageYears,
  };
}

/** True when payload looks like user tried to send birth fields */
export function hasBirthDatePayload(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  const date = `${o.birthDate || o.date || ''}`.trim();
  return Boolean(date);
}

/**
 * Soft quality flag for very young ages (structure OK, life-stage tools less actionable).
 */
export function isYoungBirthAge(ageYears: number | undefined | null, threshold = 6): boolean {
  return typeof ageYears === 'number' && Number.isFinite(ageYears) && ageYears < threshold;
}
