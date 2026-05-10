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
import { fortuneOperations } from '@/lib/database';
import { buildTimingProfile } from '@/lib/life-timing/timing-orchestrator';
import { getCurrentLiuNianGanZhi } from '@/lib/life-timing/lunar-utils';
import {
  getTimingProfile,
  saveTimingProfile,
  isProfileFresh,
  type TimingProfileRecord,
} from '@/lib/life-timing/timing-profile-store';
import { PillarCalculatorService } from '@/lib/services/pillar-calculator.service';
import { calculateDayun } from '@/lib/dayun-calculator';
import type { DetectorInput } from '@/lib/life-timing/types';
import { fallbackNarrate } from '@/lib/life-timing/timing-narrator';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultV2Page({ params }: PageProps) {
  const { id } = await params;
  const fortune = fortuneOperations.getById(id);
  if (!fortune) notFound();

  const userId = fortune.userId;
  if (!userId) notFound();

  // 解析生日
  const birthDate = new Date(fortune.birthDate);
  const birthTime = fortune.birthTime || '12:00';
  const gender = (fortune.gender || 'male') as 'male' | 'female';
  const now = new Date();

  // 算八字（一定要算，缓存决策要 year 柱）
  const pillarCalculator = new PillarCalculatorService();
  const pillars = pillarCalculator.calculate({
    date: birthDate,
    time: birthTime,
    timezone: 8,
  });

  const birthSignature = `${fortune.birthDate}_${pillars[0].celestialStem}${pillars[0].earthlyBranch}`;
  const currentLiuNian = getCurrentLiuNianGanZhi(now);

  // 读缓存
  let record: TimingProfileRecord | null = getTimingProfile(userId);

  if (!isProfileFresh(record, birthSignature, currentLiuNian)) {
    // 重算
    const dayunResult = calculateDayun(
      birthDate,
      birthTime,
      gender,
      pillars[0].celestialStem,
      { gan: pillars[1].celestialStem, zhi: pillars[1].earthlyBranch },
      null,
      birthDate.getFullYear()
    );

    const input: DetectorInput = {
      bazi: {
        yearGan: pillars[0].celestialStem,
        yearZhi: pillars[0].earthlyBranch,
        monthGan: pillars[1].celestialStem,
        monthZhi: pillars[1].earthlyBranch,
        dayGan: pillars[2].celestialStem,
        dayZhi: pillars[2].earthlyBranch,
        hourGan: pillars[3].celestialStem,
        hourZhi: pillars[3].earthlyBranch,
      },
      birthDate,
      currentDate: now,
      dayunResult,
      pattern: extractPatternFromAnalysis(fortune.analysis),
    };

    const profile = buildTimingProfile(input);

    // 立即填 fallback narrator copy（同步、快速、模板）
    const profileWithFallback = {
      ...profile,
      next_30_days: profile.next_30_days.map((p) => ({ ...p, userCopy: fallbackNarrate(p) })),
      next_12_months: profile.next_12_months.map((p) => ({ ...p, userCopy: fallbackNarrate(p) })),
    };

    saveTimingProfile({
      userId,
      reportId: id,
      profile: profileWithFallback,
      narratorStatus: 'fallback',
    });
    record = {
      userId,
      reportId: id,
      narratorStatus: 'fallback',
      narratorCompletedAt: new Date().toISOString(),
      ...profileWithFallback,
    };

    // LLM narrator 升级由 scripts/life-timing/upgrade-narrator.ts 批量 cron 处理
  }

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
          pattern={extractPatternFromAnalysis(fortune.analysis) || undefined}
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
          <p className="text-sm text-[color:var(--ink-2)] mb-3">
            上面这些时点，邮件会提前告诉你
          </p>
          <p className="text-xs text-[color:var(--ink-3)]">
            （邮箱订阅功能即将上线）
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function extractPatternFromAnalysis(analysis: unknown): string | undefined {
  if (typeof analysis !== 'string') return undefined;
  try {
    const parsed = JSON.parse(analysis);
    if (parsed?.pattern?.type) return parsed.pattern.type;
  } catch {}
  return undefined;
}
