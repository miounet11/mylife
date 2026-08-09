import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Layers3, Network, Sparkles, Heart, Coins, Briefcase, Home, HeartPulse, Plane } from 'lucide-react';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';

const lifeDomains = [
  {
    id: 'career',
    title: '事业 Career',
    icon: Briefcase,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: '对应八字中的官杀与印星，反映职业发展轨迹、权力结构与事业周期的势能变化。官星为事业平台，杀星为压力与突破，印星为资源与贵人。',
    bazi: 'K线分析通过大运流年的官印配合，判断升迁窗口、职业转型时机与行业方向选择。当官星得生、印星得力时，往往是事业突破的关键节点。'
  },
  {
    id: 'wealth',
    title: '财富 Wealth',
    icon: Coins,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    description: '对应八字中的财星与食伤，反映收入趋势、投资周期与财富积累的节奏。正财为稳定收入，偏财为意外之财，食伤为生财之源。',
    bazi: 'K线分析通过财星旺衰与财运周期，帮助识别投资窗口与风险时段。财星透干、食伤生财的组合预示着财富增长期，而财星受克时则需保守理财。'
  },
  {
    id: 'relationship',
    title: '关系 Relationship',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    description: '对应八字中的夫妻宫与日支，反映亲密关系、婚姻质量与人际互动的深层模式。日支为婚姻宫，配偶星的状态决定关系质量。',
    bazi: 'K线分析通过配偶星与合冲关系，评估关系稳定性与关键转折点。可通过合婚分析（hehun）综合判断两人八字在情感层面的匹配度与互补性。'
  },
  {
    id: 'health',
    title: '健康 Health',
    icon: HeartPulse,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    description: '对应八字中的五行平衡与用神状态，反映身体节奏、能量低谷与恢复周期。五行失衡往往是健康问题的根源所在。',
    bazi: 'K线分析通过五行生克判断健康风险窗口与调理时机。当用神被克、忌神猖獗时，对应的身体系统容易出现波动，需要提前预防。'
  },
  {
    id: 'family',
    title: '家庭 Family',
    icon: Home,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    description: '对应八字中的印星与比劫，反映家庭结构、代际关系与归属感的深层动力。印星为长辈与庇护，比劫为兄弟姐妹与同辈。',
    bazi: 'K线分析通过家庭宫位与六亲星，识别家庭变迁与代际影响的节律。印星状态的变化往往预示家庭环境的重大调整。'
  },
  {
    id: 'migration',
    title: '迁移 Migration',
    icon: Plane,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    description: '对应八字中的驿马与冲合，反映人生轨迹的流动性、迁徙运势与地理变迁的势能。驿马星动则远行，冲合变化则环境更迭。',
    bazi: 'K线分析通过大运中的驿马星与方位冲合，判断迁移窗口、留学时机与海外发展的适宜性。冲开驿马且方位有利时，异地发展顺遂。'
  }
];

const matrixSections = [
  {
    title: '生命矩阵是什么',
    description: '生命矩阵（World-Yi Matrix）是一个多维度的命理分析框架，将八字命理学的核心维度映射到人生八大领域。每个维度都对应特定的十神、五行与宫位。',
    items: [
      '八字四柱对应四个生命阶段',
      '十神体系映射六大人生命题',
      '大运流年提供时间维度',
      '五行生克揭示能量流转'
    ]
  },
  {
    title: '矩阵与K线',
    description: 'K线图将矩阵的抽象维度转化为可视化趋势，让八字学说的"势"得以直观呈现。每个维度都有独立的K线走势，反映该领域在时间轴上的起伏。',
    items: [
      '日主强弱决定K线基准',
      '用神喜忌判定涨跌方向',
      '大运周期影响中长期趋势',
      '流年波动带来短期机会与风险'
    ]
  }
];

const ctaItems = [
  {
    href: '/analyze',
    title: '开始排盘分析',
    description: '输入出生信息，获取完整的八字排盘与K线分析',
    icon: Sparkles
  },
  {
    href: '/hehun',
    title: '合婚分析',
    description: '从关系维度深入分析两人的八字匹配度',
    icon: Heart
  },
  {
    href: '/profile/foundation',
    title: '基础档案',
    description: '完善个人档案，解锁更多维度的人生分析',
    icon: BookOpen
  }
];

export default function WorldYiMatrixPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-ming-bg)]">
      <WorldYiSurfaceHero
        title="生命矩阵"
        subtitle="八字命理六大维度，全方位解读人生K线"
        badge="World-Yi Matrix"
      />

      <div className="page-content">
        {/* Matrix Explanation */}
        {matrixSections.map((section, idx) => (
          <section key={idx} className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Layers3 className="w-5 h-5 text-[var(--color-ming-gold)]" />
              {section.title}
            </h2>
            <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed mb-4">
              {section.description}
            </p>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-ming-text-subtle)]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-ming-gold)] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* Six Life Domains */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Compass className="w-5 h-5 text-[var(--color-ming-gold)]" />
            六大人生维度
          </h2>
          <p className="text-sm text-[var(--color-ming-text-dim)] mb-6">
            生命矩阵从六个核心维度描绘人生全景，每个维度都与八字�理深度对应
          </p>
          <div className="space-y-5">
            {lifeDomains.map((domain) => {
              const Icon = domain.icon;
              return (
                <div key={domain.id} className="shadow-[var(--shadow-card)] bg-[color:var(--color-ming-surface-light)] rounded-[var(--radius)] p-4">
                  <div className="flex items-start gap-3">
                    <div className={`${domain.bg} ${domain.color} p-2 rounded-lg shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{domain.title}</h3>
                      <p className="text-xs text-[var(--color-ming-text-dim)] mt-1 leading-relaxed">
                        {domain.description}
                      </p>
                      <div className="mt-2 pt-2 border-t border-[var(--color-ming-border)]">
                        <p className="text-xs text-[var(--color-ming-text-subtle)] leading-relaxed">
                          <span className="font-medium">八字对应：</span>
                          {domain.bazi}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Global Matrix Preview */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <div className="flex items-start gap-3">
            <Network className="w-6 h-6 text-[var(--color-ming-gold)] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold mb-2">全局矩阵</h2>
              <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed">
                全局矩阵将所有维度叠加在同一时间轴上，展示各领域之间的联动关系。
                事业起伏可能影响财富走势，健康状态可能制约事业选择——全局矩阵让这些交叉影响一目了然。
              </p>
              <Link
                href="/world-yi/global"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[var(--color-ming-gold)] hover:underline"
              >
                查看全局矩阵
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Links */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--color-ming-gold)]" />
            开始你的人生探索
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {ctaItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shadow-[var(--shadow-card)] bg-[color:var(--color-ming-surface-light)] rounded-[var(--radius)] p-4 hover:opacity-80 transition-opacity block"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-[var(--color-ming-gold)]" />
                    <span className="font-semibold text-sm">{item.title}</span>
                  </div>
                  <p className="text-xs text-[var(--color-ming-text-dim)]">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Conversion Strip */}
        <section className="shadow-[var(--shadow-card)] bg-gradient-to-r from-[var(--color-ming-gold)]/10 to-[var(--color-ming-accent)]/10 rounded-[var(--radius)] p-6 text-center">
          <h3 className="font-bold text-base mb-2">保存你的分析结果</h3>
          <p className="text-sm text-[var(--color-ming-text-dim)] mb-4">
            注册账号即可保存你的命盘分析、K线图表与人生矩阵，随时回顾人生趋势变化
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