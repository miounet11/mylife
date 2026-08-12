import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildReportAnchoredAnswer,
  extractChatContextFromSnapshot,
  type ChatMessage,
} from '@/lib/chat-report-anchor';

describe('chat report anchor', () => {
  it('extracts dayun and evidence from snapshot', () => {
    const ctx = extractChatContextFromSnapshot('report_abc123456', {
      result: {
        basic: {
          dayMaster: '甲',
          pillars: [
            { ganZhi: '甲子' },
            { ganZhi: '乙丑' },
            { ganZhi: '丙寅' },
            { ganZhi: '丁卯' },
          ],
        },
        pattern: { type: '正官格' },
        advice: {
          yongShen: ['木', '火'],
          jiShen: ['金'],
          career: { specific: ['复盘岗位匹配'], avoid: ['裸辞'] },
        },
        fortune: {
          currentDaYun: '正行壬寅大运',
          currentLiuNian: '丙午年',
          interaction: '大运与日主相生',
        },
        dayun: {
          currentDayun: { ganZhi: '壬寅', quality: 'good' },
        },
        scenarioViews: [
          { key: 'overall', title: '综合稳健', summary: '宜稳中求进', score: 72 },
          { key: 'career', title: '事业可推', summary: '适合内部晋升', score: 78 },
        ],
        monthlyWindows: [
          { label: '4月', level: 'good', score: 70 },
          { label: '8月', level: 'caution', score: 40 },
        ],
      },
    });
    assert.equal(ctx.dayMaster, '甲');
    assert.equal(ctx.currentDayun, '壬寅');
    assert.ok(ctx.evidenceLines && ctx.evidenceLines.length >= 1);
    assert.ok(ctx.doThis);
    assert.match(ctx.pillarsSummary || '', /甲子/);
  });

  it('anchors answer to report truth', () => {
    const answer = buildReportAnchoredAnswer('今年事业该怎么推？', {
      reportId: 'report_xyz_long_id',
      dayMaster: '甲',
      pattern: '正官格',
      yongShen: ['木'],
      jiShen: ['金'],
      topScenario: '内部晋升',
      bestWindow: 'Q2',
      riskWindow: '8月',
      doThis: '复盘岗位',
      currentDayun: '壬寅',
      currentLiunian: '丙午',
    });
    assert.match(answer, /锚定报告/);
    assert.match(answer, /壬寅/);
    assert.match(answer, /事业|岗位|复盘/);
    assert.match(answer, /还想问/);
  });

  it('multi-turn continuity references prior answer', () => {
    const prior: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: '事业怎么推？',
        at: 1,
      },
      {
        id: '2',
        role: 'assistant',
        content: '【锚定报告 r…】\n\n关于事业：当前主轴是「内部晋升」。\n可验证下一步：90 天复盘。',
        at: 2,
      },
    ];
    const answer = buildReportAnchoredAnswer(
      '那具体第一步做什么？',
      {
        reportId: 'report_xyz_long_id',
        dayMaster: '甲',
        yongShen: ['木'],
        jiShen: ['金'],
        topScenario: '内部晋升',
        bestWindow: 'Q2',
        riskWindow: '8月',
        doThis: '先对齐上级期望',
      },
      prior
    );
    assert.match(answer, /承接|上一轮|内部晋升|第一步|对齐/);
  });

  it('requires report binding', () => {
    const answer = buildReportAnchoredAnswer('随便问问', null);
    assert.match(answer, /未绑定|生成完整报告/);
  });
});
