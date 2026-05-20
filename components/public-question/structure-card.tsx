// v5-D40/D41 公开追问页结构卡：把 LLM 文本中提取出的格局/用神/窗口可视化
//
// SSR-safe，纯 SVG/CSS，无外部图表库，零 client JS。
// D41 起接受权威结构化字段（advice.yongShen / fortune.currentDaYun 等），
// 渲染层不再依赖正则抽取。

import type { PublicQuestionStructure } from '@/lib/public-question-enrichment';

interface Props {
  structure: PublicQuestionStructure;
}

const ELEMENT_COLOR: Record<string, string> = {
  金: 'var(--metal, #c9a14a)',
  木: 'var(--wood, #4d8c45)',
  水: 'var(--water, #3b6fb0)',
  火: 'var(--fire, #c1473d)',
  土: 'var(--earth, #a07a3b)',
};

function ElementChip({ el, tone }: { el: string; tone: 'favor' | 'avoid' }) {
  const color = ELEMENT_COLOR[el] || 'var(--ink-3)';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold"
      style={{
        background: tone === 'favor' ? `${color}1a` : 'var(--bg-sunken)',
        color: tone === 'favor' ? color : 'var(--ink-4)',
        border: `1px solid ${tone === 'favor' ? color : 'var(--hairline)'}`,
        textDecoration: tone === 'avoid' ? 'line-through' : 'none',
      }}
    >
      {el}
    </span>
  );
}

export default function PublicQuestionStructureCard({ structure }: Props) {
  const hasFav = (structure.favorable || []).length > 0;
  const hasAvd = (structure.unfavorable || []).length > 0;
  const hasWindows = (structure.windows || []).length > 0;
  const hasDirections = (structure.directions || []).length > 0;

  const hasAny =
    structure.patternName ||
    structure.daYun ||
    structure.liuNian ||
    structure.dayMaster ||
    structure.trend ||
    hasFav ||
    hasAvd ||
    hasWindows ||
    hasDirections;

  if (!hasAny) return null;

  return (
    <section
      aria-label="结构与时间窗口图卡"
      className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--brand-tint)] via-[color:var(--paper)] to-[color:var(--bg-sunken)] p-4 md:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          结构速读
        </div>
        <div className="text-[10px] text-[color:var(--ink-5)]">
          来自报告权威字段，仅供参考
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* 主轴 */}
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-white/80 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">主轴</div>
          <div className="mt-1 text-base font-black text-[color:var(--ink-1)]">
            {structure.patternName || '未指定格局'}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[color:var(--ink-3)]">
            {structure.dayMaster && (
              <span>
                日主 <span className="font-bold text-[color:var(--ink-2)]">{structure.dayMaster}</span>
              </span>
            )}
            {structure.daYun && <span>{structure.daYun}</span>}
            {structure.liuNian && <span>流年 {structure.liuNian}</span>}
          </div>
          {structure.trend && (
            <div className="mt-2 line-clamp-3 text-xs leading-5 text-[color:var(--ink-4)]">
              {structure.trend}
            </div>
          )}
        </div>

        {/* 用神 / 忌神 */}
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-white/80 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">用神 / 忌神</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(structure.favorable || []).map((el) => (
              <ElementChip key={`fav-${el}`} el={el} tone="favor" />
            ))}
            {(structure.unfavorable || []).map((el) => (
              <ElementChip key={`avd-${el}`} el={el} tone="avoid" />
            ))}
            {!hasFav && !hasAvd && (
              <span className="text-xs text-[color:var(--ink-5)]">未识别</span>
            )}
          </div>
          {hasDirections && (
            <div className="mt-3 border-t border-dashed border-[color:var(--hairline)] pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">推进方向</div>
              <ul className="mt-1 space-y-0.5">
                {structure.directions!.slice(0, 3).map((d, i) => (
                  <li key={i} className="text-xs leading-5 text-[color:var(--ink-3)]">
                    · {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 时间窗口（简易甘特） */}
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-white/80 p-3 md:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">时间窗口</div>
          {!hasWindows ? (
            <div className="mt-2 text-xs text-[color:var(--ink-5)]">未识别</div>
          ) : (
            <ol className="mt-2 space-y-1.5">
              {structure.windows.slice(0, 4).map((w, idx) => (
                <li key={`${w.when}-${idx}`} className="flex items-baseline gap-2">
                  <span className="inline-flex h-5 min-w-[3.5rem] items-center justify-center rounded bg-[color:var(--brand-soft)] px-1.5 text-[10px] font-bold text-[color:var(--brand-strong)]">
                    {w.when}
                  </span>
                  <span className="text-xs leading-5 text-[color:var(--ink-3)]">{w.action}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
