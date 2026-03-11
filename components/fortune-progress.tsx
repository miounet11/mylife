'use client';

import { useEffect, useState } from 'react';

const steps = [
  { name: '正在初始化排盘引擎与真太阳时参数', duration: 1400 },
  { name: '根据经纬度与时区修正出生时刻', duration: 2200 },
  { name: '计算四柱、五行、十神与强弱结构', duration: 2600 },
  { name: '识别格局并生成多维度趋势建议', duration: 2800 },
  { name: '整合结果页内容并准备跳转展示', duration: 3200 },
];

export default function FortuneProgress({ isComplete = false }: { isComplete?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let current = 0;
    let stepIndex = 0;
    const totalDuration = steps.reduce((sum, item) => sum + item.duration, 0);
    const tick = 100;
    const progressPerTick = 100 / (totalDuration / tick);

    const timer = window.setInterval(() => {
      current += progressPerTick;

      if (current >= 100 || isComplete) {
        setProgress(100);
        setCurrentStep(steps.length - 1);
        window.clearInterval(timer);
        return;
      }

      setProgress(current);

      let accumulated = 0;
      for (let index = 0; index < steps.length; index += 1) {
        accumulated += (steps[index].duration / totalDuration) * 100;
        if (current <= accumulated) {
          stepIndex = index;
          setCurrentStep(index);
          break;
        }
      }
    }, tick);

    return () => window.clearInterval(timer);
  }, [isComplete]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="glass-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="space-y-4">
            <div className="section-label">分析进行中</div>
            <div>
              <h3 className="text-3xl font-black text-[color:var(--ink)]">报告正在生成</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                我们把计算过程拆成可感知步骤，减少用户对“黑盒等待”的不安。
              </p>
            </div>

            <div className="inline-flex items-end gap-2">
              <span className="text-5xl font-black text-[color:var(--accent-strong)]">{Math.round(progress)}</span>
              <span className="pb-1 text-lg font-semibold text-[color:var(--muted)]">%</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-full bg-white/75">
              <div
                className="h-4 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--warm))] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="rounded-[1.5rem] bg-white/85 p-5">
              <div className="text-sm font-semibold text-[color:var(--ink)]">当前阶段</div>
              <div className="mt-2 text-base leading-7 text-[color:var(--muted)]">{steps[currentStep].name}</div>
            </div>

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
                  {step.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
