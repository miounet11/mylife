/**
 * 开业择时分析
 *
 * 基于传统五行季节对应关系，为商铺开业提供择时窗口建议。
 * 不做精确择日（需要完整历法），而是提供季节性指导和方向性建议。
 */

import type { FengshuiTimingWindow } from './types';

/** 五行对应季节 */
const ELEMENT_SEASON: Record<string, string> = {
  wood: '春季（寅卯辰月）',
  fire: '夏季（巳午未月）',
  earth: '四季月（辰戌丑未月）',
  metal: '秋季（申酉戌月）',
  water: '冬季（亥子丑月）',
};

/** 季节对应五行 */
const SEASON_ELEMENT: Record<string, string> = {
  春: 'wood',
  夏: 'fire',
  秋: 'metal',
  冬: 'water',
};

/** 季节月份数字范围（公历） */
const SEASON_MONTH_RANGE: Array<{ name: string; months: number[]; element: string }> = [
  { name: '春', months: [2, 3, 4], element: 'wood' },
  { name: '夏', months: [5, 6, 7], element: 'fire' },
  { name: '秋', months: [8, 9, 10], element: 'metal' },
  { name: '冬', months: [11, 0, 1], element: 'water' },
  { name: '四季月', months: [3, 6, 9, 0], element: 'earth' }, // 辰戌丑未
];

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/** 相生：a 生 b */
const GENERATING: Record<string, string> = {
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
  metal: 'water',
  water: 'wood',
};

/** 克我者 */
const OVERCOME_BY: Record<string, string> = {
  wood: 'metal',
  earth: 'wood',
  water: 'earth',
  fire: 'water',
  metal: 'fire',
};

/**
 * 从日期字符串提取月份
 */
function getMonthFromDate(dateStr: string): number | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return parseInt(match[2], 10) - 1; // 0-indexed month
}

/**
 * 根据月份确定季节五行
 */
function getSeasonElement(month: number): string {
  for (const season of SEASON_MONTH_RANGE) {
    if (season.months.includes(month)) {
      // 优先返回非土（土月特殊），除非是四季末月
      if (season.name === '四季月') {
        // 检查是否刚好在辰戌丑未的简化映射中
        // 这里简化：3,6,9,0月含土，但也含其他
        // 实际上我们只关心主季节
      }
      return season.element;
    }
  }
  return 'earth';
}

/**
 * 分析开业日期或提供季节性建议
 *
 * @param openingDate 计划开业日期 YYYY-MM-DD，可选
 * @param birthData 用户命局数据（喜用/忌讳五行），可选
 * @param currentYear 当前年份（用于推荐年份）
 */
export function analyzeOpeningDate(
  openingDate: string | undefined,
  birthData: { favorable: string[]; unfavorable: string[]; basisLabel?: string } | null,
  currentYear: number,
): FengshuiTimingWindow {
  const favorable = birthData?.favorable || [];
  const unfavorable = birthData?.unfavorable || [];
  const basisLabel = birthData?.basisLabel || '喜用五行';

  // 场景1：提供了具体开业日期
  if (openingDate) {
    const month = getMonthFromDate(openingDate);
    if (month !== null) {
      const seasonElement = getSeasonElement(month);
      const reasons: string[] = [];

      let matchScore = 50;

      if (favorable.includes(seasonElement)) {
        matchScore = 85;
        reasons.push(`该时段属「${ELEMENT_CN[seasonElement]}」行，与${basisLabel}一致`);
      } else if (favorable.some((f) => GENERATING[f] === seasonElement)) {
        matchScore = 70;
        reasons.push(`该时段属「${ELEMENT_CN[seasonElement]}」行，为${basisLabel}所生`);
      } else if (unfavorable.includes(seasonElement)) {
        matchScore = 30;
        reasons.push(`该时段属「${ELEMENT_CN[seasonElement]}」行，与忌讳五行重叠`);
      } else if (unfavorable.some((f) => OVERCOME_BY[f] === seasonElement)) {
        matchScore = 40;
        reasons.push(`该时段属「${ELEMENT_CN[seasonElement]}」行，被忌讳五行所克`);
      } else {
        reasons.push(`该时段属「${ELEMENT_CN[seasonElement]}」行，与${basisLabel}无明显冲突`);
      }

      // 避免时段
      const avoidPeriods: string[] = [];
      for (const unfav of unfavorable) {
        const avoidSeason = ELEMENT_SEASON[unfav];
        if (avoidSeason) {
          avoidPeriods.push(`${avoidSeason}（${ELEMENT_CN[unfav]}旺）`);
        }
      }

      // 推荐日期：如果分数高就直接推荐，否则找更好的
      const recommendedDate = matchScore >= 60 ? openingDate : null;
      const seasonPreference = ELEMENT_SEASON[seasonElement] || '四季皆可';

      return {
        recommendedDate,
        seasonPreference,
        avoidPeriods: avoidPeriods.length > 0 ? avoidPeriods : ['无明显避讳时段'],
        reason: reasons.join('；') + '。',
      };
    }
  }

  // 场景2：未提供开业日期，根据分析基准提供季节建议
  const seasons: string[] = [];
  for (const fav of favorable) {
    seasons.push(ELEMENT_SEASON[fav]);
  }

  // 生成避免时段
  const avoidPeriods: string[] = [];
  for (const unfav of unfavorable) {
    const avoidSeason = ELEMENT_SEASON[unfav];
    if (avoidSeason) {
      avoidPeriods.push(`${avoidSeason}（${ELEMENT_CN[unfav]}旺，宜避开）`);
    }
  }

  const seasonPreference = seasons.length > 0 ? seasons.join('或') : '四季皆可';

  // 推荐一个大致日期（喜用五行季节的开始）
  let recommendedDate: string | null = null;
  if (favorable.length > 0) {
    const fav = favorable[0];
    // 简化推荐：根据五行选季节的中间月份
    const monthMap: Record<string, string> = {
      wood: '03-15', // 春季中
      fire: '06-15',  // 夏季中
      earth: '09-15', // 秋季中（四季月简化）
      metal: '08-15', // 秋季中
      water: '12-15',  // 冬季中
    };
    const monthDay = monthMap[fav];
    if (monthDay) {
      const thisYearCandidate = `${currentYear}-${monthDay}`;
      const today = new Date().toISOString().slice(0, 10);
      recommendedDate = thisYearCandidate >= today
        ? thisYearCandidate
        : `${currentYear + 1}-${monthDay}`;
    }
  }

  const reason = favorable.length > 0
    ? `${basisLabel}「${favorable.map((f) => ELEMENT_CN[f]).join('、')}」对应上述季节，可优先在此期间比较开业条件。`
    : `无明显${basisLabel}参考，建议选择春秋两季，并结合气候与客流条件判断。`;

  return {
    recommendedDate,
    seasonPreference,
    avoidPeriods: avoidPeriods.length > 0 ? avoidPeriods : ['无明显避讳时段'],
    reason,
  };
}
