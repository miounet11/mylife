import { Solar } from 'lunar-javascript';
import { GAN_TO_WUXING } from '@/lib/bazi-constants';

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const WUXING_CN: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

export interface DayScore {
  date: string;
  ganZhi: string;
  score: number;
  label: '宜' | '平' | '忌';
  reason: string;
}

function getDayGanZhi(date: Date): string {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  return ec.getDay();
}

function scoreGanZhiAgainstYongShen(
  ganZhi: string,
  favorable: string[],
  unfavorable: string[],
): { score: number; reason: string } {
  const gan = ganZhi[0] || '';
  const zhi = ganZhi[1] || '';
  const ganWx = WUXING_CN[GAN_TO_WUXING[gan] || ''] || '';
  let score = 50;
  const notes: string[] = [];

  if (favorable.includes(ganWx)) {
    score += 18;
    notes.push(`日干五行${ganWx}扶用神`);
  }
  if (unfavorable.includes(ganWx)) {
    score -= 15;
    notes.push(`日干五行${ganWx}触忌神`);
  }

  const zhiWxMap: Record<string, string> = {
    寅: '木', 卯: '木', 巳: '火', 午: '火', 辰: '土', 戌: '土', 丑: '土', 未: '土',
    申: '金', 酉: '金', 亥: '水', 子: '水',
  };
  const zhiWx = zhiWxMap[zhi] || '';
  if (favorable.includes(zhiWx)) {
    score += 10;
    notes.push(`日支${zhi}助用神`);
  }
  if (unfavorable.includes(zhiWx)) {
    score -= 8;
    notes.push(`日支${zhi}犯忌神`);
  }

  return {
    score: Math.min(95, Math.max(15, score)),
    reason: notes.length ? notes.join('；') : `流日${ganZhi}中性`,
  };
}

export function scoreUpcomingDays(
  favorable: string[],
  unfavorable: string[],
  days = 21,
  start = new Date(),
): DayScore[] {
  const results: DayScore[] = [];
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);

  for (let i = 0; i < days; i += 1) {
    const ganZhi = getDayGanZhi(cursor);
    const { score, reason } = scoreGanZhiAgainstYongShen(ganZhi, favorable, unfavorable);
    results.push({
      date: cursor.toISOString().slice(0, 10),
      ganZhi,
      score,
      label: score >= 68 ? '宜' : score <= 42 ? '忌' : '平',
      reason,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

export function pickBestDays(scored: DayScore[], count = 3): DayScore[] {
  return [...scored].sort((a, b) => b.score - a.score).slice(0, count);
}

export function pickAvoidDays(scored: DayScore[], count = 2): DayScore[] {
  return [...scored].sort((a, b) => a.score - b.score).slice(0, count);
}

export { TIAN_GAN, WUXING_CN };