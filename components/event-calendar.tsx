'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isToday, startOfMonth } from 'date-fns';

interface Event {
  id: string;
  date: Date;
  title: string;
  description?: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family' | 'other';
  impact: 'positive' | 'negative' | 'neutral';
  reminder?: {
    enabled: boolean;
    advanceDays: number;
    method: 'app' | 'email' | 'sms';
  };
}

interface EventCalendarProps {
  events?: Event[];
}

const typeMeta = {
  career: '👔',
  wealth: '💰',
  marriage: '❤️',
  health: '💪',
  family: '👥',
  other: '📌',
};

const impactClass = {
  positive: 'bg-emerald-500',
  negative: 'bg-rose-500',
  neutral: 'bg-amber-500',
};

export default function EventCalendar({ events = [] }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = new Date(monthStart).getDay();

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDay(events, selectedDate);
  }, [events, selectedDate]);

  return (
    <div className="soft-card h-full rounded-[2rem] p-5 md:p-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, -1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-[color:var(--ink)]">{format(currentDate, 'yyyy年 M月')}</h2>
          <p className="text-xs tracking-[0.18em] text-[color:var(--muted)]">CALENDAR VIEW</p>
        </div>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold tracking-[0.18em] text-[color:var(--muted)]">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {Array.from({ length: paddingDays }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const isCurrent = isToday(day);
          const isSelected = !!selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`aspect-square rounded-[1.1rem] border p-1.5 text-left transition ${
                isSelected
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                  : isCurrent
                    ? 'border-[color:var(--warm)] bg-[rgba(201,125,58,0.08)]'
                    : 'border-[color:var(--line)] bg-white hover:border-[color:var(--accent)]'
              }`}
            >
              <div className="flex h-full flex-col justify-between">
                <div className={`text-sm font-semibold ${isSelected || isCurrent ? 'text-[color:var(--ink)]' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </div>
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span key={event.id} className={`h-2 w-2 rounded-full ${impactClass[event.impact]}`} />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4">
        <div className="text-sm font-semibold text-[color:var(--ink)]">
          {selectedDate ? `${format(selectedDate, 'M月d日')} 的事件` : '选择一个日期查看详情'}
        </div>

        {selectedDate ? (
          selectedEvents.length > 0 ? (
            <div className="mt-4 space-y-3">
              {selectedEvents.map((event) => (
                <div key={event.id} className="rounded-[1.25rem] bg-white px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{typeMeta[event.type]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-[color:var(--ink)]">{event.title}</div>
                        <span className={`h-2 w-2 rounded-full ${impactClass[event.impact]}`} />
                      </div>
                      <div className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{event.description || '暂无说明'}</div>
                      {event.reminder?.enabled && (
                        <div className="mt-2 text-xs font-medium text-[color:var(--accent-strong)]">
                          已开启提醒 · 提前{event.reminder.advanceDays}天
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-[color:var(--muted)]">这一天还没有安排事件。</div>
          )
        ) : (
          <div className="mt-4 text-sm text-[color:var(--muted)]">点击日历中的日期，查看当天事件和提醒状态。</div>
        )}
      </div>
    </div>
  );
}

function getEventsForDay(events: Event[], date: Date): Event[] {
  return events.filter((event) => isSameDay(new Date(event.date), date));
}
