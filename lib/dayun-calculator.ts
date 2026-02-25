// 大运精确计算
// 原理：男阳年/女阴年顺排，男阴年/女阳年逆排
// 起运年龄：出生到最近节气的天数 / 3（每3天=1岁）

// @ts-ignore
import { Solar, Lunar } from 'lunar-javascript';
import { GAN_TO_WUXING } from './bazi-constants';
import type { YongShenResult } from './bazi-analyzer';

// 天干顺序
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
// 地支顺序
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export interface DayunInfo {
  index: number;          // 第几个大运（0开始）
  startAge: number;       // 起运年龄
  endAge: number;         // 结束年龄
  startYear: number;      // 起运公历年
  endYear: number;        // 结束公历年
  gan: string;            // 天干
  zhi: string;            // 地支
  ganZhi: string;         // 干支
  ganWuxing: string;      // 天干五行
  zhiWuxing: string;      // 地支五行
  yongShenMatch: 'good' | 'neutral' | 'bad'; // 与用神的关系
  quality: 'excellent' | 'good' | 'neutral' | 'bad' | 'poor'; // 综合评级
  description: string;    // 大运描述
  isCurrent: boolean;     // 是否当前大运
}

export interface DayunResult {
  startAge: number;       // 起运年龄
  dayuns: DayunInfo[];    // 10个大运
  currentDayun: DayunInfo | null; // 当前大运
  currentDayunYear: number; // 当前大运第几年（1-10）
}

// 地支五行映射
const ZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// 五行生克关系
const WUXING_SHENG: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
const WUXING_KE: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

/**
 * 计算大运
 */
export function calculateDayun(
  birthDate: Date,
  birthTime: string,
  gender: 'male' | 'female',
  yearGan: string,
  monthPillar: { gan: string; zhi: string },
  yongShen: YongShenResult | null,
  birthYear: number
): DayunResult {
  const [hour, minute] = birthTime.split(':').map(Number);

  // 1. 判断顺逆排
  const isYangGan = ['甲', '丙', '戊', '庚', '壬'].includes(yearGan);
  const shunPai = (gender === 'male' && isYangGan) || (gender === 'female' && !isYangGan);

  // 2. 计算起运年龄（用节气计算）
  const startAge = calculateStartAge(birthDate, hour, minute, shunPai);

  // 3. 生成10个大运干支
  const dayunGanZhi = generateDayunSequence(monthPillar, shunPai);

  // 4. 构建大运信息
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - birthYear;

  const dayuns: DayunInfo[] = dayunGanZhi.map((gz, idx) => {
    const ageStart = startAge + idx * 10;
    const ageEnd = ageStart + 9;
    const yearStart = birthYear + ageStart;
    const yearEnd = birthYear + ageEnd;
    const isCurrent = currentAge >= ageStart && currentAge <= ageEnd;

    const ganWuxing = GAN_TO_WUXING[gz.gan] || '';
    const zhiWuxing = ZHI_WUXING[gz.zhi] || '';

    const yongShenMatch = yongShen
      ? evaluateYongShenMatch(ganWuxing, zhiWuxing, yongShen)
      : 'neutral';

    const quality = determineQuality(yongShenMatch, ganWuxing, zhiWuxing, yongShen);
    const description = generateDayunDescription(gz.gan, gz.zhi, yongShenMatch, quality);

    return {
      index: idx,
      startAge: ageStart,
      endAge: ageEnd,
      startYear: yearStart,
      endYear: yearEnd,
      gan: gz.gan,
      zhi: gz.zhi,
      ganZhi: gz.gan + gz.zhi,
      ganWuxing,
      zhiWuxing,
      yongShenMatch,
      quality,
      description,
      isCurrent,
    };
  });

  const currentDayun = dayuns.find(d => d.isCurrent) || null;
  const currentDayunYear = currentDayun
    ? currentAge - currentDayun.startAge + 1
    : 0;

  return { startAge, dayuns, currentDayun, currentDayunYear };
}

/**
 * 计算起运年龄
 * 顺排：找出生后第一个节（不含气）
 * 逆排：找出生前最近的节
 */
