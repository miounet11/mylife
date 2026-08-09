import Link from 'next/link';
import { ArrowRight, BookOpen, Briefcase, Coins, Heart, Home, HeartPulse, Plane, Sparkles, Target, ScanSearch } from 'lucide-react';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';

const domains = [
  {
    id: 'career',
    title: '事业 Career',
    icon: Briefcase,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: '事业维度对应八字中的官杀与印星，反映职业发展轨迹、权力结构与事业周期的势能变化。官星代表事业平台与官方认可，杀星代表压力突破与竞争激烈，印星代表资源、贵人与学习能力。',
    details: [
      '官星有力者适合体制内、大平台发展',
      '杀星旺相者适合创业、竞争性行业',
      '印星得力者学业顺遂、易获贵人提携',
      '官杀混杂则需要明确职业定位'
    ],
    tools: [
      { href: '/analyze', label: '八字排盘分析' },
      { href: '/profile/foundation', label: '基础档案' }
    ],
    baziLink: '/analyze'
  },
  {
    id: 'wealth',
    title: '财富 Wealth',
    icon: Coins,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    description: '财富维度对应八字中的财星与食伤，反映收入趋势、投资周期与财富积累的节奏。正财为稳定工资收入，偏财为投资、副业等非固定收入，食伤为生财的创意与技能。',
    details: [
      '财星旺相且得食伤生助，财运亨通',
      '偏财透干者适合投资、副业创收',
      '财星入库需要大运流年才能引动',
      '比劫夺财则需注意合作与借贷风险'
    ],
    tools: [
      { href: '/analyze', label: '财运分析' },
      { href: '/profile/foundation', label: '基础档案' }
    ],
    baziLink: '/analyze'
  },
  {
    id: 'relationship',
    title: '关系 Relationship',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    description: '关系维度对应八字中的夫妻宫与日支，反映亲密关系、婚姻质量与人际互动的深层模式。日支为婚姻宫，配偶星（正财/正官）的状态决定关系质量与伴侣特征。',
    details: [
      '夫妻宫稳定者婚姻关系和谐',
      '配偶星得位者易遇良缘',
      '日支逢冲则需要更多磨合',
      '合婚分析可综合判断两人匹配度'
    ],
    tools: [
      { href: '/hehun', label: '合婚分析' },
      { href: '/analyze', label: '八字排盘分析' }
    ],
    baziLink: '/hehun'
  },
  {
    id: 'health',
    title: '健康 Health',
    icon: HeartPulse,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    description: '健康维度对应八字中的五行平衡与用神状态，反映身体节奏、能量低谷与恢复周期。五行分为木火土金水，对应人体的不同脏腑系统，五行失衡往往是健康问题的根源。',
    details: [
      '木弱者易有肝胆、筋骨问题',
      '火弱者需关注心血管、循环系统',
      '土弱者注意脾胃消化功能',
      '金水失调则与呼吸、泌尿系统相关'
    ],
    tools: [
      { href: '/analyze', label: '健康走势分析' },
      { href: '/profile/foundation', label: '基础档案' }
    ],
    baziLink: '/analyze'
  },
  {
    id: 'family',
    title: '家庭 Family',
    icon: Home,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    description: '家庭维度对应八字中的印星与比劫，反映家庭结构、代际关系与归属感的深层动力。印星为长辈、父母与庇护，比劫为兄弟姐妹、同辈与社交圈层。',
    details: [
      '印星旺相者家庭支持强、易得祖荫',
      '比劫有力者兄弟姐妹助力多',
      '印星受损则需关注长辈健康',
      '家庭宫位受冲预示家庭变动'
    ],
    tools: [
      { href: '/analyze', label: '家庭运势分析' },
      { href: '/profile/foundation', label: '基础档案' }
    ],
    baziLink: '/analyze'
  },
  {
    id: 'migration',
    title: '迁移 Migration',
    icon: Plane,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    description: '迁移维度对应八字中的驿马星与冲合，反映人生轨迹的流动性、迁徙运势与地理变迁的势能。驿马星动则远行，冲合变化则环境更迭，方位五行则影响迁徙吉凶。',
    details: [
      '驿马星逢冲则远行机会多',
      '迁移方位与用神五行相符则顺遂',
      '大运引动驿马时为迁徙窗口期',
      '留学、移民、外地发展均与此相关'
    ],
    tools: [
      { href: '/analyze', label: '迁移运势分析' },
      { href: '/profile/foundation', label: '基础档案' }
    ],
    baziLink: '/analyze'
  }
];

