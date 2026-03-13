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
  const topWindow = context.engine.kline.windows[0];
  const temporal = context.context.temporal;
  const macro = context.context.macroCycles;
  const geo = context.context.geoClimate;
  const spatial = context.context.spatialFactors;
  const firstAnchor = context.engine.kline.anchorPoints[0];
  const leadIndustry = macro.industryCycle?.[0];

  const common = {
    windows: topWindow
      ? [{ label: topWindow.label, score: topWindow.score, advice: `优先围绕 ${topWindow.label} 这段窗口安排动作。` }]
      : [],
  };

  switch (key) {
    case 'core_constitution':
      return {
        summary: `命局主轴围绕${constitution.patternType}展开，日主为${constitution.dayMaster}，当前判断偏${mapStrengthText(constitution.strength)}。`,
        highlights: [
          `用神：${constitution.yongShen.join('、') || '待继续校正'}`,
          `忌神：${constitution.jiShen.join('、') || '待继续校正'}`,
          `当前阶段：${currentDayun}`,
        ],
        risks: ['不能脱离用忌神去放大动作节奏。'],
        actions: ['先按用神方向配置环境和行动。'],
        citations: ['constitution', 'dayun.windows'],
        ...common,
      };
    case 'kline_narrative':
      return {
        summary: `人生K线当前以${currentDayun}为主阶段，关键锚点先看${firstAnchor ? `${firstAnchor.year}年` : '当前阶段'}，优先窗口聚焦${topWindow?.label || '当前阶段窗口'}，后续重点看峰谷变化。`,
        highlights: context.engine.kline.anchorPoints.map((item) => `${item.year} ${item.type} ${item.score}`),
        risks: ['低谷窗口不宜用高风险动作去硬冲。'],
        actions: ['先做阶段判断，再决定推进或收缩。'],
        citations: ['kline.anchorPoints', 'kline.windows'],
        ...common,
      };
    case 'career_wealth':
      return {
        summary: `事业与财富动作要同时服从命局用神、${macro.economicCycle?.label || '当前宏观周期'}与${leadIndustry?.industry || '当前行业周期'}，不宜只看个人主观意愿。`,
        highlights: [
          `当前宏观：${macro.economicCycle?.label || '待补充'}`,
          `行业信号：${macro.industryCycle?.[0]?.industry || '综合行业'}`,
        ],
        risks: ['宏观承压期应降低高杠杆和重投入。'],
        actions: ['先做强匹配赛道，再谈扩张速度。'],
        citations: ['macroCycles', 'constitution.yongShen'],
        ...common,
      };
    case 'relationship_family':
      return {
        summary: `关系板块更看阶段节奏和现实协同，不适合只按单点好坏判断。`,
        highlights: [context.context.humanFactors.relationshipFocus || '先建立稳定的合作与关系边界。'],
        risks: ['阶段压力增大时，关系问题更容易被事业节奏放大。'],
        actions: ['先处理节奏和边界，再推进关系决定。'],
        citations: ['humanFactors', 'timeWindows.relationship'],
        ...common,
      };
    case 'health_lifestyle':
      return {
        summary: '健康不是单独板块，而是决定你能否承接好运窗口的底盘能力。',
        highlights: [
          `人生阶段：${context.context.humanFactors.lifeStage}`,
          `环境提示：${geo.climateBias?.[0] || '先把作息、恢复和压力管理稳定下来。'}`,
        ],
        risks: ['高压阶段最容易用透支换效率。'],
        actions: ['优先控制透支和恢复效率。'],
        citations: ['humanFactors', 'geoClimate'],
        ...common,
      };
    case 'strategy_advisor':
      return {
        summary: `当前最优策略不是同时做很多事，而是围绕${topWindow?.label || '当前窗口'}排序动作，尤其要结合${leadIndustry?.industry || '当前行业周期'}和${temporal.currentLiuNian || '当前流年'}。`,
        highlights: [
          `当前流年：${temporal.currentLiuNian || '待补充'}`,
          `优先窗口：${topWindow?.label || '待补充'}`,
        ],
        risks: ['没有窗口排序时，容易把精力浪费在低胜率动作上。'],
        actions: ['先排序，再推进，再复盘。'],
        citations: ['temporal', 'kline.windows'],
        ...common,
      };
    case 'temporal_spatial_advisor':
      return {
        summary: `这份命盘的落地效果会被${temporal.currentSolarTerm || '当前节气'}、立春边界、${geo.currentPlace || geo.birthPlace || '当前城市'}的环境、${spatial.favorableDirections[0] || '有利方位'}和行业周期显著放大或压制。`,
        highlights: [
          temporal.currentSolarTerm ? `当前节气：${temporal.currentSolarTerm}` : '当前节气待补充',
          `有利方位：${spatial.favorableDirections.join('、') || '待补充'}`,
          `当前地点：${geo.currentPlace || geo.birthPlace || '待补充'}`,
        ],
        risks: ['环境错配时，个人努力会被高摩擦消耗。'],
        actions: ['优先做环境修正，再做高成本推进。'],
        citations: ['temporal', 'geoClimate', 'spatialFactors', 'macroCycles'],
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
