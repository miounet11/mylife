import type { PastValidation } from '@/lib/life-timing/types';

interface Props {
  validations: PastValidation[];
}

export default function PastValidationBlock({ validations }: Props) {
  if (validations.length === 0) return null;
  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--ink-3)]">
        过去你应该多次经历过
      </div>
      <ul className="mt-3 space-y-2">
        {validations.map((v) => (
          <li key={v.id} className="text-sm leading-6 text-[color:var(--ink-1)] flex gap-2">
            <span className="text-[color:var(--brand-strong)] font-bold">·</span>
            <span>{v.rawTemplate}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
