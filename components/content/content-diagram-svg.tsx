import type { ReactNode } from 'react';
import type { ContentDiagramVariant } from '@/lib/content-illustrations';

type ContentDiagramSvgProps = {
  variant: ContentDiagramVariant;
  title?: string;
  className?: string;
};

const STEP_COLORS = ['#1d4ed8', '#0f766e', '#b45309', '#7c3aed', '#be123c', '#334155'];

function Shell({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 960 540"
      role="img"
      aria-label={title}
      className={`h-auto w-full rounded-[var(--radius-sm)] bg-[#0b1220] ${className}`}
    >
      <defs>
        <linearGradient id="diagBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#132033" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="960" height="540" fill="url(#diagBg)" rx="18" />
      <circle cx="120" cy="90" r="90" fill="#1d4ed8" opacity="0.12" />
      <circle cx="860" cy="460" r="120" fill="#0f766e" opacity="0.12" />
      <text x="48" y="52" fill="#93c5fd" fontSize="18" fontFamily="system-ui,sans-serif" fontWeight="700">
        人生K线 · 图解
      </text>
      <text x="48" y="92" fill="#f8fafc" fontSize="30" fontFamily="system-ui,sans-serif" fontWeight="800">
        {title}
      </text>
      {children}
      <text x="48" y="512" fill="#64748b" fontSize="14" fontFamily="system-ui,sans-serif">
        非决定论 · 结构时位环境动作风险 · www.life-kline.com
      </text>
    </svg>
  );
}

