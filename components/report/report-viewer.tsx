'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { PipelineResult } from '@/lib/agentic-report/types';
import { AlertBanner } from '@/components/layout/alert-banner';
import { ReportCover } from '@/components/report/agent/cover';
import ReportCockpit from '@/components/report/agent/cockpit';
import ReportCurrentState from '@/components/report/agent/current-state';
import ReportRhythmTimeline from '@/components/report/agent/rhythm-timeline';
import LifeKLineSummaryCard from '@/components/report/agent/life-kline-summary-card';
import ReportTimingTabs from '@/components/report/agent/timing-tabs';
import ReportScenarioPanels from '@/components/report/agent/scenario-panels';
import ReportBlueprintCards from '@/components/report/agent/blueprint-cards';
import ReportNextActions from '@/components/report/agent/next-actions';
import ReportActionBoard from '@/components/report/agent/action-board';
import ReportPredictionsCard from '@/components/report/report-predictions-card';
import { extractPredictions } from '@/lib/predictions/extract';
import { getPredictionsForReport, savePredictions } from '@/lib/predictions/store';
import ReportStageProgress from '@/components/report/agent/stage-progress';
import ReportValidationPanel from '@/components/report/agent/validation-panel';
import ReportReadingPath from '@/components/report/agent/reading-path';
import ReportContinueExplorationNav from '@/components/report/agent/continue-exploration-nav';
import ReportContinueLearning from '@/components/report/report-continue-learning';
import {
  PastPresentFutureRow,
  ReportHighlightsGrid,
  ValidationFeedbackHero,
} from '@/components/report/agent/deep-summary-blocks';
import {
  isEphemeralReportId,
  readEphemeralReport,
} from '@/lib/report-session-cache';
import { isCalibratedUser } from '@/lib/life-profile/calibration-status';
import { getOrCreateProfile } from '@/lib/life-profile/store';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import { useLocale } from '@/components/i18n/locale-provider';

type ReportPayload = {
  id: string;
  intent: string | null;
  birthAccuracy: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  createdAt: string;
  snapshot: {
    result?: PipelineResult;
    generatedAt?: string;
  } | null;
};

export default function ReportViewer({ reportId, source }: { reportId: string; source: string }) {
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      if (isEphemeralReportId(reportId)) {
        const cached = readEphemeralReport(reportId);
        if (cached?.snapshot?.result?.context) {
          setReport({
            id: cached.id,
            intent: cached.intent,
            birthAccuracy: cached.birthAccuracy,
            createdAt: cached.createdAt,
            snapshot: cached.snapshot,
          });
          setError('本报告仅临时保存在当前浏览器，填写邮箱重新生成可永久归档。');
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch(`/api/report/${encodeURIComponent(reportId)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setReport(null);
          setError(data.error || '未找到报告');
          return;
        }
        setReport(data.report);
      } catch {
        setError('加载报告失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [reportId]);

  const pipeline = report?.snapshot?.result;
  const merged = pipeline?.merged;

  const reportPredictions = useMemo(() => {
    if (!merged || !report?.id) return [];
    const stored = getPredictionsForReport(report.id);
    if (stored.length) return stored;
    return extractPredictions(merged, report.id);
  }, [merged, report?.id]);

  const calibratedBadge = useMemo(() => {
    const reportInput = pipeline?.context?.report?.input as Record<string, unknown> | undefined;
    const birthDate = report?.birthDate || (typeof reportInput?.birthDate === 'string' ? reportInput.birthDate : null);
    if (!birthDate) return null;
    const gender = (pipeline?.context?.report?.raw?.gender || reportInput?.gender) as string | undefined;
    const birthSignature = buildBirthSignature({
      birthDate,
      birthTime: report?.birthTime || (typeof reportInput?.birthTime === 'string' ? reportInput.birthTime : undefined),
      birthPlace: report?.birthPlace || (typeof reportInput?.birthPlace === 'string' ? reportInput.birthPlace : undefined),
      birthAccuracy: report?.birthAccuracy || (typeof reportInput?.birthAccuracy === 'string' ? reportInput.birthAccuracy : undefined),
      gender,
    });
    const profile = getOrCreateProfile(birthSignature);
    if (!isCalibratedUser(profile)) return null;
    return {
      hitRate: profile.calibrationScore,
      reportCount: profile.reportCount,
    };
  }, [pipeline?.context?.report?.raw?.gender, report]);

  useEffect(() => {
    if (!reportPredictions.length || !report?.id) return;
    savePredictions(reportPredictions);
  }, [reportPredictions, report?.id]);

  if (loading) {
    return (
      <div className="fb-card flex items-center justify-center gap-2.5 p-12 text-[13px] font-medium text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在加载报告…
      </div>
    );
  }

  if (!pipeline?.context) {
    return (
      <div className="lk-report-stack">
        {error ? <AlertBanner>{error}</AlertBanner> : null}
        <section className="fb-card p-5 md:p-6">
          <div className="lk-section-eyebrow">报告状态</div>
          <h2 className="lk-report-section-title mt-1.5">报告尚未归档或已过期</h2>
          <p className="lk-report-prose-muted mt-3">
            报告 ID：<span className="font-mono text-[color:var(--ink-2)]">{reportId}</span>。
            若生成时未绑定邮箱，报告不会保存到服务器。请重新生成并填写邮箱，或从邮件中心找回。
          </p>
          <a href="/analyze" className="fb-btn fb-btn-primary mt-5 h-9 px-4 text-[13px] hover:no-underline">
            重新生成报告
          </a>
        </section>
      </div>
    );
  }

  const { context, run, verify } = pipeline;
  const engine = context.engine;

  return (
    <div className="lk-report-stack">
      {error ? <AlertBanner tone="info">{error}</AlertBanner> : null}

      <ReportCover
        reportId={reportId}
        intent={report?.intent}
        birthAccuracy={report?.birthAccuracy}
        createdAt={report?.createdAt || report?.snapshot?.generatedAt}
        calibrated={calibratedBadge}
      />
      <ReportReadingPath locale={locale} />
      <ReportHighlightsGrid merged={merged} />
      <ReportCockpit context={context} merged={merged} locale={locale} />
      <ReportCurrentState context={context} merged={merged} />
      <PastPresentFutureRow kline={engine.kline} />
      <ReportRhythmTimeline kline={engine.kline} locale={locale} />
      <LifeKLineSummaryCard kline={engine.kline} />
      <ReportTimingTabs
        timeWindows={engine.timeWindows}
        calibrated={Boolean(calibratedBadge)}
        locale={locale}
      />
      <ReportScenarioPanels merged={merged} />
      <ReportBlueprintCards engine={engine} />
      <ReportNextActions reportId={reportId} merged={merged} locale={locale} />
      <ReportActionBoard merged={merged} locale={locale} />
      <ReportPredictionsCard predictions={reportPredictions} reportId={reportId} />
      <ReportStageProgress run={run} />
      <ReportValidationPanel verify={verify} locale={locale} />
      <ValidationFeedbackHero reportId={reportId} />
      <ReportContinueLearning reportId={reportId} source={source} merged={merged} />
      <ReportContinueExplorationNav reportId={reportId} />
    </div>
  );
}