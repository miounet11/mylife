'use client';

import { CheckCircle2, Clock3, MapPin, Sparkles, Stars, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { describeReportDeliveryStage } from '@/lib/report-quality';

const steps = [
  {
    name: '锁定信息',
    detail: '生日、地点、时区',
    target: 18,
  },
  {
    name: '修正时刻',
    detail: '真太阳时、四柱、底座',
    target: 40,
  },
  {
    name: '计算结构',
    detail: '五行、十神、格局',
    target: 64,
  },
  {
    name: '整理重点',
    detail: '阶段、主题、动作',
    target: 86,
  },
  {
    name: '生成结果',
    detail: '结果页、K 线、报告',
    target: 100,
  },
];

const reassuranceMessages = [
  '多模块计算中',
  '系统持续处理',
  '结果页整理中',
  '阶段持续更新',
  '结构与动作生成中',
];

interface FortuneProgressSummary {
  name: string;
  birthText: string;
  birthPlace: string;
  solarTimeText: string;
  useSolarTime: boolean;
  useDaylightSaving: boolean;
  useSeparateZiHour: boolean;
}

interface FortuneProgressServerStage {
  stage: string;
  progress: number;
  label: string;
  detail: string;
}

interface FortuneProgressCompletionMeta {
  llmUsed: boolean;
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  grade?: 'S' | 'A' | 'B' | 'C';
  score?: number;
  targetAchieved?: boolean;
  upgradeQueued?: boolean;
  upgradeStatus?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
  upgradeAttempts?: number;
  upgradeMaxAttempts?: number;
}

interface FortuneProgressDeliverySupport {
  canEmailNotify: boolean;
  emailLabel?: string | null;
}

function buildDeliveryHint(deliverySupport?: FortuneProgressDeliverySupport | null) {
  if (deliverySupport?.canEmailNotify && deliverySupport.emailLabel) {
    return `可离开页面，完成后会通知到 ${deliverySupport.emailLabel}。`;
  }

  return '可稍后回来查看，结果会保存到记录。';
}

export default function FortuneProgress({
  isComplete = false,
  summary,
  onCancel,
  serverStage,
  completionMeta,
  deliverySupport,
}: {
  isComplete?: boolean;
  summary?: FortuneProgressSummary | null;
  onCancel?: () => void;
  serverStage?: FortuneProgressServerStage | null;
  completionMeta?: FortuneProgressCompletionMeta | null;
  deliverySupport?: FortuneProgressDeliverySupport | null;
}) {
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (isComplete) {
          return 100;
        }

        if (current >= 93) {
          return current;
        }

        const delta = current < 18
          ? 1.8
          : current < 40
            ? 1.15
            : current < 64
              ? 0.82
              : current < 86
                ? 0.42
                : 0.18;

        return Math.min(current + delta, 93);
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % reassuranceMessages.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [isComplete]);

  const estimatedStep = useMemo(() => {
    const matchedIndex = steps.findIndex((step) => progress <= step.target);
    return matchedIndex === -1 ? steps.length - 1 : matchedIndex;
  }, [progress]);

  const currentStep = serverStage
    ? Math.max(0, steps.findIndex((step) => serverStage.progress <= step.target))
    : estimatedStep;
  const nextStep = currentStep < steps.length - 1 ? steps[currentStep + 1] : null;
  const displayProgress = serverStage ? Math.max(progress, serverStage.progress) : progress;
  const progressLabel = isComplete ? '100' : String(Math.round(displayProgress));
  const elapsedLabel = elapsedSeconds < 60
    ? `${elapsedSeconds} 秒`
    : `${Math.floor(elapsedSeconds / 60)} 分 ${String(elapsedSeconds % 60).padStart(2, '0')} 秒`;
  const isSlow = !isComplete && elapsedSeconds >= 12;
  const slowHint = elapsedSeconds >= 20
    ? '等待较长，系统仍在处理。'
    : '处理中，无需重复提交。';
  const deliveryStage = describeReportDeliveryStage(completionMeta?.deliveryTier);
  const deliveryTierLabel = deliveryStage.shortLabel;
  const backgroundUpgradeLabel = completionMeta?.upgradeStatus === 'running'
    ? '后台正在增强到更细致的报告'
    : completionMeta?.upgradeStatus === 'pending' || completionMeta?.upgradeStatus === 'retry'
      ? '后台已排队继续增强'
      : completionMeta?.upgradeStatus === 'completed'
        ? '后台增强已完成'
        : completionMeta?.upgradeStatus === 'failed'
          ? '后台增强暂时受阻'
          : '';
  const completionHeading = completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
    ? '更细致的报告已完成'
    : `${deliveryStage.label}已完成`;
  const completionDescription = completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
    ? '更细致的报告结果已生成。'
    : completionMeta?.upgradeQueued
      ? `先打开${deliveryTierLabel}结果，后台继续增强到更细致的报告。`
      : `${deliveryTierLabel}结果已生成。`;
  const finalStatusLabel = isComplete
    ? completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
      ? '已达到细致版'
      : completionMeta?.upgradeQueued
        ? '后台继续增强'
        : `${deliveryTierLabel}已生成`
    : '计算中';
  const finalStageMessage = isComplete
    ? completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
      ? '已达到更细致的报告。'
      : completionMeta?.upgradeQueued
        ? `当前质量 ${completionMeta?.score || '--'} / ${completionMeta?.grade || 'B'}。`
        : `${deliveryStage.label}整理完成。`
    : reassuranceMessages[messageIndex];
  const deliveryHint = buildDeliveryHint(deliverySupport);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="glass-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-8 md:grid-cols-[0.88fr_1.12fr] md:items-start">
          <div className="space-y-5">
            <div className="section-label">分析进行中</div>
            <div>
              <h3 className="text-3xl font-black text-[color:var(--ink)]">
                {isComplete ? completionHeading : '报告正在生成'}
              </h3>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                {isComplete ? completionDescription : '状态持续更新'}
              </p>
            </div>

            <div className="inline-flex items-end gap-2">
              <span className="text-5xl font-black text-[color:var(--accent-strong)]">{progressLabel}</span>
              <span className="pb-1 text-lg font-semibold text-[color:var(--muted)]">%</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white/85 p-4">
                <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-[color:var(--muted)]">
                  <Clock3 className="h-3.5 w-3.5" />
                  已等待
                </div>
                <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{elapsedLabel}</div>
              </div>
              <div className="rounded-[1.5rem] bg-white/85 p-4">
                <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-[color:var(--muted)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  当前节奏
                </div>
                <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">
                  {finalStatusLabel}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!onCancel || isComplete}
                onClick={onCancel}
                className="action-secondary py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                返回修改信息
              </button>
              <div className="inline-flex items-center rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-medium text-[color:var(--accent-strong)]">
                {isComplete
                  ? completionMeta?.upgradeQueued
                    ? '先看结果，后台增强'
                    : '结果页即将打开'
                  : '自动处理中'}
              </div>
            </div>

            {isSlow ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-4 text-xs leading-6 text-amber-900">
                <div className="font-semibold text-amber-800">等待较长</div>
                <div className="mt-2">{deliveryHint}</div>
              </div>
            ) : null}

            {summary ? (
              <div className="rounded-[1.5rem] bg-[rgba(201,125,58,0.1)] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                  <Stars className="h-4 w-4" />
                  本次判断已锁定输入
                </div>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--ink)]">
                  <div className="flex items-start gap-2">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--muted)]" />
                    <span>{summary.name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--muted)]" />
                    <span>{summary.birthText}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--muted)]" />
                    <span>{summary.birthPlace}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[color:var(--muted)]">
                    真太阳时 {summary.useSolarTime ? '开启' : '关闭'}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[color:var(--muted)]">
                    夏令时 {summary.useDaylightSaving ? '开启' : '关闭'}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[color:var(--muted)]">
                    早晚子时 {summary.useSeparateZiHour ? '开启' : '关闭'}
                  </span>
                </div>
                {summary.useSolarTime ? (
                  <div className="mt-3 text-xs text-[color:var(--muted)]">
                    真太阳时：{summary.solarTimeText}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-full bg-white/75">
                <div
                  className="h-4 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--warm))] transition-all duration-200"
                style={{ width: `${displayProgress}%` }}
              />
            </div>

            <div className="rounded-[1.5rem] bg-white/85 p-5">
              <div className="text-sm font-semibold text-[color:var(--ink)]">阶段</div>
              <div className="mt-2 text-base font-semibold leading-7 text-[color:var(--ink)]">
                {serverStage?.label || steps[currentStep].name}
              </div>
              <div className="mt-2 text-sm text-[color:var(--muted)]">
                {serverStage?.detail || steps[currentStep].detail}
              </div>
              {nextStep ? (
                <div className="mt-3 rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                  下一步：{nextStep.name}
                </div>
              ) : (
                <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  结果已经准备好，正在进入报告页
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 text-sm text-[color:var(--muted)]">
              {finalStageMessage}
            </div>

            {isSlow ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
                {slowHint}
              </div>
            ) : null}

            {isComplete && completionMeta?.upgradeQueued ? (
              <div className="rounded-[1.5rem] border border-[color:var(--accent)]/25 bg-[color:var(--accent-soft)] p-4 text-xs leading-6 text-[color:var(--accent-strong)]">
                {backgroundUpgradeLabel || '后台增强任务已建立'}
                {typeof completionMeta.upgradeAttempts === 'number' && typeof completionMeta.upgradeMaxAttempts === 'number'
                  ? `，当前重试进度 ${completionMeta.upgradeAttempts} / ${completionMeta.upgradeMaxAttempts}。`
                  : '。'}
              </div>
            ) : null}

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.name}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    index < currentStep
                      ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                      : index === currentStep
                        ? 'bg-[color:var(--ink)] text-white'
                        : 'bg-white/70 text-[color:var(--muted)]'
                  }`}
                >
                  <div className="font-semibold">{step.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
