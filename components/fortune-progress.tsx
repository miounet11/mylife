'use client';

import { useState, useEffect } from 'react';

export default function FortuneProgress({ isComplete = false }: { isComplete?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  const steps = [
    { name: '系统初始化，加载真太阳时参数...', duration: 1500 },
    { name: '经纬度及均时差双重修正，排演四柱八字...', duration: 2500 },
    { name: '计算五行力量分布，判定日主旺衰...', duration: 2500 },
    { name: '匹配十神及特殊格局，提取用神忌神...', duration: 3000 },
    { name: '结合AI模型，生成多维度决策支持报告...', duration: 4000 },
  ];

  useEffect(() => {
    let current = 0;
    let stepIndex = 0;

    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    const updateInterval = 100;
    const progressPerInterval = 100 / (totalDuration / updateInterval);

    const interval = setInterval(() => {
      current += progressPerInterval;

      if (current >= 100 || isComplete) {
        setProgress(100);
        setCurrentStep(steps.length - 1);
        clearInterval(interval);
        return;
      }

      setProgress(current);

      let accumulatedProgress = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulatedProgress += (steps[i].duration / totalDuration) * 100;
        if (current <= accumulatedProgress) {
          if (stepIndex !== i) {
            stepIndex = i;
            setCurrentStep(i);
            setFadeKey(prev => prev + 1);
          }
          break;
        }
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isComplete]);

  const dashLen = (progress / 100) * 251.2;

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg border border-slate-200 mt-8">
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-900 font-serif tracking-tight">引擎计算中</h3>
          <p className="text-sm text-slate-500">请耐心等待，正在为您生成专属命理报告</p>
        </div>

        <div className="relative w-28 h-28">
          <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 100 100">
            <circle
              className="text-slate-100 stroke-current"
              strokeWidth="6"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            />
            <circle
              className="text-indigo-600 stroke-current"
              strokeWidth="6"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={`${dashLen} 251.2`}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-700 font-mono tracking-tighter">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <div className="h-6 flex items-center justify-center overflow-hidden">
            <p
              key={fadeKey}
              className="text-sm font-medium text-slate-700 text-center animate-fade-in"
            >
              {steps[currentStep].name}
            </p>
          </div>
          
          {/* 进度条指示器 */}
          <div className="flex justify-between space-x-1">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx < currentStep ? 'bg-indigo-600' : 
                  idx === currentStep ? 'bg-indigo-400 animate-pulse' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
