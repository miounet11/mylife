import { COHORT_CALIBRATION_VERSION, COHORT_LENS_IDS, type CohortCalibrationState, type CohortClaimDef, type CohortJudgment, type CohortLensId, type CohortRegion, type CohortVerdict } from './types';

const VERDICTS: CohortVerdict[] = ['like', 'partial', 'unlike', 'unsure'];

function asVerdict(value: unknown): CohortVerdict | null {
  return VERDICTS.includes(value as CohortVerdict) ? (value as CohortVerdict) : null;
}

function asLensId(value: unknown): CohortLensId | null {
  return COHORT_LENS_IDS.includes(value as CohortLensId) ? (value as CohortLensId) : null;
}

export function emptyCalibration(input: {
  birthYear: number;
  cohortKey: string;
  region: CohortRegion;
  now?: Date;
}): CohortCalibrationState {
  return {
    version: COHORT_CALIBRATION_VERSION,
    birthYear: input.birthYear,
    cohortKey: input.cohortKey,
    region: input.region,
    judgments: [],
    confirmedTraits: [],
    deniedTraits: [],
    focusLenses: [],
    updatedAt: (input.now || new Date()).toISOString(),
  };
}

export function sanitizeJudgment(raw: unknown, fallbackLens?: CohortLensId): CohortJudgment | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const claimId = `${row.claimId || ''}`.trim().slice(0, 80);
  const verdict = asVerdict(row.verdict);
  const lensId = asLensId(row.lensId) || fallbackLens || null;
  if (!claimId || !verdict || !lensId) return null;
  const note = `${row.note || ''}`.trim().replace(/\s+/g, ' ').slice(0, 200);
  const forkId = `${row.forkId || ''}`.trim().slice(0, 40);
  const judgedAt = `${row.judgedAt || ''}`.trim();
  return {
    claimId,
    lensId,
    verdict,
    note: note || undefined,
    forkId: forkId || undefined,
    judgedAt: /^\d{4}-\d{2}-\d{2}T/.test(judgedAt) ? judgedAt : new Date().toISOString(),
  };
}

export function sanitizeCalibration(raw: unknown): CohortCalibrationState | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const birthYear = Number(row.birthYear);
  const cohortKey = `${row.cohortKey || ''}`.trim();
  const region = row.region;
  if (!Number.isFinite(birthYear) || birthYear < 1940 || birthYear > 2035) return null;
  if (!cohortKey) return null;
  if (region !== 'cn-mainland' && region !== 'greater-china' && region !== 'overseas') return null;
  const judgments = Array.isArray(row.judgments)
    ? row.judgments
        .map((item) => sanitizeJudgment(item))
        .filter((item): item is CohortJudgment => Boolean(item))
        .slice(-80)
    : [];
  const confirmedTraits = Array.isArray(row.confirmedTraits)
    ? row.confirmedTraits.map((item) => `${item || ''}`.trim()).filter(Boolean).slice(0, 24)
    : [];
  const deniedTraits = Array.isArray(row.deniedTraits)
    ? row.deniedTraits.map((item) => `${item || ''}`.trim()).filter(Boolean).slice(0, 24)
    : [];
  const focusLenses = Array.isArray(row.focusLenses)
    ? row.focusLenses.map((item) => asLensId(item)).filter((item): item is CohortLensId => Boolean(item))
    : [];
  return {
    version: COHORT_CALIBRATION_VERSION,
    birthYear,
    cohortKey,
    region,
    judgments,
    confirmedTraits,
    deniedTraits,
    focusLenses,
    updatedAt: `${row.updatedAt || new Date().toISOString()}`,
  };
}

export function mergeCalibrations(
  current: CohortCalibrationState | null | undefined,
  incoming: CohortCalibrationState | null | undefined,
): CohortCalibrationState | null {
  if (!current) return incoming || null;
  if (!incoming) return current;
  const newerFirst = Date.parse(incoming.updatedAt || '') >= Date.parse(current.updatedAt || '');
  const base = newerFirst ? incoming : current;
  const other = newerFirst ? current : incoming;
  const byClaim = new Map<string, CohortJudgment>();
  for (const item of other.judgments) byClaim.set(item.claimId, item);
  for (const item of base.judgments) byClaim.set(item.claimId, item);
  const merged: CohortCalibrationState = {
    ...base,
    judgments: [...byClaim.values()].sort((a, b) => a.judgedAt.localeCompare(b.judgedAt)),
  };
  return rebuildDerived(merged, []);
}

