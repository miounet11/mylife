import type { TimingProfile, DetectorInput, TimingPoint, MajorTransition } from './types';
import { detectSolarTerms } from './detectors/solar-terms';
import { detectTaiSuiYears } from './detectors/tai-sui';
import { detectDayunTransition } from './detectors/dayun-transition';
import { detectSuiYunBingLin } from './detectors/sui-yun-bing-lin';
import { detectLiuyueTriggers } from './detectors/liuyue-triggers';
import { detectLiunianShenshaMonths } from './detectors/liunian-shensha-month';
import { generatePastValidations } from './past-validation';
import { addDays, getCurrentLiuNianGanZhi } from './lunar-utils';

export function buildTimingProfile(input: DetectorInput): TimingProfile {
  // 1. 跑所有 detector
  const solarTerms = detectSolarTerms(input.currentDate);
  const taiSuiYears = detectTaiSuiYears(input);
  const dayunShifts = detectDayunTransition(input);
  const suiYunBingLin = detectSuiYunBingLin(input);
  const liuyueTriggers = detectLiuyueTriggers(input);
  const shenShaMonths = detectLiunianShenshaMonths(input);
  const pastValidations = generatePastValidations(input);

  // 2. 合并并排序
  const allPoints: TimingPoint[] = [
    ...solarTerms,
    ...taiSuiYears,
    ...dayunShifts,
    ...suiYunBingLin,
    ...liuyueTriggers,
    ...shenShaMonths,
  ];
  allPoints.sort((a, b) => a.startDate.localeCompare(b.startDate));

  // 3. 切分 30d / 12m
  const day30 = addDays(input.currentDate, 30);
  const day365 = addDays(input.currentDate, 365);

  const next_30_days: TimingPoint[] = [];
  const next_12_months: TimingPoint[] = [];

  for (const point of allPoints) {
    const pointDate = new Date(point.startDate);
    if (pointDate <= day30) {
      next_30_days.push(point);
    } else if (pointDate <= day365) {
      next_12_months.push(point);
    }
  }

  // 4. 5 年视图（仅 major transition）
  const next_5_years: MajorTransition[] = [
    ...taiSuiYears.map((p): MajorTransition => ({
      type: 'tai_sui_year',
      year: p.context.year as number,
      ageAtYear: (p.context.year as number) - input.birthDate.getFullYear(),
      rawReason: p.rawReason,
      severity: p.severity,
      context: p.context,
    })),
    ...dayunShifts.map((p): MajorTransition => {
      const dayun = input.dayunResult.dayuns?.find((d) => d.ganZhi === p.context.ganZhi);
      return {
        type: 'dayun_shift',
        year: new Date(p.startDate).getFullYear(),
        ageAtYear: dayun?.startAge || 0,
        rawReason: p.rawReason,
        severity: p.severity,
        context: p.context,
      };
    }),
    ...suiYunBingLin.map((p): MajorTransition => ({
      type: 'sui_yun_bing_lin',
      year: p.context.year as number,
      ageAtYear: (p.context.year as number) - input.birthDate.getFullYear(),
      rawReason: p.rawReason,
      severity: p.severity,
      context: p.context,
    })),
  ].sort((a, b) => a.year - b.year);

  // 5. 元数据
  const birthDateIso = `${input.birthDate.getFullYear()}-${String(input.birthDate.getMonth() + 1).padStart(2, '0')}-${String(input.birthDate.getDate()).padStart(2, '0')}`;
  const birthSignature = `${birthDateIso}_${input.bazi.yearGan}${input.bazi.yearZhi}`;

  return {
    birthSignature,
    baziPillars: `${input.bazi.yearGan}${input.bazi.yearZhi}|${input.bazi.monthGan}${input.bazi.monthZhi}|${input.bazi.dayGan}${input.bazi.dayZhi}|${input.bazi.hourGan}${input.bazi.hourZhi}`,
    computedAt: input.currentDate.toISOString(),
    computedForYear: getCurrentLiuNianGanZhi(input.currentDate),
    past_validations: pastValidations,
    next_30_days,
    next_12_months,
    next_5_years,
  };
}
