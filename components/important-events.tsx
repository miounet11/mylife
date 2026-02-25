// 重要事件组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Bell, Edit, Trash2, Plus } from 'lucide-react';
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

interface EventCardProps {
  event: Event;
  typeIcons: Record<Event['type'], string>;
  typeLabels: Record<Event['type'], string>;
  impactColors: Record<Event['impact'], string>;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleReminder?: (eventId: string) => void;
}

export default function ImportantEvents({ events = [], onAdd, onEdit, onDelete, onToggleReminder }: ImportantEventsProps) {
  const typeIcons = {
    career: '👔',
    wealth: '💰',
    marriage: '❤️',
    health: '💪',
    family: '👥',
    other: '📋',
  };

  const typeLabels = {
    career: '事业',
    wealth: '财富',
    marriage: '感情',
    health: '健康',
    family: '家庭',
    other: '其他',
  };

  const impactColors = {
    positive: 'border-emerald-300',
    negative: 'border-rose-300',
    neutral: 'border-slate-300',
  };

  const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card className="bg-white border border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">重要事件</CardTitle>
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>添加事件</span>
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                typeIcons={typeIcons}
                typeLabels={typeLabels}
                impactColors={impactColors}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleReminder={onToggleReminder}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded border border-dashed border-slate-300">
              <p className="text-slate-600 text-base">还没有重要事件</p>
              <p className="text-slate-400 text-sm mt-2">点击“添加事件”开始记录您的人生重要节点</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event, typeIcons, typeLabels, impactColors, onEdit, onDelete, onToggleReminder }: EventCardProps) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${impactColors[event.impact]}`}>
      {/* 事件头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{typeIcons[event.type]}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-base">{event.title}</h4>
            <p className="text-xs text-slate-500 mb-1">{typeLabels[event.type]}</p>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(event.date)}</span>
              {event.time && (
                <>
                  <span className="text-slate-400">·</span>
                  <Clock className="w-4 h-4" />
                  <span>{event.time}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          {onToggleReminder && (
            <button
              onClick={() => onToggleReminder(event.id)}
              className={`p-2 rounded-lg transition ${
                event.reminder?.enabled 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={event.reminder?.enabled ? '关闭提醒' : '开启提醒'}
            >
              <Bell className={`w-4 h-4 ${event.reminder?.enabled ? 'fill-current' : ''}`} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              title="编辑"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 transition"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 事件描述 */}
      <p className="text-slate-700 text-sm leading-relaxed mb-3">{event.description || '暂无描述'}</p>

      {/* 提醒信息 */}
      {event.reminder?.enabled && (
        <div className="bg-slate-50 rounded p-2 mb-3 border border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700 font-medium">已设置提醒</span>
            <span className="text-slate-600">
              {event.reminder.method === 'app' && '应用通知'}
              {event.reminder.method === 'email' && '邮件'}
              {event.reminder.method === 'sms' && '短信'}
              {` · 提前${event.reminder.advanceDays}天`}
            </span>
          </div>
        </div>
      )}

      {/* 预测准确度 */}
      {event.predictionAccuracy !== undefined && (
        <div className="flex items-center space-x-2 text-xs text-slate-600 border-t border-slate-200 pt-2">
          <span>命理预测：</span>
          <span className={`font-semibold ${event.wasAccurate ? 'text-green-600' : 'text-red-600'}`}>
            {event.wasAccurate ? '✓ 准确' : '✗ 不准确'}
          </span>
        </div>
      )}
    </div>
  );
}
