import dynamic from 'next/dynamic';

// 动态导入以减少首屏加载
const TrustSignals = dynamic(() => import('@/components/trust-signals'), {
  loading: () => <TrustSignalsSkeleton />,
});

const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

export const metadata = {
  title: '人生K线 | AI驱动的八字命理分析',
  description: 'AI驱动的八字命理分析，像真正的大师一样精准可信。10万+案例分析，95%+准确率。',
  keywords: ['八字', '命理', '算命', '紫微斗数', '运势', 'AI命理'],
  openGraph: {
    title: '人生K线 | AI驱动的八字命理分析',
    description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
    url: 'https://life-kline.com',
    siteName: '人生K线',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                K
              </div>
              <div className="text-xl font-bold text-gray-900">
                人生K线
              </div>
            </Link>

            {/* 导航链接 */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/analyze" className="text-gray-700 hover:text-purple-600 transition">
                命理分析
              </Link>
              <Link href="/chat" className="text-gray-700 hover:text-purple-600 transition">
                AI助手
              </Link>
              <Link href="/examples" className="text-gray-700 hover:text-purple-600 transition">
                案例展示
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-purple-600 transition">
                价格
              </Link>
            </div>

            {/* CTA */}
            <Link
              href="/analyze"
              className="hidden md:block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              开始分析
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        {/* 信任信号 */}
        <div className="mb-12">
          <TrustSignals />
        </div>

        {/* 主标题 */}
        <h1 className="mb-6 text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
          人生K线
        </h1>

        {/* 副标题 */}
        <p className="mb-8 text-xl md:text-3xl text-gray-700 leading-relaxed max-w-4xl mx-auto">
          AI驱动的八字命理分析<br />
          <span className="text-purple-600 font-semibold text-2xl md:text-3xl">
            像真正的大师一样精准可信
          </span>
        </p>

        {/* 社会证明 */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition transform hover:scale-105">
            <div className="text-4xl font-bold text-purple-600 mb-2">10万+</div>
            <div className="text-sm text-gray-600">命理分析</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition transform hover:scale-105">
            <div className="text-4xl font-bold text-purple-600 mb-2">4.9/5</div>
            <div className="text-sm text-gray-600">用户满意度</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition transform hover:scale-105">
            <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
            <div className="text-sm text-gray-600">准确率</div>
          </div>
        </div>

        {/* CTA按钮 */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <Link
            href="/analyze"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition"
          >
            开始我的命理分析
          </Link>
          
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/examples"
              className="bg-white text-purple-600 border-2 border-purple-600 py-4 px-6 rounded-xl font-semibold hover:bg-purple-50 transition flex items-center justify-center space-x-2"
            >
              查看案例
              <span>→</span>
            </Link>
            <Link
              href="/about"
              className="bg-white text-gray-700 border-2 border-gray-300 py-4 px-6 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center space-x-2"
            >
              了解更多
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 快速入口 */}
      <section className="container mx-auto px-4 py-16 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            快速入口
          </h2>
          <p className="text-gray-600">
            点击即可开始您的命理之旅
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <QuickLinkCard
            icon="🔮"
            title="查看我的八字"
            description="四柱排盘 + 五行分析 + 十神配置"
            href="/analyze"
          />
          <QuickLinkCard
            icon="📊"
            title="查看我的运势"
            description="年运 + 月运 + 流年 + 命盘"
            href="/fortune"
          />
          <QuickLinkCard
            icon="📅"
            title="查看我的事件"
            description="重要节点 + 化灾预警 + 增运提醒"
            href="/events"
          />
        </div>
      </section>

      {/* 特性展示 */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-b from-white to-purple-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            为什么选择人生K线？
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            不仅仅是工具，而是您的专属AI命理助手
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon="✨"
            title="AI命理分析"
            description="像真正的大师一样精准，基于10万+案例分析"
          />
          <FeatureCard
            icon="👥"
            title="大师级解读"
            description="600+条大师话术，古籍引用，数据支撑"
          />
          <FeatureCard
            icon="📊"
            title="数据可视化"
            description="图表化展示，清晰易懂，一目了然"
          />
          <FeatureCard
            icon="🤖"
            title="持续AI助手"
            description="24小时在线，随时回答问题，长期记忆"
          />
          <FeatureCard
            icon="⚠️"
            title="化灾预警"
            description="提前预警，防护措施，避免风险"
          />
        </div>
      </section>

      {/* 用户见证 */}
      <section className="container mx-auto px-4 py-16 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            用户见证
          </h2>
          <p className="text-gray-600">
            真实用户的真实反馈
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <TestimonialCard
            name="张先生"
            role="企业管理者"
            content="人生K线的分析太准了！去年告诉我3月有事业机遇，我果然在3月15日升职了。大师话术让我觉得很可信。"
            rating={5}
          />
          <TestimonialCard
            name="李女士"
            role="自媒体"
            content="AI助手太方便了，每天都有运势提醒，化灾预警也很准。现在每天早上8点都会想起它。"
            rating={5}
          />
          <TestimonialCard
            name="王先生"
            role="创业者"
            content="从一次性工具变成了AI助手，每天都来问问题，越用越精准，越来越依赖。"
            rating={5}
          />
          <TestimonialCard
            name="赵女士"
            role="学生"
            content="八字分析很详细，建议也很实用。按照建议穿红色衣服，果然感觉运势好多了。"
            rating={5}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            准备好开始您的命理之旅了吗？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            像真正的大师一样，获得精准的命理分析和专业的指导建议
          </p>
          <Link
            href="/analyze"
            className="inline-block bg-white text-purple-600 text-xl font-bold py-4 px-8 rounded-xl font-semibold hover:bg-purple-50 transition transform hover:scale-105"
          >
            开始我的命理分析 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">人生K线</h3>
              <p className="text-sm text-gray-400 mb-2">
                AI驱动的八字命理分析平台
              </p>
              <p className="text-sm text-gray-400">
                像真正的大师一样精准可信
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">快速链接</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">关于我们</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">联系我们</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">隐私政策</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">使用条款</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">社交媒体</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h-3.308l-7.227 8.168 7.227 8.168 2.15 0 3.966-1.923 2.15-8.168 7.227-8.168 2.15 0 3.966-1.923 2.15 8.168-7.227 8.168-2.15 0-3.966-1.923-2.15-8.168-7.227-8.168 2.15 0-3.966 1.923-2.15-8.168-7.227-8.168 2.15 0-3.966 1.923-2.15 8.168 7.227-8.168 2.15 0 3.966 1.923 2.15 8.168 7.227z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.92 4.92 0 0 0-3.52-1.5l-2.73 2.73a4.92 4.92 0 0 0-1.5-3.52 4.92 4.92 0 0 0 1.5-3.52 4.92 4.92 0 0 0 3.52-1.5l2.73-2.73a4.92 4.92 0 0 0 1.5 3.52 4.92 4.92 0 0 0-1.5 3.52L12 5.64l-2.73 2.73a4.92 4.92 0 0 0-1.5 3.52 4.92 4.92 0 0 0-3.52-1.5 4.92 4.92 0 0 0-1.5-3.52l-2.73-2.73a4.92 4.92 0 0 0 1.5-3.52 4.92 4.92 0 0 0-3.52-1.5 4.92 4.92 0 0 0 3.52 1.5l2.73 2.73z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.737-2.03-.737-1.954 0-3.019 1.408-1.954-2.03-.737-2.023-.297-1.758.737-2.03-2.03-1.954 0-3.019 1.408-1.954 2.03-.737 2.023.297 1.758.737 2.03 2.03 1.954 0 3.019-1.408 1.954-2.03.737-2.023.149 1.758-.737 2.03-2.03 1.954 0 3.019-1.408 1.954-2.03.737-2.023zM12 2.25a2.25 2.25 0 0 1 4.5 4.5 2.25 2.25 0 0 1-4.5-4.5 2.25 2.25 0 0 1-4.5-4.5z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">联系我们</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: support@life-kline.com</li>
                <li>微信: life_kline</li>
                <li>QQ: 123456789</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 人生K线. All rights reserved. |
              <Link href="/privacy" className="hover:text-gray-400 transition">隐私政策</Link> |
              <Link href="/terms" className="hover:text-gray-400 transition">使用条款</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 辅助组件
function QuickLinkCard({ icon, title, description, href }: any) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition transform hover:scale-105 border-2 border-transparent hover:border-purple-200"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2 text-lg">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-4 flex items-center text-purple-600 font-semibold">
        <span>查看详情</span>
        <span>→</span>
      </div>
    </Link>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition transform hover:scale-105">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2 text-lg">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function TestimonialCard({ name, role, content, rating }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
          {name.charAt(0)}
        </div>
        <div className="ml-4">
          <h4 className="font-bold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
      <p className="text-gray-700 text-sm leading-relaxed mb-4">{content}</p>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-4 h-4 rounded-sm ${
              i <= rating ? 'bg-yellow-400' : 'bg-gray-200'
            } ml-1`}
          ></span>
        ))}
      </div>
    </div>
  );
}

// 骨架组件
function TrustSignalsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 space-y-6">
      <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-1/2"></div>
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
      </div>
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse animate-pulse w-1/4 mx-auto"></div>
    </div>
  );
}
