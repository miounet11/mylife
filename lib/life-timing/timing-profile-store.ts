import path from 'node:path';
import Database from 'better-sqlite3';
import type { TimingProfile, MajorTransition, PastValidation, TimingPoint } from './types';

interface Row {
  user_id: string;
  report_id: string | null;
  birth_signature: string;
  bazi_pillars: string;
  computed_for_year: string;
  past_validations: string;
  next_30_days: string;
  next_12_months: string;
  next_5_years: string;
  computed_at: string;
  schema_version: number;
}

let _db: Database.Database | null = null;
function getDb() {
  if (!_db) {
    _db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  }
  return _db;
}

export interface TimingProfileRecord extends TimingProfile {
  userId: string;
  reportId: string | null;
}

export function getTimingProfile(userId: string): TimingProfileRecord | null {
  const stmt = getDb().prepare('SELECT * FROM user_timing_profiles WHERE user_id = ?');
  const row = stmt.get(userId) as Row | undefined;
  if (!row) return null;
  return mapRow(row);
}

export function saveTimingProfile(input: {
  userId: string;
  reportId: string | null;
  profile: TimingProfile;
}) {
  const stmt = getDb().prepare(`
    INSERT INTO user_timing_profiles
      (user_id, report_id, birth_signature, bazi_pillars, computed_for_year,
       past_validations, next_30_days, next_12_months, next_5_years, computed_at, schema_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(user_id) DO UPDATE SET
      report_id = excluded.report_id,
      birth_signature = excluded.birth_signature,
      bazi_pillars = excluded.bazi_pillars,
      computed_for_year = excluded.computed_for_year,
      past_validations = excluded.past_validations,
      next_30_days = excluded.next_30_days,
      next_12_months = excluded.next_12_months,
      next_5_years = excluded.next_5_years,
      computed_at = excluded.computed_at
  `);
  stmt.run(
    input.userId,
    input.reportId,
    input.profile.birthSignature,
    input.profile.baziPillars,
    input.profile.computedForYear,
    JSON.stringify(input.profile.past_validations),
    JSON.stringify(input.profile.next_30_days),
    JSON.stringify(input.profile.next_12_months),
    JSON.stringify(input.profile.next_5_years),
    input.profile.computedAt
  );
}

export function isProfileFresh(
  record: TimingProfileRecord | null,
  expectedSignature: string,
  currentLiuNianGanZhi: string
): boolean {
  if (!record) return false;
  if (record.birthSignature !== expectedSignature) return false;
  if (record.computedForYear !== currentLiuNianGanZhi) return false;
  return true;
}

function mapRow(row: Row): TimingProfileRecord {
  return {
    userId: row.user_id,
    reportId: row.report_id,
    birthSignature: row.birth_signature,
    baziPillars: row.bazi_pillars,
    computedAt: row.computed_at,
    computedForYear: row.computed_for_year,
    past_validations: safeParse<PastValidation[]>(row.past_validations, []),
    next_30_days: safeParse<TimingPoint[]>(row.next_30_days, []),
    next_12_months: safeParse<TimingPoint[]>(row.next_12_months, []),
    next_5_years: safeParse<MajorTransition[]>(row.next_5_years, []),
  };
}

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
