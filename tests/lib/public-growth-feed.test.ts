jest.mock('@/lib/database', () => {
  const all = jest.fn();
  const get = jest.fn();

  return {
    db: {
      prepare: jest.fn(() => ({ all, get })),
      __mock: { all, get },
    },
    fortuneOperations: {
      listRecent: jest.fn(() => []),
    },
  };
});

import { db } from '@/lib/database';
import {
  buildSeoPublicQuestionSummary,
  buildSeoPublicQuestionTitle,
  getPublicQuestionFeedItem,
  sanitizePublicIdentityText,
} from '@/lib/public-growth-feed';

const mockedDb = db as unknown as { __mock: { get: jest.Mock } };

describe('public growth feed', () => {
  beforeEach(() => {
    mockedDb.__mock.get.mockReset();
  });

  test('builds public question detail from assistant answer and linked report fields', () => {
    mockedDb.__mock.get.mockReturnValue({
      id: 'q1',
      question: '我应该怎么判断 2027 年事业窗口？',
      analysis: JSON.stringify({ intent: 'career-timing' }),
      created_at: '2026-05-07 08:02:25',
      report_id: 'r1',
      pattern: JSON.stringify({ type: '身旺格', description: '结构偏强，适合先定主线。' }),
      bazi: JSON.stringify({ dayMaster: '甲木' }),
      fortune: JSON.stringify({ currentDaYun: '丙申大运', currentLiuNian: '丁未流年', interaction: '事业推进窗口已经打开。' }),
      advice: JSON.stringify({
        overall: '先推进一个可验证动作。',
        career: { overall: '事业上先锁定主项目。', specific: ['先拿到关键承诺，再扩大投入。'] },
      }),
      report_analysis: JSON.stringify({
        summary: '这是一份匿名公开结构判断摘要。',
        explanation: '主判断：先稳住主线。\n判断依据：结构与阶段一致。\n现在先做：拿到关键承诺。',
        judgmentBlocks: {
          presentDiagnosis: { headline: '当前适合推进事业主线。', evidence: ['结构与阶段同向。'] },
          futureGuidance: { headline: '先验证再放大。', evidence: ['不要同时铺开多条线。'] },
        },
      }),
      assistant_answer: '先确认资源、窗口和关键承诺，再推进事业动作。手机号 13812345678 已脱敏。',
    });

    const item = getPublicQuestionFeedItem('q1');

    expect(item?.contextLabel).toBe('身旺格 · 甲木');
    expect(item?.reportHref).toBe('/result/r1');
    expect(item?.title).toContain('身旺格 · 甲木匿名案例');
    expect(item?.answerSummary).toContain('身旺格 · 甲木公开案例');
    expect(item?.answerSummary).toContain('先确认资源');
    expect(item?.answerSummary).toContain('[已脱敏]');
    expect(item?.reportSummary).toContain('匿名公开结构判断摘要');
    expect(item?.analysisPoints).toContain('当前适合推进事业主线。');
    expect(item?.actionPoints).toContain('先推进一个可验证动作。');
  });

  test('redacts identity details and builds seo public question copy', () => {
    const question = '我叫张三，1992年5月1日出生，出生地 北京市朝阳区，微信 wxabcd1234，今年事业风险怎么看？';
    const clean = sanitizePublicIdentityText(question, 180);

    expect(clean).not.toContain('张三');
    expect(clean).not.toContain('1992年5月1日');
    expect(clean).not.toContain('北京市朝阳区');
    expect(clean).not.toContain('wxabcd1234');
    expect(buildSeoPublicQuestionTitle(clean, '身旺格 · 甲木')).toContain('匿名案例');
    expect(buildSeoPublicQuestionSummary({
      question: clean,
      contextLabel: '身旺格 · 甲木',
      answerText: '先看阶段窗口，再拆事业风险和可执行动作。',
      fallback: '公开页只保留匿名后的结构判断。',
    })).toContain('阶段、风险和可执行动作');
  });

  test('does not expose mismatched home-layout answer for palmistry question', () => {
    mockedDb.__mock.get.mockReturnValue({
      id: 'q2',
      question: '请基于我上传的手相照片，只按可见掌纹、掌丘、手型和照片质量做相学文化观察，并说明哪些地方不能判断。',
      analysis: JSON.stringify({
        intent: 'home-layout-diagnosis',
        materials: [{ kind: 'floor_plan', label: '户型图', note: '这户型能发财吗？' }],
      }),
      created_at: '2026-05-07 08:02:25',
      report_id: null,
      pattern: null,
      bazi: null,
      fortune: null,
      advice: null,
      report_analysis: null,
      assistant_answer: '当前上游模型不稳定，先给你稳定版户型结构诊断框架。这个户型需要先看入户门、客厅和财位。',
    });

    const item = getPublicQuestionFeedItem('q2');

    expect(item?.answerText).toContain('不展示可能错配的解析');
    expect(item?.answerText).not.toContain('户型结构诊断');
    expect(item?.answerSummary).not.toContain('财位');
    expect(item?.analysisPoints).toContain(item?.answerText);
  });

  test('v5-D43: filters engineering-noise lines and stale past-year items from actionPoints', () => {
    mockedDb.__mock.get.mockReturnValue({
      id: 'q3',
      question: '我应该怎么判断事业窗口？',
      analysis: JSON.stringify({ intent: 'career-timing' }),
      created_at: '2026-05-20 08:02:25',
      report_id: 'r3',
      pattern: JSON.stringify({ type: '比肩格', description: '结构偏强。' }),
      bazi: JSON.stringify({ dayMaster: '庚' }),
      fortune: JSON.stringify({ currentDaYun: '丁酉大运', currentLiuNian: '丙午流年' }),
      advice: JSON.stringify({
        overall: '在2016-2020阶段内，尝试小规模合作，验证市场反应',
        career: {
          overall: '优先参与与火木相关的项目或岗位，增强核心竞争力',
          specific: ['2026年6月推进核心谈判'],
        },
      }),
      report_analysis: JSON.stringify({
        qualityAudit: {
          summary: '本次质量审计摘要。',
          recommendedActions: [
            '优先补齐低分测算环节的 evidence/actions，再进入正式报告编排。',
            '建议核对出生时间与地点信息已脱敏，并稍后升级重算。',
          ],
        },
        feedbackLoop: {
          correctionInsight: { fixes: ['重新校准 actions_set 项'], checkpoints: ['checkpoint:01'] },
        },
      }),
      assistant_answer: '先确认窗口。',
    });

    const item = getPublicQuestionFeedItem('q3');

    // 工程口水不应进 actionPoints
    expect(item?.actionPoints.join('|')).not.toMatch(/evidence|actions|低分测算|升级重算|核对出生时间/);
    // 过去年份窗口（2016-2020）不应进
    expect(item?.actionPoints.join('|')).not.toContain('2016-2020');
    // 正常含锚条目应保留
    expect(item?.actionPoints).toContain('2026年6月推进核心谈判');
    // qualityAudit.summary 不再做 reportSummary fallback
    expect(item?.reportSummary || '').not.toContain('质量审计摘要');
  });

  test('v5-D46: drops duplicate-with-structure-card prefixes from analysisPoints', () => {
    mockedDb.__mock.get.mockReturnValue({
      id: 'q4',
      question: '我应该怎么判断事业窗口？',
      analysis: JSON.stringify({ intent: 'career-timing' }),
      created_at: '2026-05-20 08:02:25',
      report_id: 'r4',
      pattern: JSON.stringify({ type: '比肩格', description: '结构偏强。' }),
      bazi: JSON.stringify({ dayMaster: '庚' }),
      fortune: JSON.stringify({ currentDaYun: '丁酉大运', currentLiuNian: '丙午流年', interaction: '事业推进窗口已经打开。' }),
      advice: JSON.stringify({ overall: '先推进一个可验证动作。' }),
      report_analysis: JSON.stringify({
        explanation: '当前主轴：比肩格。当前阶段：丁酉大运。顺势重点：火、木、水。',
        judgmentBlocks: {
          presentDiagnosis: { headline: '当前适合推进事业主线。', evidence: ['结构与阶段同向。'] },
        },
      }),
      assistant_answer: '先确认窗口。',
    });

    const item = getPublicQuestionFeedItem('q4');
    for (const point of item?.analysisPoints || []) {
      expect(point.startsWith('当前主轴：')).toBe(false);
      expect(point.startsWith('当前阶段：')).toBe(false);
      expect(point.startsWith('顺势重点：')).toBe(false);
      expect(point.startsWith('流年参考：')).toBe(false);
    }
    expect(item?.analysisPoints).toContain('当前适合推进事业主线。');
  });
});
