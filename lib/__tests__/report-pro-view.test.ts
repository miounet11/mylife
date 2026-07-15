import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildProReportView, toScore10, scoreLevel } from '@/lib/report-pro-view';

describe('report-pro-view', () => {
  it('toScore10 and scoreLevel', () => {
    assert.equal(toScore10(83), 8);
    assert.equal(scoreLevel(8), 'good');
    assert.equal(scoreLevel(5), 'ok');
    assert.equal(scoreLevel(3), 'caution');
  });

  it('builds beginner core: elements, time scores, risks, next year', () => {
    const view = buildProReportView({
      result: {
        basic: {
          dayMaster: '辛',
          pillars: [
            { celestialStem: '庚', earthlyBranch: '申' },
            { celestialStem: '戊', earthlyBranch: '寅' },
            { celestialStem: '辛', earthlyBranch: '未' },
            { celestialStem: '壬', earthlyBranch: '辰' },
          ],
        },
        pattern: { type: '从强格', description: '格局说明足够长用于总评兜底展示文字内容。' },
        analysis: {
          opening: '当前世界状态处于扩张期，但命局需收缩姿态，保全核心资产与身心健康。这是一句足够长的总评。',
        },
        advice: {
          yongShen: ['金', '水'],
          xiShen: ['金'],
          jiShen: ['火', '土'],
          career: { general: '事业上宜守不宜攻。', avoid: ['高杠杆扩张'] },
          wealth: { general: '财运以保全现金流为主。' },
          marriage: { general: '关系宜降温处理。' },
          health: { general: '注意作息。', avoid: ['熬夜'] },
        },
        fortune: {
          currentDaYun: '丙午大运',
          currentLiuNian: '丙午',
          nextYear: '明年宜储备与学习，不宜豪赌式翻盘。这是足够长的明年说明。',
        },
        confidence: { overallScore: 83 },
        klineData: [
          { year: 2010, score: 40, career: 40, wealth: 38, marriage: 42, health: 40 },
          { year: 2020, score: 88, career: 90, wealth: 85, marriage: 80, health: 82 },
          { year: 2026, score: 56, career: 55, wealth: 50, marriage: 58, health: 52 },
          { year: 2027, score: 62, career: 60, wealth: 58, marriage: 64, health: 60 },
        ],
      },
      scenarioViews: [
        { key: 'career', title: '事业', score: 62, trend: 'stable', status: 'steady', summary: '事业宜稳。', focus: [], risks: [], actionLabel: '稳住' },
        { key: 'wealth', title: '财富', score: 45, trend: 'down', status: 'caution', summary: '财富控风险。', focus: [], risks: ['忌追加高风险仓位'], actionLabel: '控仓' },
        { key: 'marriage', title: '关系', score: 60, trend: 'stable', status: 'steady', summary: '关系缓和。', focus: [], risks: [], actionLabel: '少争' },
        { key: 'health', title: '健康', score: 48, trend: 'down', status: 'caution', summary: '健康优先。', focus: [], risks: ['作息'], actionLabel: '休息' },
      ],
      monthlyWindows: [
        {
          key: '2026-07',
          year: 2026,
          month: 7,
          label: '2026.07',
          element: '土',
          score: 48,
          status: 'caution',
          theme: '关系经营',
          reason: '本月宜观察再行动，减少并行战线。足够长的月份说明文字。',
        },
        {
          key: '2026-12',
          year: 2026,
          month: 12,
          label: '2026.12',
          element: '水',
          score: 72,
          status: 'push',
          theme: '推进窗口',
          reason: '相对顺的月份，可小步验证。',
        },
      ],
      yearlyTrendSnapshots: [
        {
          year: 2026,
          overallScore: 56,
          dominantTrack: '关系',
          pressureTrack: '健康',
          headline: '2026 先稳结构',
          advice: '健康是主要压力位，先降噪减法。',
        },
        {
          year: 2027,
          overallScore: 61,
          dominantTrack: '事业',
          pressureTrack: '财富',
          headline: '2027 稳中求进',
          advice: '明年可在能力建设上投入，仍忌高杠杆。',
        },
      ],
      decisionPlaybook: [
        {
          key: 'playbook-health',
          track: 'health',
          title: '健康操作',
          priority: 'Observe',
          score: 50,
          stance: 'guard',
          bestWindow: '2027.06',
          whyNow: '火克金阶段需要护身。',
          nowAction: '规律作息与体检。',
          avoidAction: '连续熬夜与透支。',
        },
      ],
      cockpitHeadline: '当前最重要的是收缩姿态与结构保全。',
    });

    assert.ok(view.overview.oneLiner.includes('/10'));
    assert.ok(view.beginnerGuide.length >= 4);
    assert.deepEqual(view.elements.yongShen, ['金', '水']);
    assert.ok(view.elements.jiShen.includes('火'));
    assert.ok(view.elements.doList.length >= 1);
    assert.ok(view.elements.avoidList.length >= 1);
    assert.equal(view.timeScores.length, 3);
    assert.equal(view.timeScores[0]?.key, 'month');
    assert.equal(view.timeScores[2]?.key, 'nextYear');
    assert.ok(view.riskAlerts.length >= 1);
    assert.ok(view.riskAlerts.some((a) => a.severity === 'high' || a.when.includes('2026')));
    assert.ok(view.nextYear?.title.includes('2027') || view.nextYear?.body);
    assert.equal(view.klinePeak?.year, 2020);
    assert.equal(view.klineTrough?.year, 2010);
  });
});
