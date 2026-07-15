import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import { pickAvoidDays, pickBestDays, scoreUpcomingDays } from './data/daily-fortune';
import { buildPrediction, formatDateOffset, section } from './shared';

export function buildTimingSelectionReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_timing_${birthSignature}_${Date.now()}`;
  const yongShen = truthInput.yongShen;
  const favorable = [...(yongShen?.yongShen || []), ...(yongShen?.xiShen || [])];
  const unfavorable = yongShen?.jiShen || [];
  const scored = scoreUpcomingDays(favorable, unfavorable, 90);
  const best = pickBestDays(scored, 10);
  const avoid = pickAvoidDays(scored, 8);

  const sections = [
    section('core', '核心结论', [
      `未来 90 天流日评分已按用神（${favorable.join('、') || '待补'}）匹配（择日 2.0）。`,
      `优先选用「宜」日推进签约、出行、手术预约等关键动作；「忌」日宜收敛或改期。`,
    ], 'positive'),
    section(
      'best',
      '90 天较宜日期（Top10）',
      best.map((item) => `${item.date} ${item.ganZhi}（${item.label}，${item.score}分）：${item.reason}`),
      'positive',
    ),
    section(
      'avoid',
      '90 天宜避开日期',
      avoid.map((item) => `${item.date} ${item.ganZhi}（${item.label}，${item.score}分）：${item.reason}`),
      'warning',
    ),
    section('usage', '办事择时建议', [
      '签约/合同：选「宜」日上午，条款复核完成后再落笔。',
      '出行/搬家：提前 3 天确认行程，忌日改期或减量。',
      '手术/医疗：以医生建议为第一优先，命理择时仅作辅助参考。',
      '重要面试：选「宜」日前后，提前一晚早睡保证状态。',
    ]),
    section('boundary', '边界说明', [
      '择时基于流日干支与用神匹配，不保证结果，不替代专业判断。',
      '医疗、法律事项请以医生/律师意见为准。',
    ], 'muted'),
  ];

  const top = best[0];
  const predictions = [
    buildPrediction(reportId, birthSignature, 't1', {
      category: 'timing',
      statement: top
        ? `在 ${top.date}（${top.ganZhi}）推进一件已准备充分的关键事项`
        : '未来14天内选定一个吉日推进关键事项',
      dueDate: top?.date || formatDateOffset(14),
      confidence: 0.76,
      evidence: '择时办事 · 流日匹配',
      verifyChecklist: ['是否按计划在宜日执行？', '过程是否顺畅？'],
    }),
    buildPrediction(reportId, birthSignature, 't2', {
      category: 'timing',
      statement: '未来21天内避开最低分日期做不可逆决策',
      dueDate: formatDateOffset(21),
      confidence: 0.73,
      evidence: '择时办事 · 忌日规避',
      verifyChecklist: ['是否成功改期？', '是否减少失误？'],
    }),
    buildPrediction(reportId, birthSignature, 't3', {
      category: 'timing',
      statement: '未来28天结束时复盘择时准确度并记录反馈',
      dueDate: formatDateOffset(28),
      confidence: 0.71,
      evidence: '择时办事 · 反馈校准',
      verifyChecklist: ['是否记录结果？', '是否同步预测回访？'],
    }),
  ];

  return {
    slug: 'timing-selection',
    title: '择时办事研判',
    question: '签约、出行、手术、搬家哪天更合适？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: [
      '择时仅供参考，医疗手术请以医生建议为准。',
      '不构成法律或商业结果承诺。',
    ],
    meta: {
      bestDay: top?.date || '',
      windowDays: 90,
      yongShen: favorable,
      jiShen: unfavorable,
      xiShen: yongShen?.xiShen || [],
    },
  };
}