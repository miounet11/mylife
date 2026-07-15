import type { DimensionAdvisorInput, DimensionReport } from './types';
import { generateBaziShiShenAnalysis } from '@/lib/bazi-analyzer';
import { buildDimensionEnginePack } from './engine-pack';
import { buildPrediction, formatDateOffset, section } from './shared';

export function buildMarriageReport(input: DimensionAdvisorInput): DimensionReport {
  const pack = buildDimensionEnginePack(input);
  const { truthInput, birthSignature } = pack;
  const reportId = input.reportId || `dimension_marriage_${birthSignature}_${Date.now()}`;
  const pillars = truthInput.pillars || [];
  const bazi = pillars.map((p) => p.celestialStem + p.earthlyBranch);
  const analysis = generateBaziShiShenAnalysis(bazi);
  const relationshipDomain = analysis.tenGodStructure.lifeDomains.find((item) => item.domain === 'relationship');
  const dayBranch = pillars[2]?.earthlyBranch || '日支';
  const currentYear = new Date().getFullYear();
  const kline = truthInput.kline || [];
  const marriageScore = kline.find((item) => item.year === currentYear)?.marriage ?? 55;
  const future = kline.filter((item) => item.year > currentYear).slice(0, 5);
  const bestYear = [...future].sort((a, b) => b.marriage - a.marriage)[0];

  const sections = [
    section('core', '核心结论', [
      `当前关系节奏评分约 ${Math.round(marriageScore)}。`,
      marriageScore >= 58
        ? '今年感情推进阻力较小，适合明确需求、主动沟通。'
        : '今年宜「先看清、再推进」，避免在信息不对称时做重大承诺。',
      relationshipDomain?.driver || '婚恋结构以日支、配偶星与合冲为主导。',
    ], 'positive'),
    section('palace', '夫妻宫观察', [
      `日支（夫妻宫）为 ${dayBranch}，宜观察情绪需求与安全感来源是否匹配。`,
      analysis.tenGodStructure.input.length
        ? `配偶/财星线索：${analysis.tenGodStructure.input.join('、')}`
        : '配偶星不显，宜通过相处模式而非标签判断对象。',
      analysis.tenGodStructure.riskPatterns[0]
        ? `结构提醒：${analysis.tenGodStructure.riskPatterns[0].name} — ${analysis.tenGodStructure.riskPatterns[0].note}`
        : '未见显著结构冲突，重在节奏与边界。',
    ]),
    section('windows', '关系窗口', [
      bestYear ? `${bestYear.year} 年关系线相对更顺（约 ${Math.round(bestYear.marriage)} 分），适合推进见家长/订婚等里程碑。` : '未来一年以关系磨合为主，先统一生活节奏。',
      '低谷窗口减少「重大关系谈判」，先处理可执行的小共识。',
      '合婚/见家长优先选双方状态稳定、非低谷流年。',
    ]),
    section('communication', '沟通画像', [
      analysis.tenGodStructure.controlled.length
        ? '表达欲较强，宜把需求说具体（时间、场景、底线），避免暗示。'
        : '偏内敛型，宜用书面或预约式沟通，给对方准备时间。',
      '冲突后 24 小时内先对齐事实，再讨论感受，效率更高。',
    ], 'muted'),
  ];

  const predictions = [
    buildPrediction(reportId, birthSignature, 'm1', {
      category: 'marriage',
      statement: bestYear
        ? `${bestYear.year}年上半年适合推进一段关系到「可公开/可承诺」阶段`
        : `${currentYear + 1}年上半年适合完成一次关系需求对齐谈话`,
      dueDate: bestYear ? `${bestYear.year}-06-30` : formatDateOffset(365),
      confidence: 0.76,
      evidence: '谈婚论嫁 · 关系窗口',
      verifyChecklist: ['是否完成关键对话？', '双方预期是否一致？'],
    }),
    buildPrediction(reportId, birthSignature, 'm2', {
      category: 'marriage',
      statement: '未来90天内适合安排一次「无指责」的关系复盘',
      dueDate: formatDateOffset(90),
      confidence: 0.73,
      evidence: '谈婚论嫁 · 沟通节奏',
      verifyChecklist: ['是否完成复盘？', '是否形成1条可执行共识？'],
    }),
    buildPrediction(reportId, birthSignature, 'm3', {
      category: 'marriage',
      statement: marriageScore < 55
        ? `${currentYear}年Q4前不宜做高压式关系谈判`
        : `${currentYear}年Q3适合确定共同生活预算与节奏`,
      dueDate: formatDateOffset(150),
      confidence: 0.71,
      evidence: '谈婚论嫁 · 节奏边界',
      verifyChecklist: ['是否避免冲动决策？', '现实条件是否对齐？'],
    }),
  ];

  return {
    slug: 'marriage',
    title: '谈婚论嫁研判',
    question: '何时遇正缘？婚期窗口？关系节奏如何？',
    generatedAt: new Date().toISOString(),
    birthSignature,
    sections,
    predictions,
    disclaimers: ['关系建议用于沟通与节奏参考，不替代双方现实选择与法律咨询。'],
    meta: { marriageScore: Math.round(marriageScore), dayBranch },
  };
}