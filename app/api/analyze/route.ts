import { NextRequest, NextResponse } from 'next/server';
import { createFortuneWithUser, toolSessionOperations, userOperations } from '@/lib/database';
import { queueEmailDeliveryJob } from '@/lib/email-delivery-jobs';
import { deliverMailWithRetry, isEmailDeliveryConfigured, sendReportReadyEmail } from '@/lib/email';
import { trackServerEvent } from '@/lib/analytics';
import { CURRENT_REPORT_VERSION, generateVersionedReport } from '@/lib/report-pipeline';
import { buildAnalysisWorkflowSnapshot, loadMingliAnalysisWorkflow } from '@/lib/analysis-workflow';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import { withReportVersionLineage } from '@/lib/report-version-lineage';
import { checkRateLimit, getClientKey, RATE_LIMITS } from '@/lib/rate-limit';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { appendToolMemoryToNarrative, summarizeToolSessions } from '@/lib/tool-context';
import {
  buildTacitKnowledgeFocusTags,
  buildTacitKnowledgeSummary,
  sanitizeTacitKnowledgeInput,
} from '@/lib/tacit-knowledge';
import type { FortuneAdvice } from '@/lib/user-types';
import { validateAnalyzeRequest } from '@/lib/validators';
import { sanitizeRelationInput } from '@/lib/relation';

export const maxDuration = 60;

type AnalyzeInput = {
  name: string;
  gender?: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthSecond?: number;
  birthPlace?: string;
  timezone?: number;
  longitude?: number;
  latitude?: number;
  useSolarTime?: boolean;
  useDaylightSaving?: boolean;
  useSeparateZiHour?: boolean;
  tacitContext?: Record<string, unknown>;
  source?: string | null;
  toolSlug?: string | null;
  /** v5-D39 多档案：可选 relation key */
  relation?: string | null;
  /** v5-D39 多档案：可选自定义昵称 */
  relationLabel?: string | null;
};

type StreamStageEvent = {
  type: 'stage';
  stage:
    | 'received'
    | 'solar-time'
    | 'engine'
    | 'llm'
    | 'agentic'
    | 'merge'
    | 'persist'
    | 'complete';
  progress: number;
  label: string;
  detail: string;
};

type StreamCompleteEvent = {
  type: 'complete';
  reportId: string;
  llm: {
    used: boolean;
    fallbackToEngine: boolean;
  };
  quality?: {
    score?: number;
    grade?: 'S' | 'A' | 'B' | 'C';
    deliveryTier?: 'basic' | 'enhanced' | 'expert';
    targetAchieved?: boolean;
  };
  upgrade?: {
    queued: boolean;
    reason?: string;
    status?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
    attempts?: number;
    maxAttempts?: number;
  };
  timestamp: string;
};

type StreamErrorEvent = {
  type: 'error';
  error: string;
};

