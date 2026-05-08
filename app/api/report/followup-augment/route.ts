import { NextResponse } from 'next/server';
import { fortuneOperations } from '@/lib/database';
import { buildReportFollowupSuggestions } from '@/lib/chat-entry';
import { generateAugmentedFollowups } from '@/lib/followup-augmenter';
import { buildReportCorrectionInsight } from '@/lib/report-v2';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';

// v5-B5 (2026-05-08) AI augmented followup gen endpoint
//
// 流程：
// 1) 由 result page 在客户端 fire-and-forget 调用（不阻塞渲染）
// 2) Endpoint 检查 analysis.followupSuggestions 是否已存在 + 新鲜
//    - 已存在且 < 24h 旧 → 直接返回，不重复生成
//    - 缺失或过期 → 用 B4 deterministic 作为基线，调 LLM 优化措辞
// 3) 结果回写到 fortunes.analysis.followupSuggestions（持久化）
//
// 为什么不在 pipeline 里做：
// - pipeline 已经有多个 LLM 调用，再加一个会拖慢首次报告生成
// - lazy 模式只在用户真的查看报告时触发（按需付费）
// - 失败可优雅降级 — B4 deterministic 已经足够好

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const reportId = `${body?.reportId || ''}`.trim();
    if (!reportId) {
      return NextResponse.json({ success: false, error: 'reportId required' }, { status: 400 });
    }

    const fortune = fortuneOperations.getById(reportId);
    if (!fortune) {
      return NextResponse.json({ success: false, error: 'report not found' }, { status: 404 });
    }

    const analysis = (fortune.analysis as any) || {};
    const cached = analysis.followupSuggestions;
    const cachedAt = analysis.followupSuggestionsAt;
    const cachedAge = cachedAt ? Date.now() - new Date(cachedAt).getTime() : Infinity;

    if (Array.isArray(cached) && cached.length > 0 && Number.isFinite(cachedAge) && cachedAge < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, suggestions: cached, source: 'cache' });
    }

    // 重新生成 B4 deterministic 基线
    const result = analysis as any;
    const linkedEvents = (analysis.linkedEvents as any[]) || [];
    const todayMs = (() => {
      const t = new Date(); t.setHours(0, 0, 0, 0); return t.getTime();
    })();

    const cautionScenario = (result.scenarioViews || []).find(
      (s: any) => s.key !== 'overall' && s.status === 'caution',
    ) || null;
    const pushScenario = (result.scenarioViews || []).find(
      (s: any) => s.key !== 'overall' && s.status === 'push',
    ) || null;

    const correctionInsight = buildReportCorrectionInsight({
      scenarioViews: result.scenarioViews,
      validationInsights: analysis.validationInsights,
    });

    const pendingOverdue = (() => {
      if (!Array.isArray(linkedEvents)) return null;
      const candidates = linkedEvents
        .filter((e: any) => {
          const fb = e.userFeedback;
          if (fb && fb.wasAccurate !== undefined) return false;
          if (!e.date) return false;
          const t = new Date(`${e.date}T00:00:00`).getTime();
          if (!Number.isFinite(t)) return false;
          const overdue = Math.floor((todayMs - t) / 86_400_000);
          return overdue >= 3 && overdue <= 14;
        })
        .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
      const oldest = candidates[0];
      if (!oldest) return null;
      const overdue = Math.floor((todayMs - new Date(`${oldest.date}T00:00:00`).getTime()) / 86_400_000);
      return { title: oldest.title, date: oldest.date, overdueDays: overdue };
    })();

    const baseSuggestions = buildReportFollowupSuggestions({
      publicName: fortune.name,
      patternType: result.pattern?.type,
      dayMaster: result.basic?.dayMaster,
      actionSuggestions: result.actionSuggestions,
      topMonthlyWindow: (result.monthlyWindows || [])[0],
      hasRiskScenario: Array.isArray(result.confidence?.sensitivePoints) && result.confidence.sensitivePoints.length > 0,
      cautionScenario,
      pushScenario,
      correctionLevel: correctionInsight?.level,
      correctionSummary: correctionInsight?.summary,
      pendingOverdueEvent: pendingOverdue,
    });

    // 调 LLM 优化（带超时 + 降级）
    const augmented = await generateAugmentedFollowups({
      baseSuggestions,
      reportFacts: {
        publicName: fortune.name,
        patternType: result.pattern?.type,
        dayMaster: result.basic?.dayMaster,
        primaryActionTitle: result.actionSuggestions?.[0]?.title,
        cautionScenarioTitle: cautionScenario?.title,
        pushScenarioTitle: pushScenario?.title,
        topWindowLabel: (result.monthlyWindows || [])[0]?.label,
        correctionLevel: correctionInsight?.level,
        pendingOverdueTitle: pendingOverdue?.title,
      },
      timeoutMs: 5000,
    });

    // 持久化（fire-and-forget，不阻塞响应）
    const isAugmented = augmented.some((s, i) => s.question !== baseSuggestions[i]?.question);
    try {
      fortuneOperations.update(reportId, {
        analysis: {
          ...analysis,
          followupSuggestions: augmented,
          followupSuggestionsAt: new Date().toISOString(),
          followupSuggestionsAugmented: isAugmented,
        },
      });
    } catch (err) {
      console.warn('[v5-B5] persist failed:', err instanceof Error ? err.message : err);
    }

    trackServerEvent({
      eventName: 'report_followup_augmented',
      meta: {
        reportId,
        isAugmented,
        suggestionCount: augmented.length,
      },
    });

    return NextResponse.json({
      success: true,
      suggestions: augmented,
      source: isAugmented ? 'llm' : 'deterministic',
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'unknown error',
      },
      { status: 500 },
    );
  }
}
