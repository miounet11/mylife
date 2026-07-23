/**
 * 商铺风水分析主编排器
 *
 * 整合行业五行、方位五行、色彩方案、店名分析、择时窗口、布局建议，
 * 输出完整的商铺风水结构化分析报告。
 */

import type { ShopFengshuiInput, ShopFengshuiOutput, ShopLayoutAdvice } from './types';
import { resolveIndustryElement, matchIndustryElement } from './industry-wuxing';
import { resolveDirectionElement, matchDirection } from './direction-wuxing';
import { generateColorScheme } from './color-scheme';
import { analyzeShopName } from './name-analysis';
import { analyzeOpeningDate } from './timing-window';

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

/**
 * 根据门向和行业生成布局建议
 */
function generateLayoutAdvice(
  doorDirection: string,
  industryType: string,
  favorableElements: string[],
): ShopLayoutAdvice {
  // 整体格局
  const overallLayoutMap: Record<string, string> = {
    东: '门朝东，前庭宜开阔通畅，可点缀绿植引生气入局，避免堆阻塞物。',
    东南: '门朝东南，采光通风为佳，前庭宜明亮通透，绿植与水景相得益彰。',
    南: '门朝南，采光充足为主，门面宜明亮大气，避免遮挡阳气入口。',
    西南: '门朝西南，格局宜稳，地面材质取土色或暖色，营造踏实感。',
    西: '门朝西，傍晚西晒需注意遮阳，入口可设金属质感装饰引金气。',
    西北: '门朝西北，格局宜刚柔并济，入口整洁有秩序感，金属元素可点缀。',
    北: '门朝北，采光偏弱需补光，室内宜用暖色调与明亮灯光提升阳气。',
    东北: '门朝东北，格局宜厚重，入口区可设石或陶瓷材质装饰，稳固根基。',
  };
  const overallLayout = overallLayoutMap[doorDirection] || '格局宜方正通透，前庭开阔，避免尖角对冲。';

  // 收银台建议 — 根据门向推算财位（简化：对角位）
  const cashierAdviceMap: Record<string, string> = {
    东: '收银台宜设在西北或西南对角位，背靠实墙，避免正对大门。',
    东南: '收银台宜设在西北或正西对角位，背后有靠，不宜悬空。',
    南: '收银台宜设在正北或东北对角位，避免正对南方大门。',
    西南: '收银台宜设在东北或正东对角位，宜稳固不宜过高。',
    西: '收银台宜设在东南或正东对角位，背靠实墙为佳。',
    西北: '收银台宜设在东南或正南对角位，金属质感台面可增强金气。',
    北: '收银台宜设在正南或西南对角位，避免背对大门。',
    东北: '收银台宜设在西南或正南对角位，宜设于偏静区域。',
  };
  const cashierAdvice = cashierAdviceMap[doorDirection] || '收银台宜设在门对角位，背靠实墙，避免正对大门。';

  // 入口建议 — 根据行业类型
  const entranceAdviceMap: Record<string, string> = {
    餐饮: '入口宜宽大醒目，可设展示橱窗或菜品展示，引食欲之气。',
    零售: '入口宜通透展示，橱窗陈列主推商品，灯光照亮入口区域。',
    科技: '入口宜简洁现代，金属质感与灯光结合，体现科技属性。',
    教育: '入口宜温馨明亮，展示教学成果或荣誉，营造信任感。',
    美容: '入口宜柔和精致，镜面与灯光配合，营造美丽氛围。',
    医疗: '入口宜整洁安静，标识清晰，避免过多装饰。',
    金融: '入口宜庄重大气，金属与石材搭配，体现稳健。',
    文化: '入口宜雅致有书香气息，可展示文化元素。',
    制造: '入口宜实用简洁，通道宽敞便于物流。',
    地产: '入口宜高端大气，沙盘展示区紧邻入口。',
  };
  const entranceAdvice = entranceAdviceMap[industryType] || '入口宜整洁明亮，展示核心产品或服务。';

  // 休息区建议 — 根据喜用五行
  let loungeAdvice: string;
  if (favorableElements.includes('wood')) {
    loungeAdvice = '休息区宜设在东或东南方位，摆放绿植，木质家具为主。';
  } else if (favorableElements.includes('water')) {
    loungeAdvice = '休息区宜设在北方位，可设水景或鱼缸，座位背靠实墙。';
  } else if (favorableElements.includes('fire')) {
    loungeAdvice = '休息区宜设在南方位，暖色调灯光，营造温馨洽谈氛围。';
  } else if (favorableElements.includes('earth')) {
    loungeAdvice = '休息区宜设在西南或东北方位，色调偏暖，陶瓷石材装饰。';
  } else if (favorableElements.includes('metal')) {
    loungeAdvice = '休息区宜设在西或西北方位，金属质感家具，白色系为主。';
  } else {
    loungeAdvice = '休息区宜设在店铺偏静区域，座位背靠实墙，避免正对大门。';
  }

  // 动线建议
  const flowAdviceMap: Record<string, string> = {
    东: '动线宜自东向西延伸，左进右出，形成顺时针回环。',
    东南: '动线宜自东南向西北延伸，入口后右转为佳。',
    南: '动线宜自南向北延伸，入口后设主展示区。',
    西南: '动线宜自西南向东北延伸，动线平缓不急。',
    西: '动线宜自西向东延伸，避免直冲，宜设弯道。',
    西北: '动线宜自西北向东南延伸，入口后左转引导。',
    北: '动线宜自北向南延伸，主通道宽敞明亮。',
    东北: '动线宜自东北向西南延伸，入口后右转引导。',
  };
  const flowAdvice = flowAdviceMap[doorDirection] || '动线宜顺时针回环，避免直冲，主通道宽敞通畅。';

  return {
    overallLayout,
    cashierAdvice,
    entranceAdvice,
    loungeAdvice,
    flowAdvice,
  };
}

