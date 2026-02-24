'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FortuneProgress({ isComplete = false }: { isComplete?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { name: '排盘建局，推算四柱八字...', duration: 2000 },
    { name: '五行生克，分析十神格局...', duration: 3000 },
    { name: '大运流年，推演人生起伏...', duration: 3000 },
    { name: '请教AI大师，生成深度报告...', duration: 4000 },
  ];

  useEffect(() => {
    let current = 0;
    let stepIndex = 0;
    
    // Total duration ~12 seconds. We update every 100ms
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
      
      // Determine current step based on progress
      let accumulatedProgress = 0;
      for (let i = 0; i < steps.length; i++) {
        accumulatedProgress += (steps[i].duration / totalDuration) * 100;
        if (current <= accumulatedProgress) {
          if (stepIndex !== i) {
            stepIndex = i;
            setCurrentStep(i);
          }
          break;
        }
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-purple-100">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-gray-100 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <motion.circle
              className="text-purple-600 stroke-current"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              initial={{ strokeDasharray: "0 251.2" }}
              animate={{ strokeDasharray: \`\${(progress / 100) * 251.2} 251.2\` }}
              transition={{ duration: 0.1, ease: "linear" }}
              transform="rotate(-90 50 50)"
            ></motion.circle>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-purple-700">{Math.round(progress)}%</span>
          </div>
        </div>
        
        <div className="h-8 flex items-center justify-center overflow-hidden">
          <motion.p 
            key={currentStep}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="text-gray-700 font-medium text-center"
          >
            {steps[currentStep].name}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
