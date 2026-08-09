/**
 * Single source of truth: pick which fortune/report tools, chat, foundation
 * should bind when the client did not pass reportId.
 *
 * Production pain (feedback 读取不了我的信息):
 * - only ~0.1% fortunes have is_primary=1
 * - callers used getByUserId()[0] with weak ordering
 * - teachers_gallery opens /chat without reportId
 * - soft-deleted rows could still surface
 */

import { fortuneOperations } from '@/lib/database';

export type FortuneLike = {
  id: string;
  userId?: string;
  user_id?: string;
  name?: string;
  intent?: string | null;
  relation?: string | null;
  isPrimary?: boolean | number | null;
  is_primary?: boolean | number | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  deletedAt?: string | null;
  deleted_at?: string | null;
  birthDate?: string;
  birth_date?: string;
  bazi?: unknown;
  analysis?: unknown;
  [key: string]: unknown;
};

export type ResolveUserFortuneOptions = {
  /** Explicit deep-link / client selection */
  reportId?: string | null;
  /**
   * Prefer reports whose intent matches (career/wealth/relationship/…).
   * Also accepts teacher ids (wealth/career/overview) and maps them.
   */
  preferIntent?: string | null;
  /** Prefer relation=self (default true) */
  preferSelf?: boolean;
  /**
   * When no is_primary is set, write the chosen report as primary (once).
   * Safe: only if user currently has zero primary rows.
   */
  ensurePrimary?: boolean;
};

const INTENT_GROUPS: Record<string, string[]> = {
  wealth: ['wealth', 'money', 'finance', '财', '财富', '财运'],
  career: ['career', 'job', 'work', '事业', '工作', '职场'],
  relationship: ['relationship', 'marriage', 'love', '感情', '婚姻', '关系', '合婚'],
  health: ['health', 'body', '健康', '身体'],
  family: ['family', '子女', '家庭'],
  naming: ['naming', '起名', '姓名'],
  overview: ['overview', 'general', '综合', '全面'],
};

/** Map teacher id / free text → intent group key */
export function normalizePreferIntent(raw?: string | null): string | null {
  const s = `${raw || ''}`.trim().toLowerCase();
  if (!s) return null;
  if (INTENT_GROUPS[s]) return s;
  for (const [key, aliases] of Object.entries(INTENT_GROUPS)) {
    if (aliases.some((a) => s === a || s.includes(a))) return key;
  }
  // teacher ids often match keys already
  if (['wealth', 'career', 'relationship', 'health', 'overview'].includes(s)) return s;
  return s;
}

function isDeleted(f: FortuneLike): boolean {
  const d = f.deletedAt ?? f.deleted_at;
  return Boolean(d && `${d}`.trim() && `${d}` !== 'null');
}

function isPrimaryFlag(f: FortuneLike): boolean {
  return f.isPrimary === true || f.isPrimary === 1 || f.is_primary === 1 || f.is_primary === true;
}

function isSelf(f: FortuneLike): boolean {
  const r = `${f.relation || ''}`.trim().toLowerCase();
  return !r || r === 'self' || r === '本人' || r === 'me';
}

function createdMs(f: FortuneLike): number {
  const raw = f.createdAt || f.created_at || f.updatedAt || f.updated_at || '';
  const t = Date.parse(`${raw}`);
  return Number.isFinite(t) ? t : 0;
}

function intentMatches(f: FortuneLike, prefer: string): boolean {
  const intent = `${f.intent || ''}`.trim().toLowerCase();
  if (!intent) return false;
  if (intent === prefer) return true;
  const aliases = INTENT_GROUPS[prefer] || [prefer];
  return aliases.some((a) => intent === a || intent.includes(a));
}

function ownerId(f: FortuneLike): string {
  return `${f.userId || f.user_id || ''}`.trim();
}

function listUserFortunes(userId: string): FortuneLike[] {
  try {
    const list =
      (fortuneOperations as { getByUserId?: (id: string) => FortuneLike[] }).getByUserId?.(userId) ||
      (fortuneOperations as { listByUser?: (id: string) => FortuneLike[] }).listByUser?.(userId) ||
      [];
    if (!Array.isArray(list)) return [];
    return list.filter((f) => f && f.id && !isDeleted(f));
  } catch {
    return [];
  }
}

function ensurePrimaryIfMissing(userId: string, chosen: FortuneLike): void {
  try {
    const list = listUserFortunes(userId);
    if (list.some(isPrimaryFlag)) return;
    const update = (fortuneOperations as {
      update?: (id: string, patch: Record<string, unknown>) => unknown;
    }).update;
    if (typeof update !== 'function') return;
    // Clear any stale primaries (defensive) then set chosen
    for (const f of list) {
      if (isPrimaryFlag(f) && f.id !== chosen.id) {
        try {
          update(f.id, { isPrimary: false });
        } catch {
          // ignore
        }
      }
    }
    update(chosen.id, { isPrimary: true });
  } catch (e) {
    console.warn('[resolve-user-fortune] ensurePrimary failed', e);
  }
}

/**
 * Resolve the fortune a feature should bind for this user.
 */
export function resolveUserFortune(
  userId: string,
  options: ResolveUserFortuneOptions = {},
): FortuneLike | null {
  if (!userId) return null;

  const reportId = `${options.reportId || ''}`.trim();
  const preferIntent = normalizePreferIntent(options.preferIntent);
  const preferSelf = options.preferSelf !== false;
  const ensurePrimary = options.ensurePrimary !== false;

  // 1) Explicit reportId
  if (reportId) {
    try {
      const getById = (fortuneOperations as { getById?: (id: string) => FortuneLike | null }).getById;
      const row = typeof getById === 'function' ? getById(reportId) : null;
      if (row && !isDeleted(row)) {
        const owner = ownerId(row);
        // Owner always; public allow read is handled by callers that need it
        if (!owner || owner === userId) {
          if (ensurePrimary) ensurePrimaryIfMissing(userId, row);
          return row;
        }
        // Non-owner: still return for public deep-link if isPublic (caller checks)
        const isPublic =
          (row as { isPublic?: boolean }).isPublic !== false &&
          (row as { is_public?: number }).is_public !== 0;
        if (isPublic) return row;
      }
    } catch {
      // fall through to list
    }
  }

  const list = listUserFortunes(userId);
  if (!list.length) return null;

  // Stable ranking:
  // When a preferIntent is given and any report matches, intent beats primary
  // (wealth teacher must not silently bind a relationship primary).
  const hasIntentMatch =
    Boolean(preferIntent) && list.some((f) => intentMatches(f, preferIntent!));
  const scored = list.map((f) => {
    let score = 0;
    if (preferIntent && intentMatches(f, preferIntent)) score += 2_000_000;
    if (isPrimaryFlag(f) && !hasIntentMatch) score += 1_000_000;
    if (isPrimaryFlag(f) && hasIntentMatch) score += 10_000; // tie-break only
    if (preferSelf && isSelf(f)) score += 100_000;
    // recency
    score += Math.min(createdMs(f) / 1000, 9_999_999);
    return { f, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0]?.f || null;
  if (!chosen) return null;

  if (ensurePrimary) ensurePrimaryIfMissing(userId, chosen);
  return chosen;
}

/** Convenience: id only */
export function resolveUserFortuneId(
  userId: string,
  options: ResolveUserFortuneOptions = {},
): string | null {
  return resolveUserFortune(userId, options)?.id || null;
}
