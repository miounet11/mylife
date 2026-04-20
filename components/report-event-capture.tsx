'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { ReportActionSuggestion } from '@/lib/report-v2';
import { trackClientEvent } from '@/lib/analytics-client';
import { buildChatHref } from '@/lib/chat-entry';
import {
  buildEstimatedPastEventDescription,
  getEstimatedPastEventDateKey,
} from '@/lib/event-view';

interface ReportEventCaptureProps {
  reportId: string;
  suggestions: ReportActionSuggestion[];
  pastEventTemplates?: Array<{
    key: string;
    title: string;
    type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
    description: string;
    reason: string;
    confidenceLabel?: 'high' | 'medium';
    occurrenceWindow?: string;
  }>;
}

export default function ReportEventCapture({ reportId, suggestions, pastEventTemplates = [] }: ReportEventCaptureProps) {
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
            longTerm: '记录事件结果后回到聊天页复盘。',
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

  const savePastTemplate = async (item: NonNullable<ReportEventCaptureProps['pastEventTemplates']>[number]) => {
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
          date: getEstimatedPastEventDateKey(),
          description: buildEstimatedPastEventDescription(item.description, item.occurrenceWindow),
          impact: item.type === 'health' ? 'negative' : 'neutral',
          reminderEnabled: false,
          source: 'result_report',
          page: `/result/${reportId}`,
          fortuneAnalysis: {
            source: 'result_report',
            reportId,
            suggestionKey: item.key,
            reason: item.reason,
            title: item.title,
            templateKind: 'past_event',
            occurrenceWindow: item.occurrenceWindow,
            dateStatus: 'estimated_today_pending_correction',
          },
          followUpAdvice: {
            shortTerm: '回忆这件事大概发生在什么时间，并补充当时的真实结果。',
            longTerm: '补完真实日期和备注后，这条历史事件会成为后续判断和纠偏的重要样本。',
          },
          userFeedback: {
            wasAccurate: true,
            userNotes: '用户在结果页标记：这条过去事件确实发生过。',
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '保存历史事件失败');
        return;
      }

      setSavedKeys((current) => [...current, item.key]);
      void trackClientEvent({
        eventName: 'report_past_event_saved_from_result',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          templateKey: item.key,
          templateType: item.type,
          confidenceLabel: item.confidenceLabel || 'medium',
        },
      });
    } catch {
      setError('网络异常，保存历史事件失败');
    } finally {
      setSavingKey(null);
    }
  };

  if (suggestions.length === 0 && pastEventTemplates.length === 0) {
    return null;
  }

  return (
    <div id="result-event-capture" className="soft-card rounded-[1.75rem] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          <CalendarPlus className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-[color:var(--ink)]">把报告判断落成事件</div>
          <div className="intro-copy mt-1">先把关键建议存成事件，再回到聊天页或结果页做后续复盘。</div>
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
                  className="action-secondary min-h-0 shrink-0 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                  {isSaved ? '已保存' : savingKey === item.key ? '保存中...' : '存为事件'}
                </button>
              </div>
              <div className="mt-3 text-sm text-[color:var(--ink)]">{item.description}</div>
              <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{item.reason}</div>
            </div>
          );
        })}
      </div>

      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {pastEventTemplates.length > 0 ? (
        <div className="mt-6">
          <div className="font-semibold text-[color:var(--ink)]">回看过去是否发生过这些节点</div>
          <div className="mt-1 text-sm text-[color:var(--muted)]">
            如果其中某条确实发生过，直接存下来。系统会先按今天建一条历史样本，后续你再补真实日期。
          </div>
          <div className="mt-4 grid gap-3">
            {pastEventTemplates.map((item) => {
              const isSaved = savedKeys.includes(item.key);
              return (
                <div key={item.key} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[color:var(--muted)]">
                        <span>{mapEventTypeLabel(item.type)}</span>
                        {item.occurrenceWindow ? <span>{item.occurrenceWindow}</span> : null}
                        <span>{item.confidenceLabel === 'high' ? '高概率印证点' : '中概率印证点'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void savePastTemplate(item)}
                      disabled={isSaved || savingKey === item.key}
                      className="action-secondary min-h-0 shrink-0 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaved ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                      {isSaved ? '已记为发生过' : savingKey === item.key ? '保存中...' : '这条发生过'}
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-[color:var(--ink)]">{item.description}</div>
                  <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{item.reason}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={buildChatHref({
            reportId,
            question: '请结合我刚刚记录或确认过的这些事件，帮我继续复盘这份报告：哪些判断已经被验证，哪些地方还需要继续观察？',
            source: 'report_event_capture',
          })}
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
          className="action-secondary inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-sm font-semibold text-white"
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
          className="action-secondary"
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
