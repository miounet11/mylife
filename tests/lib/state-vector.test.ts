import { describe, expect, test } from '@jest/globals';
import { buildReferenceIntelligencePack } from '@/lib/reference-intelligence';
import { buildStateVectorData } from '@/lib/state-vector';

describe('state vector', () => {
  test('builds current, history and forecast from kline data', () => {
    const stateVector = buildStateVectorData({
      klineData: [
        { year: 2025, career: 60, wealth: 55, marriage: 50, health: 58 },
        { year: 2026, career: 75, wealth: 70, marriage: 68, health: 66 },
        { year: 2027, career: 80, wealth: 74, marriage: 71, health: 69 },
      ],
      advice: {
        directions: ['东方'],
        timing: ['2026-2027'],
        career: { timing: '2026-2027' },
        marriage: { general: '关系更看节奏', timing: '下半年' },
      },
      dayun: {
        currentDayun: {
          quality: 'good',
        },
      },
      now: new Date('2026-03-12T00:00:00.000Z'),
    });

    expect(stateVector.current.tianShi).toBeGreaterThan(7);
    expect(stateVector.current.diLi).toBeGreaterThan(6);
    expect(stateVector.current.renHe).toBeGreaterThan(7);
    expect(stateVector.history?.[0]?.year).toBe(2025);
    expect(stateVector.forecast?.[0]?.year).toBe(2026);
  });

  test('applies reference pack adjustments to current and forecast', () => {
    const referencePack = buildReferenceIntelligencePack({
      sourceDocuments: [
        {
          id: 'src_1',
          sourceType: 'site',
          platform: 'zhihu',
          sourceId: 'zhihu-search',
          canonicalUrl: 'https://www.zhihu.com/question/1',
          title: '城市迁移和办公环境适合稳步推进',
          author: null,
          publishedAt: '2026-03-12T00:00:00.000Z',
          language: 'zh-CN',
          summary: '城市、定居、办公环境和风水更利于稳定布局。',
          tags: ['城市', '定居', '办公环境', '适合'],
          rawMeta: {},
          rightsStatus: 'platform_restricted',
          licenseName: null,
          reusePolicy: null,
          contentHash: null,
          createdAt: '2026-03-12T00:00:00.000Z',
          updatedAt: '2026-03-12T00:00:00.000Z',
        },
      ],
    });

    const withoutReference = buildStateVectorData({
      klineData: [{ year: 2026, career: 70, wealth: 64, marriage: 62, health: 65 }],
      now: new Date('2026-03-12T00:00:00.000Z'),
    });

    const withReference = buildStateVectorData({
      klineData: [{ year: 2026, career: 70, wealth: 64, marriage: 62, health: 65 }],
      referencePack,
      now: new Date('2026-03-12T00:00:00.000Z'),
    });

    expect(withReference.current.diLi).toBeGreaterThan(withoutReference.current.diLi);
  });
});
