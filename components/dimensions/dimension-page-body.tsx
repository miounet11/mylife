'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import DimensionReportShell from '@/components/dimensions/dimension-report-shell';
import type { DimensionDefinition } from '@/lib/dimensions/types';
import type { DimensionReport } from '@/lib/dimensions/types';
import { hydrateLifeProfilesFromServer, recordDimensionVisit } from '@/lib/life-profile/store';
import { savePredictions } from '@/lib/predictions/store';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { buildTeacherChatHref, teacherFromDimensionSlug } from '@/lib/teachers';
import { fetchJsonWithTimeout } from '@/lib/utils';

function buildDimensionTeacherChatHref(slug: string, title: string) {
  const teacher = teacherFromDimensionSlug(slug);
  return buildTeacherChatHref({
    teacherId: teacher.id,
    window: title ? `当前维度「${title}」` : null,
    source: `dimension_${slug}_consultant`,
  });
}

function DimensionAskTeacherCta({
  slug,
  title,
  variant = 'link',
}: {
  slug: string;
  title: string;
  variant?: 'link' | 'primary';
}) {
  const href = buildDimensionTeacherChatHref(slug, title);

  if (variant === 'primary') {
    return (
      <Link href={href} className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
        问老师继续拆
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center text-[13px] font-medium text-[color:var(--ink-2)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
    >
      问老师继续拆
    </Link>
  );
}

export default function DimensionPageBody({
  dimension,
  runnable,
}: {
  dimension: DimensionDefinition;
  runnable: boolean;
}) {
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
        setError('无法读取档案资料，请先到「我的档案」完善出生信息。');
        return;
      }

      const primary = data.fortunes.find((item) => item.isPrimary) || data.fortunes[0];
      if (!primary?.birthDate) {
        setError('还没有出生资料，请先创建档案或前往工作台填写。');
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
        setError(analyzeData.error || '研判生成失败，请稍后重试。');
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
      setError('加载失败，请检查网络后重试。');
    } finally {
      setLoading(false);
    }
  }, [dimension.slug, runnable, syncPredictions]);

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
          「{dimension.title}」深度研判正在开发中。当前可先通过工作台生成完整报告，或关注后续版本更新。
        </p>
        {dimension.disclaimer ? (
          <p className="text-[12px] text-[color:var(--ink-3)]">{dimension.disclaimer}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Link href={analyzeHref} className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
            用工作台生成报告
          </Link>
          <DimensionAskTeacherCta slug={dimension.slug} title={dimension.title} />
          <Link href="/dimensions" className="fb-btn h-9 px-4 text-sm hover:no-underline">
            返回十维度
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2 p-10 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在基于你的命盘生成「{dimension.title}」研判…
      </div>
    );
  }

  if (error) {
    return (
      <section className="fb-card space-y-3 p-5">
        <p className="text-sm text-[color:var(--ink-3)]">{error}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile/settings" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
            完善档案
          </Link>
          <button type="button" onClick={() => void runAnalysis()} className="fb-btn h-9 px-4 text-sm">
            重试
          </button>
          <DimensionAskTeacherCta slug={dimension.slug} title={dimension.title} />
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
      />
      <section className="fb-card flex flex-wrap items-center justify-between gap-3 border border-[color:var(--hairline)] p-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[color:var(--ink-1)]">问老师继续拆</p>
          <p className="mt-0.5 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
            进入顾问开场，围绕「{dimension.title}」继续对齐节奏与动作。
          </p>
        </div>
        <DimensionAskTeacherCta slug={dimension.slug} title={dimension.title} variant="primary" />
      </section>
    </div>
  );
}