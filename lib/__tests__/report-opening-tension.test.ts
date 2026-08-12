import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildProReportView } from '@/lib/report-pro-view';
import { buildReportOpeningTension } from '@/lib/report-opening-tension';
import { pickWeeklyCalibrationItems } from '@/lib/weekly-calibration';
import { extractConversationStory } from '@/lib/experience-kernel/chat-memory-from-context';

describe('report opening tension', () => {
  it('builds one tension + prefilled ask from live 用神', () => {
    const view = buildProReportView({
      result: {
        basic: {
          dayMaster: '甲',
          pillars: [
            { celestialStem: '丙', earthlyBranch: '戌' },
            { celestialStem: '辛', earthlyBranch: '丑' },
            { celestialStem: '甲', earthlyBranch: '辰' },
            { celestialStem: '乙', earthlyBranch: '丑' },
          ],
        },
        pattern: { type: '正格', description: '丑月甲木失令，宜扶抑取用。' },
        advice: { yongShen: ['水', '木'], jiShen: ['金', '土'] },
        analysis: { opening: '结构已成型，先看扶抑主线。' },
        fortune: { currentDaYun: '壬寅大运' },
        confidence: { overallScore: 60 },
      },
    });
    const tension = buildReportOpeningTension(view, 'rep_test');
    assert.ok(tension.headline.length > 8);
    assert.ok(tension.askHref.includes('/chat?'));
    assert.ok(tension.askHref.includes('question='));
    assert.ok(tension.askQuestion.length > 20);
    assert.ok(tension.doNow.length > 4);
  });
});

describe('weekly calibration', () => {
  it('picks 3–21 day unmarked events', () => {
    const now = new Date(2026, 7, 13);
    const items = pickWeeklyCalibrationItems(
      [
        { id: 'a', title: '投递', date: '2026-08-01', userFeedback: {} },
        { id: 'b', title: '已标', date: '2026-08-01', userFeedback: { wasAccurate: true } },
        { id: 'c', title: '太新', date: '2026-08-12' },
        { id: 'd', title: '太旧', date: '2026-06-01' },
      ],
      now,
    );
    assert.equal(items.length, 1);
    assert.equal(items[0]!.id, 'a');
    assert.ok(items[0]!.daysAgo >= 3);
  });
});

describe('conversation story', () => {
  it('retells last turns as user/advisor story', () => {
    const story = extractConversationStory([
      { role: 'user', content: '我该不该跳槽？' },
      {
        role: 'assistant',
        content: '**当前结论** 先稳住再试探。\n**还想问**\n- 这个岗位是顺主用神还是刚忌神？',
      },
      { role: 'user', content: '那这个 offer 呢？' },
      { role: 'assistant', content: '先看现金流能不能撑过 90 天。' },
    ]);
    assert.match(story, /用户问：我该不该跳槽/);
    assert.match(story, /顾问答：先稳住/);
    assert.match(story, /未解|offer|现金流/);
    assert.match(story, /连续故事/);
  });
});
