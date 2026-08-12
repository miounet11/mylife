/**
 * Yongshen / body-strength engine versioning.
 * Bump when determineYongShen scoring or 取用 rules change so old reports can prompt re-run.
 */

/** Bump this when lib/bazi-analyzer 用神/强弱 logic changes. */
export const YONGSHEN_ENGINE_VERSION = '2026-08-12-user-facing-v3';

export function isYongShenVersionCurrent(version: string | null | undefined): boolean {
  return `${version || ''}`.trim() === YONGSHEN_ENGINE_VERSION;
}

export function readStoredYongShenEngineVersion(result: unknown): string | null {
  const r = (result || {}) as Record<string, unknown>;
  const analysis = (r.analysis || {}) as Record<string, unknown>;
  const versions = (analysis.engineVersions || r.engineVersions || {}) as Record<string, unknown>;
  const v = versions.yongShen || r.yongShenEngineVersion;
  return v ? `${v}`.trim() : null;
}
