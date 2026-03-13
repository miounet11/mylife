import type { ContextDirection, IndustryDirection, MacroDirection } from '@/lib/agentic-report/types';

export interface MacroCycleSignals {
  nationalCycle: {
    label: string;
    direction: ContextDirection;
    reason: string;
  };
  economicCycle: {
    label: string;
    direction: MacroDirection;
    reason: string;
  };
  industryCycle: Array<{
    industry: string;
    direction: IndustryDirection;
    confidence: number;
    reason: string;
  }>;
}

export function getMacroCycleSignals(year: number, industries: string[] = []): MacroCycleSignals {
  return {
    nationalCycle: buildNationalCycle(year),
    economicCycle: buildEconomicCycle(year),
    industryCycle: industries.length
      ? industries.map((industry) => buildIndustrySignal(industry, year))
      : [buildIndustrySignal('综合行业', year)],
  };
}

function buildNationalCycle(year: number) {
  const phase = year % 6;
  if (phase <= 1) {
    return {
      label: '结构升级期',
      direction: 'supportive' as const,
      reason: '更偏向有确定性、长期主义和真实价值支撑的路径。',
    };
  }

  if (phase <= 3) {
    return {
      label: '分化博弈期',
      direction: 'neutral' as const,
      reason: '宏观环境分化明显，适合精选赛道，不适合盲目扩张。',
    };
  }

  return {
    label: '压力筛选期',
    direction: 'pressured' as const,
    reason: '环境更看现金流、组织韧性和抗波动能力。',
  };
}

function buildEconomicCycle(year: number) {
  const position = year % 5;
  const cycleMap: Record<number, { label: string; direction: MacroDirection; reason: string }> = {
    0: { label: '扩张上行', direction: 'expansion', reason: '更适合主动进攻、扩大资源投入。' },
    1: { label: '扩张后段', direction: 'expansion', reason: '可以进攻，但要防止估值与预期过热。' },
    2: { label: '切换窗口', direction: 'transition', reason: '宜优化结构与仓位，不宜全线加杠杆。' },
    3: { label: '收缩承压', direction: 'contraction', reason: '更看风控、现金流和低波动决策。' },
    4: { label: '筑底修复', direction: 'transition', reason: '适合为下一阶段布局，但要控制节奏。' },
  };

  return cycleMap[position];
}

function buildIndustrySignal(industry: string, year: number) {
  const normalized = industry.toLowerCase();
  const baseConfidence = normalized === '综合行业' ? 0.45 : 0.62;

  if (/(ai|人工智能|软件|科技|芯片|数据|互联网)/.test(normalized)) {
    return {
      industry,
      direction: year % 4 === 0 ? 'flat' as const : 'up' as const,
      confidence: baseConfidence + 0.18,
      reason: '科技类仍偏结构性上行，但更看技术壁垒与商业化效率。',
    };
  }

  if (/(金融|证券|投资|银行|保险)/.test(normalized)) {
    return {
      industry,
      direction: year % 3 === 0 ? 'up' as const : 'flat' as const,
      confidence: baseConfidence + 0.1,
      reason: '金融板块更受政策和流动性驱动，适合顺周期判断，不宜只看短期情绪。',
    };
  }

  if (/(地产|建筑|土木|家装)/.test(normalized)) {
    return {
      industry,
      direction: 'down' as const,
      confidence: baseConfidence + 0.14,
      reason: '传统地产链更偏存量竞争，对效率和区域选择要求更高。',
    };
  }

  if (/(教育|文化|内容|咨询|心理)/.test(normalized)) {
    return {
      industry,
      direction: 'up' as const,
      confidence: baseConfidence + 0.12,
      reason: '知识服务与文化内容更适合做长期品牌和复利积累。',
    };
  }

  return {
    industry,
    direction: year % 2 === 0 ? 'flat' as const : 'up' as const,
    confidence: baseConfidence,
    reason: '当前行业趋势中性偏分化，适合看细分赛道和执行质量。',
  };
}
