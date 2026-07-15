// @ts-nocheck
// ── Report API V6 ──
// POST /api/report — Agentic report path (compatible with production pipeline).
// Prefer /api/analyze for the primary user funnel (full engine + LLM + quality audit).

import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { buildProfileContextPack, formatProfileContextForPrompt } from '@/lib/profile-context-builder';
import { saveReportSnapshot } from '@/lib/membership-store';
import { analyzeFortune } from '@/lib/fortune-engine';
import { runAgenticPipeline } from '@/lib/agentic-report/run-agentic-pipeline';

export const runtime = 'nodejs';

function normalizeAccuracy(birthAccuracy: unknown, birthTime: unknown): 'exact' | 'range' | 'unknown' {
  if (birthAccuracy === 'exact' || birthAccuracy === 'unknown' || birthAccuracy === 'range') {
    return birthAccuracy;
  }
  if (typeof birthTime === 'string' && birthTime.trim() && birthTime !== '12:00') {
    return 'exact';
  }
  return 'range';
}

function asDate(birthDate: string): Date {
  // Prefer local Y-M-D parse to avoid UTC shift
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  }
  return new Date(birthDate);
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const requestUrl = new URL(request.url);

    const {
      birthDate,
      birthTime,
      birthAccuracy,
      gender,
      birthPlace,
      industries,
      intent,
      email,
      source,
      name,
      timezone,
    } = body;

    const event = {
      source: typeof source === 'string' ? source : requestUrl.searchParams.get('source') || 'direct',
      referer: request.headers.get('referer') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      hasEmail: typeof email === 'string' && email.includes('@'),
      birthYear: birthDate ? new Date(birthDate).getFullYear() : undefined,
    };

    console.info('[report funnel] generate_start', event);

    if (!birthDate) {
      console.info('[report funnel] generate_rejected', {
        ...event,
        reason: 'missing_birthDate',
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: 'birthDate is required' }, { status: 400 });
    }

    const normalizedIntent = `${intent || 'yearly'}`.trim() || 'yearly';
    const normalizedAccuracy = normalizeAccuracy(birthAccuracy, birthTime);
    const resolvedTime =
      normalizedAccuracy === 'unknown' || !birthTime ? '12:00' : String(birthTime);
    const resolvedPlace = typeof birthPlace === 'string' && birthPlace.trim() ? birthPlace.trim() : '北京';
    const resolvedGender = gender === 'female' ? 'female' : 'male';
    const resolvedTz = Number.isFinite(Number(timezone)) ? Number(timezone) : 8;
    const birth = asDate(String(birthDate));

    // Production pipeline expects analyzeFortune-shaped report as groundTruth.report
    const baseResult = analyzeFortune(
      name || '访客',
      birth,
      resolvedTime,
      resolvedPlace,
      resolvedTz,
      resolvedGender,
      { sect: 2 },
    );

    let profileContextSummary: string | undefined;
    let resolvedIndustries = industries;
    try {
      const session = await getAuthSession();
      if (session.authenticated && session.user?.id) {
        const profileContext = buildProfileContextPack(session.user.id);
        if (profileContext) {
          resolvedIndustries =
            profileContext.industries?.length > 0 ? profileContext.industries : industries;
          profileContextSummary = formatProfileContextForPrompt(profileContext);
        }
      }
    } catch (profileError) {
      console.warn('[report API] profile context skipped', profileError);
    }

    const agentic = await runAgenticPipeline({
      enabled: true,
      groundTruth: {
        birthDate: birth,
        report: baseResult,
      },
      context: {
        birthDate: birth,
        birthPlace: resolvedPlace,
        currentPlace: resolvedPlace,
        industries: resolvedIndustries,
        report: {
          advice: baseResult.advice,
          fortune: baseResult.fortune,
          tacitSummary: profileContextSummary,
          tacitSignals: [
            `intent:${normalizedIntent}`,
            `birthAccuracy:${normalizedAccuracy}`,
          ],
        },
      },
    });

    // Normalize to shape expected by older UI clients + quality pack
    const agentResults = agentic.agentResults || {};
    const successRate = Number(agentic.orchestration?.successRate ?? 0);
    const durationMs = Number(agentic.orchestration?.durationMs ?? Date.now() - startedAt);
    const tasks = Object.entries(agentResults).map(([agentKey, data]) => ({
      agentKey,
      status: 'ok' as const,
      data,
      timing: { startMs: 0, endMs: durationMs, durationMs },
    }));

    const result = {
      context: agentic.context,
      run: { tasks, successRate, durationMs },
      merged: {
        merged: agentResults,
        successRate,
        failedAgents: agentic.orchestration?.failed || [],
        errors: [],
      },
      review: agentic.review,
      repair: agentic.repair,
      verify: agentic.verify,
      used: Boolean(agentic.used),
      enabled: agentic.enabled !== false,
      baseResult: {
        summary: baseResult.analysis?.summary || baseResult.basic?.dayMaster,
        dayMaster: baseResult.basic?.dayMaster,
        pattern: baseResult.pattern,
      },
    };

    let reportId: string | null = null;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (normalizedEmail && normalizedEmail.includes('@')) {
      const saved = saveReportSnapshot({
        email: normalizedEmail,
        birthDate: String(birthDate),
        birthTime: resolvedTime,
        birthPlace: resolvedPlace,
        intent: normalizedIntent,
        birthAccuracy: normalizedAccuracy,
        snapshot: {
          result,
          baseResult,
          generatedAt: new Date().toISOString(),
        },
      });
      reportId = saved.id;
    } else {
      // Guest without email still needs a stable client id for result/chat deep links.
      // Primary funnel remains /api/analyze (fortune-backed); this is for secondary agentic path.
      reportId = `agentic_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    let quality = null;
    try {
      const { buildReportQualityPack } = await import('@/lib/agentic-report/report-quality');
      quality = buildReportQualityPack(result, {
        intent: normalizedIntent,
        birthAccuracy: normalizedAccuracy,
        reportId,
      });
    } catch (qualityError) {
      console.warn('[report API] quality pack skipped', qualityError);
    }

    console.info('[report funnel] generate_ok', {
      ...event,
      intent: normalizedIntent,
      birthAccuracy: normalizedAccuracy,
      qualityScore: quality?.qualityScore,
      degraded: quality?.degraded,
      agentSuccessRate: successRate,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      ...result,
      conclusions: quality?.conclusions || [],
      predictions: quality?.predictions || [],
      deliveryNotes: quality?.deliveryNotes || [],
      meta: {
        reportId,
        emailSaved: Boolean(reportId),
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        intent: normalizedIntent,
        birthAccuracy: normalizedAccuracy,
        qualityScore: quality?.qualityScore ?? null,
        degraded: quality?.degraded ?? false,
        path: 'agentic-report-v6',
      },
    });
  } catch (error) {
    console.error('[report API]', error);
    return NextResponse.json(
      {
        error: 'report_generation_failed',
        message: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 500 },
    );
  }
}
