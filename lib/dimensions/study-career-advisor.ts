import type { DimensionAdvisorInput, DimensionReport } from './types';
import { generateBaziShiShenAnalysis } from '@/lib/bazi-analyzer';
import { buildDimensionEnginePack } from './engine-pack';
import { rankSubjects } from './data/subjects';
import { buildPrediction, formatDateOffset, section } from './shared';

export function buildStudyCareerReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_study_${birthSignature}_${Date.now()}`;
  const yongShen = truthInput.yongShen;
  const favorable = [...(yongShen?.yongShen || []), ...(yongShen?.xiShen || [])];
  const pillars = truthInput.pillars || [];
  const bazi = pillars.map((p) => p.celestialStem + p.earthlyBranch);
  const analysis = generateBaziShiShenAnalysis(bazi);
  const growth = analysis.tenGodStructure.lifeDomains.find((item) => item.domain === 'growth');
  const hasStrongYin = (analysis.shiShenCount['正印'] || 0) + (analysis.shiShenCount['偏印'] || 0) >= 1.2;
  const hasStrongShiShang = (analysis.shiShenCount['食神'] || 0) + (analysis.shiShenCount['伤官'] || 0) >= 1.2;
  const { fit, rhythm } = rankSubjects(favorable, hasStrongYin, hasStrongShiShang);

  const sections = [
    section('core', '核心结论', [
      growth?.driver || '学业事业看印星、食伤与流年节奏。',
      hasStrongYin && hasStrongShiShang
        ? '「学习吸收 + 表达输出」双强，适合考试+作品并行的路径。'
        : hasStrongYin
          ? '偏研究型学习，宜系统课程与导师反馈。'
          : hasStrongShiShang
            ? '偏实战型学习，宜项目制与竞赛验证。'
            : '宜先建立方法论，再进入专项突破。',
    ], 'positive'),
    section(
      'subjects',
      '更适合的方向',
      fit.map((item) => `${item.name}（${item.element}）：${item.tracks.join('、')}`),
      'positive',
    ),
    section('rhythm', '备考/进阶节奏', rhythm),
    section('bottleneck', '瓶颈突破', [
      analysis.tenGodStructure.riskPatterns[0]
        ? `${analysis.tenGodStructure.riskPatterns[0].name}：${analysis.tenGodStructure.riskPatterns[0].note}`
        : '当前瓶颈更可能来自节奏分配，而非能力不足。',
      '每 6 周做一次「输入-输出」比例复盘，防止只学不练或只练不体系。',
      '职业瓶颈期优先补一项可展示成果，再争取岗位或项目切换。',
    ]),
    section('exam', '考试择时提示', [
      '用神流年窗口适合报考关键证书/升学考试。',
      '忌神流年窗口以巩固基础为主，减少「孤注一掷」式报考。',
    ], 'muted'),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 's1', {
      category: 'career',
      statement: `未来6个月在「${fit[0]?.name || '主攻方向'}」完成一项可展示的学习成果`,
      dueDate: formatDateOffset(180),
      confidence: 0.77,
      evidence: '学业事业 · 方向匹配',
      verifyChecklist: ['成果是否可展示？', '是否获得反馈？'],
    }),
    buildPrediction(reportId, birthSignature, 's2', {
      category: 'timing',
      statement: '未来90天内完成一次备考/进修节奏校准（周计划级）',
      dueDate: formatDateOffset(90),
      confidence: 0.74,
      evidence: '学业事业 · 节奏校准',
      verifyChecklist: ['是否坚持4周？', '效率是否提升？'],
    }),
    buildPrediction(reportId, birthSignature, 's3', {
      category: 'career',
      statement: `${new Date().getFullYear() + 1}年上半年适合发起一次职业/升学路径评估`,
      dueDate: formatDateOffset(365),
      confidence: 0.72,
      evidence: '学业事业 · 路径评估',
      verifyChecklist: ['是否完成评估？', '是否调整路径？'],
    }),
  ];

  return {
    slug: 'study-career',
    title: '学业事业研判',
    question: '升学/考试方向？职业瓶颈如何突破？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: ['方向建议用于规划参考，不承诺录取、升职或考试结果。'],
    meta: { dominantGod: Object.entries(analysis.shiShenCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '' },
  };
}