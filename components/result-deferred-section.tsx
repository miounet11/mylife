'use client';

import type { ReactNode } from 'react';

export default function ResultDeferredSection({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <section className="fb-card p-4 md:p-5">
      {title ? <h2 className="text-base font-bold text-[color:var(--ink-1)]">{title}</h2> : null}
      {description ? <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">{description}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
