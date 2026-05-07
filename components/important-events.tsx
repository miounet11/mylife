'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar, Clock, Edit, Plus, Sparkles, Trash2 } from 'lucide-react';
import ResultCtaLink from '@/components/result-cta-link';
import { buildChatHref } from '@/lib/chat-entry';
import type { EventViewModel } from '@/lib/event-view';
import { appendSourceToHref } from '@/lib/source-url';
import {
  formatEventDateKey,
  getEstimatedPastEventPrompt,
  getEventViewSortTime,
} from '@/lib/event-view';

type Event = EventViewModel & {
  predictionAccuracy?: boolean;
  wasAccurate?: boolean;
};

interface ImportantEventsProps {
  events?: Event[];
  onAdd?: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleReminder?: (eventId: string) => void;
  onMarkAccuracy?: (eventId: string, wasAccurate: boolean) => void;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}

const typeMeta = {
  career: { icon: '👔', label: '事业' },
  wealth: { icon: '💰', label: '财富' },
  marriage: { icon: '❤️', label: '感情' },
  health: { icon: '💪', label: '健康' },
  family: { icon: '👥', label: '家庭' },
  other: { icon: '📌', label: '其他' },
};

const impactMeta = {
  positive: { label: '积极', className: 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)] border-[rgba(47,125,82,0.20)]' },
  negative: { label: '风险', className: 'bg-[color:var(--alert-soft)] text-[color:var(--alert)] border-[color:var(--alert)]' },
  neutral: { label: '中性', className: 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)] border-[color:var(--hairline-strong)]' },
};

