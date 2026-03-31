'use client';

import { CheckCircle2, Clock3, MapPin, Sparkles, Stars, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const steps = [
  {
    name: '锁定出生信息与判断上下文',
    detail: '先冻结用户输入，确认生日、地点、时区与是否启用真太阳时修正。',
    target: 18,
  },
  {
    name: '修正出生时刻并建立结构底座',
    detail: '根据经纬度、时区与节律参数处理出生时刻，准备四柱与基础结构。',
    target: 40,
  },
  {
    name: '计算四柱、五行、十神与格局关系',
    detail: '开始识别命局重心、强弱变化与关键结构，不是简单给一个标签。',
    target: 64,
  },
  {
    name: '合成阶段趋势、重点主题与行动建议',
    detail: '把命局、运势节奏和现实场景连接起来，形成用户真正能读懂的建议。',
    target: 86,
  },
  {
    name: '整理结果页并准备打开完整报告',
    detail: '将结构、趋势、建议和人生 K 线整合成最终展示内容。',
    target: 100,
  },
];

const reassuranceMessages = [
  '当前阶段属于多模块计算，耗时会比普通表单提交长一些。',
  '如果模型响应稍慢，系统会继续等待或自动切换备用策略，不需要重复提交。',
  '正在把命局结构、阶段判断和建议整理成可直接阅读的结果页。',
  '你不需要停留在空白页，我们会持续反馈当前处理阶段。',
  '世界易会先看结构，再看阶段，再把环境和动作压缩成一页结果。',
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
    return `如果上游网络或模型响应偏慢，你可以先离开页面；只要报告成功生成并保存完成，系统也会发一封结果提醒到 ${deliverySupport.emailLabel}。`;
  }

  return '如果上游网络或模型响应偏慢，你可以稍后回来继续查看；报告一旦成功保存，也会出现在你的判断记录里。登录并绑定邮箱后，还可以直接收邮件提醒。';
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
    ? '当前等待时间偏长，通常意味着正在进行更复杂的结果整理，或模型链路正在自动切换备用策略。'
    : '当前等待时间略长于普通请求，系统仍在继续处理中，不需要重复提交。';
  const deliveryTierLabel = completionMeta?.deliveryTier === 'expert'
    ? 'S级专家版'
    : completionMeta?.deliveryTier === 'enhanced'
      ? '增强版'
      : '可读版';
  const backgroundUpgradeLabel = completionMeta?.upgradeStatus === 'running'
    ? '后台正在增强到 S级'
    : completionMeta?.upgradeStatus === 'pending' || completionMeta?.upgradeStatus === 'retry'
      ? '后台已排队继续增强'
      : completionMeta?.upgradeStatus === 'completed'
        ? '后台增强已完成'
        : completionMeta?.upgradeStatus === 'failed'
          ? '后台增强暂时受阻'
          : '';
  const completionHeading = completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
    ? '专家版报告已完成'
    : '主报告已完成';
  const completionDescription = completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
    ? '这次已经生成达到专家版门槛的完整报告，正在为你打开结果页。'
    : completionMeta?.upgradeQueued
      ? `当前先交付${deliveryTierLabel}主结果，页面会优先打开核心结论，后台继续增强深度区块并尝试提升到 S级专家版。`
      : `当前已生成${deliveryTierLabel}主结果，结果页会先展示核心结论，扩展区块按顺序继续加载。`;
  const finalStatusLabel = isComplete
    ? completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
      ? '已达到专家版'
      : completionMeta?.upgradeQueued
        ? '先看主结果，后台继续增强'
        : '核心结果先打开'
    : '持续计算中';
  const finalStageMessage = isComplete
    ? completionMeta?.targetAchieved || completionMeta?.deliveryTier === 'expert'
      ? '当前版本已越过 95 分 S级门槛。'
      : completionMeta?.upgradeQueued
        ? `当前质量 ${completionMeta?.score || '--'} / ${completionMeta?.grade || 'B'}，系统会先打开核心报告，深度区块和后台增强会继续补齐。`
        : '当前结果已经整理完成，核心区块会先打开，其余扩展内容继续分批显示。'
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
              <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
                {isComplete ? completionDescription : '我们把处理过程拆成清晰阶段，让用户在等待时始终知道系统正在做什么。'}
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
                    ? '进入结果页后先看核心结论，系统仍会继续在后台增强'
                    : '结果页即将打开，核心内容会先显示'
                  : '提交后系统会自动继续，期间无需重复点击'}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/72 p-4 text-xs leading-6 text-[color:var(--muted)]">
              世界易处理中轴：先定结构，再看阶段，再结合环境整理动作与风险。你看到的不是一段空等，而是在生成一套更有顺序的判断结果。
            </div>

            {isSlow ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 p-4 text-xs leading-6 text-amber-900">
                <div className="font-semibold text-amber-800">等待偏长时，不需要一直守着页面</div>
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
                  <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
                    当前会按真太阳时修正后继续分析：{summary.solarTimeText}
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
              <div className="text-sm font-semibold text-[color:var(--ink)]">当前阶段</div>
              <div className="mt-2 text-base font-semibold leading-7 text-[color:var(--ink)]">
                {serverStage?.label || steps[currentStep].name}
              </div>
              <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
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

            <div className="rounded-[1.5rem] border border-white/60 bg-white/70 p-4 text-xs leading-6 text-[color:var(--muted)]">
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
