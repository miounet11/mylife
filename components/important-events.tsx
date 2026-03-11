'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar, Clock, Edit, Plus, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Event {
  id: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
  title: string;
  date: Date;
  time?: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  reminder?: {
    enabled: boolean;
    advanceDays: number;
    method: 'app' | 'email' | 'sms';
  };
  predictionAccuracy?: boolean;
  wasAccurate?: boolean;
}

interface ImportantEventsProps {
  events?: Event[];
  onAdd?: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleReminder?: (eventId: string) => void;
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
  positive: { label: '积极', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  negative: { label: '风险', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  neutral: { label: '中性', className: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function ImportantEvents({
  events = [],
  onAdd,
  onEdit,
  onDelete,
  onToggleReminder,
}: ImportantEventsProps) {
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <Card>
      <CardHeader className="border-b border-[color:var(--line)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">重要事件</CardTitle>
            <p className="mt-1 text-sm text-[color:var(--muted)]">把命理窗口期和现实节点放到一处，形成真正可复访的使用路径。</p>
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
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-[color:var(--line)] bg-slate-50 px-6 py-12 text-center">
            <div className="text-base font-semibold text-[color:var(--ink)]">还没有重要事件</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">现在就把报告里的关键窗口期、现实节点或提醒需求存下来。</div>
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
}: {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleReminder?: (eventId: string) => void;
}) {
  const type = typeMeta[event.type];
  const impact = impactMeta[event.impact];

  return (
    <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(23,32,51,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl">{type.icon}</span>
            <h4 className="text-lg font-bold text-[color:var(--ink)]">{event.title}</h4>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">{type.label}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${impact.className}`}>{impact.label}</span>
            {event.reminder?.enabled && (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">提醒已开启</span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[color:var(--muted)]">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDateTime(event.date)}
            </span>
            {event.time && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {event.time}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-7 text-[color:var(--ink)]">{event.description || '暂无描述'}</p>

          {(event.reminder?.enabled || event.predictionAccuracy !== undefined) && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {event.reminder?.enabled && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-[color:var(--muted)]">
                  {event.reminder.method === 'app' && '应用通知'}
                  {event.reminder.method === 'email' && '邮件提醒'}
                  {event.reminder.method === 'sms' && '短信提醒'}
                  {` · 提前${event.reminder.advanceDays}天`}
                </div>
              )}
              {event.predictionAccuracy !== undefined && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-[color:var(--muted)]">
                  命理预测：<span className={event.wasAccurate ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{event.wasAccurate ? '准确' : '待验证/不准确'}</span>
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
                event.reminder?.enabled ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-slate-100 text-slate-600'
              }`}
              title={event.reminder?.enabled ? '关闭提醒' : '开启提醒'}
            >
              <Bell className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              title="编辑"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-rose-100 hover:text-rose-700"
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
