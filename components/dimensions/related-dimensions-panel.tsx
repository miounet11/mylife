'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import DimensionRecommendations from '@/components/dimensions/dimension-recommendations';
import type { ProfileIntent } from '@/lib/profile-settings-types';

/** Cross-link into ten-dimension hub from report / analyze / predictions. */
export default function RelatedDimensionsPanel({
  intent,
  title = '相关维度研判',
  description = '按你关心的问题进入窄场景，结论会自动同步到预测回访。',
  compact = false,
  limit = 3,
}: {
  intent?: ProfileIntent | null;
  title?: string;
  description?: string;
  compact?: boolean;
  limit?: number;
}) {
  return (
    <section className="fb-card space-y-3 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="lk-section-eyebrow">十维度</div>
          <h2 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">{title}</h2>
          <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--ink-3)]">{description}</p>
        </div>
        <Link
          href="/dimensions"
          className="inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--brand)] hover:no-underline"
        >
          全部维度
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <DimensionRecommendations
        intent={intent}
        limit={limit}
        compact
        loadFromServer
        title={compact ? '推荐维度' : '为你推荐'}
        description=""
      />
      <div className="flex flex-wrap gap-2 pt-1">
        <Link href="/predictions" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
          预测回访
        </Link>
        <Link href="/annual-review" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
          年度复盘
        </Link>
      </div>
    </section>
  );
}
