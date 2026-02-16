// 事件卡片组件
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Check, X, Calendar, Clock, AlertTriangle, TrendingUp, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';

interface Event {
  id: string;
  date: Date;
  title: string;
  type: 'career' | 'wealth' | 'marriage' | 'health' | 'family';
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  reminder?: {
    enabled: boolean;
    advanceDays: number;
    method: 'app' | 'email' | 'sms';
  };
  predictionAccuracy?: boolean;
  wasAccurate?: boolean;
  dateRange?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface EventCardProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onToggleReminder?: (eventId: string) => void;
}

export default function EventCard({ event, onEdit, onDelete, onToggleReminder }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const typeIcons = {
    career: '👔',
    wealth: '💰',
    marriage: '❤️',
    health: '💪',
    family: '👥',
  };

  const typeLabels = {
    career: '事业',
    wealth: '财富',
    marriage: '感情',
    health: '健康',
    family: '家庭',
  };

  const impactColors = {
    positive: 'border-green-400 bg-green-50',
    negative: 'border-red-400 bg-red-50',
    neutral: 'border-gray-400 bg-gray-50',
  };

  const impactLabels = {
    positive: '积极',
    negative: '消极',
    neutral: '中性',
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-xl',
      isHovered && 'scale-105',
      impactColors[event.impact]
    )}>
      <CardContent className="p-4">
        {/* 事件头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{typeIcons[event.type]}</span>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-lg">{event.title}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                  {typeLabels[event.type]}
                </span>
                {event.impact === 'positive' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    {impactLabels[event.impact]}
                  </span>
                )}
                {event.impact === 'negative' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                    {impactLabels[event.impact]}
                  </span>
                )}
                {event.reminder?.enabled && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    <Bell className="w-3 h-3 inline mr-1" />
                    已提醒
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-1">
            {onToggleReminder && (
              <button
                onClick={() => onToggleReminder(event.id)}
                className="p-2 hover:bg-purple-100 rounded-lg transition"
                title={event.reminder?.enabled ? '关闭提醒' : '开启提醒'}
              >
                <Bell className={`w-4 h-4 ${event.reminder?.enabled ? 'text-purple-600' : 'text-gray-400'}`} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(event)}
                className="p-2 hover:bg-purple-100 rounded-lg transition"
                title="编辑"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="p-2 hover:bg-red-100 rounded-lg transition"
                title="删除"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* 日期和时间 */}
        <div className="flex items-center space-x-3 mb-3 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDateTime(event.date)}</span>
          </div>
          {event.dateRange && (
            <>
              <span className="text-gray-400">·</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{event.dateRange}</span>
              </div>
            </>
          )}
        </div>

        {/* 严重程度 */}
        {event.severity && (
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-900">
                {event.severity === 'critical' && '严重'}
                {event.severity === 'high' && '高'}
                {event.severity === 'medium' && '中等'}
                {event.severity === 'low' && '轻'}
              </span>
            </div>
          </div>
        )}

        {/* 描述 */}
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {event.description}
        </p>

        {/* 预测准确度 */}
        {event.predictionAccuracy !== undefined && (
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span className="flex items-center space-x-1">
              <Check className={`w-3 h-3 ${event.wasAccurate ? 'text-green-600' : 'text-red-600'}`} />
              <span>命理预测</span>
            </span>
            <span>·</span>
            <span className="font-semibold">
              {event.wasAccurate ? '准确' : '不准确'}
            </span>
          </div>
        )}

        {/* 提醒信息 */}
        {event.reminder?.enabled && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <span>
                  已设置提醒（{event.reminder.method}，提前{event.reminder.advanceDays}分钟）
                </span>
              </div>
              <button
                onClick={() => onToggleReminder(event.id)}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 化灾预警卡片
export function DisasterWarningCard({ warning }: { warning: any }) {
  const severityColors = {
    low: 'border-yellow-400 bg-yellow-50',
    medium: 'border-orange-400 bg-orange-50',
    high: 'border-red-400 bg-red-50',
    critical: 'border-red-600 bg-red-100',
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-xl',
      severityColors[warning.severity || 'medium']
    )}>
      <CardContent className="p-4">
        {/* 标题 */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg mb-1">
              ⚠️ {warning.type}化灾预警
            </h4>
            <p className="text-sm text-gray-600">
              {warning.fortunePrediction.description}
            </p>
          </div>
        </div>

        {/* 时间范围 */}
        <div className="mb-3 p-2 bg-white rounded border border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {warning.startDate} 至 {warning.endDate}
            </span>
          </div>
        </div>

        {/* 严重程度 */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-sm text-gray-600">严重程度：</span>
          <span className={cn(
            "text-sm font-bold px-3 py-1 rounded-full",
            warning.severity === 'critical' && 'bg-red-600 text-white',
            warning.severity === 'high' && 'bg-red-500 text-white',
            warning.severity === 'medium' && 'bg-orange-500 text-white',
            warning.severity === 'low' && 'bg-yellow-500 text-white'
          )}>
            {warning.severity === 'critical' && '严重'}
            {warning.severity === 'high' && '高'}
            {warning.severity === 'medium' && '中等'}
            {warning.severity === 'low' && '轻'}
          </span>
        </div>

        {/* 防护措施 */}
        <div className="space-y-3">
          {/* 立即措施 */}
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <h5 className="font-semibold text-red-900 mb-2 flex items-center">
              <span>🚨</span>
              <span className="ml-2">立即采取的措施</span>
            </h5>
            <ul className="space-y-1">
              {warning.protectionMeasures.immediate.map((measure, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">✓</span>
                  <span className="text-sm text-red-900">{measure}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 短期措施 */}
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <h5 className="font-semibold text-orange-900 mb-2 flex items-center">
              <span>⚠️</span>
              <span className="ml-2">短期措施</span>
            </h5>
            <ul className="space-y-1">
              {warning.protectionMeasures.shortTerm.map((measure, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-orange-600 mr-2 mt-1">✓</span>
                  <span className="text-sm text-orange-900">{measure}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 长期措施 */}
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <h5 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <span>📅</span>
              <span className="ml-2">长期措施</span>
            </h5>
            <ul className="space-y-1">
              {warning.protectionMeasures.longTerm.map((measure, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-yellow-600 mr-2 mt-1">✓</span>
                  <span className="text-sm text-yellow-900">{measure}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 增运建议 */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <h5 className="font-semibold text-purple-900 mb-2 flex items-center">
              <span>✨</span>
              <span className="ml-2">增运建议</span>
            </h5>
            <div className="space-y-2">
              {/* 仪式 */}
              {warning.protectionMeasures.fortuneEnhancements.rituals.length > 0 && (
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 mt-1">🔥</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-purple-900">仪式</span>
                    <div className="mt-1 space-x-1">
                      {warning.protectionMeasures.fortuneEnhancements.rituals.map((ritual, i) => (
                        <span key={i} className="text-xs text-purple-700">· {ritual}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 护身符 */}
              {warning.protectionMeasures.fortuneEnhancements.amulets.length > 0 && (
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 mt-1">🛡️</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-purple-900">护身符</span>
                    <div className="mt-1 space-x-1">
                      {warning.protectionMeasures.fortuneEnhancements.amulets.map((amulet, i) => (
                        <span key={i} className="text-xs text-purple-700">· {amulet}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 颜色 */}
              {warning.protectionMeasures.fortuneEnhancements.colors.length > 0 && (
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 mt-1">🎨</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-purple-900">颜色</span>
                    <div className="mt-1 space-x-1">
                      {warning.protectionMeasures.fortuneEnhancements.colors.map((color, i) => (
                        <span key={i} className="text-xs text-purple-700">· 宜穿{color}系衣物</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 方位 */}
              {warning.protectionMeasures.fortuneEnhancements.directions.length > 0 && (
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 mt-1">🧭</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-purple-900">方位</span>
                    <div className="mt-1 space-x-1">
                      {warning.protectionMeasures.fortuneEnhancements.directions.map((direction, i) => (
                        <span key={i} className="text-xs text-purple-700">· 宜往{direction}发展</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 吉日 */}
              {warning.protectionMeasures.fortuneEnhancements.dates && warning.protectionMeasures.fortuneEnhancements.dates.length > 0 && (
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 mt-1">📅</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-purple-900">吉日</span>
                    <div className="mt-1 space-x-1">
                      {warning.protectionMeasures.fortuneEnhancements.dates.map((date, i) => (
                        <span key={i} className="text-xs text-purple-700">· {formatDateTime(date)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
