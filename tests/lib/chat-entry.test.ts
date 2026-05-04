import { describe, expect, test } from '@jest/globals';
import { buildChatHref, buildReportFollowupQuestion } from '@/lib/chat-entry';

describe('chat entry', () => {
  test('builds chat href with strategy metadata', () => {
    expect(buildChatHref({
      reportId: 'report_123',
      eventId: 'event_456',
      intent: 'event-review',
      question: '继续拆解',
      source: 'knowledge_article:career-plan',
      ctaStrategyKey: 'knowledge_to_self_judgment',
      sourceFamily: 'knowledge_article',
    })).toBe(
      '/chat?reportId=report_123&eventId=event_456&intent=event-review&question=%E7%BB%A7%E7%BB%AD%E6%8B%86%E8%A7%A3&source=knowledge_article%3Acareer-plan&ctaStrategyKey=knowledge_to_self_judgment&sourceFamily=knowledge_article'
    );
  });

  test('omits empty chat href query params', () => {
    expect(buildChatHref({
      reportId: ' report_123 ',
      source: '  ',
      ctaStrategyKey: '',
      sourceFamily: null,
    })).toBe('/chat?reportId=report_123');
  });

  test('prefers first action suggestion in report followup question', () => {
    expect(buildReportFollowupQuestion({
      actionSuggestions: [
        {
          key: 'next-step',
          title: '先补关键条件',
          description: 'desc',
          reason: 'reason',
          date: '2026-05-01',
          type: 'career',
          impact: 'positive',
          reminderAdvanceDays: 3,
          source: 'scenario',
        },
      ],
    })).toContain('先补关键条件');
  });
});
