import { buildCohortClaims } from './claims';
import { getCohortFacts } from './cohorts';
import {
  applyJudgments,
  emptyCalibration,
  mergeCalibrations,
  sanitizeCalibration,
} from './memory';
import type { CohortCalibrationState, CohortJudgment, CohortRegion } from './types';

const STORAGE_KEY = 'lk_cohort_calibration';
const UPDATED_EVENT = 'lk-cohort-calibration-updated';

type Store = Record<string, CohortCalibrationState>;

export function cohortStoreKey(input: {
  birthSignature?: string | null;
  birthYear: number;
  region: CohortRegion;
}): string {
  if (input.birthSignature) return `sig:${input.birthSignature}`;
  return `yr:${input.birthYear}:${input.region}`;
}

function readStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function readCohortCalibration(key: string): CohortCalibrationState | null {
  return sanitizeCalibration(readStore()[key]);
}

export function writeCohortCalibration(key: string, state: CohortCalibrationState): CohortCalibrationState {
  const store = readStore();
  store[key] = state;
  writeStore(store);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UPDATED_EVENT, { detail: { key } }));
  }
  return state;
}

export function recordCohortJudgments(input: {
  key: string;
  birthYear: number;
  cohortKey: string;
  region: CohortRegion;
  judgments: CohortJudgment | CohortJudgment[];
  previous?: CohortCalibrationState | null;
}): CohortCalibrationState {
  const claims = buildCohortClaims(getCohortFacts(input.birthYear), input.region);
  const base =
    mergeCalibrations(input.previous, readCohortCalibration(input.key)) ||
    emptyCalibration({
      birthYear: input.birthYear,
      cohortKey: input.cohortKey,
      region: input.region,
    });
  const next = applyJudgments(base, input.judgments, claims);
  return writeCohortCalibration(input.key, next);
}

export function subscribeCohortCalibration(handler: (key: string) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ key?: string }>;
    if (custom.detail?.key) handler(custom.detail.key);
  };
  window.addEventListener(UPDATED_EVENT, listener);
  return () => window.removeEventListener(UPDATED_EVENT, listener);
}
