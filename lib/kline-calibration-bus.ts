/**
 * Client-only bus: ProUserCalibration → K-line chart/hero live markers.
 * Avoids full page reload after user confirms/denies past nodes.
 */

import type { KlineCalibrationMarker } from '@/lib/kline-calibration';

export const KLINE_CALIBRATION_EVENT = 'life-kline:calibration';

export type KlineCalibrationLivePayload = {
  reportId: string;
  marker: KlineCalibrationMarker;
};

export function emitKlineCalibration(payload: KlineCalibrationLivePayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(KLINE_CALIBRATION_EVENT, {
      detail: payload,
    }),
  );
}

export function subscribeKlineCalibration(
  reportId: string,
  onMarker: (marker: KlineCalibrationMarker) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handler = (ev: Event) => {
    const detail = (ev as CustomEvent<KlineCalibrationLivePayload>).detail;
    if (!detail || detail.reportId !== reportId || !detail.marker) return;
    onMarker(detail.marker);
  };

  window.addEventListener(KLINE_CALIBRATION_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(KLINE_CALIBRATION_EVENT, handler as EventListener);
  };
}

/** Merge live marker into list (same year+kind+title de-dupe, prefer latest). */
export function mergeCalibrationMarker(
  existing: KlineCalibrationMarker[],
  next: KlineCalibrationMarker,
): KlineCalibrationMarker[] {
  const keyOf = (m: KlineCalibrationMarker) =>
    `${m.year}:${m.kind}:${(m.title || '').slice(0, 40)}`;
  const map = new Map(existing.map((m) => [keyOf(m), m]));
  // If same year already exists with opposite kind, replace
  for (const [k, m] of map) {
    if (m.year === next.year && m.kind !== next.kind) {
      map.delete(k);
    }
  }
  map.set(keyOf(next), next);
  return Array.from(map.values())
    .sort((a, b) => a.year - b.year)
    .slice(0, 12);
}

/** Parse a year from occurrence window / title for optimistic markers. */
export function yearFromCalibrationText(value?: string | null): number | null {
  if (!value) return null;
  const m = String(value).match(/(19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return y >= 1900 && y <= 2100 ? y : null;
}
