import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import { resolveBodySystems } from './data/body-systems';
import { buildPrediction, formatDateOffset, section } from './shared';

export function buildHealthReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_health_${birthSignature}_${Date.now()}`;
  const yongShen = truthInput.yongShen;
  const dayMaster = yongShen?.dayMaster || truthInput.pillars?.[2]?.celestialStem || '';
  const currentYear = new Date().getFullYear();
  const kline = truthInput.kline || [];
  const current = kline.find((item) => item.year === currentYear);
  const healthScore = current?.health ?? 55;
  const { focus, stable } = resolveBodySystems(dayMaster, yongShen?.jiShen || [], healthScore);

  const sections = [
    section('core', '核心结论', [
      `当前健康节奏评分约 ${Math.round(healthScore)}（非医学指标，仅反映节律强弱）。`,
      healthScore >= 58
        ? '今年整体恢复力尚可，宜维持规律作息与适度运动。'
        : '今年宜「先恢复、再加压」，避免连续熬夜与高负荷并行。',
    ], 'positive'),
    section(
      'focus',
      '需留意的系统',
      focus.map((item) => `${item.organ}（${item.element}）：${item.tendency}`),
      'warning',
    ),
    section(
      'care',
      '养生节奏建议',
      focus.map((item) => item.care).concat([
        '每季度做一次生活方式复盘：睡眠、饮食、运动、压力四象限。',
        '出现持续不适请优先就医，命理节奏不能替代医学检查。',
      ]),
    ),
    section(
      'stable',
      '相对稳健的部分',
      stable.map((item) => `${item.organ}：${item.care}`),
      'muted',
    ),
    section('checkup', '体检/调养窗口', [
      healthScore < 55 ? '未来 60 天内适合安排一次基础体检或中医体质评估。' : '未来 90 天适合做生活方式微调，不必过度焦虑。',
      '低谷流年窗口减少高对抗性运动，以有氧 + 拉伸为主。',
    ]),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 'h1', {
      category: 'health',
      statement: `未来90天内完成一次睡眠+饮食节律复盘，并坚持至少21天`,
      dueDate: formatDateOffset(90),
      confidence: 0.74,
      evidence: '身体健康 · 生活方式节奏',
      verifyChecklist: ['是否完成21天记录？', '精力是否更稳定？'],
    }),
    buildPrediction(reportId, birthSignature, 'h2', {
      category: 'health',
      statement: healthScore < 55
        ? `${currentYear}年Q3前宜完成一次基础体检或等效健康筛查`
        : `${currentYear}年下半年宜维持每周2次中等强度运动`,
      dueDate: formatDateOffset(180),
      confidence: 0.72,
      evidence: '身体健康 · 体检窗口',
      verifyChecklist: ['是否已预约/执行？', '关键指标是否改善？'],
    }),
    buildPrediction(reportId, birthSignature, 'h3', {
      category: 'health',
      statement: `未来30天避免连续3天以上的熬夜+高压组合`,
      dueDate: formatDateOffset(30),
      confidence: 0.7,
      evidence: '身体健康 · 恢复边界',
      verifyChecklist: ['是否守住底线？', '次日恢复是否更快？'],
    }),
  ];

  return {
    slug: 'health',
    title: '身体健康节奏研判',
    question: '哪些系统易偏弱？何时宜体检/调养？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: ['生活方式参考，不能替代医疗诊断、治疗或急救判断。'],
    meta: { healthScore: Math.round(healthScore) },
  };
}