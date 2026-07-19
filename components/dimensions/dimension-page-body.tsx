'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import DimensionReportShell from '@/components/dimensions/dimension-report-shell';
import type { DimensionDefinition } from '@/lib/dimensions/types';
import type { DimensionReport } from '@/lib/dimensions/types';
import type { DimensionSlug } from '@/lib/dimensions/types';
import { dimensionDetailCopy, dimensionUiCopy } from '@/lib/i18n/dimensions-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { hydrateLifeProfilesFromServer, recordDimensionVisit } from '@/lib/life-profile/store';
import { savePredictions } from '@/lib/predictions/store';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { buildTeacherChatHref, teacherFromDimensionSlug } from '@/lib/teachers';
import { fetchJsonWithTimeout } from '@/lib/utils';

function buildDimensionTeacherChatHref(slug: string, windowLabel: string | null) {
  const teacher = teacherFromDimensionSlug(slug);
  return buildTeacherChatHref({
    teacherId: teacher.id,
    window: windowLabel || null,
    source: `dimension_${slug}_consultant`,
  });
}

function DimensionAskTeacherCta({
  slug,
  windowLabel,
  label,
  variant = 'link',
}: {
  slug: string;
  windowLabel: string;
  label: string;
  variant?: 'link' | 'primary';
}) {
  const href = buildDimensionTeacherChatHref(slug, windowLabel);

  if (variant === 'primary') {
    return (
      <Link href={href} className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center text-[13px] font-medium text-[color:var(--ink-2)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
    >
      {label}
    </Link>
  );
}

export default function DimensionPageBody({
  dimension,
  runnable,
  locale = 'zh-CN',
}: {
  dimension: DimensionDefinition;
  runnable: boolean;
  locale?: SiteLocale;
}) {
  const copy = useMemo(() => dimensionDetailCopy(locale), [locale]);
  const ui = useMemo(
    () => dimensionUiCopy(locale, dimension.slug as DimensionSlug),
    [locale, dimension.slug],
  );
  const teacherWindow = copy.teacherWindow(ui.title);

  const [loading, setLoading] = useState(runnable);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'synced' | 'error'>('idle');
  const [error, setError] = useState('');
  const [report, setReport] = useState<DimensionReport | null>(null);

  const syncPredictions = useCallback(async (predictions: DimensionReport['predictions']) => {
    if (!predictions.length) {
      setSyncStatus('idle');
      return;
    }
    setSyncing(true);
    try {
      savePredictions(predictions);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!runnable) return;
    setLoading(true);
    setError('');
    setSyncStatus('idle');
    try {
      const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
        '/api/profile/settings',
        { timeoutMs: 8000, timeoutReason: 'dimension-profile-settings' },
      );
      if (!response.ok || !data.success) {
        setError(copy.errorProfileRead);
        return;
      }

      const primary = data.fortunes.find((item) => item.isPrimary) || data.fortunes[0];
      if (!primary?.birthDate) {
        setError(copy.errorNoBirth);
        return;
      }

      await hydrateLifeProfilesFromServer();

      const analyzeRes = await fetch(`/api/dimensions/${dimension.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate: primary.birthDate,
          birthTime: primary.birthTime,
          birthPlace: primary.birthPlace,
          birthAccuracy: primary.birthAccuracy,
          gender: primary.gender,
          name: primary.name || primary.label,
        }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok || !analyzeData.success || !analyzeData.report) {
        setError(analyzeData.error || copy.errorAnalyzeFail);
        return;
      }

      const nextReport = analyzeData.report as DimensionReport;
      setReport(nextReport);

      const signature = nextReport.birthSignature;
      if (signature) {
        recordDimensionVisit(signature, dimension.slug);
      }

      // Auto-sync so users don't miss prediction feedback loop
      if (nextReport.predictions?.length) {
        await syncPredictions(nextReport.predictions);
      }
    } catch {
      setError(copy.errorNetwork);
    } finally {
      setLoading(false);
    }
  }, [copy, dimension.slug, runnable, syncPredictions]);

  useEffect(() => {
    void runAnalysis();
  }, [runAnalysis]);

  const handleSyncPredictions = async () => {
    if (!report?.predictions.length) return;
    await syncPredictions(report.predictions);
  };

  if (!runnable) {
    const analyzeHref = dimension.relatedIntent
      ? `/analyze?intent=${dimension.relatedIntent}&source=dimension_${dimension.slug}`
      : `/analyze?source=dimension_${dimension.slug}`;

    return (
      <section className="fb-card space-y-4 p-5">
        <p className="text-[14px] leading-[1.6] text-[color:var(--ink-2)]">
          {copy.notReady(ui.title)}
        </p>
        {ui.disclaimer ? (
          <p className="text-[12px] text-[color:var(--ink-3)]">{ui.disclaimer}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href={analyzeHref} className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
            {copy.generateReport}
          </Link>
          <DimensionAskTeacherCta
            slug={dimension.slug}
            windowLabel={teacherWindow}
            label={copy.askTeacher}
          />
          <Link href="/dimensions" className="fb-btn h-9 px-4 text-sm hover:no-underline">
            {copy.backToHub}
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {copy.loading(ui.title)}
      </div>
    );
  }

  if (error) {
    return (
      <section className="fb-card space-y-3 p-5">
        <p className="text-sm text-[color:var(--ink-3)]">{error}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile/settings" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
            {copy.completeProfile}
          </Link>
          <button type="button" onClick={() => void runAnalysis()} className="fb-btn h-9 px-4 text-sm">
            {copy.retry}
          </button>
          <DimensionAskTeacherCta
            slug={dimension.slug}
            windowLabel={teacherWindow}
            label={copy.askTeacher}
          />
        </div>
      </section>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-4">
      <DimensionReportShell
        report={report}
        onSyncPredictions={handleSyncPredictions}
        syncing={syncing}
        syncStatus={syncStatus}
        locale={locale}
      />
      <section className="fb-card flex flex-wrap items-center justify-between gap-3 border border-[color:var(--hairline)] p-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[color:var(--ink-1)]">{copy.askTeacher}</p>
          <p className="mt-0.5 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
            {copy.askTeacherHint(ui.title)}
          </p>
        </div>
        <DimensionAskTeacherCta
          slug={dimension.slug}
          windowLabel={teacherWindow}
          label={copy.askTeacher}
          variant="primary"
        />
      </section>
    </div>
  );
}
