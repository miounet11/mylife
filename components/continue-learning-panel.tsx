import Link from 'next/link';
import { ArrowRight, BookOpen, Compass } from 'lucide-react';

import { Eyebrow } from '@/components/ui/eyebrow';
import { Tag } from '@/components/ui/tag';
import { getRecommendedTrackSteps } from '@/lib/learning-track-stats';
import {
  resolveLearningTrackFromCategory,
  resolveLearningTrackFromThemes,
  type LearningTrackKey,
} from '@/lib/learning-tracks';
import { appendSourceToHref } from '@/lib/source-url';

export default function ContinueLearningPanel({
  source,
  category,
  themes,
}: {
  source?: string;
  category?: string | null;
  themes?: string[];
}) {
  const trackKey: LearningTrackKey = category
    ? resolveLearningTrackFromCategory(category)
    : resolveLearningTrackFromThemes(themes);

  const steps = getRecommendedTrackSteps(trackKey, 3);
  const trackHref = appendSourceToHref(`/learn/${trackKey}`, source);
  const mapHref = appendSourceToHref('/learn', source);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Eyebrow icon={<BookOpen className="h-3 w-3" />} tone="brand">
            继续学习
          </Eyebrow>
          <h2 className="mt-2 text-lg font-black text-[color:var(--ink-1)]">
            把这份报告接到深度学习路径
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[color:var(--ink-4)]">
            按你的问题类型推荐阅读顺序：先补方法论，再对照案例，最后用事件中心验证判断。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={trackHref} className="fb-btn fb-btn-primary h-8 px-3 text-xs hover:no-underline">
            <Compass className="h-3.5 w-3.5" />
            进入{steps[0]?.trackTitle || '学习轨'}
          </Link>
          <Link href={mapHref} className="fb-btn h-8 px-3 text-xs hover:no-underline">
            九轨地图
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {steps.map((step, index) => (
          <Link
            key={step.key}
            href={appendSourceToHref(step.href, source)}
            className="group flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 transition hover:border-[color:var(--brand)] hover:no-underline"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="font-mono text-xs font-black tabular-nums text-[color:var(--brand-strong)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-[color:var(--ink-2)]">{step.label}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[color:var(--ink-5)]">
                  <Tag tone="default" variant="soft" size="xs">{step.kind}</Tag>
                  {step.readMinutes ? <span>{step.readMinutes} 分钟</span> : null}
                </div>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-5)] group-hover:text-[color:var(--brand-strong)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}