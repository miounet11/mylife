// @ts-ignore
import { Solar } from 'lunar-javascript';
import {
  TIANYI_GUIREN, WENCHANG, TAOHUA, YIMA, JIANGXING,
} from '@/lib/shensha-calculator';
import type { TimingPoint, DetectorInput, TimingType, TimingSeverity } from '../types';

export function detectLiunianShenshaMonths(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayGan = input.bazi.dayGan;
  const yearZhi = input.bazi.yearZhi;
  const dayZhi = input.bazi.dayZhi;

  const tianyiBranches = TIANYI_GUIREN[dayGan] || [];
  const wenchangBranch = WENCHANG[dayGan];
  const taohuaBranch = TAOHUA[yearZhi] || TAOHUA[dayZhi];
  const yimaBranch = YIMA[yearZhi] || YIMA[dayZhi];
  const jiangxingBranch = JIANGXING[yearZhi] || JIANGXING[dayZhi];

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
    const liuYueZhi = liuYueGanZhi.charAt(1);

    if (tianyiBranches.includes(liuYueZhi)) {
      points.push(makePoint('liuyue_shensha_tianyi', 'notice', checkDate, {
        shenSha: '天乙贵人', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发天乙贵人，关键时刻容易得到贵人相助`));
    }

    if (liuYueZhi === wenchangBranch) {
      points.push(makePoint('liuyue_shensha_wenchang', 'notice', checkDate, {
        shenSha: '文昌', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发文昌，学习/创作/表达灵感顺畅`));
    }

    if (taohuaBranch && liuYueZhi === taohuaBranch) {
      points.push(makePoint('liuyue_shensha_taohua', 'notice', checkDate, {
        shenSha: '桃花', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发桃花，关系/社交活跃`));
    }

    if (yimaBranch && liuYueZhi === yimaBranch) {
      points.push(makePoint('liuyue_shensha_yima', 'notice', checkDate, {
        shenSha: '驿马', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发驿马，可能涉及变动/出差/远行`));
    }

    if (jiangxingBranch && liuYueZhi === jiangxingBranch) {
      points.push(makePoint('liuyue_shensha_jiangxing', 'notice', checkDate, {
        shenSha: '将星', liuYueGanZhi,
      }, `${liuYueGanZhi}月触发将星，适合担当与主导`));
    }
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
    id: `liuyue_shensha_${type}_${date.getFullYear()}_${date.getMonth() + 1}`,
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