type StreamEvent = StreamStageEvent | StreamCompleteEvent | StreamErrorEvent;
type AnalyzeStageRef = {
  current: StreamStageEvent['stage'] | 'failed';
};

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();
  const userAgent = request.headers.get('user-agent');
  const stageRef: AnalyzeStageRef = { current: 'received' };
  let clientKey = 'unknown';
  let source = '';
  let toolSlug = '';
  try {
    clientKey = getClientKey(request);
    const rateLimit = checkRateLimit(`analyze:${clientKey}`, RATE_LIMITS.analyze);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    // v5-D59 (2026-05-21): 空 body / 非法 JSON 走 400 而不是抛出
    // 部分 bot/扫描器会 POST 空 body，原来会让 request.json() 抛 SyntaxError，
    // 在流式响应未启动时表现为 nginx → upstream RST → 502。
    let data: AnalyzeInput;
    try {
      data = await request.json() as AnalyzeInput;
    } catch {
      return NextResponse.json(
        { success: false, error: '请求格式错误' },
        { status: 400 }
      );
    }
    source = typeof data.source === 'string' ? data.source.trim() : '';
    toolSlug = typeof data.toolSlug === 'string' ? data.toolSlug.trim() : '';
    const validation = validateAnalyzeRequest(data);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors[0].message, errors: validation.errors },
        { status: 400 }
      );
    }

    const wantsStream = request.headers.get('x-analyze-stream') === '1';

    if (wantsStream) {
      return streamAnalyze(data, {
        requestStartedAt,
        clientKey,
        userAgent,
      });
    }

    const execution = await executeAnalyze(data, {
      requestStartedAt,
      requestMode: 'json',
      userAgent,
      stageRef,
    });

    // Sub-Spec B1: 异步预生成 timing profile（不阻塞返回，让 /r/[id] 首次访问命中缓存）
    void (async () => {
      try {
        const { resolveTimingProfileForReport } = await import('@/lib/life-timing/resolve-timing-profile');
        resolveTimingProfileForReport(execution.reportId);
      } catch (err) {
        console.warn('[analyze] timing profile prebuild failed:', err instanceof Error ? err.message : err);
      }
    })();

    return NextResponse.json({
      success: true,
      reportId: execution.reportId,
      result: execution.finalResult,
      llm: {
        used: execution.llmUsed,
        fallbackToEngine: !execution.llmUsed,
      },
      quality: {
        score: execution.finalResult.analysis?.qualityAudit?.overallScore,
        grade: execution.finalResult.analysis?.qualityAudit?.grade,
        deliveryTier: execution.finalResult.analysis?.qualityAudit?.deliveryTier,
        targetAchieved: execution.finalResult.analysis?.qualityAudit?.targetAchieved,
      },
      upgrade: {
        queued: execution.queuedUpgrade.queued,
        reason: execution.queuedUpgrade.reason,
        status: execution.queuedUpgrade.job?.status,
        attempts: execution.queuedUpgrade.job?.attempts,
        maxAttempts: execution.queuedUpgrade.job?.maxAttempts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] 命理分析失败:', error);
    trackServerEvent({
      sessionId: clientKey,
      userAgent,
      eventName: 'analyze_failed',
      page: '/analyze',
      meta: {
        stage: stageRef.current,
        durationMs: Date.now() - requestStartedAt,
        error: error instanceof Error ? error.message : 'unknown',
        requestMode: 'json',
        source: source || null,
        toolSlug: toolSlug || null,
      },
    });
    return NextResponse.json(
      { success: false, error: '分析失败，请稍后再试' },
      { status: 500 }
    );
  }
}

async function streamAnalyze(
  data: AnalyzeInput,
  context: {
    requestStartedAt: number;
    clientKey: string;
    userAgent?: string | null;
  }
) {
  const encoder = new TextEncoder();
  const stageRef: AnalyzeStageRef = { current: 'received' };
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      const send = (event: StreamEvent) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) {
          return;
        }
        closed = true;
        try {
          controller.close();
        } catch {
          closed = true;
        }
      };

      try {
        send({
          type: 'stage',
          stage: 'received',
          progress: 4,
          label: '已接收测算请求',
          detail: '正在锁定出生信息、地点与计算参数，准备进入正式分析。',
        });

        const execution = await executeAnalyze(data, {
          requestStartedAt: context.requestStartedAt,
          requestMode: 'stream',
          userAgent: context.userAgent,
          stageRef,
          onStage: (event) => send(event),
        });

        // Sub-Spec B1: 异步预生成 timing profile
        void (async () => {
          try {
            const { resolveTimingProfileForReport } = await import('@/lib/life-timing/resolve-timing-profile');
            resolveTimingProfileForReport(execution.reportId);
          } catch (err) {
            console.warn('[analyze stream] timing profile prebuild failed:', err instanceof Error ? err.message : err);
          }
        })();

        send({
          type: 'complete',
          reportId: execution.reportId,
          llm: {
            used: execution.llmUsed,
            fallbackToEngine: !execution.llmUsed,
          },
          quality: {
            score: execution.finalResult.analysis?.qualityAudit?.overallScore,
            grade: execution.finalResult.analysis?.qualityAudit?.grade,
            deliveryTier: execution.finalResult.analysis?.qualityAudit?.deliveryTier,
            targetAchieved: execution.finalResult.analysis?.qualityAudit?.targetAchieved,
          },
          upgrade: {
            queued: execution.queuedUpgrade.queued,
            reason: execution.queuedUpgrade.reason,
            status: execution.queuedUpgrade.job?.status,
            attempts: execution.queuedUpgrade.job?.attempts,
            maxAttempts: execution.queuedUpgrade.job?.maxAttempts,
          },
          timestamp: new Date().toISOString(),
        });
        close();
      } catch (error) {
        if (closed) {
          return;
        }
        console.error('[API] 流式命理分析失败:', error);
        trackServerEvent({
          sessionId: context.clientKey,
          userAgent: context.userAgent,
          eventName: 'analyze_failed',
          page: '/analyze',
          meta: {
            stage: stageRef.current,
            durationMs: Date.now() - context.requestStartedAt,
            error: error instanceof Error ? error.message : 'unknown',
            requestMode: 'stream',
            source: data.source || null,
            toolSlug: data.toolSlug || null,
          },
        });
        send({
          type: 'error',
          error: '分析失败，请稍后再试',
        });
        close();
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // v5-D52: 显式禁用 nginx/CDN 中间代理 buffering，确保流式首字节即时下发
      'X-Accel-Buffering': 'no',
    },
  });
}

