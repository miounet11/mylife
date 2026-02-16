// 事件日历组件
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';

interface Event {
  id: string;
  date: Date;
  title: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family';
  impact: 'positive' | 'negative' | 'neutral';
  reminder?: {
    enabled: boolean;
    advanceDays: number;
    method: 'app' | 'email' | 'sms';
  };
}

export default function EventCalendar() {
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
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'yyyy年 MMMM')}
          </h2>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-500">
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
          const hasEvents = getEventsForDay(day).length > 0;
          const isTodayDate = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`
                aspect-square border rounded-lg p-1 cursor-pointer transition
                ${isTodayDate ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-400'}
                ${isSelected ? 'border-purple-600 bg-purple-100 ring-2 ring-purple-300' : ''}
                ${hasEvents ? 'font-semibold' : ''}
              `}
            >
              <div className="text-center">
                <div className={`text-sm ${isTodayDate ? 'text-purple-600 font-bold' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
                {hasEvents && (
                  <div className="mt-1 flex justify-center space-x-1">
                    {getEventsForDay(day).slice(0, 3).map((event, i) => (
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
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-3">
            {format(selectedDate, 'yyyy年 MMMM dd日')} 的事件
          </h3>
          <div className="space-y-2">
            {getEventsForDay(selectedDate).length > 0 ? (
              getEventsForDay(selectedDate).map((event) => (
                <div key={event.id} className="bg-white rounded-lg p-3 border-2 border-purple-200">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">
                      {event.type === 'career' && '👔'}
                      {event.type === 'wealth' && '💰'}
                      {event.type === 'marriage' && '❤️'}
                      {event.type === 'health' && '💪'}
                      {event.type === 'family' && '👥'}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      {event.reminder && event.reminder.enabled && (
                        <div className="mt-2 text-xs text-purple-600">
                          ✓ 已设置提醒（{event.reminder.method}，提前{event.reminder.advanceDays}分钟）
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">今天没有安排的事件</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 模拟获取事件
function getEventsForDay(date: Date): Event[] {
  const events: Event[] = [
    {
      id: '1',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
      type: 'career',
      icon: '👔',
      title: '面试技术总监职位',
      description: '根据您的八字，今天事业运上升，面试成功率90%',
      impact: 'positive',
      reminder: {
        enabled: true,
        advanceDays: 60,
        method: 'app',
      },
    },
    {
      id: '2',
      date: new Date(new Date().getFullYear(), new Date().getMonth(), 20),
      type: 'wealth',
      icon: '💰',
      title: '投资到期',
      description: '投资科技股到期，预期收益率25%',
      impact: 'positive',
      reminder: {
        enabled: true,
        advanceDays: 1440,
        method: 'email',
      },
    },
    {
      id: '3',
      date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5),
      type: 'marriage',
      icon: '❤️',
      title: '第一次约会',
      description: '根据您的八字，下月桃花运旺，适合恋爱',
      impact: 'neutral',
      reminder: {
        enabled: true,
        advanceDays: 60,
        method: 'app',
      },
    },
  ];

  return events.filter(event => isSameDay(event.date, date));
}
