import Link from 'next/link';
import type { EncyclopediaWorldYiLens } from '@/lib/encyclopedia-world-yi-lens';

export default function EncyclopediaWorldYiSidebar({
  lens,
}: {
  lens: EncyclopediaWorldYiLens;
}) {
  const prompts = [
    { key: 'structure', label: '结构', body: lens.structurePrompt },
    { key: 'timing', label: '时位', body: lens.timingPrompt },
    { key: 'action', label: '行动', body: lens.actionPrompt },
  ];

  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div className="text-[12px] font-medium text-[color:var(--ink-5)]">世界易读法 · {lens.label}</div>
      <h2 className="mt-1 text-[15px] font-semibold text-[color:var(--ink-1)]">{lens.title}</h2>
      <p className="mt-1.5 text-[13px] leading-[1.55] text-[color:var(--ink-5)]">{lens.lead}</p>

      <dl className="mt-4 space-y-3">
        {prompts.map((item) => (
          <div key={item.key}>
            <dt className="text-[12px] font-medium text-[color:var(--ink-3)]">{item.label}</dt>
            <dd className="mt-0.5 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">{item.body}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-[11px] leading-[1.45] text-[color:var(--ink-5)]">{lens.boundary}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <Link href={lens.learnHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
          典籍学习轨
        </Link>
        <Link
          href={lens.methodologyHref}
          className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
        >
          六步判断法
        </Link>
        <Link href={lens.analyzeHref} className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
          接到报告
        </Link>
      </div>
    </section>
  );
}
