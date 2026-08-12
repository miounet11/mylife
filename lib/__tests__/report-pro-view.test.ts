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
        pattern: { type: '从强格', description: '格局说明足够长用于总评兜底展示文字内容。从强者宜顺势而为，忌逆势硬碰。' },
        analysis: {
          opening: '当前世界状态处于扩张期，但命局需收缩姿态，保全核心资产与身心健康。这是一句足够长的总评，用来说明全局取舍。',
          summary: '总的来说，今年重点是减法与保全，而不是扩张。',
        },
        advice: {
          yongShen: ['金', '水'],
          xiShen: ['金'],
          jiShen: ['火', '土'],
          career: { general: '事业上宜守不宜攻，先做能力复利与内部资源整合，再谈对外扩张。', avoid: ['高杠杆扩张'], specific: ['完成一次岗位复盘'] },
          wealth: { general: '财运以保全现金流为主，忌冲动加杠杆。', specific: ['固定储蓄节点'] },
          marriage: { general: '关系宜降温处理，先把边界说清楚，再谈承诺。', specific: ['无指责对齐一次'] },
          health: { general: '注意作息与压力管理，健康是今年主要压力位之一。', avoid: ['熬夜'], specific: ['连续14天固定睡眠'] },
        },
        fortune: {
          currentDaYun: '丙午大运',
          currentLiuNian: '丙午',
          interaction: '大运流年同气，力量放大，吉凶都更容易显化，宜谨慎选择主战场。',
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
        { key: 'career', title: '事业', score: 62, trend: 'stable', status: 'steady', summary: '事业宜稳中做深，不适合裸辞式跳跃。', focus: ['内部晋升'], risks: [], actionLabel: '稳住' },
        { key: 'wealth', title: '财富', score: 45, trend: 'down', status: 'caution', summary: '财富控风险，现金流优先于扩张叙事。', focus: [], risks: ['忌追加高风险仓位'], actionLabel: '控仓' },
        { key: 'marriage', title: '关系', score: 60, trend: 'stable', status: 'steady', summary: '关系缓和，沟通质量比仪式感更重要。', focus: [], risks: [], actionLabel: '少争' },
        { key: 'health', title: '健康', score: 48, trend: 'down', status: 'caution', summary: '健康优先，先把睡眠与负荷压下来。', focus: [], risks: ['作息'], actionLabel: '休息' },
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
    assert.ok(view.overview.sections.length >= 7);
    assert.ok(view.overview.sections.some((s) => s.key === 'structure' && s.body.includes('日主')));
    assert.ok(view.overview.sections.some((s) => s.key === 'yongji' && /用神|喜用/.test(s.body)));
    assert.ok(view.overview.sections.some((s) => s.key === 'domains' && s.body.includes('事业')));
    assert.ok(view.overview.sections.some((s) => s.key === 'action' && s.body.includes('最该做')));
    assert.ok(view.overview.sections.some((s) => s.key === 'faq' && s.faq && s.faq.length >= 3));
    assert.ok(view.overview.sections.every((s) => s.readingHint || s.key === 'body'));
    assert.ok(view.overview.body.length > 400);
    assert.ok(view.beginnerGuide.length >= 5);
    assert.ok(view.nowAction.doThis.length > 4);
    assert.ok(view.nowAction.avoidThis.length > 4);
    assert.ok(view.nowAction.whyDo && view.nowAction.whyDo.length > 10);
    assert.ok(view.nowAction.verifyHint && view.nowAction.verifyHint.length > 10);
    assert.ok(view.topics.every((t) => t.why && t.how && t.how.length >= 1 && t.faq && t.faq.length >= 2));
    assert.ok(view.elements.plainSummary.length > 40);
    assert.ok(view.monthStrip.length >= 1);
    // Live recompute from pillars may refine 喜忌 vs advice cache; must be non-empty 五行
    assert.ok(view.elements.yongShen.length >= 1);
    assert.ok(view.elements.yongShen.every((e) => ['木', '火', '土', '金', '水'].includes(e)));
    assert.ok(view.elements.jiShen.length >= 1);
    assert.ok(Array.isArray(view.elements.reasonChain));
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
