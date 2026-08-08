import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runVerify } from '@/lib/agentic-report/review/run-verify';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

function minimalContext(overrides?: Partial<StructuredAgenticContext>): StructuredAgenticContext {
  return {
    engine: {
      pillars: [{ ganZhi: '甲子' } as any],
      constitution: {
        dayMaster: '甲',
        yongShen: ['木', '水'],
        jiShen: ['金'],
      },
      dayun: { windows: [{ ganZhi: '丙寅' }] },
      kline: {
        points: [{ year: 2024, career: 50, wealth: 50, marriage: 50, health: 50 }],
        anchorPoints: [{ year: 2020 }, { year: 2024 }],
        windows: [{ label: '2024-2028阶段' }],
      },
    },
    context: {
      temporal: {
        currentSolarTerm: '立秋',
        currentLiuNian: '丙午',
      },
      geoClimate: {
        birthPlace: '上海',
        currentPlace: '上海',
        climateBias: ['湿热'],
      },
      macroCycles: {
        industryCycle: [{ industry: '科技' }],
      },
    },
    ...overrides,
  } as StructuredAgenticContext;
}

describe('runVerify soft vs hard rules (v6-Q1)', () => {
  it('soft context omission alone never FAIL', () => {
    const ctx = minimalContext();
    // Agents omit solar term / place / industry / liunian keywords
    const agents = {
      core_constitution: {
        summary: '日主甲木，用神木水，结构中和，宜稳健推进',
      },
      kline_narrative: { summary: '阶段趋势以稳为主' },
      strategy_advisor: { summary: '先稳住基本盘再扩张' },
      career_wealth: { summary: '事业财富宜收口试错成本' },
      temporal_spatial_advisor: { summary: '当前节奏宜观察再行动' },
    };
    const res = runVerify(ctx, agents);
    assert.notEqual(res.verdict, 'FAIL');
    assert.ok(res.softFailedRules && res.softFailedRules.length > 0);
    assert.equal((res.hardFailedRules || []).length, 0);
    assert.ok(res.consistencyScore >= 58);
  });

  it('hard day_master miss still fails when severe', () => {
    const ctx = minimalContext();
    const agents = {
      core_constitution: {
        summary: '日主完全不提，用神也不提，只说运势很好',
      },
      kline_narrative: { summary: '趋势上行' },
      strategy_advisor: { summary: '进取' },
      career_wealth: { summary: '发财' },
      temporal_spatial_advisor: { summary: '立秋 丙午 上海 科技' },
    };
    const res = runVerify(ctx, agents);
    assert.ok((res.hardFailedRules || []).includes('day_master_alignment'));
    // May still WARN if score stays high; must list hard rule
    assert.ok(res.failedRules.includes('day_master_alignment'));
  });

  it('PASS when agents cover soft context + day master', () => {
    const ctx = minimalContext();
    const agents = {
      core_constitution: {
        summary: '日主甲，用神木水，忌金，结构清',
      },
      kline_narrative: { summary: '2020到2024锚点后进入 2024-2028阶段 稳健' },
      strategy_advisor: { summary: '科技行业窗口，丙午流年宜守成试探' },
      career_wealth: { summary: '科技与现金流并重' },
      temporal_spatial_advisor: { summary: '立秋节气，上海湿热，丙午年宜清爽节奏' },
    };
    const res = runVerify(ctx, agents);
    assert.equal(res.verdict, 'PASS');
    assert.equal(res.failedRules.length, 0);
  });
});
