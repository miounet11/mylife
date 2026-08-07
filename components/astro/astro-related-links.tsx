import Link from 'next/link';
import { relatedWorldYiLinks } from '@/lib/astro/resolve';
import type { SignKey } from '@/lib/astro/types';

export default function AstroRelatedLinks({
  signKey,
  title = '关联 · 世界易与人生K线',
}: {
  signKey?: SignKey | null;
  title?: string;
}) {
  const links = relatedWorldYiLinks(signKey);
  return (
    <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
      <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">{title}</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
        星座是表达与节奏层；世界易给结构语言；黄历给日节奏；八字报告给可验证动作。交叉看，不互相替代。
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1 text-[12px] font-semibold text-[color:var(--ink-2)] no-underline transition hover:border-[color:var(--brand)]/40"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
