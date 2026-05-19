/**
 * 验证 buildAgentUserPrompt 的 strict 模式只注入 readingOrder 中的 label，
 * 并量化 token 节省（按字符数近似）。
 */
import { buildAgentUserPrompt } from '@/lib/prompts/shared/agent-input';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

function makeFakeCtx(): StructuredAgenticContext {
  // 最小可用 ctx——字段值粗糙，仅用于检查 prompt 拼接行为。
  return {
    engine: {
      constitution: { dayMaster: '丙', strength: 'weak', yongShen: ['水'], jiShen: ['火'] },
      tenGodsTable: { 比劫: 1, 食伤: 0, 财: 1, 官杀: 2, 印: 0 },
      dayun: { current: '甲辰', windows: [{ label: '甲辰大运', range: '2024-2034' }] },
      kline: {
        anchorPoints: [{ year: 2028, score: 70, label: '转折前夜' }],
        windows: [{ label: '2028 春', score: 80 }],
      },
    },
    context: {
      temporal: { currentLiuNian: '丙午', currentSolarTerm: '立夏' },
      macroCycles: { industryCycle: [{ industry: 'AI', phase: 'up' }] },
      geoClimate: { currentPlace: '杭州' },
      spatialFactors: { favorableDirections: ['东', '南'] },
      humanFactors: { householdSummary: '与伴侣同住' },
      worldState: { mood: '推进期' },
    },
  } as unknown as StructuredAgenticContext;
}

describe('buildAgentUserPrompt strict mode', () => {
  const ctx = makeFakeCtx();
  const readingOrder = ['ENGINE_CONSTITUTION', 'CONTEXT_TEMPORAL'];

  it('strict=true 只注入 readingOrder 中的 label', () => {
    const out = buildAgentUserPrompt(ctx, { readingOrder, strict: true });
    expect(out).toContain('[ENGINE_CONSTITUTION]');
    expect(out).toContain('[CONTEXT_TEMPORAL]');
    // 不应出现未声明的段
    expect(out).not.toContain('[CONTEXT_MACRO]');
    expect(out).not.toContain('[CONTEXT_GEO_CLIMATE]');
    expect(out).not.toContain('[CONTEXT_SPATIAL]');
    expect(out).not.toContain('[CONTEXT_HUMAN]');
    expect(out).not.toContain('[CONTEXT_WORLD_STATE]');
  });

  it('strict=false 保留所有 ALL_LABELS（向后兼容）', () => {
    const out = buildAgentUserPrompt(ctx, { readingOrder, strict: false });
    expect(out).toContain('[CONTEXT_MACRO]');
    expect(out).toContain('[CONTEXT_GEO_CLIMATE]');
    expect(out).toContain('[CONTEXT_HUMAN]');
  });

  it('strict 默认开启', () => {
    const strict = buildAgentUserPrompt(ctx, { readingOrder });
    const explicit = buildAgentUserPrompt(ctx, { readingOrder, strict: true });
    expect(strict).toBe(explicit);
  });

  it('strict 模式至少节省 30% 字符（按 readingOrder=4 段对比 ALL_LABELS=11 段）', () => {
    const fourSegments = ['ENGINE_CONSTITUTION', 'ENGINE_TEN_GODS_TABLE', 'CONTEXT_TEMPORAL', 'CONTEXT_WORLD_STATE'];
    const strict = buildAgentUserPrompt(ctx, { readingOrder: fourSegments, strict: true });
    const loose = buildAgentUserPrompt(ctx, { readingOrder: fourSegments, strict: false });
    const saved = 1 - strict.length / loose.length;
    expect(saved).toBeGreaterThan(0.3);
  });
});
