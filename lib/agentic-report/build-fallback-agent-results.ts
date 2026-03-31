import { CORE_AGENT_KEYS, type CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';

export function buildFallbackAgentResults(
  context: StructuredAgenticContext,
  keys: CoreAgentKey[] = [...CORE_AGENT_KEYS]
) {
  return keys.reduce<Record<string, unknown>>((accumulator, key) => {
    accumulator[key] = buildAgentFallback(key, context);
    return accumulator;
  }, {});
}

function buildAgentFallback(key: CoreAgentKey, context: StructuredAgenticContext) {
  const constitution = context.engine.constitution;
  const currentDayun = context.engine.dayun.currentDayun || '当前大运';
  const topWindow = topDimensionWindow(context.engine.kline.windows);
  const temporal = context.context.temporal;
  const macro = context.context.macroCycles;
  const geo = context.context.geoClimate;
  const spatial = context.context.spatialFactors;
  const reference = context.context.referenceIntelligence?.overlay;
  const firstAnchor = context.engine.kline.anchorPoints[0];
  const leadIndustry = macro.industryCycle?.[0];
  const currentPoint = resolveCurrentKlinePoint(context);
  const dominantTrack = currentPoint ? getDominantTrack(currentPoint) : null;
  const pressureTrack = currentPoint ? getPressureTrack(currentPoint) : null;
  const careerWindow = topDimensionWindow(context.engine.timeWindows.career);
  const wealthWindow = topDimensionWindow(context.engine.timeWindows.wealth);
  const relationshipWindow = topDimensionWindow(context.engine.timeWindows.relationship);
  const healthWindow = topDimensionWindow(context.engine.timeWindows.health);
  const positiveShenSha = context.engine.shenSha.list.find((item) => item.impact === 'positive');
  const negativeShenSha = context.engine.shenSha.list.find((item) => item.impact === 'negative');
  const favoredElements = compactLabels([...constitution.yongShen, ...constitution.xiShen], 3);
  const avoidedElements = compactLabels(constitution.jiShen, 3);
  const pillarLabels = [
    context.engine.pillars.year,
    context.engine.pillars.month,
    context.engine.pillars.day,
    context.engine.pillars.hour,
  ].filter(Boolean);

  const common = {
    windows: topWindow
      ? [{ label: topWindow.label, score: topWindow.score, advice: `优先围绕 ${topWindow.label} 这段窗口安排动作。` }]
      : [],
  };

  switch (key) {
    case 'core_constitution':
      return {
        summary: [
          `命局主轴围绕${constitution.patternType}展开，日主为${constitution.dayMaster}，当前判断偏${mapStrengthText(constitution.strength)}。`,
          constitution.seasonContext ? `生时环境落在${constitution.seasonContext}` : '',
          pillarLabels.length === 4 ? `四柱落点为${pillarLabels.join('、')}` : '',
          favoredElements.length > 0 ? `更适合顺着${favoredElements.join('、')}去做取舍。` : '',
          avoidedElements.length > 0 ? `涉及${avoidedElements.join('、')}过重的环境或动作，要留出缓冲。` : '',
          positiveShenSha ? `${positiveShenSha.name}可作为顺势放大的辅助信号。` : '',
        ].filter(Boolean).join(' '),
        highlights: [
          `用神：${constitution.yongShen.join('、') || '待继续校正'}`,
          `忌神：${constitution.jiShen.join('、') || '待继续校正'}`,
          `当前阶段：${currentDayun}`,
          positiveShenSha ? `助力神煞：${positiveShenSha.name}` : '',
        ],
        risks: [
          '不能脱离用忌神去放大动作节奏。',
          negativeShenSha ? `${negativeShenSha.name}对应的波动位，需要提前控风险。` : '',
        ].filter(Boolean),
        actions: [
          favoredElements.length > 0 ? `优先把环境、合作对象和行动方向往${favoredElements.join('、')}靠。` : '先按用神方向配置环境和行动。',
        ],
        citations: ['constitution', 'dayun.windows'],
        ...common,
      };
    case 'kline_narrative':
      return {
        summary: [
          `人生K线当前以${currentDayun}为主阶段，关键锚点先看${firstAnchor ? `${firstAnchor.year}年` : '当前阶段'}。`,
          topWindow ? `优先窗口聚焦${topWindow.label}` : '',
          dominantTrack ? `眼下最容易起量的是${mapTrackLabel(dominantTrack.label)}。` : '',
          pressureTrack ? `最容易拖后腿的是${mapTrackLabel(pressureTrack.label)}。` : '',
        ].filter(Boolean).join(' '),
        highlights: context.engine.kline.anchorPoints.map((item) => `${item.year} ${item.type} ${item.score}`),
        risks: [
          '低谷窗口不宜用高风险动作去硬冲。',
          pressureTrack ? `${mapTrackLabel(pressureTrack.label)}板块更需要控节奏。` : '',
        ].filter(Boolean),
        actions: [
          dominantTrack ? `先围绕${mapTrackLabel(dominantTrack.label)}建立主线，再决定推进或收缩。` : '先做阶段判断，再决定推进或收缩。',
        ],
        citations: ['kline.anchorPoints', 'kline.windows'],
        ...common,
      };
    case 'career_wealth':
      return {
        summary: [
          `事业与财富动作要同时服从命局用神、${macro.economicCycle?.label || '当前宏观周期'}与${leadIndustry?.industry || '当前行业周期'}。`,
          careerWindow ? `事业窗口更适合看${careerWindow.label}` : '',
          wealthWindow ? `财富配置更适合围绕${wealthWindow.label}分段推进。` : '',
          favoredElements.length > 0 ? `顺着${favoredElements.join('、')}相关资源去布局，胜率更高。` : '',
        ].filter(Boolean).join(' '),
        highlights: [
          `当前宏观：${macro.economicCycle?.label || '待补充'}`,
          `行业信号：${macro.industryCycle?.[0]?.industry || '综合行业'}`,
          careerWindow ? `事业窗口：${careerWindow.label}` : '',
          wealthWindow ? `财富窗口：${wealthWindow.label}` : '',
        ],
        risks: [
          '宏观承压期应降低高杠杆和重投入。',
          avoidedElements.length > 0 ? `与${avoidedElements.join('、')}过重相关的赛道或打法，短期不要硬推。` : '',
        ].filter(Boolean),
        actions: [
          leadIndustry?.industry ? `先选与${leadIndustry.industry}更匹配、且符合用神方向的赛道。` : '先做强匹配赛道，再谈扩张速度。',
        ],
        citations: ['macroCycles', 'constitution.yongShen'],
        ...common,
      };
    case 'relationship_family':
      return {
        summary: [
          '关系板块更看阶段节奏和现实协同，不适合只按单点好坏判断。',
          relationshipWindow ? `当前更值得观察的关系窗口在${relationshipWindow.label}` : '',
          context.context.humanFactors.relationshipFocus || '',
          reference?.humanHints?.[0] || '',
        ].filter(Boolean).join(' '),
        highlights: [
          context.context.humanFactors.relationshipFocus || '先建立稳定的合作与关系边界。',
          relationshipWindow ? `关系窗口：${relationshipWindow.label}` : '',
          ...(reference?.humanHints?.slice(1, 2) || []),
        ].filter(Boolean),
        risks: [
          '阶段压力增大时，关系问题更容易被事业节奏放大。',
          pressureTrack?.label === 'marriage' ? '当前关系板块本身就偏弱，更要避免情绪化决策。' : '',
        ].filter(Boolean),
        actions: [
          relationshipWindow ? `先在${relationshipWindow.label}对应阶段做观察和校准，再推进关键关系决定。` : '先处理节奏和边界，再推进关系决定。',
        ],
        citations: ['humanFactors', 'timeWindows.relationship', ...(reference ? ['reference.overlay.human'] : [])],
        ...common,
      };
    case 'health_lifestyle':
      return {
        summary: [
          '健康不是单独板块，而是决定你能否承接好运窗口的底盘能力。',
          healthWindow ? `当前身体与作息更该按${healthWindow.label}这段节奏去安排。` : '',
          geo.climateBias?.[0] || '',
        ].filter(Boolean).join(' '),
        highlights: [
          `人生阶段：${context.context.humanFactors.lifeStage}`,
          healthWindow ? `健康窗口：${healthWindow.label}` : '',
          `环境提示：${geo.climateBias?.[0] || '先把作息、恢复和压力管理稳定下来。'}`,
        ],
        risks: [
          '高压阶段最容易用透支换效率。',
          pressureTrack?.label === 'health' ? '当前健康分位不高，更不能用拼命换结果。' : '',
        ].filter(Boolean),
        actions: [
          healthWindow ? `先按${healthWindow.label}的节奏做恢复和负荷管理。` : '优先控制透支和恢复效率。',
        ],
        citations: ['humanFactors', 'geoClimate'],
        ...common,
      };
    case 'strategy_advisor':
      return {
        summary: [
          topWindow ? `当前先按${topWindow.label}这段窗口排序动作。` : '当前先排序动作，再决定发力顺序。',
          dominantTrack ? `${mapTrackLabel(dominantTrack.label)}是当前主线。` : '',
          pressureTrack ? `${mapTrackLabel(pressureTrack.label)}是当前更容易失衡的位置。` : '',
          leadIndustry?.industry ? `现实动作优先落在${leadIndustry.industry}等更顺势的场景。` : '',
          reference?.timingHints?.[0] || '',
        ].filter(Boolean).join(' '),
        highlights: [
          `当前流年：${temporal.currentLiuNian || '待补充'}`,
          `优先窗口：${topWindow?.label || '待补充'}`,
          dominantTrack ? `当前主线：${mapTrackLabel(dominantTrack.label)}` : '',
          pressureTrack ? `当前压力位：${mapTrackLabel(pressureTrack.label)}` : '',
          ...(reference?.timingHints?.slice(1, 2) || []),
        ],
        risks: [
          '没有窗口排序时，容易把精力浪费在低胜率动作上。',
          avoidedElements.length > 0 ? `凡是会放大${avoidedElements.join('、')}失衡的动作，都要降优先级。` : '',
        ].filter(Boolean),
        actions: [
          dominantTrack ? `先把${mapTrackLabel(dominantTrack.label)}的一步关键动作做实，再按窗口复盘。` : '先排序，再推进，再复盘。',
        ],
        citations: ['temporal', 'kline.windows', ...(reference ? ['reference.overlay.timing'] : [])],
        ...common,
      };
    case 'temporal_spatial_advisor':
      return {
        summary: [
          `${temporal.currentSolarTerm || '当前节气'}前后更要重视节奏切换和环境匹配。`,
          `${geo.currentPlace || geo.birthPlace || '当前城市'}与${spatial.favorableDirections[0] || '有利方位'}方向，是这段时间更值得借力的位置。`,
          '先把场域和节奏调顺，再做高成本推进。',
          reference?.geoHints?.[0] || '',
        ].filter(Boolean).join(' '),
        highlights: [
          temporal.currentSolarTerm ? `当前节气：${temporal.currentSolarTerm}` : '当前节气待补充',
          `有利方位：${spatial.favorableDirections.join('、') || '待补充'}`,
          `当前地点：${geo.currentPlace || geo.birthPlace || '待补充'}`,
          ...(reference?.geoHints?.slice(1, 2) || []),
        ],
        risks: ['环境错配时，个人努力会被高摩擦消耗。'],
        actions: ['优先做环境修正，再做高成本推进。'],
        citations: ['temporal', 'geoClimate', 'spatialFactors', 'macroCycles', ...(reference ? ['reference.overlay.geo'] : [])],
        ...common,
      };
    default:
      return {
        summary: '当前专家结果待补充。',
        highlights: [],
        risks: [],
        actions: [],
        citations: [],
        windows: [],
      };
  }
}

function mapStrengthText(strength: string) {
  if (strength === 'strong') return '身强';
  if (strength === 'weak') return '身弱';
  if (strength === 'follow') return '从格';
  return '平衡';
}

function resolveCurrentKlinePoint(context: StructuredAgenticContext) {
  const currentYear = context.context.temporal.currentYear;
  return context.engine.kline.points.find((item) => item.year === currentYear) || context.engine.kline.points[0] || null;
}

function getDominantTrack(point: {
  career: number;
  wealth: number;
  marriage: number;
  health: number;
}) {
  return [
    { label: 'career', score: point.career },
    { label: 'wealth', score: point.wealth },
    { label: 'marriage', score: point.marriage },
    { label: 'health', score: point.health },
  ].sort((left, right) => right.score - left.score)[0];
}

function getPressureTrack(point: {
  career: number;
  wealth: number;
  marriage: number;
  health: number;
}) {
  return [
    { label: 'career', score: point.career },
    { label: 'wealth', score: point.wealth },
    { label: 'marriage', score: point.marriage },
    { label: 'health', score: point.health },
  ].sort((left, right) => left.score - right.score)[0];
}

function topDimensionWindow(windows: Array<{ label: string; score: number }> = []) {
  return [...windows].sort((left, right) => right.score - left.score)[0];
}

function compactLabels(values: string[] = [], limit = 3) {
  return [...new Set(values.filter(Boolean))].slice(0, limit);
}

function mapTrackLabel(key: string) {
  if (key === 'career') return '事业';
  if (key === 'wealth') return '财富';
  if (key === 'marriage') return '关系';
  if (key === 'health') return '健康';
  return key;
}
