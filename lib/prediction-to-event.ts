/**
 * 预测回访 → 事件本 打通
 */

import type { Prediction, PredictionOutcome } from '@/lib/predictions/types';
import type { EventViewType, EventViewImpact } from '@/lib/event-view';

const CAT_TO_EVENT: Record<Prediction['category'], EventViewType> = {
  career: 'career',
  wealth: 'wealth',
  marriage: 'marriage',
  health: 'health',
  timing: 'other',
};

const OUTCOME_LABEL: Record<Exclude<PredictionOutcome, 'pending'>, string> = {
  fulfilled: '命中',
  partial: '部分命中',
  missed: '未命中',
};

export function predictionCategoryToEventType(cat: Prediction['category']): EventViewType {
  return CAT_TO_EVENT[cat] || 'other';
}

export function outcomeToImpact(outcome: Exclude<PredictionOutcome, 'pending'>): EventViewImpact {
  if (outcome === 'fulfilled') return 'positive';
  if (outcome === 'missed') return 'negative';
  return 'neutral';
}

/** 构造写入 /api/events 或 localStorage 的载荷 */
export function buildEventFromPrediction(
  prediction: Prediction,
  outcome: Exclude<PredictionOutcome, 'pending'>,
  feedback?: string
) {
  const label = OUTCOME_LABEL[outcome];
  const title = `预测${label}：${prediction.statement.slice(0, 36)}${
    prediction.statement.length > 36 ? '…' : ''
  }`;
  const description = [
    `原预测：${prediction.statement}`,
    prediction.window ? `窗口：${prediction.window}` : '',
    `到期：${prediction.dueDate}`,
    `回访结果：${label}`,
    feedback ? `说明：${feedback}` : '',
    prediction.evidence ? `依据：${prediction.evidence}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    type: predictionCategoryToEventType(prediction.category),
    title,
    date: new Date().toISOString().slice(0, 10),
    description,
    impact: outcomeToImpact(outcome),
    reminderEnabled: false,
    reminderAdvanceDays: 0,
    reminderMethod: 'app' as const,
    source: 'prediction_feedback',
    fortuneAnalysis: {
      reportId: prediction.reportId,
      source: 'prediction_feedback',
      predictionId: prediction.id,
      outcome,
      suggestionKey: prediction.id,
      title: prediction.statement.slice(0, 80),
      occurrenceWindow: prediction.window || prediction.dueDate,
    },
    userFeedback: {
      wasAccurate: outcome === 'fulfilled' ? true : outcome === 'missed' ? false : undefined,
      userNotes: feedback || label,
      answeredAt: new Date().toISOString(),
    },
  };
}

export function eventsHrefForReport(reportId?: string) {
  return reportId ? `/events?reportId=${encodeURIComponent(reportId)}` : '/events';
}
