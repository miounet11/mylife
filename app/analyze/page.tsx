// 命理分析页面
export const fetchCache = 'force-no-store';
export const revalidate = 0;
import { Suspense } from 'react';
import NextDynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// 动态导入以减少首屏加载
const FortuneForm = NextDynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

export const metadata = {
  title: '开始您的命理分析 | 人生K线',
  description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
};

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 返回按钮 */}
            <Link
              href="/"
              className="flex items-center space-x-2 text-slate-700 hover:text-indigo-600"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">返回首页</span>
            </Link>

            {/* 标题 */}
            <h1 className="text-xl font-bold text-slate-900">
              开始您的命理分析
            </h1>

            {/* 步骤指示 */}
            <div className="hidden md:block text-sm text-slate-500">
              输入信息 → 分析 → 报告
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              输入信息，生成命理分析报告
            </h2>
            <p className="text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              请尽量填写准确的出生时间与地点，以提升分析结果的准确性。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="font-semibold text-slate-900">精确性</h3>
              </div>
              <p className="text-sm text-slate-600">
                毫秒级精确计算四柱，考虑藏干、纳音，不使用近似算法
              </p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="font-semibold text-slate-900">深度性</h3>
              </div>
              <p className="text-sm text-slate-600">
                六层次分析体系，每个观点都有理论依据和古籍引用
              </p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-slate-200">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="font-semibold text-slate-900">解读风格</h3>
              </div>
              <p className="text-sm text-slate-600">
                600+条大师话术库，让AI分析像真正的大师一样
              </p>
            </div>
          </div>

          {/* 命理表单 */}
          <Suspense fallback={<FormSkeleton />}>
            <FortuneForm />
          </Suspense>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="font-semibold text-slate-900 mb-2">隐私保护</h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              您的个人信息仅用于命理分析，不会分享给第三方。相关数据将存储于本地数据库。
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              需要帮助？
              <Link href="/chat" className="text-indigo-600 hover:underline ml-2">
                AI 助手
              </Link>
            </p>
            <p className="text-xs text-slate-500 mt-2">
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
    <div className="max-w-4xl mx-auto bg-white rounded-lg border border-slate-200 p-8 space-y-8">
      <div className="h-8 bg-slate-200 rounded-lg animate-pulse w-1/3"></div>
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="space-y-6">
        <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="bg-slate-100 rounded-lg p-6 space-y-4">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3"></div>
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2"></div>
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-16 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
