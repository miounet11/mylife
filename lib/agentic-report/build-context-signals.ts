import { getGeoClimateSignals } from '@/lib/agentic-report/context/geo-climate';
import { getMacroCycleSignals } from '@/lib/agentic-report/context/macro-cycles';
import { getSolarTermContext } from '@/lib/agentic-report/context/solar-terms';
import { getSpatialFactors } from '@/lib/agentic-report/context/spatial-factors';
import type { BuildContextSignalsInput, ContextSignalPack, LifeStage } from '@/lib/agentic-report/types';
import { buildReferenceContextOverlay } from '@/lib/reference-engine-bridge';
import { buildReferenceIntelligencePack } from '@/lib/reference-intelligence';
import type { FortuneAnalysisResult } from '@/lib/user-types';

export function buildContextSignals({
  birthDate,
  birthPlace,
  currentPlace,
  targetPlaces,
  industries,
  referenceCorpus,
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
  const referenceIntelligence = hasReferenceCorpus(referenceCorpus)
    ? (() => {
        const pack = buildReferenceIntelligencePack(referenceCorpus || {});
        return {
          pack,
          overlay: buildReferenceContextOverlay(pack),
        };
      })()
    : undefined;

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
      tacitSummary: report?.tacitSummary,
      tacitSignals: report?.tacitSignals,
    },
    worldState: buildWorldState({
      engine,
      report,
      macro,
      solarTerm: solar.currentSolarTerm,
      lifeStage: inferLifeStage(age),
      currentYear: now.getFullYear(),
    }),
    referenceIntelligence,
  };
}

function hasReferenceCorpus(input?: BuildContextSignalsInput['referenceCorpus']) {
  if (!input) return false;
  return Boolean(
    (input.sourceDocuments && input.sourceDocuments.length > 0) ||
    (input.bibliographyEntries && input.bibliographyEntries.length > 0) ||
    (input.entities && input.entities.length > 0)
  );
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

function buildWorldState(params: {
  engine: BuildContextSignalsInput['engine'];
  report?: BuildContextSignalsInput['report'];
  macro: ReturnType<typeof getMacroCycleSignals>;
  solarTerm?: string;
  lifeStage: LifeStage;
  currentYear: number;
}) {
  const favored = [...params.engine.constitution.yongShen, ...params.engine.constitution.xiShen].slice(0, 2);
  const pressedIndustry = params.macro.industryCycle?.find((item) => item.direction === 'down');
  const risingIndustry = params.macro.industryCycle?.find((item) => item.direction === 'up');
  const currentWindow = params.engine.kline.windows[0];
  const tacitSummary = params.report?.tacitSummary || '';

  const currentPriority = [
    currentWindow?.label ? `当前主窗口是${currentWindow.label}` : '',
    favored.length ? `优先顺着${favored.join('、')}对应的结构发力` : '',
    params.macro.economicCycle?.direction === 'contraction'
      ? '外部处于收缩段，先保底盘再谈扩张'
      : params.macro.economicCycle?.direction === 'expansion'
      ? '外部处于扩张段，可以试探性放大优势'
      : '外部处于过渡段，动作宜分层推进',
  ].filter(Boolean).join('；');

  const actionBias = params.macro.economicCycle?.direction === 'contraction'
    ? '动作偏向收敛、验证、保留回撤空间。'
    : params.macro.economicCycle?.direction === 'expansion'
    ? '动作偏向试探后放大，但仍要围绕命局用神取舍。'
    : '动作偏向先排序、再推进，不宜同时开多线。';

  const timingBias = params.solarTerm
    ? `当前节气参考是${params.solarTerm}，时机判断要结合当下转折感，而不是只看单一年份标签。`
    : '时机判断优先看阶段变化和当前窗口，不把单点年份当作唯一答案。';

  const environmentBias = [
    risingIndustry ? `${risingIndustry.industry}更接近顺势方向，可优先观察。` : '',
    pressedIndustry ? `${pressedIndustry.industry}承压明显，宜保守处理。` : '',
    params.lifeStage === 'rising' || params.lifeStage === 'prime'
      ? '当前更重要的是建立可复利的结构，而不是只求短期结果。'
      : '当前更重要的是减少错误成本，保护长期秩序。',
  ].filter(Boolean).join(' ');

  const guardrails = [
    '任何强结论都必须同时服从命局结构、阶段窗口和现实环境三者一致。',
    '如果结构支持但环境不支持，先缩动作，不直接否定方向。',
    '如果环境看起来很好但命局阶段不承接，先试探，不一次性压满。',
    tacitSummary ? '用户没说出口的隐性状态也是真实输入，不能只按表层问题给答案。': '',
  ].filter(Boolean);

  return {
    summary: [
      `世界状态判断年份：${params.currentYear}`,
      currentPriority,
      actionBias,
      environmentBias,
    ].filter(Boolean).join('；'),
    currentPriority,
    actionBias,
    timingBias,
    environmentBias,
    guardrails,
    tacitLeverage: tacitSummary
      ? `当前还要结合这层没完全说出口的状态：${tacitSummary}`
      : '当前以结构、阶段、环境三层显性信号为主。',
  };
}
