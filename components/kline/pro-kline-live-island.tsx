'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import type { ProKlinePeak } from '@/lib/report-pro-view';
import type { KlineCalibrationMarker } from '@/lib/kline-calibration';
import { buildPersonalKlineHighlight } from '@/lib/kline-showcase';
import {
  mergeCalibrationMarker,
  subscribeKlineCalibration,
} from '@/lib/kline-calibration-bus';
import PersonalKlineHero from '@/components/kline/personal-kline-hero';
import ProKlineSection from '@/components/report-pro/pro-kline-section';
import { ReportIllustrationCite } from '@/components/report/report-illustration-cite';

/**
 * Client island: hero + full K-line share one live calibration marker list.
 * Listens for ProUserCalibration events so markers appear without reload.
 * Optional `between` slot preserves reading order (e.g. 四柱 between hero and chart).
 */
export default function ProKlineLiveIsland({
  reportId,
  klineData,
  peak,
  trough,
  birthYear,
  yongShen,
  jiShen,
  dayun,
  publicName,
  locale,
  initialMarkers,
  between,
}: {
  reportId: string;
  klineData?: FortuneAnalysisResult['klineData'] | null;
  peak: ProKlinePeak | null;
  trough?: ProKlinePeak | null;
  birthYear?: number;
  yongShen?: string[];
  jiShen?: string[];
  dayun?: unknown;
  publicName?: string;
  locale?: string | null;
  initialMarkers?: KlineCalibrationMarker[] | null;
  /** Inserted after hero (e.g. pillars bar) before the full chart */
  between?: ReactNode;
}) {
  const [markers, setMarkers] = useState<KlineCalibrationMarker[]>(
    () => (Array.isArray(initialMarkers) ? initialMarkers : []),
  );
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setMarkers(Array.isArray(initialMarkers) ? initialMarkers : []);
  }, [initialMarkers]);

  useEffect(() => {
    return subscribeKlineCalibration(reportId, (marker) => {
      setMarkers((prev) => mergeCalibrationMarker(prev, marker));
      setFlash(
        marker.kind === 'confirmed'
          ? `已标到 K 线：${marker.year} 年 ✓ ${marker.title || '确认节点'}`
          : `已标到 K 线：${marker.year} 年 × ${marker.title || '未发生'}`,
      );
      window.setTimeout(() => setFlash(null), 4200);
      const el = document.getElementById('pro-kline');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }, [reportId]);

  const highlight = useMemo(
    () =>
      buildPersonalKlineHighlight(klineData as any, {
        birthYear,
        calibrationMarkers: markers,
      }),
    [klineData, birthYear, markers],
  );

  return (
    <>
      <PersonalKlineHero highlight={highlight} anchorId="pro-kline" />

      {flash ? (
        <div
          role="status"
          className="rounded-[10px] border border-[color:var(--data-up)]/25 bg-[rgba(47,125,82,0.08)] px-3 py-2 text-[12px] font-medium text-[color:var(--data-up)]"
        >
          {flash}
          <a href="#pro-kline" className="ml-2 underline-offset-2 hover:underline">
            查看曲线
          </a>
        </div>
      ) : null}

      {between}

      <div id="pro-kline" className="scroll-mt-header space-y-3">
        <ReportIllustrationCite keys={['dayun', 'timing']} title="节奏窗口" limit={1} />
        <ProKlineSection
          klineData={klineData}
          peak={peak}
          trough={trough}
          birthYear={birthYear}
          yongShen={yongShen}
          jiShen={jiShen}
          dayun={dayun}
          publicName={publicName}
          reportId={reportId}
          locale={locale}
          calibrationMarkers={markers}
        />
      </div>
    </>
  );
}
