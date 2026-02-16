// NextStep引导组件 - 从可信报告到AI助手的桥梁
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles, Bot } from 'lucide-react';

export default function NextStepGuide() {
  const [step, setStep] = useState(1);
  
  const handleCompleteStep = () => {
    setStep(step + 1);
  };

  const handleSkip = () => {
    // 跳到创建档案
    window.location.href = '/profile/create';
  };

  return (
    <div className="mt-16 pt-8 border-t-2 border-purple-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 标题 */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            🎉 您已完成精准的命理分析
          </h2>
          <p className="text-xl text-gray-700">
            现在让我们创建您的永久档案，让AI持续为您服务
          </p>
        </div>

        {/* 步骤1：可信报告完成 */}
        {step >= 1 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">步骤 1：可信报告完成</h3>
                  <p className="text-sm text-gray-600">AI已经帮您分析了八字、五行、格局、运势</p>
                </div>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              您现在拥有了一份像真正大师一样精准可信的命理分析报告，
              包含六层次的分析和具体的可执行建议。
            </p>
            <button
              onClick={handleCompleteStep}
              className="w-full bg-white border-2 border-green-500 text-green-600 py-3 px-6 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center space-x-2"
            >
              <span>下一步：创建永久档案</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 步骤2：创建永久档案 */}
        {step >= 2 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">步骤 2：创建您的永久档案</h3>
                  <p className="text-sm text-gray-600">保存您的八字、运势、事件、问题，AI会持续学习</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">保存您的八字数据，永远不丢失</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">记录您的运势变化，建立长期档案</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">保存您的重要事件，AI会验证命理准确性</p>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">AI会根据您的历史数据，提供越来越准确的个性化分析</p>
              </div>
            </div>
            <Link
              href="/profile/create"
              className="w-full bg-white border-2 border-blue-500 text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center space-x-2"
            >
              <span>创建我的永久档案</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* 步骤3：AI助手介绍 */}
        {step >= 3 && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">步骤 3：欢迎您的AI命理助手</h3>
                  <p className="text-sm text-gray-600">24小时在线，随时回答您的命理问题</p>
                </div>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              我是您的专属命理AI，已经学习了您的八字和运势。
              您可以随时问我任何命理问题，我会根据您的八字提供个性化答案。
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">每日运势提醒，让您每天都想起我们</p>
              </div>
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">重要事件提醒，不错过关键时机</p>
              </div>
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">化灾预警，提前保护</p>
              </div>
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700">个性化越来越强，AI越用越懂您</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/chat"
                className="bg-white border-2 border-purple-500 text-purple-600 py-3 px-4 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center justify-center space-x-2"
              >
                <span>开始对话</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleSkip}
                className="bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                跳过，稍后再说
              </button>
            </div>
          </div>
        )}

        {/* 跳过 */}
        {step === 1 && (
          <button
            onClick={handleSkip}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            跳过，稍后再创建档案
          </button>
        )}
      </div>
    </div>
  );
}
