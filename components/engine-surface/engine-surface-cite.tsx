'use client';

/**
 * Lightweight module cite strip — jump links into EngineSurfaceMount.
 * Drop above any result narrative so readers can open structure modules.
 */

import {
  ENGINE_MODULE_META,
  type EngineModuleId,
  type EngineSurfacePack,
} from '@/lib/engine-surface/types';

type Props = {
  pack: EngineSurfacePack;
  /** Scroll target of the full mount (default #engine-surface) */
  href?: string;
  /** Subset of modules to show as cite chips; default pack.modules */
  modules?: EngineModuleId[];
  label?: string;
  className?: string;
};

export default function EngineSurfaceCite({
  pack,
  href = '#engine-surface',
  modules,
  label = '引用引擎模块',
  className = '',
}: Props) {
  const ids = (modules || pack.modules).filter((id) => ENGINE_MODULE_META[id]);
  if (!ids.length) return null;

  return (
    <div
      className={`rounded-[10px] border border-dashed border-[color:var(--hairline-strong)] bg-[color:var(--bg-sunken)]/30 px-3 py-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            Life Kline · Engine Cite
          </p>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
            {label}
            {pack.dayMaster ? ` · 日主 ${pack.dayMaster}` : ''}
          </p>
        </div>
        <a
          href={href}
          className="text-[12px] font-semibold text-[color:var(--ink-1)] underline-offset-2 hover:underline"
        >
          打开结构台 →
        </a>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ids.slice(0, 10).map((id) => (
          <a
            key={id}
            href={href}
            title={ENGINE_MODULE_META[id].blurb}
            className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--ink-3)] hover:border-[color:var(--ink-1)] hover:text-[color:var(--ink-1)]"
          >
            {ENGINE_MODULE_META[id].short}
          </a>
        ))}
      </div>
    </div>
  );
}
