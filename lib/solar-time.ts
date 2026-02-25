/**
 * 真太阳时计算器 - 移植自历史版本权威引擎
 *
 * 真太阳时 = 北京时间 + 经度时差 + 均时差
 * 经度时差 = (当地经度 - 120) * 4 分钟  (中国标准时间基于东经120°)
 * 均时差：Spencer公式 (1971)
 *
 * 对于非中国时区：经度时差 = (当地经度 - 标准时区中央经度) * 4 分钟
 */

// @ts-ignore
import { Solar } from 'lunar-javascript';

// ==================== 均时差计算 ====================

/**
 * 计算均时差 (Equation of Time)
 * 返回值单位：分钟
 */
export function calculateEquationOfTime(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // B角度（弧度）
  const B = (360 / 365) * (dayOfYear - 81) * (Math.PI / 180);

  // Spencer's formula (1971)
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/**
 * 计算一年中的第几天
 */
export function getDayOfYear(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ==================== 经度时差计算 ====================

/**
 * 计算地方平太阳时偏移 (仅基于经度)
 * 中国标准时间基于东经120度，每度经度差对应4分钟时差
 */
export function calculateLocalMeanTimeOffset(longitude: number, timezone: number = 8): number {
  const standardLongitude = timezone * 15; // 每个时区15度
  return (longitude - standardLongitude) * 4;
}

/**
 * 计算真太阳时偏移 = 经度时差 + 均时差
 */
export function calculateTrueSolarTimeOffset(longitude: number, date: Date, timezone: number = 8): number {
  const localMeanOffset = calculateLocalMeanTimeOffset(longitude, timezone);
  const equationOfTime = calculateEquationOfTime(date);
  return localMeanOffset + equationOfTime;
}

// ==================== 真太阳时主计算 ====================

export interface TrueSolarTimeResult {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  totalMinutes: number;
  correctionMinutes: number;
  longitudeOffset: number;
  equationOfTime: number;
  description: string;
}

/**
 * 计算真太阳时（完整版）
 */
export function calculateTrueSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  longitude: number,
  timezone: number
): TrueSolarTimeResult {
  // 1. 经度差修正（分钟）
  const standardLongitude = timezone * 15;
  const longitudeOffset = (longitude - standardLongitude) * 4;

  // 2. 均时差修正（分钟）
  const date = new Date(year, month - 1, day);
  const eot = calculateEquationOfTime(date);

  // 3. 总修正量（分钟）
  const totalCorrection = longitudeOffset + eot;

  // 4. 标准时间转总分钟数
  const standardTotalMinutes = hour * 60 + minute + second / 60;

  // 5. 真太阳时
  let solarTotalMinutes = standardTotalMinutes + totalCorrection;

  // 6. 处理日期跨越
  let solarYear = year;
  let solarMonth = month;
  let solarDay = day;

  if (solarTotalMinutes < 0) {
    solarTotalMinutes += 24 * 60;
    const prevDate = new Date(year, month - 1, day - 1);
    solarYear = prevDate.getFullYear();
    solarMonth = prevDate.getMonth() + 1;
    solarDay = prevDate.getDate();
  } else if (solarTotalMinutes >= 24 * 60) {
    solarTotalMinutes -= 24 * 60;
    const nextDate = new Date(year, month - 1, day + 1);
    solarYear = nextDate.getFullYear();
    solarMonth = nextDate.getMonth() + 1;
    solarDay = nextDate.getDate();
  }

  // 7. 转换回时分秒
  const solarHour = Math.floor(solarTotalMinutes / 60);
  const remainMinutes = solarTotalMinutes - solarHour * 60;
  const solarMinute = Math.floor(remainMinutes);
  const solarSecond = Math.round((remainMinutes - solarMinute) * 60);

  // 8. 生成描述
  const sign = totalCorrection >= 0 ? '+' : '';
  const description = `经度修正 ${longitudeOffset >= 0 ? '+' : ''}${longitudeOffset.toFixed(1)}分钟，均时差 ${eot >= 0 ? '+' : ''}${eot.toFixed(1)}分钟，共 ${sign}${totalCorrection.toFixed(1)}分钟`;

  return {
    year: solarYear,
    month: solarMonth,
    day: solarDay,
    hour: solarHour,
    minute: solarMinute,
    second: solarSecond,
    totalMinutes: solarTotalMinutes,
    correctionMinutes: totalCorrection,
    longitudeOffset,
    equationOfTime: eot,
    description,
  };
}

// ==================== 节气边界计算 (来自历史版本 SolarTermCalculator) ====================

/**
 * 检查出生时间是否在节气边界日，影响月柱准确性
 */
export function checkSolarTermBoundary(
  birthDate: string | Date,
  birthHour: number = 0,
  birthMinute: number = 0
): {
  isOnBoundary: boolean;
  solarTerm: string | null;
  needsConfirmation: boolean;
  message?: string;
} {
  let year: number, month: number, day: number;
  if (typeof birthDate === 'string') {
    [year, month, day] = birthDate.split('-').map(Number);
  } else {
    year = birthDate.getFullYear();
    month = birthDate.getMonth() + 1;
    day = birthDate.getDate();
  }

  try {
    const solar = Solar.fromYmdHms(year, month, day, birthHour, birthMinute, 0);
    const lunar = solar.getLunar();
    const prevJie = lunar.getPrevJie();
    const nextJie = lunar.getNextJie();

    if (!prevJie || !nextJie) {
      return { isOnBoundary: false, solarTerm: null, needsConfirmation: false };
    }

    const birthDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const prevJieDate = prevJie.getSolar().toYmd();
    const nextJieDate = nextJie.getSolar().toYmd();

    const isOnBoundary = birthDateStr === prevJieDate || birthDateStr === nextJieDate;

    if (!isOnBoundary) {
      return { isOnBoundary: false, solarTerm: prevJie.getName(), needsConfirmation: false };
    }

    // 在边界日，比较精确时间
    const birthTimeMinutes = birthHour * 60 + birthMinute;
    const jieObj = birthDateStr === prevJieDate ? prevJie : nextJie;
    const jieSolar = jieObj.getSolar();
    const jieTimeMinutes = jieSolar.getHour() * 60 + jieSolar.getMinute();
    const birthBeforeJie = birthTimeMinutes < jieTimeMinutes;

    const jieTimeStr = `${String(jieSolar.getHour()).padStart(2, '0')}:${String(jieSolar.getMinute()).padStart(2, '0')}`;

    return {
      isOnBoundary: true,
      solarTerm: jieObj.getName(),
      needsConfirmation: true,
      message: birthBeforeJie
        ? `出生时间早于${jieObj.getName()}节气交接时间(${jieTimeStr})，应使用前一个月的月柱`
        : `出生时间晚于${jieObj.getName()}节气交接时间(${jieTimeStr})，应使用当月月柱`,
    };
  } catch {
    return { isOnBoundary: false, solarTerm: null, needsConfirmation: false };
  }
}

// ==================== 格式化 ====================

/**
 * 格式化真太阳时为字符串
 */
export function formatSolarTime(st: { hour: number; minute: number; second: number }): string {
  return `${String(st.hour).padStart(2, '0')}:${String(st.minute).padStart(2, '0')}:${String(st.second).padStart(2, '0')}`;
}
