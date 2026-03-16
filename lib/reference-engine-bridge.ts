import type { StateVectorData } from '@/lib/report-types';
import type {
  ReferenceDimension,
  ReferenceDimensionSummary,
  ReferenceIntelligencePack,
  ReferenceStateVectorAdjustment,
} from '@/lib/reference-intelligence';

export interface ReferenceContextOverlay {
  timingHints: string[];
  geoHints: string[];
  humanHints: string[];
  directives: string[];
  citations: Array<{
    dimension: ReferenceDimension;
    sourceId: string;
    label: string;
  }>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Number(value.toFixed(2));
}

function mapSummaryToHint(summary: ReferenceDimensionSummary, dimension: ReferenceDimension) {
  const labelMap: Record<ReferenceDimension, string> = {
    tianShi: '天时',
    diLi: '地利',
    renHe: '人和',
  };
  const leading = summary.leadingSubdimensions.join('、') || labelMap[dimension];

  if (!summary.evidenceCount) {
    return `${labelMap[dimension]}外部参照暂不足，维持命盘原始判断权重。`;
  }

  if (summary.score >= 6.2) {
    return `${labelMap[dimension]}外部参照偏强，优先结合${leading}解释当前判断。`;
  }

  if (summary.score <= 4.2) {
    return `${labelMap[dimension]}外部参照偏谨慎，涉及${leading}时要降低激进结论。`;
  }

  return `${labelMap[dimension]}外部参照中性，结合${leading}做解释增强即可。`;
}

export function calibrateStateVectorCurrent(
  current: StateVectorData['current'],
  adjustment: ReferenceStateVectorAdjustment
): StateVectorData['current'] {
  return {
    tianShi: round(clamp(current.tianShi + adjustment.tianShiDelta, 0, 10)),
    diLi: round(clamp(current.diLi + adjustment.diLiDelta, 0, 10)),
    renHe: round(clamp(current.renHe + adjustment.renHeDelta, 0, 10)),
  };
}

export function applyReferenceIntelligenceToStateVector(
  stateVector: StateVectorData,
  pack: ReferenceIntelligencePack
): StateVectorData {
  return {
    ...stateVector,
    current: calibrateStateVectorCurrent(stateVector.current, pack.stateVectorAdjustment),
  };
}

export function buildReferenceContextOverlay(pack: ReferenceIntelligencePack): ReferenceContextOverlay {
  const citations = (['tianShi', 'diLi', 'renHe'] as ReferenceDimension[])
    .flatMap((dimension) =>
      pack.dimensions[dimension].evidence.slice(0, 3).map((item) => ({
        dimension,
        sourceId: item.sourceId,
        label: item.label,
      }))
    );

  return {
    timingHints: [
      mapSummaryToHint(pack.dimensions.tianShi, 'tianShi'),
      ...(pack.dimensions.tianShi.signals.length
        ? [`重点信号：${pack.dimensions.tianShi.signals.slice(0, 4).join('、')}`]
        : []),
    ],
    geoHints: [
      mapSummaryToHint(pack.dimensions.diLi, 'diLi'),
      ...(pack.dimensions.diLi.signals.length
        ? [`重点信号：${pack.dimensions.diLi.signals.slice(0, 4).join('、')}`]
        : []),
    ],
    humanHints: [
      mapSummaryToHint(pack.dimensions.renHe, 'renHe'),
      ...(pack.dimensions.renHe.signals.length
        ? [`重点信号：${pack.dimensions.renHe.signals.slice(0, 4).join('、')}`]
        : []),
    ],
    directives: pack.modelDirectives,
    citations,
  };
}
