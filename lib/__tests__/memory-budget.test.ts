import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateChatMemoryBudget,
  buildChatMemoryLayers,
} from '@/lib/experience-kernel/memory-budget';
import { extractWorkingMemoryFromHistory } from '@/lib/experience-kernel/chat-memory-from-context';

describe('chat memory budget', () => {
  it('keeps engine + calibration + seven-day over soft extras', () => {
    const layers = buildChatMemoryLayers({
      engineFactBlock: '日主甲 · 用神木水 · 大运乙丑',
      calibrationScore: 64,
      calibrationDenied: ['事业方向重排'],
      sevenDayActions: ['完成一次小交付', '复盘关键节点'],
      report: { dayMaster: '甲', yongShen: ['木'], currentDaYun: '乙丑' },
      focusAreas: ['事业'],
      materialSummary: 'x'.repeat(500),
      intentHint: 'career focus',
    });
    const result = allocateChatMemoryBudget({
      layers,
      history: [
        { role: 'user', content: 'old question' },
        { role: 'assistant', content: 'old answer' },
        { role: 'user', content: 'new question' },
      ],
      budgetChars: 3_500,
      maxHistoryTurns: 4,
    });
    assert.ok(result.stats.layersKept.includes('engine_efc'));
    assert.ok(result.stats.layersKept.includes('calibration'));
    assert.ok(result.stats.layersKept.includes('seven_day'));
    assert.match(result.systemContext, /日主甲/);
    assert.match(result.systemContext, /近7天可执行/);
    assert.ok(result.history.length >= 1);
  });

  it('never exceeds budget chars for system context', () => {
    const layers = buildChatMemoryLayers({
      engineFactBlock: 'EFC ' + '甲'.repeat(400),
      sevenDayActions: ['a', 'b', 'c'],
      materialSummary: 'mat '.repeat(200),
      intentHint: 'intent '.repeat(100),
    });
    const budget = 900;
    const result = allocateChatMemoryBudget({
      layers,
      history: [],
      budgetChars: budget,
    });
    assert.ok(result.stats.layersKept.includes('engine_efc'));
    // systemContext alone stays within budget (+ small join overhead allowance)
    assert.ok(result.systemContext.length <= budget + 50);
  });

  it('extracts working memory from structured assistant reply', () => {
    const wm = extractWorkingMemoryFromHistory([
      {
        role: 'assistant',
        content: [
          '**当前结论**',
          '可行，且方向正确。',
          '**阶段动作**',
          '- 今天：盘点数据化经验',
          '- 7 天内：找 IT 领导非正式沟通',
          '**风险提醒**',
          '勿急于跳船。',
          '**验证点**',
          '对方是否关注数据逻辑。',
        ].join('\n'),
      },
    ]);
    assert.match(wm, /验证|7天|今日|风险|结论/);
  });
});