async function executeAnalyze(
  data: AnalyzeInput,
  options?: {
    requestStartedAt?: number;
    requestMode?: 'json' | 'stream';
    userAgent?: string | null;
    stageRef?: AnalyzeStageRef;
    onStage?: (event: StreamStageEvent) => void;
  }
) {
  const stage = (event: StreamStageEvent) => {
    if (options?.stageRef) {
      options.stageRef.current = event.stage;
    }
    options?.onStage?.(event);
  };

  const userId = await getOrCreateGuestUserId();
  const analysisWorkflow = loadMingliAnalysisWorkflow();
  const analysisWorkflowSnapshot = buildAnalysisWorkflowSnapshot(analysisWorkflow);
  const recentToolSessions = toolSessionOperations.listByUser(userId, 8);
  const tacitContext = sanitizeTacitKnowledgeInput(data.tacitContext);
  const tacitSummary = buildTacitKnowledgeSummary(tacitContext);
  const tacitSignals = buildTacitKnowledgeFocusTags(tacitContext);
  const source = typeof data.source === 'string' ? data.source.trim() : '';
  const toolSlug = typeof data.toolSlug === 'string' ? data.toolSlug.trim() : '';
  const timing = resolveEffectiveTiming(data);
  const timezone = (data.timezone as number) || 8;
  const useSeparateZiHour = Boolean(data.useSeparateZiHour);

  if (timing.usedSolarTime) {
    stage({
      type: 'stage',
      stage: 'solar-time',
      progress: 12,
      label: '真太阳时修正已完成',
      detail: timing.solarTimeDetail,
    });
  } else {
    stage({
      type: 'stage',
      stage: 'solar-time',
      progress: 10,
      label: '跳过真太阳时修正',
      detail: '本次沿用钟表时间进入排盘，准备开始命局结构计算。',
    });
  }

  const { result: finalResult, llmUsed } = await generateVersionedReport({
    name: data.name,
    birthDate: timing.effectiveBirthDate,
    birthTime: timing.effectiveBirthTime,
    birthPlace: data.birthPlace || '北京',
    timezone,
    gender: data.gender || 'male',
    sect: useSeparateZiHour ? 1 : 2,
    tacitSummary,
    tacitSignals,
    source: 'analyze',
    onProgress: async (progressEvent) => {
      const mapped = mapPipelineStage(progressEvent);
      if (mapped) {
        stage(mapped);
      }
    },
  });

  const toolMemory = summarizeToolSessions(recentToolSessions, null, 5);
  finalResult.analysis = {
    ...(finalResult.analysis || {}),
  };
  (finalResult.analysis as typeof finalResult.analysis & { workflow?: typeof analysisWorkflowSnapshot }).workflow = analysisWorkflowSnapshot;
  if (toolMemory) {
    finalResult.analysis = {
      ...(finalResult.analysis || {}),
      contextSignals: {
        ...((finalResult.analysis?.contextSignals as Record<string, unknown>) || {}),
        toolMemory,
      },
      enhancementNotes: [
        ...(((finalResult.analysis?.enhancementNotes || []) as string[]) || []),
        `已纳入最近 ${toolMemory.recentSessions.length} 次单项工具结果作为用户历史上下文。`,
      ],
      explanation: appendToolMemoryToNarrative(finalResult.analysis?.explanation || '', toolMemory),
    };
  }

  if (tacitContext && tacitSummary) {
    finalResult.analysis = {
      ...(finalResult.analysis || {}),
      contextSignals: {
        ...((finalResult.analysis?.contextSignals as Record<string, unknown>) || {}),
        tacitKnowledge: tacitContext,
      },
      enhancementNotes: [
        ...(((finalResult.analysis?.enhancementNotes || []) as string[]) || []),
        `已纳入一层无法直接用完整句子表达的隐性状态：${tacitSummary}。`,
      ],
      summary: finalResult.analysis?.summary || tacitSummary.slice(0, 64),
    };
  }

  stage({
    type: 'stage',
    stage: 'persist',
    progress: 94,
    label: '正在写入报告与用户档案',
    detail: '命盘结果已经生成，正在保存报告、归档测算记录并准备结果页。',
  });

  const reportId = generateReportId();
  finalResult.analysis = withReportVersionLineage({
    nextAnalysis: finalResult.analysis,
    nextReportVersion: CURRENT_REPORT_VERSION,
  });

  // v5-D39 多档案：清洗 relation / relationLabel
  const sanitizedRelation = sanitizeRelationInput({
    relation: data.relation ?? null,
    relationLabel: data.relationLabel ?? null,
  });

  createFortuneWithUser(
    userId,
    {
      name: data.name,
      gender: (data.gender as 'male' | 'female') || 'male',
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      birthPlace: data.birthPlace || '北京',
      timezone,
    },
    {
      id: reportId,
      userId,
      name: data.name,
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      birthPlace: data.birthPlace || '北京',
      timezone,
      gender: (data.gender as 'male' | 'female') || 'male',
      bazi: finalResult.basic,
      fiveElements: finalResult.fiveElements,
      tenGods: finalResult.tenGods || {},
      pattern: finalResult.pattern,
      fortune: finalResult.fortune,
      advice: finalResult.advice as FortuneAdvice,
      evidence: finalResult.evidence,
      analysis: finalResult.analysis,
      klineData: finalResult.klineData,
      dayun: finalResult.dayun,
      shenSha: finalResult.shenSha,
      reportVersion: CURRENT_REPORT_VERSION,
      isPublic: true,
      relation: sanitizedRelation.relation ?? undefined,
      relationLabel: sanitizedRelation.relationLabel ?? undefined,
    }
  );
  const savedReport = createSavedReportSnapshot({
    id: reportId,
    userId,
    data,
    timezone,
    finalResult,
  });
  const queuedUpgrade = enqueueReportUpgrade({
    report: savedReport,
    reason: 'analyze_auto_followup',
  });

  trackServerEvent({
    userId,
    sessionId: userId,
    userAgent: options?.userAgent,
    eventName: 'analyze_submitted',
    page: '/analyze',
    meta: {
      reportId,
      llmUsed,
      reportVersion: CURRENT_REPORT_VERSION,
      reasoningMode: finalResult.analysis?.reasoningMode || 'engine',
      qualityScore: finalResult.analysis?.qualityAudit?.overallScore || 0,
      qualityGrade: finalResult.analysis?.qualityAudit?.grade || 'C',
      deliveryTier: finalResult.analysis?.qualityAudit?.deliveryTier || 'basic',
      expertTargetAchieved: !!finalResult.analysis?.qualityAudit?.targetAchieved,
      upgradeQueued: queuedUpgrade.queued,
      useSolarTime: !!data.useSolarTime,
      useDaylightSaving: !!data.useDaylightSaving,
      useSeparateZiHour: !!data.useSeparateZiHour,
      tacitSignalCount: tacitSignals.length,
      source: source || 'direct',
      toolSlug: toolSlug || undefined,
    },
  });

  trackServerEvent({
    userId,
    sessionId: userId,
    userAgent: options?.userAgent,
    eventName: 'report_generated',
    page: `/result/${reportId}`,
    meta: {
      reportId,
      llmUsed,
      reportVersion: CURRENT_REPORT_VERSION,
      reasoningMode: finalResult.analysis?.reasoningMode || 'engine',
      pattern: finalResult.pattern?.type || '',
      qualityScore: finalResult.analysis?.qualityAudit?.overallScore || 0,
      qualityGrade: finalResult.analysis?.qualityAudit?.grade || 'C',
      deliveryTier: finalResult.analysis?.qualityAudit?.deliveryTier || 'basic',
      expertTargetAchieved: !!finalResult.analysis?.qualityAudit?.targetAchieved,
      upgradeQueued: queuedUpgrade.queued,
      source: source || 'direct',
      toolSlug: toolSlug || undefined,
    },
  });
  trackServerEvent({
    userId,
    sessionId: userId,
    userAgent: options?.userAgent,
    eventName: 'analyze_completed',
    page: `/result/${reportId}`,
    meta: {
      reportId,
      llmUsed,
      fallbackToEngine: !llmUsed,
      reportVersion: CURRENT_REPORT_VERSION,
      reasoningMode: finalResult.analysis?.reasoningMode || 'engine',
      qualityScore: finalResult.analysis?.qualityAudit?.overallScore || 0,
      qualityGrade: finalResult.analysis?.qualityAudit?.grade || 'C',
      deliveryTier: finalResult.analysis?.qualityAudit?.deliveryTier || 'basic',
      expertTargetAchieved: !!finalResult.analysis?.qualityAudit?.targetAchieved,
      upgradeQueued: queuedUpgrade.queued,
      durationMs: options?.requestStartedAt ? Date.now() - options.requestStartedAt : undefined,
      requestMode: options?.requestMode || 'json',
      finalStage: 'complete',
      agenticUsed: !!finalResult.analysis?.agenticUsed,
      agentSuccessCount: Array.isArray(finalResult.analysis?.orchestration?.succeeded)
        ? finalResult.analysis.orchestration.succeeded.length
        : 0,
      agentFailureCount: Array.isArray(finalResult.analysis?.orchestration?.failed)
        ? finalResult.analysis.orchestration.failed.length
        : 0,
      tacitSignalCount: tacitSignals.length,
      source: source || 'direct',
      toolSlug: toolSlug || undefined,
    },
  });

  await notifyRegisteredUserReportReady({
    userId,
    reportId,
    reportName: data.name,
    score: finalResult.analysis?.qualityAudit?.overallScore,
    grade: finalResult.analysis?.qualityAudit?.grade,
    deliveryTier: finalResult.analysis?.qualityAudit?.deliveryTier,
    queuedUpgrade: queuedUpgrade.queued,
  });

  stage({
    type: 'stage',
    stage: 'complete',
    progress: 100,
    label: finalResult.analysis?.qualityAudit?.targetAchieved || finalResult.analysis?.qualityAudit?.deliveryTier === 'expert'
      ? '完整报告已准备就绪'
      : '当前可读版报告已准备就绪',
    detail: finalResult.analysis?.qualityAudit?.targetAchieved || finalResult.analysis?.qualityAudit?.deliveryTier === 'expert'
      ? '本次结果已经达到更完整标准，正在为你打开完整报告。'
      : queuedUpgrade.queued
        ? '当前先打开可读版结果，更完整的内容会继续补全到这份报告里。'
        : '结果页已经生成并保存完成，正在为你打开当前报告。',
  });

  return {
    reportId,
    finalResult,
    llmUsed,
    queuedUpgrade,
  };
}

