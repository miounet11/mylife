'use client';

import { useMemo, useState } from 'react';
import { castLiuyao, type LiuyaoCastResult } from '@/lib/liuyao/cast';

export function LiuyaoCastClient({ locale = 'zh-CN' }: { locale?: string }) {
  const en = locale.toLowerCase().startsWith('en');
  const [result, setResult] = useState<LiuyaoCastResult | null>(null);

  const copy = useMemo(
    () =>
      en
        ? {
            cast: 'Cast six lines',
            recast: 'Cast again',
            ben: 'Primary hexagram',
            bian: 'Changed hexagram',
            lines: 'Lines (bottom → top)',
            changing: 'Changing',
            seed: 'Seed',
            empty: 'Tap cast to simulate three coins six times.',
          }
        : {
            cast: '起一卦',
            recast: '再起一卦',
            ben: '本卦',
            bian: '变卦',
            lines: '六爻（初 → 上）',
            changing: '动爻',
            seed: '种子',
            empty: '点击起卦：模拟三枚铜钱，由初爻到上爻。',
          },
    [en],
  );

  const onCast = () => {
    setResult(castLiuyao());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCast}
          className="inline-flex h-9 items-center rounded-[6px] bg-[color:var(--brand-strong)] px-4 text-[13px] font-semibold text-white hover:opacity-90"
        >
          {result ? copy.recast : copy.cast}
        </button>
        <span className="text-[12px] text-[color:var(--ink-5)]">{copy.empty}</span>
      </div>

      {result ? (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)]">
          <div className="grid gap-0 border-b border-[color:var(--hairline)] sm:grid-cols-2">
            <div className="px-4 py-3 sm:border-r sm:border-[color:var(--hairline)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
                {copy.ben}
              </div>
              <div className="mt-1 text-[18px] font-semibold text-[color:var(--ink-1)]">
                {result.benName}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[color:var(--ink-4)]">
                {result.benBinary}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
                {copy.bian}
              </div>
              <div className="mt-1 text-[18px] font-semibold text-[color:var(--ink-1)]">
                {result.bianName}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[color:var(--ink-4)]">
                {result.bianBinary}
                {result.changingCount > 0 ? (
                  <span className="ml-2 text-[color:var(--ink-5)]">
                    · {copy.changing} {result.changingCount}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="mb-2 text-[11px] font-medium text-[color:var(--ink-5)]">{copy.lines}</div>
            <ol className="space-y-1.5">
              {[...result.lines].reverse().map((line) => (
                <li
                  key={line.index}
                  className={`flex items-center justify-between rounded-[6px] border px-3 py-1.5 text-[13px] ${
                    line.changing
                      ? 'border-[color:var(--brand)]/30 bg-[color:var(--brand-soft,rgba(59,89,152,0.06))]'
                      : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40'
                  }`}
                >
                  <span className="text-[color:var(--ink-5)]">
                    {en ? `L${line.index + 1}` : `${['初', '二', '三', '四', '五', '上'][line.index]}爻`}
                  </span>
                  <span className="font-mono text-[color:var(--ink-2)]">
                    {line.yang ? '▅▅▅▅▅' : '▅▅  ▅▅'}
                  </span>
                  <span className="text-[12px] text-[color:var(--ink-3)]">
                    {line.label}
                    {line.changing ? (en ? ' · move' : ' · 动') : ''}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] leading-[1.45] text-[color:var(--ink-5)]">
              {result.disclaimer}
            </p>
            <p className="mt-1 font-mono text-[10px] text-[color:var(--ink-4)]">
              {copy.seed}: {result.seed.slice(0, 24)}…
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
