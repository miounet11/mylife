import type { DimensionAdvisorInput, DimensionReport } from './types';
import { buildDimensionEnginePack } from './engine-pack';
import { scoreNameAgainstYongShen } from './data/name-characters';
import { scoreName } from '@/lib/naming';
import { buildPrediction, formatDateOffset, section } from './shared';

export function buildNamingReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_naming_${birthSignature}_${Date.now()}`;
  const yongShen = truthInput.yongShen;
  const favorable = [...(yongShen?.yongShen || []), ...(yongShen?.xiShen || [])];
  const unfavorable = yongShen?.jiShen || [];
  const displayName = `${input.name || ''}`.trim() || '（未填写）';
  // Prefer shared naming scorer; fallback to legacy table scorer
  const rich =
    displayName !== '（未填写）'
      ? scoreName({
          mode: 'person',
          name: displayName,
          yongShen: favorable,
          jiShen: unfavorable,
        })
      : null;
  const scored = rich
    ? {
        score: rich.score,
        summary: rich.reason,
        suggestions: [
          `总分 ${rich.score}（五行 ${rich.breakdown.wuxing} · 音韵 ${rich.breakdown.phonology} · 字义 ${rich.breakdown.semantics}）`,
          ...rich.elements.map((e) => `${e.char}→${e.element}`),
          `宜补用神：${favorable.join('、') || '按引擎判定'}`,
          '更多候选请打开 /tools/naming 起名中心一键生成',
        ],
      }
    : scoreNameAgainstYongShen(displayName, favorable, unfavorable);

  const sections = [
    section('core', '核心结论', [scored.summary], scored.score >= 60 ? 'positive' : 'warning'),
    section('analysis', '姓名五行拆解', [
      displayName === '（未填写）'
        ? '请先在档案中填写姓名，或在下方补充后重新生成。'
        : `当前姓名：${displayName}`,
      ...scored.suggestions,
    ]),
    section('rename', '改名/补强方向', [
      `优先补用神五行：${favorable.join('、') || '按引擎判定'}`,
      `减少忌神五行：${unfavorable.join('、') || '无明显忌神'}`,
      '末字或中间字微调通常比全名更换成本更低。',
      '音韵顺口、寓意积极与五行补益同样重要。',
    ]),
    section('boundary', '边界说明', [
      '姓名评估基于五行补益模型，不承诺学业、事业或法律效果。',
      '正式改名请同时考虑户籍、证件与家庭共识。',
    ], 'muted'),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 'n1', {
      category: 'timing',
      statement: displayName !== '（未填写）'
        ? `未来60天内收集 2-3 个补用神（${favorable[0] || '木'}）的候选字并比对音韵`
        : '未来30天内补全姓名信息并重新生成研判',
      dueDate: formatDateOffset(displayName !== '（未填写）' ? 60 : 30),
      confidence: 0.73,
      evidence: '起名改名 · 字库筛选',
      verifyChecklist: ['是否完成候选字比对？', '是否征求家人意见？'],
    }),
    buildPrediction(reportId, birthSignature, 'n2', {
      category: 'timing',
      statement: `未来90天内确定是否微调姓名（非必须，视契合度 ${scored.score} 分而定）`,
      dueDate: formatDateOffset(90),
      confidence: 0.7,
      evidence: '起名改名 · 决策窗口',
      verifyChecklist: ['是否做出明确决策？', '是否完成必要手续？'],
    }),
    buildPrediction(reportId, birthSignature, 'n3', {
      category: 'timing',
      statement: scored.score < 55
        ? '未来180天内观察改名/补强后的心理认同与使用习惯'
        : '未来180天内保持姓名稳定，把精力放在行动验证上',
      dueDate: formatDateOffset(180),
      confidence: 0.68,
      evidence: '起名改名 · 使用反馈',
      verifyChecklist: ['是否更自在地使用新名字？', '是否减少反复纠结？'],
    }),
  ];

  return {
    slug: 'naming',
    title: '起名 / 改名研判',
    question: '这个名字五行是否补用神？改名方向如何？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: [
      '姓名五行评估仅供参考，不承诺命运改变或任何具体结果。',
      '涉及证件/legal 改名请咨询相关部门与专业人士。',
    ],
    meta: { nameScore: scored.score, displayName },
  };
}