export default function WorldYiDomainsPage() {
  return (
    <main className="min-h-screen bg-[color:var(--color-ming-bg)]">
      <WorldYiSurfaceHero
        title="人生维度"
        subtitle="六大领域深度解析，从八字看透人生全景"
        badge="Life Domains"
      />

      <div className="page-content">
        {/* Introduction */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <div className="flex items-start gap-3">
            <Target className="w-6 h-6 text-[var(--color-ming-gold)] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold mb-2">六大生命维度</h2>
              <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed">
                八字命理并非单一的命运预测，而是通过多维度的十神体系与五行生克，
                全面解读人生的不同侧面。每个维度都有其独特的对应关系与作用机制，
                共同构成一幅完整的人生图景。
              </p>
              <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed mt-3">
                点击下方维度，了解其与八字命理的深层关联，并通过对应的分析工具获取你个人的命理解读。
              </p>
            </div>
          </div>
        </section>

        {/* Domain Cards */}
        <section className="space-y-4">
          {domains.map((domain) => {
            const Icon = domain.icon;
            return (
              <div
                key={domain.id}
                className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`${domain.bg} ${domain.color} p-2.5 rounded-lg shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{domain.title}</h3>
                    <Link
                      href={domain.baziLink}
                      className="text-xs text-[var(--color-ming-gold)] hover:underline"
                    >
                      查看八字对应分析 &rarr;
                    </Link>
                  </div>
                </div>

                <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed mb-4">
                  {domain.description}
                </p>

                <div className="bg-[var(--color-ming-surface-light)] rounded-[var(--radius)] p-3 mb-4">
                  <h4 className="text-xs font-semibold mb-2 text-[var(--color-ming-text-subtle)]">
                    核心要点
                  </h4>
                  <ul className="space-y-1.5">
                    {domain.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-ming-text-subtle)]">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-ming-gold)] shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  {domain.tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ming-gold)] border border-[var(--color-ming-gold)]/20 rounded-lg px-3 py-1.5 hover:bg-[var(--color-ming-gold)]/5 transition-colors"
                    >
                      <ScanSearch className="w-3.5 h-3.5" />
                      {tool.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Cross-Domain Analysis */}
        <section className="shadow-[var(--shadow-card)] bg-[color:var(--paper)] rounded-[var(--radius)] p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-[var(--color-ming-gold)] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold mb-2">维度联动解读</h2>
              <p className="text-sm text-[var(--color-ming-text-dim)] leading-relaxed">
                各维度并非孤立存在，它们之间存在着复杂的联动关系。事业的起落影响财富的积累，
                健康的狀態制约事业的发展，家庭的稳定为关系提供基础。生命矩阵将这些维度整合在同一框架下，
                让你看到人生全貌而非孤立片段。
              </p>
              <Link
                href="/world-yi/matrix"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[var(--color-ming-gold)] hover:underline"
              >
                探索生命矩阵
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Conversion Strip */}
        <section className="shadow-[var(--shadow-card)] bg-gradient-to-r from-[var(--color-ming-gold)]/10 to-[var(--color-ming-accent)]/10 rounded-[var(--radius)] p-6 text-center">
          <h3 className="font-bold text-base mb-2">开始你的人生探索</h3>
          <p className="text-sm text-[var(--color-ming-text-dim)] mb-4">
            输入出生信息，获取完整的八字排盘与六大维度深度分析
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-[var(--color-ming-gold)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <BookOpen className="w-4 h-4" />
            免费排盘分析
          </Link>
          <p className="text-xs text-[var(--color-ming-text-subtle)] mt-3">
            保存分析结果？<Link href="/profile/foundation" className="text-[var(--color-ming-gold)] hover:underline">注册账号</Link>
          </p>
        </section>
      </div>

    </main>
  );
}