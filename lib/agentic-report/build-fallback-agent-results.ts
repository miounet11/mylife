// ── Build Fallback Agent Results V6 ──
// Deterministic fallback when no LLM models are available

import type { StructuredAgenticContext, CoreAgentKey } from './types';

function endOfQuarter(year: number, quarter: number): string {
  const month = quarter * 3;
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

function quarterDueDate(year: number, quarter: number): string {
  return endOfQuarter(year, Math.min(4, Math.max(1, quarter)));
}

export function buildFallbackAgentResults(
  context: StructuredAgenticContext,
  keys: CoreAgentKey[],
): Record<string, any> {
  const { engine, context: ctx } = context;
  const results: Record<string, any> = {};

  for (const key of keys) {
    switch (key) {
      case 'core_constitution':
        results[key] = {
          constitutionSummary: `${engine.constitution.dayMaster}日主，${engine.constitution.patternType}，${engine.constitution.strength} — 用神${engine.constitution.yongShen.join('、') || '待定'}`,
          favorableElements: engine.constitution.yongShen,
          unfavorableElements: engine.constitution.jiShen,
          actions: ['优先补充用神方向资源', '在忌神触达期保持谨慎'],
        };
        break;

      case 'kline_narrative': {
        const peakYears = engine.kline.anchorPoints.filter(a => a.type === 'peak').slice(0, 3).map(a => a.year);
        const troughYears = engine.kline.anchorPoints.filter(a => a.type === 'trough').slice(0, 3).map(a => a.year);
        const currentYear = engine.derivedFacts.currentYear;
        results[key] = {
          currentPhase: (engine.kline.phases ?? []).find(p =>
            p.startYear <= currentYear && p.endYear >= currentYear
          )?.label || '稳定期',
          peakYears,
          troughYears,
          actions: ['高点期积极推进', '低点期守势调整'],
          predictions: [
            peakYears[0]
              ? {
                  category: 'timing',
                  statement: `${peakYears[0]}年可能出现趋势高点窗口，宜把握推进节奏`,
                  dueDate: `${peakYears[0]}-12-31`,
                  window: `${peakYears[0]}年`,
                  confidence: 0.72,
                  verifyChecklist: [
                    '该年整体节奏是否偏积极？',
                    '是否出现预测提到的高峰或突破节点？',
                  ],
                }
              : {
                  category: 'timing',
                  statement: `${currentYear}年Q4适合巩固当前阶段成果并准备下一轮窗口`,
                  dueDate: quarterDueDate(currentYear, 4),
                  window: `${currentYear}年Q4`,
                  confidence: 0.68,
                  verifyChecklist: [
                    'Q4 节奏是否比前三季度更稳定？',
                    '关键事项是否按阶段判断推进？',
                  ],
                },
            troughYears[0]
              ? {
                  category: 'timing',
                  statement: `${troughYears[0]}年可能进入低谷整理期，宜收敛风险与调整预期`,
                  dueDate: `${troughYears[0]}-12-31`,
                  window: `${troughYears[0]}年`,
                  confidence: 0.7,
                  verifyChecklist: [
                    '该年是否出现承压或回调信号？',
                    '是否按建议控制了节奏与风险？',
                  ],
                }
              : {
                  category: 'timing',
                  statement: `${currentYear + 1}年上半年宜先守后攻，避免在弱窗口过度扩张`,
                  dueDate: quarterDueDate(currentYear + 1, 2),
                  window: `${currentYear + 1}年上半年`,
                  confidence: 0.66,
                  verifyChecklist: [
                    '上半年是否以整理和蓄力为主？',
                    '扩张决策是否等到窗口更清晰后再做？',
                  ],
                },
          ],
        };
        break;
      }

      case 'temporal_spatial_advisor':
        results[key] = {
          temporalSignal: `${ctx.temporal.currentSolarTerm}节气，${ctx.temporal.liuNian}流年`,
          spatialSignal: `有利方向：${ctx.spatialFactors.favorableDirections.join('、')}`,
          macroSignal: `${ctx.macroCycles.nationalCycle} · ${ctx.macroCycles.economicCycle}`,
          actions: ['把握节气能量节奏', '顺势而为'],
        };
        break;

      case 'career_wealth': {
        const year = engine.derivedFacts.currentYear;
        const yongElement = engine.constitution.yongShen[0] || '综合';
        results[key] = {
          strategy: {
            primaryTrack: yongElement !== '综合' ? `${yongElement}性行业优先` : '综合发展',
            capitalDiscipline: '稳健为主',
            macroFit: ctx.macroCycles.industryCycle || '正常',
          },
          actions: ['深耕用神行业', '避免忌神方向过度投入'],
          predictions: [
            {
              category: 'career',
              statement: `${year}年Q3-${year + 1}年Q1适合在${yongElement}相关赛道推进职责升级或关键项目`,
              dueDate: quarterDueDate(year + 1, 1),
              window: `${year}年Q3-${year + 1}年Q1`,
              confidence: 0.74,
              verifyChecklist: [
                '是否出现岗位、项目或职责层面的实质变化？',
                '工作优先级是否向用神方向倾斜？',
              ],
            },
            {
              category: 'wealth',
              statement: `${year + 1}年上半年宜稳健积累现金流，避免在忌神触达期做高杠杆决策`,
              dueDate: quarterDueDate(year + 1, 2),
              window: `${year + 1}年上半年`,
              confidence: 0.71,
              verifyChecklist: [
                '现金流或资产结构是否保持稳健？',
                '是否避免了冲动型大额支出或投资？',
              ],
            },
          ],
        };
        break;
      }

      case 'relationship_family':
        results[key] = {
          relationshipFocus: ctx.humanFactors.relationshipFocus,
          collaborationAdvice: ctx.humanFactors.collaborationMode,
          actions: ['保持关系边界', '重视沟通方式'],
        };
        break;

      case 'health_lifestyle':
        results[key] = {
          bodyFocus: '五行偏弱处优先关照',
          recoveryAdvice: '规律作息 + 适度运动',
          actions: ['定期体检', '注意薄弱系统'],
        };
        break;

      case 'strategy_advisor': {
        const year = engine.derivedFacts.currentYear;
        const yong = engine.constitution.yongShen.join('、') || '待定';
        results[key] = {
          topPriority: `用神${yong} — 长期主线`,
          avoidNow: engine.constitution.jiShen.join('、') || '暂无',
          actions: ['补短板、放长板、控节奏'],
          predictions: [
            {
              category: 'timing',
              statement: `${year}年Q4-${year + 1}年Q2是执行「${yong}」主线的优先窗口`,
              dueDate: quarterDueDate(year + 1, 2),
              window: `${year}年Q4-${year + 1}年Q2`,
              confidence: 0.78,
              verifyChecklist: [
                '该窗口内是否完成了 1-2 个与主线相关的关键动作？',
                '是否避免了忌神方向上的过度投入？',
              ],
            },
            {
              category: 'career',
              statement: `${year + 1}年Q1前宜明确一项可验证的职业/项目取舍决策`,
              dueDate: quarterDueDate(year + 1, 1),
              window: `${year + 1}年Q1`,
              confidence: 0.75,
              verifyChecklist: [
                '是否做出了一个清晰的取舍或优先级调整？',
                '决策结果是否能在季度末复盘？',
              ],
            },
          ],
        };
        break;
      }
    }
  }

  return results;
}