export function rebuildDerived(
  state: CohortCalibrationState,
  claims: CohortClaimDef[],
): CohortCalibrationState {
  const byId = new Map(claims.map((item) => [item.id, item]));
  const confirmed: string[] = [];
  const denied: string[] = [];
  const focus = new Set<CohortLensId>();
  for (const judgment of state.judgments) {
    const claim = byId.get(judgment.claimId);
    const fork = judgment.forkId ? claim?.forks.find((item) => item.id === judgment.forkId) : undefined;
    if (fork?.trait) {
      confirmed.push(fork.trait);
    }
    if (judgment.verdict === 'like' && claim && !fork) {
      confirmed.push(claim.traitIfLike);
    } else if (judgment.verdict === 'partial' && claim && !fork) {
      confirmed.push(`部分成立：${claim.traitIfLike}`);
    } else if (judgment.verdict === 'unlike' && claim) {
      denied.push(claim.traitIfUnlike);
    }
    if (judgment.verdict === 'unlike' || judgment.verdict === 'partial') {
      focus.add(judgment.lensId);
    }
    if (judgment.note) {
      confirmed.push(`用户补充：${judgment.note}`);
    }
  }
  return {
    ...state,
    confirmedTraits: unique(confirmed).slice(0, 24),
    deniedTraits: unique(denied).slice(0, 24),
    focusLenses: [...focus],
  };
}

export function applyJudgments(
  state: CohortCalibrationState,
  incoming: CohortJudgment | CohortJudgment[],
  claims: CohortClaimDef[],
  now = new Date(),
): CohortCalibrationState {
  const list = Array.isArray(incoming) ? incoming : [incoming];
  const byClaim = new Map(state.judgments.map((item) => [item.claimId, item]));
  for (const item of list) {
    const clean = sanitizeJudgment(item, item.lensId);
    if (!clean) continue;
    byClaim.set(clean.claimId, clean);
  }
  return rebuildDerived(
    {
      ...state,
      judgments: [...byClaim.values()],
      updatedAt: now.toISOString(),
    },
    claims,
  );
}

export function formatCohortMemoryBlock(
  state: CohortCalibrationState | null | undefined,
  opts?: { heading?: string },
): string {
  if (!state || state.judgments.length === 0) return '';
  const heading = opts?.heading || '【世代校准 · 用户已核对的个人事实】';
  const lines = [heading];
  if (state.confirmedTraits.length) {
    lines.push(`已确认（当作环境层输入，不得推翻命局结构）：${state.confirmedTraits.slice(0, 8).join('；')}`);
  }
  if (state.deniedTraits.length) {
    lines.push(`已否认（禁止再写成「你们这代人都…」）：${state.deniedTraits.slice(0, 8).join('；')}`);
  }
  if (state.focusLenses.length) {
    lines.push(`需要改口径的面：${state.focusLenses.join('、')}。`);
  }
  lines.push('未判断的世代条目只作假说，必须邀请用户核对，不得写成已证实的个人经历。');
  return lines.join('\n');
}

export function summarizeCalibration(state: CohortCalibrationState | null | undefined): string {
  if (!state || state.judgments.length === 0) {
    return '尚未用世代经历校准。标几条「像我 / 不像」，下次报告和问顾问会按你的个人事实改口径。';
  }
  const like = state.judgments.filter((item) => item.verdict === 'like').length;
  const unlike = state.judgments.filter((item) => item.verdict === 'unlike').length;
  const partial = state.judgments.filter((item) => item.verdict === 'partial').length;
  const head = `已核对 ${state.judgments.length} 条：像我 ${like}，部分像 ${partial}，不像 ${unlike}。`;
  if (state.confirmedTraits[0]) {
    return `${head} 当前按「${state.confirmedTraits[0]}」来写你的环境层。`;
  }
  return head;
}

function unique(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}