function calculateStartAge(birthDate: Date, hour: number, minute: number, shunPai: boolean): number {
  try {
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();

    let jieQiSolar: ReturnType<typeof Solar.fromYmd>;
    if (shunPai) {
      // 顺排：找下一个节
      const nextJie = lunar.getNextJie();
      jieQiSolar = nextJie.getSolar();
    } else {
      // 逆排：找上一个节
      const prevJie = lunar.getPrevJie();
      jieQiSolar = prevJie.getSolar();
    }

    // 计算天数差
    const birthMs = new Date(year, month - 1, day, hour, minute).getTime();
    const jieQiMs = new Date(
      jieQiSolar.getYear(),
      jieQiSolar.getMonth() - 1,
      jieQiSolar.getDay()
    ).getTime();

    const diffDays = Math.abs(jieQiMs - birthMs) / (1000 * 60 * 60 * 24);

    // 每3天=1岁，取整
    const startAge = Math.round(diffDays / 3);
    return Math.max(1, Math.min(startAge, 10)); // 限制在1-10岁
  } catch {
    return 3; // 默认3岁起运
  }
}

/**
 * 生成大运干支序列
 */
function generateDayunSequence(
  monthPillar: { gan: string; zhi: string },
  shunPai: boolean
): Array<{ gan: string; zhi: string }> {
  const ganIdx = GAN.indexOf(monthPillar.gan);
  const zhiIdx = ZHI.indexOf(monthPillar.zhi);

  if (ganIdx === -1 || zhiIdx === -1) {
    // 兜底：返回默认序列
    return Array.from({ length: 10 }, (_, i) => ({
      gan: GAN[(ganIdx + (shunPai ? i + 1 : -(i + 1)) + 100) % 10],
      zhi: ZHI[(zhiIdx + (shunPai ? i + 1 : -(i + 1)) + 120) % 12],
    }));
  }

  return Array.from({ length: 10 }, (_, i) => {
    const step = shunPai ? i + 1 : -(i + 1);
    return {
      gan: GAN[((ganIdx + step) % 10 + 10) % 10],
      zhi: ZHI[((zhiIdx + step) % 12 + 12) % 12],
    };
  });
}

/**
 * 评估大运与用神的匹配度
 */
function evaluateYongShenMatch(
  ganWuxing: string,
  zhiWuxing: string,
  yongShen: YongShenResult
): 'good' | 'neutral' | 'bad' {
  const { yongShen: ys, xiShen, jiShen } = yongShen;

  let score = 0;
  // 天干权重 0.6，地支权重 0.4
  if (ys.includes(ganWuxing)) score += 3;
  else if (xiShen.includes(ganWuxing)) score += 1;
  else if (jiShen.includes(ganWuxing)) score -= 2;

  if (ys.includes(zhiWuxing)) score += 2;
  else if (xiShen.includes(zhiWuxing)) score += 1;
  else if (jiShen.includes(zhiWuxing)) score -= 1;

  if (score >= 3) return 'good';
  if (score <= -2) return 'bad';
  return 'neutral';
}

/**
 * 综合评级
 */
function determineQuality(
  yongShenMatch: 'good' | 'neutral' | 'bad',
  ganWuxing: string,
  zhiWuxing: string,
  yongShen: YongShenResult | null
): DayunInfo['quality'] {
  if (!yongShen) return 'neutral';

  const isGanYong = yongShen.yongShen.includes(ganWuxing);
  const isZhiYong = yongShen.yongShen.includes(zhiWuxing);
  const isGanJi = yongShen.jiShen.includes(ganWuxing);
  const isZhiJi = yongShen.jiShen.includes(zhiWuxing);

  if (isGanYong && isZhiYong) return 'excellent';
  if (yongShenMatch === 'good') return 'good';
  if (isGanJi && isZhiJi) return 'poor';
  if (yongShenMatch === 'bad') return 'bad';
  return 'neutral';
}

/**
 * 生成大运描述
 */
function generateDayunDescription(
  gan: string,
  zhi: string,
  match: 'good' | 'neutral' | 'bad',
  quality: DayunInfo['quality']
): string {
  const qualityMap = {
    excellent: '大吉之运，诸事顺遂',
    good: '吉运，事业财运均有进展',
    neutral: '平稳之运，宜守成',
    bad: '运势偏弱，宜谨慎行事',
    poor: '凶运，需防重大变故',
  };
  return `${gan}${zhi}大运，${qualityMap[quality]}。`;
}
