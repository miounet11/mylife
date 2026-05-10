// @ts-ignore
import { Solar } from 'lunar-javascript';
import { BRANCH_CLASH, BRANCH_TRINE, type EarthlyBranch } from '../constants';
import type { TimingPoint, DetectorInput, TimingType, TimingSeverity } from '../types';

const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱'] as const;

export function detectLiuyueTriggers(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const fourPillars: EarthlyBranch[] = [
    input.bazi.yearZhi as EarthlyBranch,
    input.bazi.monthZhi as EarthlyBranch,
    input.bazi.dayZhi as EarthlyBranch,
    input.bazi.hourZhi as EarthlyBranch,
  ];

  for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
    const checkDate = new Date(input.currentDate);
    checkDate.setMonth(checkDate.getMonth() + monthOffset);
    checkDate.setDate(15);

    const solar = Solar.fromYmd(
      checkDate.getFullYear(),
      checkDate.getMonth() + 1,
      checkDate.getDate()
    );
    const lunar = solar.getLunar();
    const liuYueGanZhi = lunar.getMonthInGanZhi();
    const liuYueZhi = liuYueGanZhi.charAt(1) as EarthlyBranch;

    fourPillars.forEach((pillarZhi, idx) => {
      if (BRANCH_CLASH[liuYueZhi] === pillarZhi) {
        points.push(makePoint('liuyue_clash', 'caution', checkDate, {
          pillarIdx: idx,
          pillarZhi,
          liuYueGanZhi,
        }, `${liuYueGanZhi}月地支与${PILLAR_NAMES[idx]}相冲，变动月`));
      }
    });

    fourPillars.forEach((pillarZhi, idx) => {
      if (liuYueZhi === pillarZhi) {
        points.push(makePoint('liuyue_fuyin', 'caution', checkDate, {
          pillarIdx: idx,
          pillarZhi,
          liuYueGanZhi,
        }, `${liuYueGanZhi}月地支与${PILLAR_NAMES[idx]}伏吟，原局力量加倍`));
      }
    });

    BRANCH_TRINE.forEach((triple) => {
      if (triple.includes(liuYueZhi)) {
        const others = triple.filter((b) => b !== liuYueZhi);
        const matchedCount = fourPillars.filter((p) => others.includes(p)).length;
        if (matchedCount >= 2) {
          points.push(makePoint('liuyue_combine', 'notice', checkDate, {
            triple: triple.join(''),
            liuYueGanZhi,
          }, `${liuYueGanZhi}月与命局形成三合，能量增强月`));
        }
      }
    });
  }

  return points;
}

function makePoint(
  type: TimingType,
  severity: TimingSeverity,
  date: Date,
  context: Record<string, unknown>,
  reason: string
): TimingPoint {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    id: `liuyue_${type}_${date.getFullYear()}_${date.getMonth() + 1}_${context.pillarIdx ?? 'x'}_${context.liuYueGanZhi}`,
    type,
    severity,
    startDate: toIsoDate(monthStart),
    endDate: toIsoDate(monthEnd),
    rawReason: reason,
    context,
  };
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