function createSavedReportSnapshot(params: {
  id: string;
  userId: string;
  data: AnalyzeInput;
  timezone: number;
  finalResult: Awaited<ReturnType<typeof generateVersionedReport>>['result'];
}) {
  const sanitized = sanitizeRelationInput({
    relation: params.data.relation ?? null,
    relationLabel: params.data.relationLabel ?? null,
  });
  return {
    id: params.id,
    userId: params.userId,
    name: params.data.name,
    birthDate: params.data.birthDate,
    birthTime: params.data.birthTime,
    birthPlace: params.data.birthPlace || '北京',
    timezone: params.timezone,
    gender: (params.data.gender as 'male' | 'female') || 'male',
    bazi: params.finalResult.basic,
    fiveElements: params.finalResult.fiveElements,
    tenGods: params.finalResult.tenGods || {},
    pattern: params.finalResult.pattern,
    fortune: params.finalResult.fortune,
    advice: params.finalResult.advice as FortuneAdvice,
    evidence: params.finalResult.evidence,
    analysis: params.finalResult.analysis,
    klineData: params.finalResult.klineData,
    dayun: params.finalResult.dayun,
    shenSha: params.finalResult.shenSha,
    reportVersion: CURRENT_REPORT_VERSION,
    isPublic: true,
    relation: sanitized.relation ?? undefined,
    relationLabel: sanitized.relationLabel ?? undefined,
  };
}

