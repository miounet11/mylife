'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { SpaceSeoPlanSvg } from '@/components/fengshui/space-seo-plan-svg';
import { getSpaceSeoScenario } from '@/lib/fengshui/space/seo-catalog';
import { buildSpaceSeoLab, type SpaceSeoSceneSnapshot } from '@/lib/fengshui/space/seo-report';

const SpaceSeoViewport3D = dynamic(
  () => import('@/components/fengshui/space-seo-viewport-3d').then((m) => m.SpaceSeoViewport3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0b0e14] text-[13px] text-white/50">
        加载户型 3D…
      </div>
    ),
  },
);

export function SpaceSeoStage({
  slug,
  snapshot,
}: {
  slug: string;
  snapshot: SpaceSeoSceneSnapshot;
}) {
  const [mode, setMode] = useState<'three' | 'plan'>('three');
  const lab = useMemo(() => {
    const s = getSpaceSeoScenario(slug);
    if (!s) return null;
    return buildSpaceSeoLab(s);
  }, [slug]);

  return (
    <section className="overflow-hidden rounded-[12px] border border-[color:var(--hairline)] bg-[#0b0e14]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-[12px] text-white/70">
        <p className="truncate">
          {snapshot.layout} · {snapshot.facing}向
          {snapshot.yongLabel ? ` · 用神 ${snapshot.yongLabel}` : ''}
          <span className="ml-2 text-white/40">开顶户型 · 可拖转 · 色块是房间 · 白柱为用神方位</span>
        </p>
        <div className="flex shrink-0 gap-1">
          {(
            [
              { id: 'three' as const, label: '3D' },
              { id: 'plan' as const, label: '平面' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                mode === m.id ? 'bg-white text-black' : 'bg-white/10 text-white/75 hover:bg-white/15'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-[min(52vh,440px)] min-h-[280px] w-full">
        {mode === 'plan' || !lab ? (
          <SpaceSeoPlanSvg snap={snapshot} className="h-full w-full" />
        ) : (
          <SpaceSeoViewport3D
            state={lab.state}
            result={lab.result}
            highlightFacings={lab.enhanceFacings}
            reduceFacings={lab.reduceFacings}
          />
        )}
      </div>
    </section>
  );
}
