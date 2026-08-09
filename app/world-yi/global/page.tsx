import Link from 'next/link';
import { ArrowRight, BookOpen, Globe, Layers3, Network, Sparkles, BarChart3, TrendingUp, Presentation } from 'lucide-react';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';

const globalFeatures = [
  {
    title: '多维度叠加',
    icon: Layers3,
    description: '将事业、财富、关系、健康、家庭、迁移六个维度的K线走势叠加在同一时间轴上，直观展示各领域之间的联动与共振效应。'
  },
  {
    title: '交叉影响分析',
    icon: Network,
    description: '一个维度的波动如何影响其他维度？事业上升期是否伴随健康压力？财富增长是否影响家庭关系？全局矩阵揭示这些隐藏的关联规律。'
  },
  {
    title: '周期性趋势',
    icon: TrendingUp,
    description: '基于大运十年周期与流年波动，全局矩阵自动识别各维度的高低周期，帮助你在正确的时间做出正确的人生决策。'
  },
  {
    title: '全景报告',
    icon: Presentation,
    description: '将全局分析结果整合为可视化报告，包含各维度评分、联动系数、周期标注与��议时机，一次获取完整的人生导航。'
  }
];

const usageSteps = [
  {
    step: 1,
    title: '完成八字排盘',
    description: '输入出生年月日时，获取准确的八字四柱与五行分析'
  },
  {
    step: 2,
    title: '进入生命矩阵',
    description: '在排盘结果中选择"生命矩阵"视图，查看各维度K线走势'
  },
  {
    step: 3,
    title: '切换到全局视图',
    description: '点击"全局矩阵"标签，将所有维度K线叠加显示'
  },
  {
    step: 4,
    title: '解读联动趋势',
    description: '观察各维度走势的同步与背离，发现关键的人生转折信号'
  }
];

const ctaCards = [
  {
    href: '/analyze',
    title: '开始排盘',
    description: '输入出生信息，获取完整八字分析'
  },
  {
    href: '/world-yi/matrix',
    title: '生命矩阵',
    description: '查看各维度独立K线走势'
  },
  {
    href: '/world-yi/domains',
    title: '维度详解',
    description: '了解六大领域与八字的对应关系'
  }
];

export default function WorldYiGlobalPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-ming-bg)]">
      <WorldYiSurfaceHero
        title="全局矩阵"
        subtitle="六大维度叠加，洞见人生全景趋势"
        badge="Global Matrix"
      />

      <div className="page-content">
        {/* Overview */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <div className="flex items-start gap-3">
            <Globe className="w-6 h-6 text-[var(--color-ming-gold)] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold mb-2">什么是全局矩阵</h2>
              <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed">
                全局矩阵（Global Matrix）是生命矩阵的最高维度视图，将事业、财富、关系、健康、家庭、迁移
                六个独立的K线走势叠加在同一时间轴上，形成一张全方位的人生趋势全景图。
              </p>
              <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed mt-3">
                与单维度分析不同，全局矩阵帮助你发现各领域之间的交叉影响与联动规律。
                例如，事业K线上升的同时健康K线是否在下降？财富K线的波动是否与家庭K线的变化同步？
                这些跨维度的洞察，正是全局矩阵的核心价值。
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid gap-4 sm:grid-cols-2">
          {globalFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-[var(--color-ming-gold)]" />
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                </div>
                <p className="text-xs text-[var(--color-ming-text-dim)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* How to Use */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--color-ming-gold)]" />
            如何使用全局矩阵
          </h2>
          <p className="text-sm text-[var(--color-ming-text-dim)] mb-6">
            只需几步，即可解锁全局矩阵的完整分析能力
          </p>
          <div className="space-y-4">
            {usageSteps.map((step) => (
              <div key={step.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[var(--color-ming-gold)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{step.title}</h3>
                  <p className="text-xs text-[var(--color-ming-text-dim)] mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What to Look For */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--color-ming-gold)]" />
            全局�阵的关键信号
          </h2>
          <div className="space-y-3">
            <div className="bg-[var(--color-ming-surface-light)] rounded-[var(--radius)] p-3">
              <h3 className="font-semibold text-xs mb-1">同步共振</h3>
              <p className="text-xs text-[var(--color-ming-text-dim)]">
                多个维度同时出现上升趋势，意味着人生进入整体上升周期。这是抓住机遇、全面布局的最佳时机。
              </p>
            </div>
            <div className="bg-[var(--color-ming-surface-light)] rounded-[var(--radius)] p-3">
              <h3 className="font-semibold text-xs mb-1">背离信号</h3>
              <p className="text-xs text-[var(--color-ming-text-dim)]">
                事业K线上升而健康K线下降，提示需要在工作与健康之间寻找平衡。背离是重新调整优先级的重要信号。
              </p>
            </div>
            <div className="bg-[var(--color-ming-surface-light)] rounded-[var(--radius)] p-3">
              <h3 className="font-semibold text-xs mb-1">周期转换</h3>
              <p className="text-xs text-[var(--color-ming-text-dim)]">
                大运交替年份，各维度K线可能出现集体转向。这是人生的重要转折节点，需要提前规划与准备。
              </p>
            </div>
            <div className="bg-[var(--color-ming-surface-light)] rounded-[var(--radius)] p-3">
              <h3 className="font-semibold text-xs mb-1">极端值预警</h3>
              <p className="text-xs text-[var(--color-ming-text-dim)]">
                某个维度K线出现极端高位或低位时，提示该领域即将发生重大变化或需要特别关注。
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid gap-3 sm:grid-cols-3">
          {ctaCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-4 hover:opacity-80 transition-opacity block text-center"
            >
              <h3 className="font-semibold text-sm mb-1">{card.title}</h3>
              <p className="text-xs text-[var(--color-ming-text-dim)]">
                {card.description}
              </p>
            </Link>
          ))}
        </section>

        {/* Conversion Strip */}
        <section className="shadow-[var(--shadow-card)] bg-gradient-to-r from-[var(--color-ming-gold)]/10 to-[var(--color-ming-accent)]/10 rounded-[var(--radius)] p-6 text-center">
          <h3 className="font-bold text-base mb-2">保存你的全景分析</h3>
          <p className="text-sm text-[var(--color-ming-text-dim)] mb-4">
            注册账号即可保存全局矩阵分析结果，随时回顾各维度K线走势，跟踪人生趋势变化
          </p>
          <Link
            href="/profile/foundation"
            className="inline-flex items-center gap-2 bg-[var(--color-ming-gold)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" />
            免费注册，保存命盘
          </Link>
          <p className="text-xs text-[var(--color-ming-text-subtle)] mt-3">
            已有账号？<Link href="/login" className="text-[var(--color-ming-gold)] hover:underline">立即登录</Link>
          </p>
        </section>
      </div>

    </main>
  );
}