async function notifyRegisteredUserReportReady(params: {
  userId: string;
  reportId: string;
  reportName: string;
  score?: number;
  grade?: 'S' | 'A' | 'B' | 'C';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  queuedUpgrade?: boolean;
}) {
  if (!isEmailDeliveryConfigured()) {
    return;
  }

  const user = userOperations.getById(params.userId) as {
    email?: string | null;
    name?: string | null;
    email_verified?: number | null;
  } | undefined;
  const email = `${user?.email || ''}`.trim().toLowerCase();
  const emailVerified = user?.email_verified === 1;

  if (!email || !emailVerified) {
    return;
  }

  try {
    const deliveryResult = await deliverMailWithRetry(() => sendReportReadyEmail({
      email,
      name: params.reportName || user?.name || '用户',
      reportId: params.reportId,
      score: params.score,
      grade: params.grade,
      deliveryTier: params.deliveryTier,
      queuedUpgrade: params.queuedUpgrade,
    }));

    if (deliveryResult?.success) {
      trackServerEvent({
        userId: params.userId,
        sessionId: params.userId,
        eventName: 'email_delivery_succeeded',
        page: `/result/${params.reportId}`,
        meta: {
          channel: 'report_ready',
          reportId: params.reportId,
          emailDomain: email.split('@')[1] || '',
          deliveryTier: params.deliveryTier || 'basic',
          queuedUpgrade: !!params.queuedUpgrade,
        },
      });
      return;
    }

    queueEmailDeliveryJob({
      kind: 'report_ready',
      to: [email],
      payload: {
        email,
        name: params.reportName || user?.name || '用户',
        reportId: params.reportId,
        score: params.score,
        grade: params.grade,
        deliveryTier: params.deliveryTier,
        queuedUpgrade: !!params.queuedUpgrade,
      },
      meta: {
        userId: params.userId,
        reportId: params.reportId,
      },
    });

    trackServerEvent({
      userId: params.userId,
      sessionId: params.userId,
      eventName: 'email_delivery_failed',
      page: `/result/${params.reportId}`,
      meta: {
        channel: 'report_ready',
        reportId: params.reportId,
        emailDomain: email.split('@')[1] || '',
        deliveryTier: params.deliveryTier || 'basic',
        queuedUpgrade: !!params.queuedUpgrade,
        reason: deliveryResult?.message || 'queued_for_retry',
      },
    });
  } catch (error) {
    queueEmailDeliveryJob({
      kind: 'report_ready',
      to: [email],
      payload: {
        email,
        name: params.reportName || user?.name || '用户',
        reportId: params.reportId,
        score: params.score,
        grade: params.grade,
        deliveryTier: params.deliveryTier,
        queuedUpgrade: !!params.queuedUpgrade,
      },
      meta: {
        userId: params.userId,
        reportId: params.reportId,
      },
    });

    trackServerEvent({
      userId: params.userId,
      sessionId: params.userId,
      eventName: 'email_delivery_failed',
      page: `/result/${params.reportId}`,
      meta: {
        channel: 'report_ready',
        reportId: params.reportId,
        emailDomain: email.split('@')[1] || '',
        deliveryTier: params.deliveryTier || 'basic',
        queuedUpgrade: !!params.queuedUpgrade,
        reason: error instanceof Error ? error.message : 'queued_for_retry',
      },
    });
  }
}

