'use client';

import React from 'react';
import type { DashboardData } from '@/lib/dashboard-builder';

/* ── FortuneHero — 顶部核心指标卡片 ── */

export function FortuneHero({ hero }: { hero: DashboardData['hero'] }) {
  const elementClass = `element-${hero.dayMasterElement}`;
  const scoreColor =
    hero.overallScore >= 70 ? 'text-green-400' :
    hero.overallScore >= 50 ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="premium-card-gold">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 日主 */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[var(--color-ming-gold)]/30 bg-[var(--color-ming-gold)]/5">
            <span className={`text-2xl font-black ${elementClass}`}>
              {hero.dayMaster}
            </span>
          </div>
          <div>
            <div className="text-xs text-muted uppercase tracking-wider">日主</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{hero.dayMaster}</span>
              <span className={`badge-element bg-${hero.dayMasterElement}-500/10 ${elementClass}`}>
                {hero.dayMasterElement === 'wood' ? '木' :
                 hero.dayMasterElement === 'fire' ? '火' :
                 hero.dayMasterElement === 'earth' ? '土' :
                 hero.dayMasterElement === 'metal' ? '金' : '水'}
              </span>
            </div>
          </div>
        </div>

        {/* 格局 + 大运 */}
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-xs text-muted uppercase tracking-wider">格局</div>
            <div className="font-semibold text-gold">{hero.pattern || '正格'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase tracking-wider">当前大运</div>
            <div className="font-semibold">{hero.currentDayun || '—'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted uppercase tracking-wider">年龄</div>
            <div className="font-semibold">{hero.age}岁</div>
          </div>
        </div>

        {/* 综合评分 */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted uppercase tracking-wider">综合评分</div>
            <div className={`text-3xl font-black ${scoreColor}`}>
              {hero.overallScore}
            </div>
          </div>
          <div className="text-xs text-muted max-w-16">{hero.overallLabel}</div>
        </div>
      </div>
    </div>
  );
}

/* ── ConstitutionView — 命局结构卡片 ── */

export function ConstitutionView({ constitution }: { constitution: DashboardData['constitution'] }) {
  const pinyin = ['年柱', '月柱', '日柱', '时柱'];

  return (
    <div className="premium-card">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">四柱结构</h3>

      <div className="flex gap-3 justify-center mb-5">
        {constitution.pillars.map((p, i) => (
          <div key={i} className="pillar-box">
            <div className="text-xs text-muted mb-1">{pinyin[i]}</div>
            <div className="ganzhi">{p.ganZhi}</div>
            <div className="nayin">{p.nayin || '—'}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-ming-border)]">
        <div>
          <div className="text-xs text-muted mb-1">日主强度</div>
          <div className="font-semibold">{constitution.dayMasterStrength || '中和'}</div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">用神 / 忌神</div>
          <div className="flex gap-2 text-sm">
            <span className="text-gold">{constitution.yongShen.join('、') || '—'}</span>
            <span className="text-muted">/</span>
            <span className="text-subtle">{constitution.jiShen.join('、') || '—'}</span>
          </div>
        </div>
        {constitution.specialSignals.length > 0 && (
          <div className="col-span-2">
            <div className="text-xs text-muted mb-1">特殊信号</div>
            <div className="flex gap-2 flex-wrap">
              {constitution.specialSignals.map((s, i) => (
                <span key={i} className="badge-element bg-[var(--color-ming-gold)]/10 text-gold-dim text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── RadarChart — 五行雷达图 (using Recharts) ── */

import {
  Radar, RadarChart as ReRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

export function ElementRadar({ elements }: { elements: DashboardData['elements'] }) {
  const labels = elements.radarData.labels.map((l, i) => ({
    element: l,
    strength: elements.radarData.strengths[i],
    preference: elements.radarData.yongShenPreference[i],
  }));

  return (
    <div className="premium-card">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">五行力量雷达</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ReRadarChart data={labels}>
          <PolarGrid stroke="var(--color-ming-border)" />
          <PolarAngleAxis
            dataKey="element"
            tick={{ fill: 'var(--color-ming-text-dim)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="五行力量"
            dataKey="strength"
            stroke="var(--color-ming-gold)"
            fill="var(--color-ming-gold)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          {elements.radarData.yongShenPreference.some(v => v > 0) && (
            <Radar
              name="用神偏好"
              dataKey="preference"
              stroke="var(--color-ming-water)"
              fill="var(--color-ming-water)"
              fillOpacity={0.08}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          <Tooltip
            contentStyle={{
              background: 'var(--color-ming-surface-light)',
              border: '1px solid var(--color-ming-border)',
              borderRadius: '8px',
              color: 'var(--color-ming-text)',
            }}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── KLineChart — 人生趋势 K 线 ── */

import type { KlinePointV6, KlineAnchorV6 } from '@/lib/kline-v6';

export function KLineChart({
  data,
  anchors,
  currentYear,
}: {
  data: KlinePointV6[];
  anchors: KlineAnchorV6[];
  currentYear: number;
}) {
  if (!data.length) {
    return (
      <div className="premium-card">
        <p className="text-muted text-sm">暂无趋势数据</p>
      </div>
    );
  }

  const max = Math.max(...data.map(p => Math.max(p.career, p.wealth, p.marriage, p.health)), 1);
  const height = 200;
  const width = data.length * 3; // bar width

  const anchorMap = new Map(anchors.map(a => [a.year, a]));

  const lines = [
    { key: 'career', label: '事业', color: '#d4a853' },
    { key: 'wealth', label: '财运', color: '#e0554a' },
    { key: 'marriage', label: '婚姻', color: '#c4a45a' },
    { key: 'health', label: '健康', color: '#4a90d9' },
  ] as const;

  const getValue = (p: KlinePointV6, key: string) => (p as any)[key] as number;

  return (
    <div className="premium-card">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">人生趋势</h3>

      <div className="overflow-x-auto">
        <svg width={Math.max(width * 3, 600)} height={height + 30} className="w-full min-w-[600px]">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => (
            <line
              key={pct}
              x1={0}
              y1={height - (height * pct / 100)}
              x2={Math.max(width * 3, 600)}
              y2={height - (height * pct / 100)}
              stroke="var(--color-ming-border)"
              strokeWidth={0.5}
            />
          ))}

          {/* K-line for each line */}
          {lines.map(line => {
            const pathData = data
              .map((p, i) => {
                const x = 30 + i * 3;
                const y = height - (height * getValue(p, line.key) / 100);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');

            return (
              <path
                key={line.key}
                d={pathData}
                fill="none"
                stroke={line.color}
                strokeWidth={1.2}
                strokeOpacity={0.7}
              />
            );
          })}

          {/* Anchor markers */}
          {anchors.map(a => {
            const idx = data.findIndex(p => p.year === a.year);
            if (idx === -1) return null;
            const x = 30 + idx * 3;
            const isCurrent = a.year === currentYear;
            return (
              <circle
                key={`a-${a.year}`}
                cx={x}
                cy={height - (height * (a.score || 50) / 100)}
                r={isCurrent ? 4 : 2.5}
                fill={isCurrent ? 'var(--color-ming-gold-bright)' : 'var(--color-ming-gold-dim)'}
                className={isCurrent ? 'pulse-gold' : ''}
              />
            );
          })}

          {/* Current year line */}
          {(() => {
            const curIdx = data.findIndex(p => p.year === currentYear);
            if (curIdx === -1) return null;
            const x = 30 + curIdx * 3;
            return (
              <line x1={x} y1={0} x2={x} y2={height} stroke="var(--color-ming-gold)" strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3 3" />
            );
          })()}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        {lines.map(line => (
          <div key={line.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            {line.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── YearCalendar — 年度热力日历 ── */

export function YearCalendar({
  year,
  monthlyData,
}: {
  year: number;
  monthlyData: Array<{ month: number; score: number; label: string }>;
}) {
  const months = Array.from({ length: 12 }, (_, i) => {
    const data = monthlyData.find(m => m.month === i + 1);
    return { month: i + 1, score: data?.score ?? 0, label: data?.label ?? '' };
  });

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const maxScore = Math.max(...months.map(m => m.score), 1);

  const getColor = (score: number) => {
    const ratio = score / maxScore;
    if (ratio > 0.7) return 'bg-[var(--color-ming-accent-up)]/20 border-[var(--color-ming-accent-up)]/30';
    if (ratio > 0.4) return 'bg-[var(--color-ming-gold)]/10 border-[var(--color-ming-gold)]/20';
    return 'bg-[var(--color-ming-accent-down)]/10 border-[var(--color-ming-accent-down)]/20';
  };

  const getTextColor = (score: number) => {
    const ratio = score / maxScore;
    if (ratio > 0.7) return 'text-[var(--color-ming-accent-up)]';
    if (ratio > 0.4) return 'text-[var(--color-ming-gold)]';
    return 'text-[var(--color-ming-accent-down)]';
  };

  return (
    <div className="premium-card">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
        {year} 年度热力
      </h3>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {months.map(m => (
          <div key={m.month} className={`heat-cell p-2 rounded-lg border text-center ${getColor(m.score)}`} title={m.label}>
            <div className="text-xs text-muted">{monthNames[m.month - 1]}</div>
            <div className={`text-lg font-bold ${getTextColor(m.score)}`}>
              {m.score || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── AnalysisSection — 分析内容区域 ── */

export function AnalysisSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="premium-card">
      <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-3">
        {icon ? `${icon}  ` : ''}{title}
      </h3>
      <div className="prose prose-invert prose-sm max-w-none text-[var(--color-ming-text)] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/* ── StrategyPanel — 策略建议面板 ── */

export function StrategyPanel({ strategy }: { strategy: DashboardData['strategy'] }) {
  return (
    <div className="premium-card-gold">
      <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">策略建议</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted mb-2">优先方向</div>
          {strategy.priorities.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ming-gold)]" />
              {p}
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs text-muted mb-2">注意事项</div>
          {strategy.cautions.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ming-fire)]" />
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Disclaimer ── */

export function Disclaimer({ disclaimer }: { disclaimer: DashboardData['disclaimer'] }) {
  return (
    <div className="text-xs text-subtle text-center py-6 space-y-1">
      <p>{disclaimer.text}</p>
      {disclaimer.version && <p>引擎版本：{disclaimer.version}</p>}
    </div>
  );
}