/**
 * 商铺风水综合分析
 *
 * @param input 商铺输入信息
 * @param userFavorable 用户喜用五行
 * @param userUnfavorable 用户忌讳五行
 * @returns 完整的商铺风水分析输出
 */
export function analyzeShopFengshui(
  input: ShopFengshuiInput,
  userFavorable: string[],
  userUnfavorable: string[],
  comparisonBasis = '个人喜用五行',
): ShopFengshuiOutput {
  // 1. 解析行业五行
  const industryInfo = resolveIndustryElement(input.industryType);

  // 2. 解析门向五行
  const doorInfo = resolveDirectionElement(input.doorDirection);

  // 3. 行业与喜用神匹配
  const industryMatch = matchIndustryElement(input.industryType, userFavorable);

  // 4. 门向与喜用神匹配
  const doorMatch = matchDirection(input.doorDirection, userFavorable);

  // 5. 生成色彩方案
  const colorScheme = generateColorScheme(userFavorable, input.decorPreference);

  // 6. 店名分析
  const nameAnalysis = analyzeShopName(input.shopName, userFavorable);

  // 7. 开业择时分析
  const currentYear = new Date().getFullYear();
  const timingWindow = analyzeOpeningDate(
    input.openingDate,
    { favorable: userFavorable, unfavorable: userUnfavorable, basisLabel: comparisonBasis },
    currentYear,
  );

  // 8. 布局建议
  const layoutAdvice = generateLayoutAdvice(input.doorDirection, input.industryType, userFavorable);

  // 9. 色彩评分：如果主色和次色五行都在喜用神中，高分
  let colorScore = 50;
  if (userFavorable.includes(colorScheme.primary.element)) colorScore += 25;
  if (userFavorable.includes(colorScheme.secondary.element)) colorScore += 15;
  if (userFavorable.includes(colorScheme.accent.element)) colorScore += 10;
  colorScore = Math.min(100, colorScore);

  // 10. 择时评分
  let timingScore = 50;
  if (timingWindow.recommendedDate) {
    timingScore = 75;
  }
  if (timingWindow.avoidPeriods.length > 0 && timingWindow.avoidPeriods[0] !== '无明显避讳时段') {
    timingScore = Math.max(30, timingScore - 10);
  }

  // 11. 雷达分数
  const radarScores = {
    industry: industryMatch.score,
    direction: doorMatch.score,
    nameScore: nameAnalysis.totalScore,
    colorScore,
    timingScore,
  };

  // 12. 综合评分 — 加权平均
  // 行业 25%, 方位 25%, 店名 15%, 色彩 20%, 择时 15%
  const overallScore = Math.round(
    radarScores.industry * 0.25 +
    radarScores.direction * 0.25 +
    radarScores.nameScore * 0.15 +
    radarScores.colorScore * 0.20 +
    radarScores.timingScore * 0.15,
  );

  // 13. 结构化摘要 — 不说吉凶，只说结构匹配度
  const summaryParts: string[] = [];

  summaryParts.push(`行业「${input.industryType}」五行属${ELEMENT_CN[industryInfo.element]}${industryInfo.subElement ? `/${ELEMENT_CN[industryInfo.subElement]}` : ''}，与${comparisonBasis}匹配度${industryMatch.matchLevel}。`);
  summaryParts.push(`门向「${input.doorDirection}」五行属${ELEMENT_CN[doorInfo.element]}，与${comparisonBasis}匹配度${doorMatch.matchLevel}。`);
  summaryParts.push(`店名五行总分${nameAnalysis.totalScore}。`);
  summaryParts.push(`色彩主色「${colorScheme.primary.label}」(${ELEMENT_CN[colorScheme.primary.element]})，辅色「${colorScheme.secondary.label}」(${ELEMENT_CN[colorScheme.secondary.element]})。`);

  if (timingWindow.recommendedDate) {
    summaryParts.push(`推荐开业日期${timingWindow.recommendedDate}。`);
  } else {
    summaryParts.push(`建议开业时段：${timingWindow.seasonPreference}。`);
  }

  summaryParts.push(`综合匹配度${overallScore}分。`);

  const structuralSummary = summaryParts.join('');

  return {
    overallScore,
    radarScores,
    industryElement: industryInfo.element,
    doorElement: doorInfo.element,
    industryAnalysis: {
      element: industryInfo.element,
      matchLevel: industryMatch.matchLevel,
      description: industryMatch.description,
    },
    doorAnalysis: {
      element: doorInfo.element,
      matchLevel: doorMatch.matchLevel,
      description: doorMatch.description,
      favorableElements: doorInfo.favorableElements,
    },
    colorScheme,
    nameAnalysis,
    timingWindow,
    layoutAdvice,
    structuralSummary,
  };
}