function StepRow({
  steps,
  y = 180,
}: {
  steps: string[];
  y?: number;
}) {
  const width = 120;
  const gap = 18;
  const total = steps.length * width + (steps.length - 1) * gap;
  const startX = (960 - total) / 2;
  return (
    <g>
      {steps.map((label, index) => {
        const x = startX + index * (width + gap);
        const color = STEP_COLORS[index % STEP_COLORS.length];
        return (
          <g key={label}>
            {index > 0 ? (
              <path
                d={`M ${x - gap + 2} ${y + 34} H ${x - 4}`}
                stroke="#475569"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            ) : null}
            <rect x={x} y={y} width={width} height={68} rx="14" fill={color} opacity="0.92" filter="url(#softGlow)" />
            <text
              x={x + width / 2}
              y={y + 40}
              textAnchor="middle"
              fill="#fff"
              fontSize="16"
              fontFamily="system-ui,sans-serif"
              fontWeight="700"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function ContentDiagramSvg({ variant, title, className }: ContentDiagramSvgProps) {
  if (variant === 'world-yi-six-step') {
    return (
      <Shell title={title || '世界易六步总式'} className={className}>
        <StepRow steps={['结构', '时位', '环境', '行动', '风险', '复盘']} y={200} />
        <text x="480" y="340" textAnchor="middle" fill="#cbd5e1" fontSize="18" fontFamily="system-ui,sans-serif">
          先判断匹配度与窗口，再决定推进 / 观望 / 收敛
        </text>
        <rect x="180" y="380" width="600" height="72" rx="16" fill="#1e293b" stroke="#334155" />
        <text x="480" y="424" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontFamily="system-ui,sans-serif">
          输出：可验证动作 · 风险边界 · 复盘指标
        </text>
      </Shell>
    );
  }

  if (variant === 'structure-timing-env') {
    return (
      <Shell title={title || '结构 · 时位 · 环境'} className={className}>
        {[
          { x: 90, label: '结构', sub: '日主/用神/角色', color: '#1d4ed8' },
          { x: 360, label: '时位', sub: '大运·流年·阶段', color: '#0f766e' },
          { x: 630, label: '环境', sub: '组织·城市·关系场', color: '#b45309' },
        ].map((card) => (
          <g key={card.label}>
            <rect x={card.x} y="170" width="240" height="180" rx="20" fill={card.color} opacity="0.9" />
            <text x={card.x + 120} y="245" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="800" fontFamily="system-ui,sans-serif">
              {card.label}
            </text>
            <text x={card.x + 120} y="290" textAnchor="middle" fill="#e2e8f0" fontSize="16" fontFamily="system-ui,sans-serif">
              {card.sub}
            </text>
          </g>
        ))}
        <text x="480" y="410" textAnchor="middle" fill="#94a3b8" fontSize="16" fontFamily="system-ui,sans-serif">
          三者同时成立，动作才有成功率
        </text>
      </Shell>
    );
  }

  if (variant === 'decision-matrix') {
    const cells = [
      { x: 100, y: 160, label: '推进', desc: '窗口开 · 资源够', color: '#15803d' },
      { x: 360, y: 160, label: '观望', desc: '结构可 · 时位未到', color: '#a16207' },
      { x: 620, y: 160, label: '收敛', desc: '风险高 · 边界先稳', color: '#b91c1c' },
      { x: 230, y: 330, label: '小步验证', desc: '30 天可证伪动作', color: '#1d4ed8' },
      { x: 500, y: 330, label: '复盘改写', desc: '用结果修正判断', color: '#7c3aed' },
    ];
    return (
      <Shell title={title || '决策矩阵'} className={className}>
        {cells.map((cell) => (
          <g key={cell.label}>
            <rect x={cell.x} y={cell.y} width="230" height="120" rx="18" fill={cell.color} opacity="0.92" />
            <text x={cell.x + 115} y={cell.y + 52} textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800" fontFamily="system-ui,sans-serif">
              {cell.label}
            </text>
            <text x={cell.x + 115} y={cell.y + 84} textAnchor="middle" fill="#e2e8f0" fontSize="15" fontFamily="system-ui,sans-serif">
              {cell.desc}
            </text>
          </g>
        ))}
      </Shell>
    );
  }

  if (variant === 'risk-boundary') {
    return (
      <Shell title={title || '风险与边界'} className={className}>
        <circle cx="480" cy="290" r="150" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="10 8" />
        <circle cx="480" cy="290" r="95" fill="#1d4ed8" opacity="0.85" />
        <text x="480" y="285" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" fontFamily="system-ui,sans-serif">
          可行动区
        </text>
        <text x="480" y="315" textAnchor="middle" fill="#dbeafe" fontSize="14" fontFamily="system-ui,sans-serif">
          结构匹配内
        </text>
        <text x="480" y="175" textAnchor="middle" fill="#fca5a5" fontSize="18" fontFamily="system-ui,sans-serif" fontWeight="700">
          红线：资金/健康/关系不可逆损耗
        </text>
        <text x="160" y="430" fill="#cbd5e1" fontSize="16" fontFamily="system-ui,sans-serif">先定边界 → 再谈扩张 → 保留回旋空间</text>
      </Shell>
    );
  }

  if (variant === 'kline-journey') {
    return (
      <Shell title={title || '从阅读到验证'} className={className}>
        <StepRow steps={['读图解', '对照自身', '工具验证', '完整报告', '节点复访']} y={210} />
        <text x="480" y="360" textAnchor="middle" fill="#cbd5e1" fontSize="18" fontFamily="system-ui,sans-serif">
          内容不是终点，是进入人生K线闭环的入口
        </text>
      </Shell>
    );
  }

  if (variant === 'five-elements-cycle') {
    const nodes = [
      { label: '木', x: 480, y: 170 },
      { label: '火', x: 650, y: 260 },
      { label: '土', x: 590, y: 410 },
      { label: '金', x: 370, y: 410 },
      { label: '水', x: 310, y: 260 },
    ];
    return (
      <Shell title={title || '五行生克简图'} className={className}>
        {nodes.map((node, index) => {
          const next = nodes[(index + 1) % nodes.length];
          return (
            <g key={node.label}>
              <line x1={node.x} y1={node.y} x2={next.x} y2={next.y} stroke="#38bdf8" strokeWidth="3" opacity="0.7" />
              <circle cx={node.x} cy={node.y} r="36" fill="#1d4ed8" />
              <text x={node.x} y={node.y + 7} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="system-ui,sans-serif">
                {node.label}
              </text>
            </g>
          );
        })}
        <text x="480" y="480" textAnchor="middle" fill="#94a3b8" fontSize="16" fontFamily="system-ui,sans-serif">
          看生克网络，而不是孤立标签
        </text>
      </Shell>
    );
  }

  // case-before-after
  return (
    <Shell title={title || '案例前后对照'} className={className}>
      <rect x="80" y="160" width="360" height="240" rx="20" fill="#7f1d1d" opacity="0.9" />
      <text x="260" y="230" textAnchor="middle" fill="#fecaca" fontSize="22" fontWeight="800" fontFamily="system-ui,sans-serif">
        修正前
      </text>
      <text x="260" y="280" textAnchor="middle" fill="#fee2e2" fontSize="16" fontFamily="system-ui,sans-serif">
        角色错位 · 窗口误判
      </text>
      <text x="260" y="320" textAnchor="middle" fill="#fee2e2" fontSize="16" fontFamily="system-ui,sans-serif">
        动作过载 · 边界模糊
      </text>
      <rect x="520" y="160" width="360" height="240" rx="20" fill="#14532d" opacity="0.92" />
      <text x="700" y="230" textAnchor="middle" fill="#bbf7d0" fontSize="22" fontWeight="800" fontFamily="system-ui,sans-serif">
        修正后
      </text>
      <text x="700" y="280" textAnchor="middle" fill="#dcfce7" fontSize="16" fontFamily="system-ui,sans-serif">
        结构对齐 · 阶段匹配
      </text>
      <text x="700" y="320" textAnchor="middle" fill="#dcfce7" fontSize="16" fontFamily="system-ui,sans-serif">
        小步验证 · 风险可控
      </text>
      <path d="M 455 280 H 505" stroke="#e2e8f0" strokeWidth="4" />
      <polygon points="505,270 525,280 505,290" fill="#e2e8f0" />
    </Shell>
  );
}
