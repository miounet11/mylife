import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFoundationChatStarters } from '@/lib/life-foundation/chat-starters';
import type { LifeFoundationSnapshot } from '@/lib/life-foundation/types';

function miniSnap(partial: Partial<LifeFoundationSnapshot>): LifeFoundationSnapshot {
  return {
    version: 1,
    overall: 40,
    grade: 'building',
    gradeLabel: '底座搭建中',
    fortuneId: 'f1',
    fortuneName: '测',
    hasReport: true,
    layers: [],
    nextSteps: [
      {
        priority: 20,
        layerId: 'life_qa',
        title: '最大困惑',
        reason: '补现状',
        href: '/profile/foundation?wizard=1',
        ctaLabel: '填写',
        itemId: 'qa_goals',
      },
    ],
    astro: {
      sunSign: null,
      sunSignEn: null,
      chineseZodiac: null,
      chineseZodiacYear: null,
      moonSign: null,
      risingSign: null,
      element: null,
      modality: null,
      source: 'none',
    },
    toolSignals: [],
    appsHighlights: {},
    milestones: [],
    milestoneProgress: { done: 0, total: 7, percent: 0 },
    stats: {
      filledItems: 0,
      totalCoreItems: 10,
      eventCount: 0,
      toolRunCount: 0,
      documentCount: 0,
      chatProgressiveCount: 0,
    },
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe('foundation chat starters', () => {
  it('builds starters from life_qa gap', () => {
    const starters = buildFoundationChatStarters(miniSnap({}), { hasReport: true });
    assert.ok(starters.length >= 1);
    assert.ok(starters.some((s) => /最大困惑|life context/i.test(s.text)));
  });

  it('prioritizes hehun followup when highlight exists', () => {
    const starters = buildFoundationChatStarters(
      miniSnap({
        appsHighlights: {
          hehun: { score: 72, band: '可经营', headline: '甲与乙：综合 72/100 · 可经营' },
        },
      }),
      { hasReport: true },
    );
    assert.equal(starters[0]?.id, 'hehun_followup');
  });
});
