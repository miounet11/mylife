// 命理分析页面
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// 动态导入以减少首屏加载
const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

export const metadata = {
  title: '开始您的命理分析 | 人生K线',
  description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
};

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 返回按钮 */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">返回首页</span>
            </Link>

            {/* 标题 */}
            <h1 className="text-2xl font-bold text-gray-900">
              开始您的命理分析
            </h1>

            {/* 步骤指示 */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold">
                  1
                </div>
                <span className="text-sm text-gray-600">输入信息</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs font-bold">
                  2
                </div>
                <span className="text-sm text-gray-600">分析</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs font-bold">
                  3
                </div>
                <span className="text-sm text-gray-600">报告</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* 仪式感标题 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 bg-purple-50 rounded-full px-6 py-3 mb-6">
              <span className="text-2xl">🔮</span>
              <span className="text-sm text-purple-700 font-medium">AI命理大师</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              细观您的八字，命理之象，历历在目
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
              请提供您的出生信息，AI将为您进行
              <span className="text-purple-600 font-semibold">
                像真正的大师一样精准可信
              </span>
              的命理分析
            </p>
          </div>

          {/* 快速提示卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-md border-2 border-purple-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-gray-900">精确性</h3>
              </div>
              <p className="text-sm text-gray-600">
                毫秒级精确计算四柱，考虑藏干、纳音，不使用近似算法
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border-2 border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">📊</span>
                <h3 className="font-bold text-gray-900">深度性</h3>
              </div>
              <p className="text-sm text-gray-600">
                六层次分析体系，每个观点都有理论依据和古籍引用
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md border-2 border-green-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">💎</span>
                <h3 className="font-bold text-gray-900">大师话术</h3>
              </div>
              <p className="text-sm text-gray-600">
                600+条大师话术库，让AI分析像真正的大师一样
              </p>
            </div>
          </div>

          {/* 命理表单 */}
          <Suspense fallback={<FormSkeleton />}>
            <FortuneForm />
          </Suspense>

          {/* 安全提示 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">隐私保护</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  您的个人信息严格保密，仅用于命理分析。
                  我们不会将您的信息分享给任何第三方。
                  您的八字数据会加密存储在本地数据库中。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              需要帮助？
              <Link href="/contact" className="text-purple-600 hover:underline ml-2">
                联系我们
              </Link>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © 2024 人生K线. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 骨架组件
function FormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-y-8">
      <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-1/3"></div>
      <div className="space-y-6">
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="space-y-6">
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="bg-gray-100 rounded-lg p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
