import type { PipelineResult } from '@/lib/agentic-report/types';

export type EphemeralReportPayload = {
  id: string;
  intent: string | null;
  birthAccuracy: string | null;
  createdAt: string;
  snapshot: {
    result: PipelineResult;
    generatedAt: string;
  };
};

const STORAGE_PREFIX = 'lk_ephemeral_report:';

export function createEphemeralReportId() {
  return `ephemeral_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isEphemeralReportId(id: string) {
  return id.startsWith('ephemeral_');
}

export function cacheEphemeralReport(payload: EphemeralReportPayload) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${payload.id}`, JSON.stringify(payload));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function readEphemeralReport(id: string): EphemeralReportPayload | null {
  if (typeof window === 'undefined' || !isEphemeralReportId(id)) return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as EphemeralReportPayload;
  } catch {
    return null;
  }
}