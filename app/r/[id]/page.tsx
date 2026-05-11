import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import PortraitBlock from '@/components/result-v2/portrait-block';
import PastValidationBlock from '@/components/result-v2/past-validation-block';
import Next30DaysBlock from '@/components/result-v2/next-30-days-block';
import Next12MonthsBlock from '@/components/result-v2/next-12-months-block';
import Next5YearsBlock from '@/components/result-v2/next-5-years-block';
import DetailedFoldBlock from '@/components/result-v2/detailed-fold-block';
import TimingSubscribeBar from '@/components/result-v2/timing-subscribe-bar';
import TimingRecallTracker from '@/components/result-v2/timing-recall-tracker';
import { fortuneOperations } from '@/lib/database';
import { resolveTimingProfileForFortune } from '@/lib/life-timing/resolve-timing-profile';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultV2Page({ params }: PageProps) {
  const { id } = await params;
  const fortune = fortuneOperations.getById(id);
  if (!fortune) notFound();

  const resolved = resolveTimingProfileForFortune({
    id: fortune.id,
    userId: fortune.userId,
    birthDate: fortune.birthDate,
    birthTime: fortune.birthTime,
    gender: fortune.gender,
    analysis: fortune.analysis,
  });
  if (!resolved) notFound();

  const record = resolved.record;
  const pattern = extractPatternFromAnalysis(fortune.analysis);

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-10 space-y-5">
        <div className="text-xs text-[color:var(--ink-3)]">
          <Link href="/profile" className="underline-offset-2 hover:underline">
            我的档案
          </Link>
          {' / '}
          <Link href={`/result/${id}`} className="underline-offset-2 hover:underline">
            查看完整报告
          </Link>
        </div>

        <PortraitBlock
          baziPillars={record.baziPillars}
          pattern={pattern || undefined}
        />

        <PastValidationBlock validations={record.past_validations} />

        <Next30DaysBlock points={record.next_30_days} />

        <Next12MonthsBlock points={record.next_12_months} />

        <Next5YearsBlock
          transitions={record.next_5_years}
          baziPillars={record.baziPillars}
        />

        <DetailedFoldBlock baziPillars={record.baziPillars} />

        <div className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] p-5 text-center">
          <p className="text-sm text-[color:var(--ink-2)] mb-2">
            上面这些时点，我们会在邮件里提前告诉你
          </p>
          <p className="text-xs text-[color:var(--ink-3)]">
            完全免费 · 随时可退订 · 留邮箱即可（在屏幕底部）
          </p>
        </div>
      </main>
      <TimingSubscribeBar
        surfaceKey={`r:${id}`}
        reportId={id}
      />
      <TimingRecallTracker reportId={id} />
      <SiteFooter />
    </div>
  );
}

function extractPatternFromAnalysis(analysis: unknown): string | undefined {
  if (typeof analysis !== 'string') return undefined;
  try {
    const parsed = JSON.parse(analysis);
    if (parsed?.pattern?.type) return parsed.pattern.type;
  } catch {
    return undefined;
  }
  return undefined;
}
