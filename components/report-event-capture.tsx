'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { ReportActionSuggestion } from '@/lib/report-v2';
import { trackClientEvent } from '@/lib/analytics-client';

interface ReportEventCaptureProps {
  reportId: string;
  suggestions: ReportActionSuggestion[];
}

export default function ReportEventCapture({ reportId, suggestions }: ReportEventCaptureProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [error, setError] = useState('');

  const saveSuggestion = async (item: ReportActionSuggestion) => {
    if (savingKey) return;
    setSavingKey(item.key);
    setError('');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type,
          title: item.title,
          date: item.date,
          description: item.description,
          impact: item.impact,
          reminderEnabled: true,
          reminderAdvanceDays: item.reminderAdvanceDays,
          reminderMethod: 'app',
          source: 'result_report',
          page: `/result/${reportId}`,
          fortuneAnalysis: {
            source: 'result_report',
            reportId,
            suggestionKey: item.key,
            reason: item.reason,
            title: item.title,
          },
          followUpAdvice: {
            shortTerm: item.reason,
            longTerm: '记录事件结果后，回到聊天页继续复盘，校验报告结论和现实偏差。',
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '保存事件失败');
        return;
      }

      setSavedKeys((current) => [...current, item.key]);
      void trackClientEvent({
        eventName: 'report_event_saved_from_result',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          suggestionKey: item.key,
          suggestionType: item.type,
          suggestionSource: item.source,
        },
      });
    } catch {
      setError('网络异常，保存事件失败');
    } finally {
      setSavingKey(null);
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="soft-card rounded-[1.75rem] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          <CalendarPlus className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-[color:var(--ink)]">把报告判断落成事件</div>
          <p className="mt-1 text-sm leading-7 text-[color:var(--muted)]">关键窗口不要只看完就走，直接存进事件系统，后面才能持续验证。</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {suggestions.map((item) => {
          const isSaved = savedKeys.includes(item.key);
          return (
            <div key={item.key} className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                  <div className="mt-1 text-xs text-[color:var(--muted)]">
                    {item.date} · {mapEventTypeLabel(item.type)} · {mapImpactLabel(item.impact)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void saveSuggestion(item)}
                  disabled={isSaved || savingKey === item.key}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                  {isSaved ? '已保存' : savingKey === item.key ? '保存中...' : '存为事件'}
                </button>
              </div>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
              <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">{item.reason}</div>
            </div>
          );
        })}
      </div>

      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/chat?reportId=${encodeURIComponent(reportId)}`}
          onClick={() => {
            void trackClientEvent({
              eventName: 'result_cta_clicked',
              page: `/result/${reportId}`,
              meta: {
                reportId,
                target: 'chat',
                source: 'report_event_capture',
              },
            });
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white"
        >
          去 AI 深问这份报告
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/events?reportId=${encodeURIComponent(reportId)}`}
          onClick={() => {
            void trackClientEvent({
              eventName: 'result_cta_clicked',
              page: `/result/${reportId}`,
              meta: {
                reportId,
                target: 'events',
                source: 'report_event_capture',
              },
            });
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
        >
          查看事件中心
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function mapEventTypeLabel(type: string) {
  switch (type) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '关系';
    case 'health':
      return '健康';
    case 'family':
      return '家庭';
    default:
      return '其他';
  }
}

function mapImpactLabel(impact: string) {
  switch (impact) {
    case 'positive':
      return '积极';
    case 'negative':
      return '风险';
    default:
      return '中性';
  }
}
