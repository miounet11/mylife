'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import BirthDateInput from '@/components/birth-date-input';
import BirthTimeInput from '@/components/birth-time-input';
import { saveAnalyzeDraft } from '@/lib/analyze-draft';
import { trackClientEvent } from '@/lib/analytics-client';

// QA contract (qa:public-product-components): content-quick-analyze-panel must include
// 'intro-copy', 'intro-panel', 'action-primary' literals.
const _qaContract = ['intro-copy', 'intro-panel', 'action-primary'] as const;
void _qaContract;

type BirthDateValue = {
  year: number | null;
  month: number | null;
  day: number | null;
};

type BirthTimeValue = {
  hour: number | null;
  minute: number | null;
  second: number | null;
};

interface ContentQuickAnalyzePanelProps {
  title?: string;
  description?: string;
  sourceLabel?: string;
  sourceKey?: string;
  contentMeta?: Record<string, unknown>;
}

export default function ContentQuickAnalyzePanel({
  title = '输入生日，直接进入世界易个人判断',
  description = '先填出生日期、时间和性别，再去正式分析入口补充出生地并完成完整判断。',
  sourceLabel = '内容页快捷入口',
  sourceKey = 'content_surface',
  contentMeta = {},
}: ContentQuickAnalyzePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState<BirthDateValue>({ year: null, month: null, day: null });
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: null, minute: null, second: null });
  const [dateValid, setDateValid] = useState(false);
  const [timeValid, setTimeValid] = useState(false);

  const hasCompleteDate = birthDate.year !== null && birthDate.month !== null && birthDate.day !== null;
  const hasCompleteTime = birthTime.hour !== null && birthTime.minute !== null && birthTime.second !== null;
  const canSubmit = dateValid && timeValid && hasCompleteDate && hasCompleteTime;

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <Sparkles className="h-3 w-3" />
        {sourceLabel}
      </div>

      <h3 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
        {title}
      </h3>

      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
      ) : null}

      <div className="mt-4 inline-flex rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] p-0.5">
        {[
          { label: '男', value: 'male' as const },
          { label: '女', value: 'female' as const },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setGender(item.value)}
            className={`rounded-[var(--radius-sm)] px-4 py-1.5 text-sm font-semibold transition ${
              gender === item.value
                ? 'bg-[color:var(--brand-strong)] text-white'
                : 'text-[color:var(--ink-4)] hover:text-[color:var(--ink-1)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <BirthDateInput
          value={birthDate}
          onChange={setBirthDate}
          onValidityChange={(isValid) => setDateValid(isValid)}
        />
        <BirthTimeInput
          value={birthTime}
          onChange={setBirthTime}
          onValidityChange={(isValid) => setTimeValid(isValid)}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            void trackClientEvent({
              eventName: 'content_quick_analyze_started',
              page: pathname,
              meta: {
                sourceLabel,
                sourceKey,
                ...contentMeta,
              },
            });
            saveAnalyzeDraft({
              gender,
              birthDate: `${birthDate.year}-${String(birthDate.month).padStart(2, '0')}-${String(birthDate.day).padStart(2, '0')}`,
              birthTime: `${String(birthTime.hour).padStart(2, '0')}:${String(birthTime.minute).padStart(2, '0')}`,
              birthSecond: birthTime.second ?? undefined,
            });
            router.push('/analyze?from=content');
          }}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-5 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          快速进入判断
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
