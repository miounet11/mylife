import { NextRequest, NextResponse } from 'next/server';
import { createFortuneWithUser, userOperations } from '@/lib/database';
import { queueEmailDeliveryJob } from '@/lib/email-delivery-jobs';
import { deliverMailWithRetry, isEmailDeliveryConfigured, sendReportReadyEmail } from '@/lib/email';
import { trackServerEvent } from '@/lib/analytics';
import { CURRENT_REPORT_VERSION, generateVersionedReport } from '@/lib/report-pipeline';
import { enqueueReportUpgrade } from '@/lib/report-upgrade-jobs';
import { withReportVersionLineage } from '@/lib/report-version-lineage';
import { checkRateLimit, getClientKey, RATE_LIMITS } from '@/lib/rate-limit';
import { calculateTrueSolarTime } from '@/lib/solar-time';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import type { FortuneAdvice } from '@/lib/user-types';
import { validateAnalyzeRequest } from '@/lib/validators';

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
  const stageRef: AnalyzeStageRef = { current: 'received' };
  let clientKey = 'unknown';
  try {
    clientKey = getClientKey(request);
    const rateLimit = checkRateLimit(`analyze:${clientKey}`, RATE_LIMITS.analyze);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '请求过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } }
      );
    }

    const data = await request.json() as AnalyzeInput;
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
      });
    }

    const execution = await executeAnalyze(data, {
      requestStartedAt,
      requestMode: 'json',
      stageRef,
    });
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
      eventName: 'analyze_failed',
      page: '/analyze',
      meta: {
        stage: stageRef.current,
        durationMs: Date.now() - requestStartedAt,
        error: error instanceof Error ? error.message : 'unknown',
        requestMode: 'json',
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
          stageRef,
          onStage: (event) => send(event),
        });

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
          eventName: 'analyze_failed',
          page: '/analyze',
          meta: {
            stage: stageRef.current,
            durationMs: Date.now() - context.requestStartedAt,
            error: error instanceof Error ? error.message : 'unknown',
            requestMode: 'stream',
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
    },
  });
}

async function executeAnalyze(
  data: AnalyzeInput,
  options?: {
    requestStartedAt?: number;
    requestMode?: 'json' | 'stream';
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
    source: 'analyze',
    onProgress: async (progressEvent) => {
      const mapped = mapPipelineStage(progressEvent);
      if (mapped) {
        stage(mapped);
      }
    },
  });

  stage({
    type: 'stage',
    stage: 'persist',
    progress: 94,
    label: '正在写入报告与用户档案',
    detail: '命盘结果已经生成，正在保存报告、归档测算记录并准备结果页。',
  });

  const reportId = generateReportId();
  const userId = await getOrCreateGuestUserId();
  finalResult.analysis = withReportVersionLineage({
    nextAnalysis: finalResult.analysis,
    nextReportVersion: CURRENT_REPORT_VERSION,
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
      isPublic: false,
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
    },
  });

  trackServerEvent({
    userId,
    sessionId: userId,
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
    },
  });
  trackServerEvent({
    userId,
    sessionId: userId,
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
      ? '专家版报告已准备就绪'
      : '当前可读版报告已准备就绪',
    detail: finalResult.analysis?.qualityAudit?.targetAchieved || finalResult.analysis?.qualityAudit?.deliveryTier === 'expert'
      ? '本次结果已经达到专家版标准，正在为你打开完整报告。'
      : queuedUpgrade.queued
        ? '当前先打开可读版结果，后台会继续增强并尝试提升到 S 级专家版。'
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
    isPublic: false,
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
      started: { progress: 22, label: '命理引擎正在计算结构底座' },
      completed: { progress: 38, label: '基础命盘结构计算完成' },
    },
    llm: {
      started: { progress: 48, label: '语言模型正在增强解释层' },
      completed: { progress: 62, label: '语言增强阶段已完成' },
    },
    agentic: {
      started: { progress: 58, label: '并发专家 Agent 正在分析' },
      completed: { progress: 78, label: '并发专家 Agent 已返回结果' },
    },
    merge: {
      started: { progress: 86, label: '正在整合最终报告' },
      completed: { progress: 92, label: '最终报告整合完成' },
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
    detail: progressEvent.detail,
  };
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
