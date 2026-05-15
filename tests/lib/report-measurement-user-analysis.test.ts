import type { FortuneRecord } from '@/lib/user-types';
import {
  buildReportMeasurementUserAnalysis,
  renderReportMeasurementUserAnalysis,
} from '@/lib/report-measurement-user-analysis';

const measurementResults = [
  ['pillars', '四柱排盘', 92, 'good', '排盘稳定'],
  ['five-elements', '五行力量', 76, 'watch', '五行分解可继续补根气'],
  ['day-master-strength', '日主强弱', 81, 'watch', '强弱边界需要补得地证据'],
  ['pattern', '格局判断', 64, 'risk', '格局形成证据不足'],
  ['ten-gods', '十神结构', 88, 'good', '十神主线稳定'],
  ['yong-shen', '用神体系', 58, 'risk', '用神层级需要拆分'],
  ['shen-sha', '神煞辅助', 83, 'watch', '神煞只做辅助'],
  ['dayun', '大运阶段', 86, 'good', '大运判断稳定'],
  ['kline', '流年 K 线', 72, 'watch', '流年驱动还要补证据'],
  ['domain-advice', '领域建议', 90, 'good', '建议能落到行动'],
].map(([id, label, score, level, conclusion], index) => ({
  id: id as string,
  label: label as string,
  order: index + 1,
  score: score as number,
  level: level as string,
  conclusion: conclusion as string,
}));

function makeReport(): FortuneRecord {
  return {
    id: 'report_measurement_user_analysis_test',
    userId: 'user_measurement_user_analysis_test',
    name: '真实用户样本',
    birthDate: '1990-01-01',
    birthTime: '08:00',
    timezone: 8,
    gender: 'female',
    bazi: {} as any,
    fiveElements: {} as any,
    tenGods: {} as any,
    pattern: {} as any,
    fortune: {} as any,
    advice: {} as any,
    evidence: {} as any,
    analysis: {
      contextSignals: {
        engineEvidence: {
          version: 'engine-evidence-v2',
          measurementResults,
        },
      },
    } as any,
  } as FortuneRecord;
}

describe('report measurement user analysis', () => {
  it('ranks every measurement stage and identifies the optimization target', () => {
    const analysis = buildReportMeasurementUserAnalysis(makeReport());

    expect(analysis.totalStages).toBe(10);
    expect(analysis.complete).toBe(true);
    expect(analysis.averageScore).toBe(79);
    expect(analysis.weakestStage).toMatchObject({
      id: 'yong-shen',
      score: 58,
      status: 'risk',
      optimizationHint: '补调候、通关、扶抑、病药四层优先级。',
    });
    expect(analysis.optimizationPriorities.map((stage) => stage.id).slice(0, 3)).toEqual([
      'yong-shen',
      'pattern',
      'kline',
    ]);
    expect(analysis.strongestStages[0]?.id).toBe('pillars');
  });

  it('renders a readable stage score report', () => {
    const rendered = renderReportMeasurementUserAnalysis(buildReportMeasurementUserAnalysis(makeReport()));

    expect(rendered).toContain('Report Measurement User Analysis');
    expect(rendered).toContain('最该优化：用神体系（58 分）');
    expect(rendered).toContain('## Stage scores');
    expect(rendered).toContain('## Optimization priorities');
  });
});
