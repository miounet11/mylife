export const fetchCache = 'force-no-store';
export const revalidate = 0;
import NextDynamic from 'next/dynamic';
import Link from 'next/link';

const FortuneForm = NextDynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

const primaryNavItems = [
  { href: '/analyze', label: '命理排盘' },
  { href: '/chat', label: 'AI 咨询' },
  { href: '/events', label: '日历择吉' },
];

const trustSignals = [
  { title: '真太阳时', subtitle: '经度与均时差双重修正' },
  { title: '分钟级', subtitle: '节气交接边界精准判定' },
  { title: '五行生克', subtitle: '核心引擎确定性计算' },
  { title: 'AI 赋能', subtitle: '深度解析与定制化建议' },
];

export const metadata = {
  title: '人生K线 | 权威八字命理分析引擎',
  description: '基于天文历法与传统命理学，提供精准的命运轨迹与决策参考。高考、升学、事业关键节点决策辅助工具。',
  keywords: ['八字', '命理', '高考测算', '学业决策', '运势分析', 'AI命理'],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-indigo-700 flex items-center justify-center text-white font-serif font-bold tracking-tighter">
                K
              </div>
              <div className="text-xl font-bold tracking-tight text-slate-900">
                人生K线
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
              {primaryNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="text-slate-600 hover:text-indigo-600 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>

            <Link
              href="/analyze"
              className="hidden md:flex items-center justify-center bg-indigo-600 text-white px-5 py-2 rounded font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            >
              新建测算
            </Link>

            <Link
              href="#form-section"
              className="md:hidden inline-flex items-center justify-center rounded bg-indigo-600 text-white px-3 py-1.5 text-xs font-medium"
            >
              立即测算
            </Link>
          </div>

          <div className="md:hidden pb-3">
            <div className="grid grid-cols-3 gap-2">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded border border-slate-200 bg-white px-2 py-2 text-center text-xs font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-14 md:pt-24 md:pb-20 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-indigo-100/50 border border-indigo-200 text-indigo-700 text-xs font-semibold tracking-wide uppercase mb-6">
            专业级命理分析引擎 V2.0
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 font-serif">
            洞悉命理轨迹 <br className="hidden md:block" />
            <span className="text-indigo-600">成就关键决策</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            基于精准天文历法（真太阳时修正）与传统子平八字理论。为升学（高考）、事业、婚姻等人生关键节点提供权威、客观的决策数据参考。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="#form-section"
              className="w-full sm:w-auto px-8 py-3.5 border border-transparent text-base font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              立即开启精准排盘
            </Link>
            <Link
              href="/analyze"
              className="w-full sm:w-auto px-8 py-3.5 border border-slate-300 text-base font-medium rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              查看示例报告
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Data Signals */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {trustSignals.map((signal) => (
              <div
                key={signal.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center hover:border-indigo-200 hover:bg-indigo-50/40 transition"
              >
                <div className="text-2xl font-bold text-indigo-600 mb-1">{signal.title}</div>
                <div className="text-sm text-slate-500 font-medium">{signal.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section id="form-section" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 font-serif">严谨的排盘输入</h2>
            <p className="mt-3 text-slate-600">请尽可能提供精确到分钟的出生时间及出生城市，以确保真太阳时计算的准确性。</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 sm:p-6 md:p-8">
            <FortuneForm />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 font-serif">专业级功能模块</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">以严谨的逻辑和清晰的交互，为您呈现命理学核心数据，摒弃迷信与模糊，提供具参考价值的决策支持。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              title="权威排盘与五行分析"
              description="展示标准的四柱八字排盘、藏干、纳音，以及精确的五行力量对比图表，直观呈现命局五行旺衰。"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title="用神与特殊格局"
              description="引擎自动检测从财、从杀、专旺等特殊格局，并根据调候、通关、强弱平衡四步法精确提取用神忌神。"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.000 8.000 0 01-4.659-1.509L3 19l2.09-2.09A8.000 8.000 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" /></svg>}
              title="AI 深度命理咨询"
              description="结合排盘数据与大语言模型，提供如专家面谈般的解读体验，针对学业、事业、财富提供定制化建议。"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="col-span-1 lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-serif font-bold text-xs">
                  K
                </div>
                <span className="text-lg font-bold text-white tracking-tight">人生K线</span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                致力于将传统命理学与现代算法及人工智能相结合，为用户提供客观、专业、具参考价值的人生决策辅助工具。
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">核心功能</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/analyze" className="hover:text-indigo-400 transition-colors">精准排盘</Link></li>
                <li><Link href="/chat" className="hover:text-indigo-400 transition-colors">AI 咨询</Link></li>
                <li><Link href="/events" className="hover:text-indigo-400 transition-colors">日历择吉</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">支持与协议</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">使用协议</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">隐私政策</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">联系我们</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} 人生K线. 保留所有权利.</p>
            <p className="mt-2 md:mt-0">专业版 V2.0 (真太阳时修正)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 辅助组件
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-6 border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all duration-300">
      <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

// 骨架组件
function FormSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="h-8 bg-slate-100 rounded animate-pulse w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-12 bg-slate-100 rounded animate-pulse"></div>
        <div className="h-12 bg-slate-100 rounded animate-pulse"></div>
        <div className="h-12 bg-slate-100 rounded animate-pulse"></div>
        <div className="h-12 bg-slate-100 rounded animate-pulse"></div>
      </div>
      <div className="h-12 bg-slate-100 rounded animate-pulse w-full"></div>
    </div>
  );
}
