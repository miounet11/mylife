// 重要事件组件
'use client';

import { useState } from 'react';
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

export default function ImportantEvents({ events = [], onAdd, onEdit, onDelete, onToggleReminder }: ImportantEventsProps) {
  const [selectedType, setSelectedType] = useState<string>('all');

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
    positive: 'border-green-400 bg-green-50',
    negative: 'border-red-400 bg-red-50',
    neutral: 'border-gray-400 bg-gray-50',
  };

  const filteredEvents = selectedType === 'all' 
    ? events 
    : events.filter(event => event.type === selectedType);

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📅</span>
              <span className="text-2xl font-bold text-gray-900">重要事件</span>
            </div>
          </CardTitle>
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>添加事件</span>
          </button>
        </div>

        {/* 类型筛选 */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
              selectedType === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-purple-100'
            }`}
          >
            全部
          </button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition flex items-center space-x-1 ${
                selectedType === key 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-purple-100'
              }`}
            >
              <span>{typeIcons[key]}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                typeIcons={typeIcons}
                impactColors={impactColors}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleReminder={onToggleReminder}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">还没有重要事件</p>
              <p className="text-gray-400 text-sm mt-2">点击"添加事件"开始记录您的人生重要节点</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({ event, typeIcons, impactColors, onEdit, onDelete, onToggleReminder }: any) {
  return (
    <div className={`bg-white rounded-xl border-2 p-4 hover:shadow-lg transition transform hover:scale-[1.02] ${impactColors[event.impact]}`}>
      {/* 事件头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{typeIcons[event.type]}</span>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg">{event.title}</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(event.date)}</span>
              {event.time && (
                <>
                  <span className="text-gray-400">·</span>
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
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
              }`}
              title={event.reminder?.enabled ? '关闭提醒' : '开启提醒'}
            >
              <Bell className={`w-4 h-4 ${event.reminder?.enabled ? 'fill-current' : ''}`} />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-purple-100 transition"
              title="编辑"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 transition"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 事件描述 */}
      <p className="text-gray-700 text-sm leading-relaxed mb-3">{event.description}</p>

      {/* 提醒信息 */}
      {event.reminder?.enabled && (
        <div className="bg-purple-50 rounded-lg p-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-700 font-medium">已设置提醒</span>
            <span className="text-purple-600">
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
        <div className="flex items-center space-x-2 text-xs text-gray-600 border-t border-gray-200 pt-2">
          <span>命理预测：</span>
          <span className={`font-semibold ${event.wasAccurate ? 'text-green-600' : 'text-red-600'}`}>
            {event.wasAccurate ? '✓ 准确' : '✗ 不准确'}
          </span>
        </div>
      )}
    </div>
  );
}