function mapPipelineStage(progressEvent: {
  stage: 'engine' | 'llm' | 'agentic' | 'merge';
  status: 'started' | 'completed';
  detail: string;
}): StreamStageEvent | null {
  const stageMeta = {
    engine: {
      started: { progress: 22, label: '正在计算基础结构' },
      completed: { progress: 38, label: '基础结构已完成' },
    },
    llm: {
      started: { progress: 48, label: '正在整理报告内容' },
      completed: { progress: 62, label: '报告内容已整理' },
    },
    agentic: {
      started: { progress: 58, label: '正在补充多角度判断' },
      completed: { progress: 78, label: '补充判断已完成' },
    },
    merge: {
      started: { progress: 86, label: '正在整理最终报告' },
      completed: { progress: 92, label: '最终报告整理完成' },
    },
  } as const;

  const meta = stageMeta[progressEvent.stage]?.[progressEvent.status];
  if (!meta) {
    return null;
  }

  return {
    type: 'stage',
    stage: progressEvent.stage,
    progress: meta.progress,
    label: meta.label,
    detail: mapPipelineStageDetail(progressEvent.stage, progressEvent.status),
  };
}

function mapPipelineStageDetail(
  stage: 'engine' | 'llm' | 'agentic' | 'merge',
  status: 'started' | 'completed'
) {
  if (stage === 'engine') {
    return status === 'started'
      ? '正在计算基础结构、阶段信号和重点主题。'
      : '基础结构已完成，正在继续整理报告正文。';
  }

  if (stage === 'llm') {
    return status === 'started'
      ? '正在整理解释、风险提醒和行动建议。'
      : '报告正文已整理，正在补充多角度判断。';
  }

  if (stage === 'agentic') {
    return status === 'started'
      ? '正在补充天时、地利、人和等多角度判断。'
      : '补充判断已完成，正在做最终校对。';
  }

  return status === 'started'
    ? '正在汇总结构、趋势和行动建议。'
    : '最终报告已整理完成。';
}

