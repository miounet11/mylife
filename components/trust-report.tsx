'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  ArrowRightLeft,
  Compass,
  Flame,
  Gem,
  Leaf,
  ShieldCheck,
  Waves,
} from 'lucide-react';

type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

const elementMeta: Record<ElementKey, { label: string; color: string; icon: typeof Leaf }> = {
  wood: { label: '木', color: 'from-emerald-500 to-emerald-400', icon: Leaf },
  fire: { label: '火', color: 'from-rose-500 to-orange-400', icon: Flame },
  earth: { label: '土', color: 'from-amber-500 to-yellow-400', icon: Compass },
  metal: { label: '金', color: 'from-slate-500 to-slate-300', icon: Gem },
  water: { label: '水', color: 'from-sky-500 to-cyan-400', icon: Waves },
};

export default function TrustReport({ result }: any) {
  if (!result) return null;

  const analysis = result.analysis || {};
  const basic = result.basic || { dayMaster: '', pillars: [] };
  const pillars = basic.pillars || [];
  const fiveElements = result.fiveElements || {};
  const pattern = result.pattern || { type: '未知', quality: '', strength: '', description: '' };
  const fortune = result.fortune || { currentDaYun: '', currentLiuNian: '', interaction: '', nextYear: '' };
  const advice = result.advice || { career: {}, wealth: {}, marriage: {}, health: {} };

  const elementEntries = (Object.entries(fiveElements) as [ElementKey, any][])
    .filter(([key]) => key in elementMeta)
    .sort((a, b) => (b[1]?.strength || 0) - (a[1]?.strength || 0));

  const strongestElement = elementEntries[0];
  const weakestElement = elementEntries[elementEntries.length - 1];

  const quickStats = [
    { label: '日主', value: basic.dayMaster || '未知' },
    { label: '格局', value: pattern.type || '未知' },
    { label: '当前大运', value: fortune.currentDaYun || '待补充' },
    { label: '流年提示', value: fortune.currentLiuNian || '待补充' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <Card id="overview" variant="gradient" className="relative overflow-hidden scroll-mt-28">
        <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />

        <CardHeader className="relative z-10 pb-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            TRUSTED REPORT
          </div>
          <CardTitle className="mt-4 max-w-4xl text-3xl font-black text-white md:text-5xl">
            这份结果不只是告诉用户“是什么命”，
            <span className="font-serif">更要说清为什么、现在如何、下一步做什么。</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6 pt-2">
          <p className="max-w-4xl whitespace-pre-wrap text-base leading-8 text-white/82">
            {analysis.opening || '察天地之理，究阴阳之变。本报告基于真太阳时修正、四柱排盘与结构化建议生成。'}
          </p>

          <div className="grid gap-4 md:grid-cols-4">
            {quickStats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">{item.label}</div>
                <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div id="pillars" className="grid scroll-mt-28 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Activity className="h-5 w-5 text-[color:var(--accent-strong)]" />
              核心命盘结构
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {['年柱', '月柱', '日柱', '时柱'].map((label, index) => {
                const pillar = pillars[index] || { celestialStem: '-', earthlyBranch: '-', nayin: '-', hiddenStems: [] };
                const isDayMaster = index === 2;
                return (
                  <div
                    key={label}
                    className={`relative rounded-[1.5rem] border p-4 text-center ${
                      isDayMaster
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                        : 'border-[color:var(--line)] bg-slate-50'
                    }`}
                  >
                    {isDayMaster && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[color:var(--accent-strong)] px-3 py-1 text-[11px] font-semibold text-white">
                        日主
                      </div>
                    )}
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
                    <div className="mt-4 font-serif text-5xl font-black text-[color:var(--ink)]">{pillar.celestialStem}</div>
                    <div className="mt-2 font-serif text-5xl font-black text-[color:var(--ink)]">{pillar.earthlyBranch}</div>
                    <div className="mt-5 space-y-2 border-t border-white/60 pt-4 text-left text-xs text-[color:var(--muted)]">
                      <div className="flex items-start justify-between gap-3">
                        <span>纳音</span>
                        <span className="font-semibold text-[color:var(--ink)]">{pillar.nayin || '-'}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span>藏干</span>
                        <span className="font-semibold text-[color:var(--ink)]">{pillar.hiddenStems?.join(' ') || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <ArrowRightLeft className="h-5 w-5 text-[color:var(--warm)]" />
              结构结论
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <MetricTile label="命局格局" value={pattern.type || '未知'} emphasis />
            <MetricTile label="用神" value={advice.yongShen?.join('、') || '待补充'} />
            <MetricTile label="忌神" value={advice.jiShen?.join('、') || '待补充'} />
            <MetricTile label="当前运势交互" value={fortune.interaction || '待补充'} />
            <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-[color:var(--muted)]">
              {pattern.description || '当前报告未返回更详细的格局说明。'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div id="elements" className="grid scroll-mt-28 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="text-lg">五行力量分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {elementEntries.map(([key, value]) => {
              const meta = elementMeta[key];
              const Icon = meta.icon;
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[color:var(--ink)]">{meta.label}</div>
                        <div className="text-xs text-[color:var(--muted)]">{value?.state || '结构值'}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[color:var(--ink)]">{Number(value?.strength || 0).toFixed(1)}%</div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meta.color}`}
                      style={{ width: `${value?.strength || 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="text-lg">一眼看懂的结论</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <InsightCard
              label="最强元素"
              value={strongestElement ? `${elementMeta[strongestElement[0]].label} ${Number(strongestElement[1]?.strength || 0).toFixed(1)}%` : '暂无'}
            />
            <InsightCard
              label="最弱元素"
              value={weakestElement ? `${elementMeta[weakestElement[0]].label} ${Number(weakestElement[1]?.strength || 0).toFixed(1)}%` : '暂无'}
            />
            <InsightCard label="有利方向" value={advice.directions?.join('、') || '待补充'} />
            <InsightCard label="幸运颜色" value={advice.colors?.join('、') || '待补充'} />
            <InsightCard label="幸运数字" value={advice.numbers?.join('、') || '待补充'} />
            <InsightCard label="下一年提醒" value={fortune.nextYear || '待补充'} />
          </CardContent>
        </Card>
      </div>

      <Card id="advice" className="scroll-mt-28">
        <CardHeader className="border-b border-[color:var(--line)] pb-4">
          <CardTitle className="text-lg">AI 深度建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <AdviceSection
            title="命局总评"
            accent="bg-[color:var(--accent)]"
            summary={analysis.explanation || '当前报告未提供更多 AI 总评。'}
          />
          <AdviceSection
            title="学业与事业"
            accent="bg-sky-500"
            summary={advice.career?.general || '当前未返回事业建议。'}
            points={advice.career?.specific || []}
            extra={advice.career?.timing ? `时机把握：${advice.career.timing}` : ''}
          />
          <AdviceSection
            title="财富与配置"
            accent="bg-emerald-500"
            summary={advice.wealth?.general || '当前未返回财富建议。'}
            points={advice.wealth?.specific || []}
          />
          <AdviceSection
            title="婚恋与关系"
            accent="bg-rose-500"
            summary={advice.marriage?.general || '当前未返回婚恋建议。'}
            points={advice.marriage?.specific || []}
          />
          <AdviceSection
            title="健康与节奏"
            accent="bg-amber-500"
            summary={advice.health?.general || '当前未返回健康建议。'}
            points={advice.health?.specific || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 ${emphasis ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : 'border-[color:var(--line)] bg-white'}`}>
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className={`mt-2 ${emphasis ? 'text-xl' : 'text-base'} font-bold text-[color:var(--ink)]`}>{value}</div>
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-base font-bold leading-7 text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

function AdviceSection({
  title,
  accent,
  summary,
  points = [],
  extra = '',
}: {
  title: string;
  accent: string;
  summary: string;
  points?: string[];
  extra?: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${accent}`} />
        <h3 className="text-lg font-bold text-[color:var(--ink)]">{title}</h3>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-[color:var(--ink)]">{summary}</p>
      {points.length > 0 && (
        <div className="mt-4 grid gap-3">
          {points.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
              {item}
            </div>
          ))}
        </div>
      )}
      {extra && <div className="mt-4 rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-sm font-medium text-[color:var(--accent-strong)]">{extra}</div>}
    </section>
  );
}