export default function ImportantEvents({
  events = [],
  onAdd,
  onEdit,
  onDelete,
  onToggleReminder,
  onMarkAccuracy,
  source,
  ctaStrategyKey,
  sourceFamily,
}: ImportantEventsProps) {
  const sortedEvents = [...events].sort((a, b) => getEventViewSortTime(a) - getEventViewSortTime(b));

  return (
    <Card>
      <CardHeader className="border-b border-[color:var(--line)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">重要事件</CardTitle>
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              添加事件
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {sortedEvents.length > 0 ? (
          <div className="space-y-4">
            {sortedEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleReminder={onToggleReminder}
                onMarkAccuracy={onMarkAccuracy}
                source={source}
                ctaStrategyKey={ctaStrategyKey}
                sourceFamily={sourceFamily}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--line)] bg-[color:var(--bg-elevated)] px-6 py-12 text-center">
            <div className="text-base font-semibold text-[color:var(--ink)]">还没有重要事件</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EventRow({
  event,
  onEdit,
  onDelete,
  onToggleReminder,
  onMarkAccuracy,
  source,
  ctaStrategyKey,
  sourceFamily,
}: {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleReminder?: (eventId: string) => void;
  onMarkAccuracy?: (eventId: string, wasAccurate: boolean) => void;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const type = typeMeta[event.type];
  const impact = impactMeta[event.impact];

  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(23,32,51,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl">{type.icon}</span>
            <h4 className="text-lg font-bold text-[color:var(--ink)]">{event.title}</h4>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">{type.label}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${impact.className}`}>{impact.label}</span>
            {event.reminder?.enabled && (
              <span className="rounded-full border border-[color:var(--env)] bg-[color:var(--env-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--env)]">提醒已开启</span>
            )}
            {event.fortuneAnalysis?.source === 'result_report' && (
              <span className="rounded-full border border-[color:var(--accent)] bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                来自判断报告
              </span>
            )}
            {event.fortuneAnalysis?.source === 'chat_message' && (
              <span className="rounded-full border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--signal-strong)]">
                来自聊天结论
              </span>
            )}
            {event.userFeedback?.wasAccurate === true && (
              <span className="rounded-full border border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.08)] px-3 py-1 text-xs font-semibold text-[color:var(--data-up)]">
                已验证准确
              </span>
            )}
            {event.userFeedback?.wasAccurate === false && (
              <span className="rounded-full border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--alert)]">
                已标记偏差
              </span>
            )}
            {event.isEstimatedPastEvent && (
              <span className="rounded-full border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--signal-strong)]">
                日期待补
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[color:var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatEventDateKey(event.dateKey)}
            </span>
            {event.time && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {event.time}
              </span>
            )}
          </div>

          {event.isEstimatedPastEvent && (
            <div className="mt-4 rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-4 py-3 text-sm text-[color:var(--signal-strong)]">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">这条历史印证还没补真实日期</div>
                  <div className="mt-1 leading-6">{getEstimatedPastEventPrompt(event)}</div>
                </div>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs leading-6 text-[color:var(--ink)]">{event.description || '尚未补充这条事件的详细说明。'}</p>

          {(event.fortuneAnalysis?.reason || event.followUpAdvice?.shortTerm) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {event.fortuneAnalysis?.reason && (
                <div className="rounded-[var(--radius)] bg-[rgba(178,149,93,0.08)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                  {event.fortuneAnalysis.reason}
                </div>
              )}
              {event.followUpAdvice?.shortTerm && (
                <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-sm text-[color:var(--ink)]">
                  {event.followUpAdvice.shortTerm}
                </div>
              )}
            </div>
          )}

          {event.fortuneAnalysis?.reportId && (
            <div className="mt-4 flex flex-wrap gap-3">
              <ResultCtaLink
                href={appendSourceToHref(`/result/${event.fortuneAnalysis.reportId}`, source)}
                page={source === 'profile_page' ? '/profile' : source === 'events_page' ? '/events' : '/history'}
                target="important_event_report"
                className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                meta={{
                  source: source || null,
                  ctaStrategyKey: ctaStrategyKey || null,
                  sourceFamily: sourceFamily || null,
                  surface: 'important_events',
                  eventId: event.id,
                  reportId: event.fortuneAnalysis.reportId,
                }}
              >
                查看关联报告
              </ResultCtaLink>
              {event.userFeedback?.wasAccurate === false && (
                <ResultCtaLink
                  href={buildChatHref({
                    reportId: event.fortuneAnalysis.reportId,
                    eventId: event.id,
                    question: '这条事件已经被我标记为存在偏差，请结合原判断和实际结果，帮我拆开看偏差更可能出在结构、阶段、触发条件还是执行动作，并给我一个纠偏后的下一步方案。',
                    source: 'important_events_drift',
                    ctaStrategyKey,
                    sourceFamily,
                  })}
                  page={source === 'profile_page' ? '/profile' : source === 'events_page' ? '/events' : '/history'}
                  target="important_event_drift_chat"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-4 py-2 text-xs font-semibold text-[color:var(--alert)]"
                  meta={{
                    source: 'important_events_drift',
                    ctaStrategyKey: ctaStrategyKey || null,
                    sourceFamily: sourceFamily || null,
                    surface: 'important_events',
                    eventId: event.id,
                    reportId: event.fortuneAnalysis.reportId,
                  }}
                >
                  进入纠偏分析
                </ResultCtaLink>
              )}
              {event.isEstimatedPastEvent && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-4 py-2 text-xs font-semibold text-[color:var(--signal-strong)]"
                >
                  补真实日期
                </button>
              )}
            </div>
          )}

          {(event.userFeedback?.wasAccurate !== undefined || event.userFeedback?.userNotes) && (
            <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-sm text-[color:var(--ink)]">
              <span className="font-semibold text-[color:var(--ink)]">验证结果：</span>
              {event.userFeedback?.wasAccurate === true && '这次判断已被记录为准确。'}
              {event.userFeedback?.wasAccurate === false && '这次判断已被记录为存在偏差。'}
              {event.userFeedback?.userNotes ? ` ${event.userFeedback.userNotes}` : ''}
            </div>
          )}

          {(event.reminder?.enabled || event.predictionAccuracy !== undefined) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {event.reminder?.enabled && (
                <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-sm text-[color:var(--muted)]">
                  {event.reminder.method === 'app' && '应用通知'}
                  {event.reminder.method === 'email' && '邮件提醒'}
                  {event.reminder.method === 'sms' && '短信提醒'}
                  {` · 提前${event.reminder.advanceDays}天`}
                </div>
              )}
              {event.predictionAccuracy !== undefined && (
                <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-sm text-[color:var(--muted)]">
                  报告预测：<span className={event.wasAccurate ? 'font-semibold text-[color:var(--data-up)]' : 'font-semibold text-[color:var(--alert)]'}>{event.wasAccurate ? '准确' : '待验证/不准确'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onToggleReminder && (
            <button
              onClick={() => onToggleReminder(event.id)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                event.reminder?.enabled ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)]'
              }`}
              title={event.reminder?.enabled ? '关闭提醒' : '开启提醒'}
            >
              <Bell className="h-4 w-4" />
            </button>
          )}
          {onMarkAccuracy && (
            <button
              onClick={() => onMarkAccuracy(event.id, true)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[rgba(47,125,82,0.08)] px-3 text-xs font-semibold text-[color:var(--data-up)] transition hover:bg-[rgba(47,125,82,0.12)]"
              title="标记为准确"
            >
              准
            </button>
          )}
          {onMarkAccuracy && (
            <button
              onClick={() => onMarkAccuracy(event.id, false)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[color:var(--alert-soft)] px-3 text-xs font-semibold text-[color:var(--alert)] transition hover:bg-[rgba(189,76,66,0.16)]"
              title="标记为存在偏差"
            >
              偏
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)] transition hover:bg-[color:var(--hairline-strong)]"
              title="编辑"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)] transition hover:bg-[rgba(189,76,66,0.16)] hover:text-[color:var(--alert)]"
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
