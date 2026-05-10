import {
  BRANCH_CLASH, BRANCH_PUNISH, BRANCH_HARM, BRANCH_BREAK,
  type EarthlyBranch
} from '../constants';
import type { TimingPoint, DetectorInput, TimingType, TimingSeverity } from '../types';
import { findLiChun, getLiuNianGanZhi } from '../lunar-utils';

export function detectTaiSuiYears(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const yearZhi = input.bazi.yearZhi as EarthlyBranch;

  for (let yearOffset = 0; yearOffset <= 5; yearOffset++) {
    const checkYear = input.currentDate.getFullYear() + yearOffset;
    const liChunDate = findLiChun(checkYear);

    // 立春前不算本年触发
    if (yearOffset === 0 && liChunDate > input.currentDate) {
      continue;
    }

    const liuNianGanZhi = getLiuNianGanZhi(checkYear);
    const liuNianZhi = liuNianGanZhi.charAt(1) as EarthlyBranch;

    let type: TimingType | null = null;
    let severity: TimingSeverity = 'caution';
    let reason = '';

    if (liuNianZhi === yearZhi) {
      type = 'tai_sui_value';
      severity = 'critical';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相同，值太岁（本命年）`;
    } else if (BRANCH_CLASH[liuNianZhi] === yearZhi) {
      type = 'tai_sui_clash';
      severity = 'critical';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相冲`;
    } else if (BRANCH_PUNISH[liuNianZhi]?.includes(yearZhi)) {
      type = 'tai_sui_punish';
      severity = 'caution';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相刑`;
    } else if (BRANCH_HARM[liuNianZhi] === yearZhi) {
      type = 'tai_sui_harm';
      severity = 'caution';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相害`;
    } else if (BRANCH_BREAK[liuNianZhi] === yearZhi) {
      type = 'tai_sui_break';
      severity = 'notice';
      reason = `${checkYear}年（${liuNianGanZhi}）流年地支与年柱地支相破`;
    }

    if (type) {
      points.push({
        id: `taisui_${type}_${checkYear}`,
        type,
        severity,
        startDate: toIsoDate(liChunDate),
        endDate: toIsoDate(findLiChun(checkYear + 1)),
        rawReason: reason,
        context: {
          year: checkYear,
          liuNianGanZhi,
          birthYearZhi: yearZhi,
        },
      });
    }
  }

  return points;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
