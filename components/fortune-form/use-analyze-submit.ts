'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UNKNOWN_LOCATION,
  formatBirthLabel,
  normalizeBirthPlaceLabel,
  type FormLocationState,
  type PaipanInfoData,
} from '@/lib/paipan-form';
import { trackGoogleAnalyticsEvent } from '@/lib/google-analytics';
import { appendSearchParamsToHref } from '@/lib/source-url';
import type { TacitKnowledgeInput } from '@/lib/tacit-knowledge';

type CompletionMeta = {
  llmUsed: boolean;
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  grade?: 'S' | 'A' | 'B' | 'C';
  score?: number;
  targetAchieved?: boolean;
  upgradeQueued?: boolean;
  upgradeStatus?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
  upgradeAttempts?: number;
  upgradeMaxAttempts?: number;
};

type ServerStage = {
  stage: string;
  progress: number;
  label: string;
  detail: string;
};

type LoadingSummary = {
  name: string;
  birthText: string;
  birthPlace: string;
  solarTimeText: string;
  useSolarTime: boolean;
  useDaylightSaving: boolean;
  useSeparateZiHour: boolean;
  // v5-D3: 客户端快算预热
  birthday: string;
  unknownHour: boolean;
  gender: 0 | 1;
};

type AnalyzeEvent =
  | { type: 'stage'; stage: string; progress: number; label: string; detail: string }
  | {
      type: 'complete';
      reportId: string;
      llm?: { used?: boolean; fallbackToEngine?: boolean };
      quality?: {
        score?: number;
        grade?: 'S' | 'A' | 'B' | 'C';
        deliveryTier?: 'basic' | 'enhanced' | 'expert';
        targetAchieved?: boolean;
      };
      upgrade?: {
        queued?: boolean;
        reason?: string;
        status?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
        attempts?: number;
        maxAttempts?: number;
      };
    }
  | { type: 'error'; error: string };

const ANALYZE_REQUEST_TIMEOUT_MS = 90_000;
const ANALYZE_IDLE_TIMEOUT_MS = 45_000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}

function buildCaseName() {
  const KEY = 'demoCount';
  try {
    const current = Number(window.localStorage.getItem(KEY) || '0') + 1;
    window.localStorage.setItem(KEY, String(current));
    return `案例${current}`;
  } catch {
    // localStorage 不可用（如 iOS Safari 私密模式 / 第三方 cookie 拦截）
    // 用时间戳后 4 位作为兜底，避免完全没有名字
    const fallback = String(Date.now()).slice(-4);
    return `案例${fallback}`;
  }
}

export type AnalyzeSubmitContext = {
  setTimeInfoValues: { useSolarTime: boolean; useSeparateZiHour: boolean };
  selectedCaseType: string;
  readinessScore: number;
  hasKnownLocation: boolean;
  hasKnownBirthHour: boolean;
  activeSource: string;
  inferredToolSlug: string | null;
  tacitContext: TacitKnowledgeInput;
  computedSolarTime: (info: PaipanInfoData, location: FormLocationState) => string;
  returnHref?: string;
  hasEmailDelivery: boolean;
  verifiedEmail: string;
  /** v5-D39 多档案：可选 relation 与自定义昵称 */
  relation?: string | null;
  relationLabel?: string | null;
};