function resolveEffectiveTiming(data: AnalyzeInput) {
  const [year, month, day] = data.birthDate.split('-').map(Number);
  const [hour, minute] = data.birthTime.split(':').map(Number);
  const second = (data.birthSecond as number) || 0;
  const longitude = (data.longitude as number) || 116.407;
  const timezone = (data.timezone as number) || 8;
  const useDaylightSaving = Boolean(data.useDaylightSaving);
  const normalizedClock = useDaylightSaving
    ? toStandardClockTime(year, month, day, hour, minute, second)
    : { year, month, day, hour, minute, second };

  let effectiveYear = normalizedClock.year;
  let effectiveMonth = normalizedClock.month;
  let effectiveDay = normalizedClock.day;
  let effectiveHour = normalizedClock.hour;
  let effectiveMinute = normalizedClock.minute;
  let effectiveSecond = normalizedClock.second;
  let solarTimeDetail = '本次未启用真太阳时修正。';
  let usedSolarTime = false;

  if (data.useSolarTime && longitude !== undefined) {
    const solarTimeInfo = calculateTrueSolarTime(
      normalizedClock.year,
      normalizedClock.month,
      normalizedClock.day,
      normalizedClock.hour,
      normalizedClock.minute,
      normalizedClock.second,
      longitude,
      timezone
    );
    effectiveYear = solarTimeInfo.year;
    effectiveMonth = solarTimeInfo.month;
    effectiveDay = solarTimeInfo.day;
    effectiveHour = solarTimeInfo.hour;
    effectiveMinute = solarTimeInfo.minute;
    effectiveSecond = solarTimeInfo.second;
    usedSolarTime = true;
    solarTimeDetail = `钟表时间 ${normalizedClock.year}-${normalizedClock.month}-${normalizedClock.day} ${normalizedClock.hour}:${normalizedClock.minute}:${normalizedClock.second} 已修正为真太阳时 ${effectiveYear}-${effectiveMonth}-${effectiveDay} ${effectiveHour}:${effectiveMinute}:${effectiveSecond}。`;
    console.log(
      `[Solar Time] 钟表时间: ${normalizedClock.year}-${normalizedClock.month}-${normalizedClock.day} ${normalizedClock.hour}:${normalizedClock.minute}:${normalizedClock.second} → 真太阳时: ${effectiveYear}-${effectiveMonth}-${effectiveDay} ${effectiveHour}:${effectiveMinute}:${effectiveSecond}`
    );
  }

  return {
    usedSolarTime,
    solarTimeDetail,
    effectiveBirthDate: new Date(effectiveYear, effectiveMonth - 1, effectiveDay),
    effectiveBirthTime: `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`,
    effectiveSecond,
  };
}

function toStandardClockTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
) {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() - 60);

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcDate.getUTCHours(),
    minute: utcDate.getUTCMinutes(),
    second: utcDate.getUTCSeconds(),
  };
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
  });
}

function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
