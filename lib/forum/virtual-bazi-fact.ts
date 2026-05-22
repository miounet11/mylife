// v5-D73 论坛虚拟命盘事实包生成器
// 铁律：内容 = 引擎事实 + 提示词 + LLM 修饰
// 这里负责"引擎事实"——基于随机虚拟生日跑 fortune-engine，抽出可被 LLM 引用的命理判断
//
// 输入: rng（确定性种子）
// 输出: VirtualBaziFact，包含真实算出来的四柱/日主/格局/用神/当前大运/流年互动
//   LLM 在 prompt 里只能"引用"这些字段，不允许自行编造其它命理判断

import { analyzeFortune } from '@/lib/fortune-engine';

export interface VirtualBaziFact {
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourGanZhi: string;
  dayMaster: string;
  dayMasterElement: string;
  strength: string;        // strong / neutral / weak（label 化中文）
  pattern: string;         // 格局
  yongShen: string[];      // 用神（中文五行）
  jiShen: string[];        // 忌神
  currentDaYun: string;    // 当前大运干支
  currentLiuNian: string;  // 当前流年
  interaction: string;     // 大运流年互动
  gender: 'male' | 'female';
  ageRange: string;
  birthYear: number;
}

const ELEMENT_LABEL: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

const STRENGTH_LABEL: Record<string, string> = {
  very_strong: '过旺',
  strong: '偏旺',
  neutral: '中和',
  weak: '偏弱',
  very_weak: '过弱',
};

function elLabel(e: string | undefined | null): string {
  if (!e) return '';
  return ELEMENT_LABEL[e] || e;
}

/**
 * 用 rng 造一个虚拟生日，跑 fortune-engine 拿真实事实包
 */
export function buildVirtualBaziFact(rng: () => number): VirtualBaziFact | null {
  const birthYear = 1970 + Math.floor(rng() * 36);
  const birthMonth = Math.floor(rng() * 12) + 1;
  const birthDay = Math.floor(rng() * 28) + 1;
  const hour = Math.floor(rng() * 24);
  const minute = Math.floor(rng() * 60);
  const gender: 'male' | 'female' = rng() < 0.5 ? 'male' : 'female';
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay, hour, minute);
  const birthTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  let result;
  try {
    result = analyzeFortune('虚拟提问者', birthDate, birthTime, '北京', 8, gender, { sect: 2, useTrueSolarTime: false });
  } catch (err) {
    console.warn('[forum/virtual-bazi-fact] engine failed:', (err as Error).message);
    return null;
  }

  const pillars = result.basic?.pillars;
  if (!pillars || pillars.length !== 4) return null;

  const yearGZ = pillars[0].celestialStem + pillars[0].earthlyBranch;
  const monthGZ = pillars[1].celestialStem + pillars[1].earthlyBranch;
  const dayGZ = pillars[2].celestialStem + pillars[2].earthlyBranch;
  const hourGZ = pillars[3].celestialStem + pillars[3].earthlyBranch;
  const dayMaster = pillars[2].celestialStem;
  const dayMasterElement = elLabel(pillars[2].fiveElements?.main);

  const patternStrength = result.pattern?.strength;
  const strength = STRENGTH_LABEL[patternStrength as keyof typeof STRENGTH_LABEL] || '中和';
  const patternName = result.pattern?.type || '正格';

  // 引擎直接给的用神/忌神（顶层 advice）
  const adv = result.advice as { yongShen?: string[]; jiShen?: string[] } | undefined;
  const yongShen = (adv?.yongShen || []).map(elLabel).filter(Boolean);
  const jiShen = (adv?.jiShen || []).map(elLabel).filter(Boolean);

  const currentDaYun = result.fortune?.currentDaYun || '';
  const currentLiuNian = result.fortune?.currentLiuNian || '';
  const interaction = (result.fortune?.interaction || '').replace(/\s+/g, ' ').trim();

  const age = 2026 - birthYear;
  const lo = Math.floor(age / 5) * 5;
  const ageRange = `${lo}-${lo + 5}`;

  return {
    yearGanZhi: yearGZ,
    monthGanZhi: monthGZ,
    dayGanZhi: dayGZ,
    hourGanZhi: hourGZ,
    dayMaster,
    dayMasterElement,
    strength,
    pattern: patternName,
    yongShen,
    jiShen,
    currentDaYun,
    currentLiuNian,
    interaction,
    gender,
    ageRange,
    birthYear,
  };
}

/**
 * 把事实包格式化为给 LLM 的"事实清单"
 * LLM 必须只引用这里的字段，不允许编造其他命理判断
 */
export function formatFactPackForPrompt(fact: VirtualBaziFact): string {
  const lines = [
    `性别：${fact.gender === 'male' ? '男' : '女'}，年龄段：${fact.ageRange}`,
    `四柱：年柱 ${fact.yearGanZhi} / 月柱 ${fact.monthGanZhi} / 日柱 ${fact.dayGanZhi} / 时柱 ${fact.hourGanZhi}`,
    `日主：${fact.dayMaster}（${fact.dayMasterElement}），日主强弱：${fact.strength}`,
    `格局：${fact.pattern}`,
  ];
  if (fact.yongShen.length) lines.push(`用神：${fact.yongShen.join('、')}`);
  if (fact.jiShen.length) lines.push(`忌神：${fact.jiShen.join('、')}`);
  if (fact.currentDaYun) lines.push(`当前大运：${fact.currentDaYun}`);
  if (fact.currentLiuNian) lines.push(`当前流年：${fact.currentLiuNian}`);
  if (fact.interaction) lines.push(`大运流年互动：${fact.interaction.slice(0, 80)}`);
  return lines.join('\n');
}
