import type { TimingPoint, DetectorInput } from '../types';
import { findLiChun, getLiuNianGanZhi } from '../lunar-utils';

export function detectSuiYunBingLin(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayuns = input.dayunResult?.dayuns || [];

  for (let yearOffset = 0; yearOffset <= 5; yearOffset++) {
    const checkYear = input.currentDate.getFullYear() + yearOffset;
    const liChunDate = findLiChun(checkYear);

    if (yearOffset === 0 && liChunDate > input.currentDate) continue;

    const liuNianGanZhi = getLiuNianGanZhi(checkYear);
    const ageThatYear = checkYear - input.birthDate.getFullYear();
    const dayunOfYear = dayuns.find((d) =>
      ageThatYear >= d.startAge && ageThatYear < d.startAge + 10
    );

    if (dayunOfYear && dayunOfYear.ganZhi === liuNianGanZhi) {
      points.push({
        id: `suiyunbinglin_${checkYear}`,
        type: 'sui_yun_bing_lin',
        severity: 'critical',
        startDate: toIsoDate(liChunDate),
        endDate: toIsoDate(findLiChun(checkYear + 1)),
        rawReason: `${checkYear}年（${liuNianGanZhi}）大运干支与流年干支完全相同，命理称岁运并临`,
        context: { year: checkYear, ganZhi: liuNianGanZhi },
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
