import { getGeoClimateSignals } from '@/lib/agentic-report/context/geo-climate';
import { getMacroCycleSignals } from '@/lib/agentic-report/context/macro-cycles';
import { getSolarTermContext } from '@/lib/agentic-report/context/solar-terms';
import { getSpatialFactors } from '@/lib/agentic-report/context/spatial-factors';
import type { BuildContextSignalsInput, ContextSignalPack, LifeStage } from '@/lib/agentic-report/types';
import type { FortuneAnalysisResult } from '@/lib/user-types';

export function buildContextSignals({
  birthDate,
  birthPlace,
  currentPlace,
  targetPlaces,
  industries,
  engine,
  report,
  now = new Date(),
  version = 'context-signals-v1',
}: BuildContextSignalsInput): ContextSignalPack {
  const age = now.getFullYear() - birthDate.getFullYear();
  const solar = getSolarTermContext(now);
  const macro = getMacroCycleSignals(now.getFullYear(), industries || gatherIndustryHints(report?.advice));
  const geoClimate = getGeoClimateSignals({
    birthPlace,
    currentPlace,
    targetPlaces,
    favoredElements: [...engine.constitution.yongShen, ...engine.constitution.xiShen],
    avoidedElements: engine.constitution.jiShen,
  });
  const spatial = getSpatialFactors({
    favoredDirections: report?.advice?.directions || [],
    favoredElements: [...engine.constitution.yongShen, ...engine.constitution.xiShen],
    avoidedElements: engine.constitution.jiShen,
  });

  return {
    version,
    generatedAt: now.toISOString(),
    temporal: {
      currentDate: now.toISOString(),
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      currentSolarTerm: solar.currentSolarTerm,
      nextSolarTerm: solar.nextSolarTerm,
      isBeforeLichun: solar.isBeforeLichun,
      currentLunarYear: solar.currentLunarYear,
      currentLiuNian: solar.currentLiuNian,
      currentDaYun: engine.dayun.currentDayun,
      currentPhaseLabel: engine.kline.phases.find((phase) => now.getFullYear() >= phase.startYear && now.getFullYear() <= phase.endYear)?.label,
    },
    macroCycles: macro,
    geoClimate,
    spatialFactors: spatial,
    humanFactors: {
      lifeStage: inferLifeStage(age),
      relationshipFocus: inferRelationshipFocus(age),
      familyRolePressure: inferFamilyRolePressure(age),
      collaborationMode: inferCollaborationMode(engine.constitution.yongShen, macro.industryCycle || []),
    },
  };
}

function inferLifeStage(age: number): LifeStage {
  if (age < 24) return 'early';
  if (age < 34) return 'rising';
  if (age < 46) return 'prime';
  if (age < 58) return 'transition';
  return 'later';
}

function inferRelationshipFocus(age: number) {
  if (age < 28) return '关系重点在筛选同频圈层与合作边界。';
  if (age < 40) return '关系重点在伴侣协同、家庭节奏与事业平衡。';
  if (age < 55) return '关系重点在家庭责任分配与长期信任维护。';
  return '关系重点在稳定支持系统和情绪能量管理。';
}

function inferFamilyRolePressure(age: number) {
  if (age < 26) return ['角色压力相对较轻，试错空间更大。'];
  if (age < 40) return ['事业与家庭双线并行，时间分配压力较高。'];
  if (age < 55) return ['家庭责任、代际支持、职业稳定性会共同影响决策。'];
  return ['更需要平衡身体负荷、家庭支持和长期生活质量。'];
}

function inferCollaborationMode(
  favoredElements: string[],
  industryCycle: Array<{ industry: string; direction: string }>
) {
  const suggestions: string[] = [];

  if (favoredElements.includes('木')) suggestions.push('适合和成长型、学习型、长期主义团队合作。');
  if (favoredElements.includes('火')) suggestions.push('适合在高表达、高推进、高影响力环境中放大价值。');
  if (favoredElements.includes('土')) suggestions.push('适合在组织稳定、流程清晰的合作框架中积累成果。');
  if (favoredElements.includes('金')) suggestions.push('适合在规则明确、结果导向强的体系中发挥。');
  if (favoredElements.includes('水')) suggestions.push('适合在跨区域、跨资源、跨渠道的协作结构中形成优势。');

  const pressuredIndustry = industryCycle.find((item) => item.direction === 'down');
  if (pressuredIndustry) {
    suggestions.push(`当前${pressuredIndustry.industry}承压，更适合轻资产试探和保守扩张。`);
  }

  return suggestions.length ? suggestions : ['合作模式应优先选择低摩擦、能形成长期复利的组合。'];
}

function gatherIndustryHints(advice?: FortuneAnalysisResult['advice']) {
  if (!advice) return [];

  const hints = [
    ...(advice.career?.specific || []),
    ...(advice.wealth?.specific || []),
    advice.career?.general || '',
    advice.wealth?.general || '',
  ].join(' ');

  const keywords = ['科技', '教育', '金融', '地产', '制造', '咨询', '内容', '医疗', '能源'];
  return keywords.filter((keyword) => hints.includes(keyword));
}