export function useAnalyzeSubmit(ctx: AnalyzeSubmitContext) {
  const router = useRouter();
  const requestRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState<LoadingSummary | null>(null);
  const [serverStage, setServerStage] = useState<ServerStage | null>(null);
  const [completionMeta, setCompletionMeta] = useState<CompletionMeta | null>(null);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    setLoadingSummary(null);
    setServerStage(null);
    setCompletionMeta(null);
    setLoadingComplete(false);
    setLoading(false);
    requestRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    requestRef.current?.abort();
    reset();
  }, [reset]);

  // 组件卸载时取消正在进行的 SSE 流，避免 setState 已卸载组件
  useEffect(() => {
    return () => {
      requestRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  const submit = useCallback(
    async (payload: PaipanInfoData, payloadLocation: FormLocationState) => {
      setLoading(true);
      setLoadingComplete(false);
      setServerStage(null);
      setCompletionMeta(null);
      setError('');

      const displayName = payload.username.trim() || buildCaseName();
      const [birthDate, birthTime] = payload.birthday.split(' ');
      const birthPlace = normalizeBirthPlaceLabel(payloadLocation.addressData);
      const useSolarTime = ctx.setTimeInfoValues.useSolarTime;
      const useDaylightSaving = Boolean(payload.xls);
      const useSeparateZiHour = ctx.setTimeInfoValues.useSeparateZiHour;

      setLoadingSummary({
        name: displayName,
        birthText: formatBirthLabel(payload, payload.type),
        birthPlace,
        solarTimeText: ctx.computedSolarTime(payload, payloadLocation),
        useSolarTime,
        useDaylightSaving,
        useSeparateZiHour,
        // v5-D3: 提供给 PreheatPanel 客户端快算
        birthday: payload.birthday,
        unknownHour: payload.unknowhour === 1,
        gender: payload.sex as 0 | 1,
      });

      try {
        trackGoogleAnalyticsEvent('analyze_submitted', {
          case_type: ctx.selectedCaseType,
          readiness_score: ctx.readinessScore,
          has_known_location: ctx.hasKnownLocation,
          has_known_birth_hour: ctx.hasKnownBirthHour,
          use_solar_time: useSolarTime,
          source: ctx.activeSource || 'direct',
          tool_slug: ctx.inferredToolSlug,
        });

        const controller = new AbortController();
        requestRef.current = controller;
        timeoutRef.current = setTimeout(() => {
          controller.abort('request-timeout');
        }, ANALYZE_REQUEST_TIMEOUT_MS);
        const refreshIdleTimeout = () => {
          if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
          }
          idleTimeoutRef.current = setTimeout(() => {
            controller.abort('idle-timeout');
          }, ANALYZE_IDLE_TIMEOUT_MS);
        };
        refreshIdleTimeout();

        const response = await fetch('/api/analyze', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-analyze-stream': '1',
          },
          body: JSON.stringify({
            name: displayName,
            gender: payload.sex === 1 ? 'male' : 'female',
            birthDate,
            birthTime,
            birthSecond: 0,
            birthPlace,
            timezone: payload.hw && payload.bjtime ? 8 : payloadLocation.timezone,
            longitude: payloadLocation.longitude,
            latitude: payloadLocation.latitude ?? (UNKNOWN_LOCATION.latitude as number),
            cityNameEn:
              payloadLocation.option?.nameEn ||
              payloadLocation.option?.city ||
              payloadLocation.addressData[1] ||
              payloadLocation.addressData[0],
            useDaylightSaving,
            useSolarTime,
            useSeparateZiHour,
            tacitContext: ctx.tacitContext,
            unknowhour: payload.unknowhour,
            xls: payload.xls,
            bjtime: payload.bjtime,
            hw: payload.hw,
            typeId: payload.typeId,
            isSave: payload.isSave,
            source: ctx.activeSource || null,
            toolSlug: ctx.inferredToolSlug,
            relation: ctx.relation ?? null,
            relationLabel: ctx.relationLabel ?? null,
          }),
        });
        refreshIdleTimeout();

        if (!response.ok || !response.body) {
          const failed = await response.json().catch(() => null);
          let message = failed?.error;
          if (!message) {
            if (response.status === 429) {
              message = '请求过于频繁，请稍后再试';
            } else if (response.status === 503) {
              message = '系统繁忙，请稍后再试';
            } else if (response.status >= 500) {
              message = '服务异常，请稍后再试';
            } else {
              message = '分析请求失败，请稍后再试';
            }
          }
          setError(message);
          setLoadingSummary(null);
          setLoading(false);
          reset();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completedReportId = '';
        let completedMeta: CompletionMeta | null = null;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          refreshIdleTimeout();

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const event = JSON.parse(trimmed) as AnalyzeEvent;

            if (event.type === 'stage') {
              setServerStage({
                stage: event.stage,
                progress: event.progress,
                label: event.label,
                detail: event.detail,
              });
              continue;
            }

            if (event.type === 'error') {
              setError(event.error || '分析失败，请稍后再试');
              setLoadingSummary(null);
              setServerStage(null);
              setCompletionMeta(null);
              setLoading(false);
              reset();
              return;
            }

            if (event.type === 'complete') {
              completedReportId = event.reportId;
              completedMeta = {
                llmUsed: !!event.llm?.used,
                deliveryTier: event.quality?.deliveryTier,
                grade: event.quality?.grade,
                score: event.quality?.score,
                targetAchieved: !!event.quality?.targetAchieved,
                upgradeQueued: !!event.upgrade?.queued,
                upgradeStatus: event.upgrade?.status,
                upgradeAttempts: event.upgrade?.attempts,
                upgradeMaxAttempts: event.upgrade?.maxAttempts,
              };
              setCompletionMeta(completedMeta);
              trackGoogleAnalyticsEvent('analyze_completed', {
                report_id: event.reportId,
                llm_used: !!event.llm?.used,
                delivery_tier: event.quality?.deliveryTier || 'basic',
                quality_grade: event.quality?.grade || 'B',
                quality_score: event.quality?.score || 0,
                target_achieved: !!event.quality?.targetAchieved,
                upgrade_queued: !!event.upgrade?.queued,
                upgrade_status: event.upgrade?.status || 'none',
                source: ctx.activeSource || 'direct',
                tool_slug: ctx.inferredToolSlug,
              });
            }
          }
        }

        if (!completedReportId) {
          setError('分析结果未完整返回，请稍后重试');
          setLoadingSummary(null);
          setServerStage(null);
          setCompletionMeta(null);
          setLoading(false);
          reset();
          return;
        }

        setLoadingComplete(true);
        const targetAchieved = completedMeta?.targetAchieved;
        const deliveryTier = completedMeta?.deliveryTier;
        const upgradeQueued = completedMeta?.upgradeQueued;
        setServerStage({
          stage: 'complete',
          progress: 100,
          label:
            targetAchieved || deliveryTier === 'expert'
              ? '专家版报告已准备就绪'
              : '主报告已准备就绪',
          detail:
            targetAchieved || deliveryTier === 'expert'
              ? '本次结果已经达到专家版标准，正在为你打开完整报告。'
              : upgradeQueued
                ? '当前先打开核心结果页，更完整的内容会继续补全到这份报告里。'
                : '结果页已经生成并保存完成，核心内容会先打开，扩展区块随后继续加载。',
        });
        await wait(220);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        requestRef.current = null;
        router.push(
          ctx.returnHref
            ? appendSearchParamsToHref(`${ctx.returnHref}#tool-runner`, {
                source: ctx.activeSource || undefined,
                reportId: completedReportId,
                ready: '1',
              })
            : appendSearchParamsToHref(`/result/${completedReportId}`, {
                source: ctx.activeSource || undefined,
              }),
        );
      } catch (err) {
        if (isAbortError(err)) {
          const reason = requestRef.current?.signal.reason;
          setError(
            reason === 'request-timeout' || reason === 'idle-timeout'
              ? '本次连接等待时间过长，已自动停止。请稍后重试；如果报告已生成，可在判断记录中查看。'
              : '已取消本次判断，你可以继续修改信息后重新提交',
          );
        } else {
          setError(
            ctx.hasEmailDelivery
              ? `网络连接异常，请稍后重试。若报告已经成功生成并保存完成，系统也会把结果提醒发到 ${ctx.verifiedEmail}。`
              : '网络连接异常，请稍后重试。你也可以稍后回到判断记录里查看是否已生成结果。',
          );
        }
        reset();
      }
    },
    [ctx, router, reset],
  );

  return {
    loading,
    loadingComplete,
    loadingSummary,
    serverStage,
    completionMeta,
    error,
    setError,
    submit,
    cancel,
  };
}
