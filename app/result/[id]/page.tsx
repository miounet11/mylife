// 命理分析结果页面
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { notFound } from 'next/navigation';
import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';

// 动态导入以减少首屏加载
const TrustReport = NextDynamic(() => import('@/components/trust-signals'), {
  loading: () => <ReportSkeleton />,
});

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => <ChartSkeleton />,
});

const NextStepGuide = NextDynamic(() => import('@/components/next-step-guide'), {
  loading: () => <GuideSkeleton />,
});

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

import { fortuneOperations } from '@/lib/database';

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const fortuneData = fortuneOperations.getById(id);
    if (fortuneData) {
      return {
        title: `${fortuneData.name || '您'}的八字命理分析报告 | 人生K线`,
        description: `${fortuneData.name || '您'}的专属AI命理解析，基于传统子平八字与现代AI技术，深度解析事业、财富、婚姻与健康。`,
        openGraph: {
          title: `${fortuneData.name || '您'}的专属命理分析 | 人生K线`,
          description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
        },
      };
    }
  } catch(e) {
    // ignore
  }
  
  return {
    title: '您的命理分析报告 | 人生K线',
    description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
  };
}

async function getResult(reportId: string) {
  try {
    const fortuneData = fortuneOperations.getById(reportId);
    if (!fortuneData) return null;

    // Transform database format to match frontend expectations
    return {
      basic: {
        name: fortuneData.name || '测算者',
        dayMaster: fortuneData.bazi?.dayMaster || '未知',
        ...fortuneData.bazi
      },
      fiveElements: fortuneData.fiveElements,
      tenGods: fortuneData.tenGods,
      pattern: fortuneData.pattern,
      fortune: fortuneData.fortune,
      advice: fortuneData.advice,
      evidence: fortuneData.evidence,
      analysis: fortuneData.analysis || {
        opening: '细观您的八字，命理之象，历历在目。',
        explanation: '（加载中或模型未生成深度解析）'
      }
    };
  } catch(e) {
    console.error("Error fetching report:", e);
    return null;
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getResult(id);

  if (!result) {
    notFound();
  }

  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${result.basic.name || '测算者'}的命理分析报告`,
    description: `AI驱动的八字命理分析，像真正的大师一样精准可信。此为${result.basic.name || '测算者'}的专属报告。`,
    author: {
      '@type': 'Organization',
      name: '人生K线',
      url: 'https://life-kline.com'
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 顶部导航 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                K
              </div>
              <div className="text-xl font-bold text-gray-900">
                人生K线
              </div>
            </a>
            <a
              href="/analyze"
              className="hidden md:block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              再次分析
            </a>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 可信报告 */}
        <Suspense fallback={<ReportSkeleton />}>
          <TrustReport result={result} />
        </Suspense>

        {/* NextStep引导 */}
        <div className="mt-16">
          <Suspense fallback={<GuideSkeleton />}>
            <NextStepGuide />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © 2024 人生K线. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 骨架组件
function ReportSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
  );
}

function GuideSkeleton() {
  return (
    <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
  );
}
