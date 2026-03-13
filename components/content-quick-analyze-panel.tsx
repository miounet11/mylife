'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import BirthDateInput from '@/components/birth-date-input';
import BirthTimeInput from '@/components/birth-time-input';
import { saveAnalyzeDraft } from '@/lib/analyze-draft';
import { trackClientEvent } from '@/lib/analytics-client';

interface ContentQuickAnalyzePanelProps {
  title?: string;
  description?: string;
  sourceLabel?: string;
  sourceKey?: string;
  contentMeta?: Record<string, unknown>;
}

export default function ContentQuickAnalyzePanel({
  title = '输入生日，直接进入个人测算',
  description = '先填出生日期、时间和性别，出生地可以在下一步继续补充。这样内容阅读不会中断，但转化入口始终在手边。',
  sourceLabel = '内容页快捷入口',
  sourceKey = 'content_surface',
  contentMeta = {},
}: ContentQuickAnalyzePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState({ year: 1990, month: 1, day: 1 });
  const [birthTime, setBirthTime] = useState({ hour: 12, minute: 0, second: 0 });
  const [dateValid, setDateValid] = useState(true);
  const [timeValid, setTimeValid] = useState(true);

  const canSubmit = dateValid && timeValid;

  return (
    <div className="product-panel-strong overflow-hidden p-5 md:p-6">
      <div className="section-label">
        <Sparkles className="h-3.5 w-3.5" />
        {sourceLabel}
      </div>

      <h3 className="mt-4 text-2xl font-black text-[color:var(--ink)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{description}</p>

      <div className="mt-5 inline-flex rounded-full border border-[color:var(--line)] bg-white/80 p-1">
        {[
          { label: '男', value: 'male' as const },
          { label: '女', value: 'female' as const },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setGender(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              gender === item.value
                ? 'bg-[color:var(--accent)] text-white'
                : 'text-[color:var(--muted)] hover:text-[color:var(--ink)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
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

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs leading-6 text-[color:var(--muted)]">
          下一步会自动带入分析页。你只需要再确认出生地，就可以开始完整排盘。
        </p>
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
              birthSecond: birthTime.second,
            });
            router.push('/analyze?from=content');
          }}
          className="action-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          快速进入测算
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
