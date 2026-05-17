'use client';

import { useState } from 'react';
import {
  buildChatEventDraft,
  type ChatExperienceContext,
} from '@/lib/chat-context';
import type { SuggestedEventDraft } from '@/components/ai-assistant-chat/chat-helpers';

interface UseChatEventsParams {
  context: ChatExperienceContext | null;
  reportId: string;
  source: string;
  setError: (value: string) => void;
}

export function useChatEvents({ context, reportId, source, setError }: UseChatEventsParams) {
  const [savingEventKey, setSavingEventKey] = useState<string | null>(null);
  const [savedEventKeys, setSavedEventKeys] = useState<string[]>([]);

  const saveEventPayload = async (eventKey: string, payload: Record<string, unknown>) => {
    if (savingEventKey) return;
    setSavingEventKey(eventKey);
    setError('');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '保存事件失败');
        return;
      }
      setSavedEventKeys((current) => (current.includes(eventKey) ? current : [...current, eventKey]));
    } catch {
      setError('网络异常，保存事件失败');
    } finally {
      setSavingEventKey(null);
    }
  };

  const handleSaveSuggestedEvent = (item: SuggestedEventDraft) => {
    void saveEventPayload(`suggestion:${item.key}`, {
      type: item.type,
      title: item.title,
      date: item.date,
      description: item.description,
      impact: item.impact,
      reminderEnabled: true,
      reminderAdvanceDays: item.reminderAdvanceDays,
      reminderMethod: 'app',
      source: 'chat_message',
      page: '/chat',
      attributionSource: source || undefined,
      fortuneAnalysis: {
        source: 'chat_message',
        reportId: context?.report?.id || reportId || undefined,
        attributionSource: source || undefined,
        suggestionKey: item.key,
        reason: item.reason,
        title: item.title,
      },
      followUpAdvice: {
        shortTerm: item.reason,
        longTerm: '事件发生后回到聊天页继续复盘，校验这次判断与现实偏差。',
      },
    });
  };

  const handleSaveMessageEvent = (question: string, answer: string, key: string) => {
    const draft = buildChatEventDraft({
      question,
      answer,
      context,
    });

    void saveEventPayload(`message:${key}`, {
      ...draft,
      reminderEnabled: true,
      reminderMethod: 'app',
      source: 'chat_message',
      page: '/chat',
      attributionSource: source || undefined,
    });
  };

  return {
    savingEventKey,
    savedEventKeys,
    handleSaveSuggestedEvent,
    handleSaveMessageEvent,
  };
}
