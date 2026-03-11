// 命理分析结果页面
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Compass,
  LineChart,
  LockKeyhole,
  ScrollText,
  Share2,
  Sparkles,
} from 'lucide-react';

// 动态导入以减少首屏加载
const TrustReport = NextDynamic(() => import('@/components/trust-report'), {
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
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ResultPublicControls from '@/components/result-public-controls';
import RelatedContent from '@/components/related-content';
import { getCurrentUserId } from '@/lib/user-utils';

function getPublicDisplayName(name?: string | null) {
  const cleaned = `${name || ''}`.trim();
  if (!cleaned) return '某位用户';
  if (cleaned.length === 1) return `${cleaned}**`;
  return `${cleaned.slice(0, 1)}**`;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const fortuneData = fortuneOperations.getById(id);
    if (fortuneData) {
      const publicName = getPublicDisplayName(fortuneData.name);
      const currentUserId = await getCurrentUserId();
      const isOwner = !!currentUserId && fortuneData.user_id === currentUserId;
      const isPublic = fortuneData.isPublic !== false;
      return {
        title: `${publicName}的命理分析报告 | 人生K线`,
        description: `${publicName}的公开命理分析报告，基于真太阳时修正与结构化解读，适合公开浏览与分享。`,
        alternates: {
          canonical: `https://life-kline.com/result/${id}`,
        },
        robots: {
          index: isPublic,
          follow: isPublic || isOwner,
        },
        openGraph: {
          url: `https://life-kline.com/result/${id}`,
          title: `${publicName}的公开命理分析 | 人生K线`,
          description: '公开可分享的命理分析结果页，展示结构、趋势与建议。',
        },
      };
    }
  } catch(e) {
    // ignore
  }
  
  return {
    title: '您的命理分析报告 | 人生K线',
    description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
    robots: {
      index: true,
      follow: true,
    },
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
        userId: fortuneData.user_id,
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
      },
      klineData: fortuneData.klineData || null,
      llmUsed: fortuneData.analysis?.llmUsed ?? false,
      isPublic: fortuneData.isPublic !== false,
    };
  } catch(e) {
    console.error("Error fetching report:", e);
    return null;
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getResult(id);
  const currentUserId = await getCurrentUserId();

  if (!result) {
    notFound();
  }

  const canManage = !!currentUserId && result.basic.userId === currentUserId;
  if (result.isPublic === false && !canManage) {
    notFound();
  }
  const publicName = getPublicDisplayName(result.basic.name);
  const fiveElements = result.fiveElements || {};
  const sortedElements = Object.entries(fiveElements).sort(
    (left, right) => Number((right[1] as { strength?: number })?.strength || 0) - Number((left[1] as { strength?: number })?.strength || 0)
  );
  const strongestEntry = sortedElements[0];
  const weakestEntry = [...sortedElements].reverse()[0];
  const elementLabelMap: Record<string, string> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
  };
  const reportHighlights = [
    { label: '日主', value: result.basic.dayMaster || '未知' },
    { label: '格局', value: result.pattern?.type || '未知' },
    { label: '最强五行', value: strongestEntry ? elementLabelMap[strongestEntry[0]] || strongestEntry[0] : '待补充' },
    { label: '最弱五行', value: weakestEntry ? elementLabelMap[weakestEntry[0]] || weakestEntry[0] : '待补充' },
  ];
  const reportActions = [
    {
      title: result.isPublic ? '这份报告可直接分享' : '这份报告目前为隐藏模式',
      description: result.isPublic
        ? '默认匿名展示，适合分享到朋友、客户或社群，作为公开承接页使用。'
        : '当前仅你可见，切换为公开后才适合做外部分享和传播。',
      icon: Share2,
    },
    {
      title: '看完可继续深问 AI',
      description: '把最关键的一条结论继续追问，用户停留和后续转化会更强。',
      icon: Bot,
    },
    {
      title: '可以再次测算对比',
      description: '适合修正出生时间或地点后重新生成，对比差异。',
      icon: LockKeyhole,
    },
  ];
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${publicName}的命理分析报告`,
    description: `AI驱动的八字命理分析公开结果页。此为${publicName}的公开报告。`,
    mainEntityOfPage: `https://life-kline.com/result/${id}`,
    author: {
      '@type': 'Organization',
      name: '人生K线',
      url: 'https://life-kline.com'
    }
  };
  return (
    <div className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="再次分析" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="glass-panel relative overflow-hidden rounded-[2.25rem] p-6 md:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--accent),var(--warm),#d97706)]" />
            <div className="absolute -right-12 top-8 h-44 w-44 rounded-full bg-[rgba(15,118,110,0.12)] blur-3xl" />
            <div className="absolute left-8 top-24 h-32 w-32 rounded-full bg-[rgba(201,125,58,0.16)] blur-3xl" />

            <div className="relative">
              <div className="section-label">公开结果页</div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {result.llmUsed ? 'AI 深度解析' : '基础引擎解析'}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {result.isPublic ? '默认公开可分享' : '当前隐藏'}
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
                {publicName}的这份命理报告，
                <span className="font-serif text-[color:var(--accent-strong)]">现在已经具备公开浏览与传播价值。</span>
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--muted)]">
                这不是只给本人看的内部结果，而是一张可以承接分享、建立信任、继续转化的公开页面。关键信息集中展示，姓名默认匿名化，拥有者可随时切换隐藏。
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {reportHighlights.map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[1.5rem] bg-[rgba(15,118,110,0.08)] px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">首屏结论</div>
                  <div className="mt-2 text-lg font-bold leading-8 text-[color:var(--ink)]">
                    {result.pattern?.type || '命局结构'}是当前核心判断，
                    {result.fortune?.currentDaYun ? ` 当前行运落在 ${result.fortune.currentDaYun}` : ' 当前行运信息已写入报告正文'}。
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                    继续往下可以看到完整命盘、五行分布、AI 建议和趋势图。看完后最适合继续分享、深问 AI，或再次测算对比。
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-white/82 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">快速动作</div>
                  <div className="mt-3 flex flex-col gap-3">
                    <Link
                      href="/chat"
                      className="inline-flex items-center justify-between rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white"
                    >
                      进入 AI 咨询
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/analyze"
                      className="inline-flex items-center justify-between rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
                    >
                      再次测算一份
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="font-semibold text-[color:var(--ink)]">分享与可见性</div>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                默认公开，拥有者可随时切换为隐藏。结果页本身就是分享页，不需要额外包装。
              </p>
              <div className="mt-4">
                <ResultPublicControls
                  reportId={id}
                  initialIsPublic={result.isPublic}
                  canManage={canManage}
                  publicName={publicName}
                />
              </div>
            </div>

            {reportActions.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="soft-card rounded-[1.75rem] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
                </div>
              );
            })}

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-[color:var(--warm)]" />
                <div className="font-semibold text-[color:var(--ink)]">阅读路径</div>
              </div>
              <div className="mt-3 space-y-3">
                {[
                  '先看总览和核心结构',
                  '再看五行分布与趋势图',
                  '最后进入 AI 咨询或再次测算',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* LLM 状态提示 */}
        <div className="mx-auto mb-6 flex max-w-6xl flex-col gap-4">
          <div className="flex justify-end">
            {result.llmUsed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                AI 深度解析
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                基础引擎解析
              </span>
            )}
          </div>

          <div className="scrollbar-none overflow-x-auto">
            <div className="flex min-w-max gap-3">
              {[
                { href: '#overview', label: '总览', icon: Sparkles },
                { href: '#pillars', label: '命盘', icon: Compass },
                { href: '#elements', label: '五行', icon: LineChart },
                { href: '#advice', label: '建议', icon: ScrollText },
                { href: '#trend', label: '趋势', icon: CalendarClock },
                { href: '#next-step', label: '下一步', icon: ArrowRight },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 可信报告 */}
        <Suspense fallback={<ReportSkeleton />}>
          <TrustReport result={result} />
        </Suspense>

        {/* 人生K线图 */}
        {result.klineData && result.klineData.length > 0 && (
          <div id="trend" className="mt-12 scroll-mt-28">
            <Suspense fallback={<ChartSkeleton />}>
              <FortuneChart data={result.klineData} />
            </Suspense>
          </div>
        )}

        {/* NextStep引导 */}
        <div id="next-step" className="mt-16 scroll-mt-28">
          <Suspense fallback={<GuideSkeleton />}>
            <NextStepGuide />
          </Suspense>
        </div>

        <div className="mt-16">
          <RelatedContent />
        </div>
      </main>

      <SiteFooter />
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
