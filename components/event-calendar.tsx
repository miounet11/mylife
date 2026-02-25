// 事件日历组件
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';

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

export default function EventCalendar({ events = [] }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const firstDayOfMonth = new Date(monthStart);
  const paddingDays = firstDayOfMonth.getDay();

  return (
    <div className="h-full p-4 bg-white">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded transition">
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {format(currentDate, 'yyyy年 MMMM')}
          </h2>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded transition">
          <ChevronRight className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-slate-500">
            {day}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-2">
        {/* 填充日期 */}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={i} className="aspect-square"></div>
        ))}

        {/* 实际日期 */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const hasEvents = dayEvents.length > 0;
          const isTodayDate = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`
                aspect-square border rounded-lg p-1 cursor-pointer transition
                ${isTodayDate ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}
                ${isSelected ? 'border-indigo-600 bg-indigo-100' : ''}
                ${hasEvents ? 'font-semibold' : ''}
              `}
            >
              <div className="text-center">
                <div className={`text-sm ${isTodayDate ? 'text-indigo-600 font-bold' : 'text-slate-900'}`}>
                  {format(day, 'd')}
                </div>
                {hasEvents && (
                  <div className="mt-1 flex justify-center space-x-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${
                        event.impact === 'positive' ? 'bg-green-500' :
                        event.impact === 'negative' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 选中的日期事件 */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-slate-50 rounded border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-3">
            {format(selectedDate, 'yyyy年 MMMM dd日')} 的事件
          </h3>
          <div className="space-y-2">
            {getEventsForDay(events, selectedDate).length > 0 ? (
              getEventsForDay(events, selectedDate).map((event) => (
                <div key={event.id} className="bg-white rounded p-3 border border-slate-200">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">
                      {event.type === 'career' && '👔'}
                      {event.type === 'wealth' && '💰'}
                      {event.type === 'marriage' && '❤️'}
                      {event.type === 'health' && '💪'}
                      {event.type === 'family' && '👥'}
                      {event.type === 'other' && '📋'}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{event.title}</h4>
                      <p className="text-sm text-slate-600">{event.description || '暂无描述'}</p>
                      {event.reminder && event.reminder.enabled && (
                        <div className="mt-2 text-xs text-indigo-600">
                          ✓ 已设置提醒（{event.reminder.method}，提前{event.reminder.advanceDays}天）
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">今天没有安排的事件</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getEventsForDay(events: Event[], date: Date): Event[] {
  return events.filter((event) => isSameDay(new Date(event.date), date));
}
