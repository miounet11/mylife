// 事件卡片组件
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Check, Calendar, Clock, AlertTriangle, Edit, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import {
  formatEventDateKey,
  getEstimatedPastEventPrompt,
  type EventViewModel,
} from '@/lib/event-view';
import type { DisasterWarning } from '@/lib/user-types';

type Event = EventViewModel & {
  predictionAccuracy?: boolean;
  wasAccurate?: boolean;
  dateRange?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
};

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
    other: '📌',
  };

  const typeLabels = {
    career: '事业',
    wealth: '财富',
    marriage: '感情',
    health: '健康',
    family: '家庭',
    other: '其他',
  };

  const impactBorderColors: Record<'positive' | 'negative' | 'neutral', string> = {
    positive: 'border-l-[color:var(--data-up)]',
    negative: 'border-l-[color:var(--data-down)]',
    neutral: 'border-l-[color:var(--ink-5)]',
  };

  const impactLabels = {
    positive: '积极',
    negative: '消极',
    neutral: '中性',
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'rounded-[var(--radius-md)] border border-[color:var(--hairline)] border-l-4 bg-[color:var(--paper)] p-4 transition',
        impactBorderColors[event.impact],
        isHovered && 'shadow-[var(--shadow-card)]',
      )}
    >
      {/* 事件头部 */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="text-xl leading-none">{typeIcons[event.type]}</span>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold leading-snug text-[color:var(--ink-1)]">
              {event.title}
            </h4>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-1.5 text-[10px] font-bold text-[color:var(--brand-strong)]">
                {typeLabels[event.type]}
              </span>
              {event.impact === 'positive' && (
                <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.08)] px-1.5 text-[10px] font-bold text-[color:var(--data-up)]">
                  {impactLabels[event.impact]}
                </span>
              )}
              {event.impact === 'negative' && (
                <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[rgba(189,76,66,0.20)] bg-[rgba(189,76,66,0.08)] px-1.5 text-[10px] font-bold text-[color:var(--data-down)]">
                  {impactLabels[event.impact]}
                </span>
              )}
              {event.reminder?.enabled && (
                <span className="inline-flex h-5 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--env)] bg-[color:var(--env-soft)] px-1.5 text-[10px] font-bold text-[color:var(--env)]">
                  <Bell className="h-2.5 w-2.5" />
                  已提醒
                </span>
              )}
              {event.isEstimatedPastEvent && (
                <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-1.5 text-[10px] font-bold text-[color:var(--signal-strong)]">
                  日期待补
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex shrink-0 items-center gap-0.5">
          {onToggleReminder && (
            <button
              onClick={() => onToggleReminder(event.id)}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--ink-4)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--brand-strong)]"
              title={event.reminder?.enabled ? '关闭提醒' : '开启提醒'}
            >
              <Bell
                className={cn(
                  'h-3.5 w-3.5',
                  event.reminder?.enabled && 'text-[color:var(--brand-strong)]',
                )}
              />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--ink-4)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--brand-strong)]"
              title="编辑"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event.id)}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--ink-4)] transition hover:bg-[color:var(--alert-soft)] hover:text-[color:var(--alert)]"
              title="删除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 日期和时间 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-[color:var(--ink-4)]">
        <div className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{event.dateKey ? formatEventDateKey(event.dateKey) : formatDateTime(event.date)}</span>
        </div>
        {event.dateRange && (
          <>
            <span className="text-[color:var(--ink-6)]">·</span>
            <div className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{event.dateRange}</span>
            </div>
          </>
        )}
      </div>

      {event.isEstimatedPastEvent && (
        <div className="mb-3 rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--signal-strong)]">
          <div className="flex items-start gap-1.5">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>{getEstimatedPastEventPrompt(event)}</div>
          </div>
        </div>
      )}

      {/* 严重程度 */}
      {event.severity && (
        <div className="mb-3 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--alert)]" />
          <span className="text-xs font-bold text-[color:var(--ink-2)]">
            {event.severity === 'critical' && '严重'}
            {event.severity === 'high' && '高'}
            {event.severity === 'medium' && '中等'}
            {event.severity === 'low' && '轻'}
          </span>
        </div>
      )}

      {/* 描述 */}
      <p className="mb-3 text-sm leading-6 text-[color:var(--ink-3)]">{event.description}</p>

      {/* 预测准确度 */}
      {event.predictionAccuracy !== undefined && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[color:var(--ink-5)]">
          <Check
            className={cn(
              'h-3 w-3',
              event.wasAccurate
                ? 'text-[color:var(--data-up)]'
                : 'text-[color:var(--data-down)]',
            )}
          />
          <span>报告预测</span>
          <span className="text-[color:var(--ink-6)]">·</span>
          <span
            className={cn(
              'font-bold',
              event.wasAccurate
                ? 'text-[color:var(--data-up)]'
                : 'text-[color:var(--data-down)]',
            )}
          >
            {event.wasAccurate ? '准确' : '不准确'}
          </span>
        </div>
      )}

      {/* 提醒信息 */}
      {event.reminder?.enabled && (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
          <div className="flex items-center justify-between gap-3 text-xs text-[color:var(--ink-4)]">
            <div className="flex min-w-0 items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-strong)]" />
              <span className="truncate">
                已设置（{event.reminder.method}，提前 {event.reminder.advanceDays} 分钟）
              </span>
            </div>
            <button
              onClick={() => onToggleReminder?.(event.id)}
              className="shrink-0 font-semibold text-[color:var(--brand-strong)] hover:text-[color:var(--brand-deep)]"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 化灾预警卡片
export function DisasterWarningCard({ warning }: { warning: DisasterWarning }) {
  const severityColors: Record<string, string> = {
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
              {warning.protectionMeasures.immediate.map((measure: string, i: number) => (
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
              {warning.protectionMeasures.shortTerm.map((measure: string, i: number) => (
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
              {warning.protectionMeasures.longTerm.map((measure: string, i: number) => (
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
                      {warning.protectionMeasures.fortuneEnhancements.rituals.map((ritual: string, i: number) => (
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
                      {warning.protectionMeasures.fortuneEnhancements.amulets.map((amulet: string, i: number) => (
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
                      {warning.protectionMeasures.fortuneEnhancements.colors.map((color: string, i: number) => (
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
                      {warning.protectionMeasures.fortuneEnhancements.directions.map((direction: string, i: number) => (
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
                      {warning.protectionMeasures.fortuneEnhancements.dates.map((date: Date, i: number) => (
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
