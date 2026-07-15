/**
 * V6 Dashboard Builder — 一页式总览数据构建器
 *
 * 输出结构化的 Dashboard JSON，前端可直接渲染为：
 * - 顶部：核心指标卡片（日主、格局、当前大运、综合评分）
 * - 中左：命局结构卡片
 * - 中右：五行雷达图槽位
 * - 底部：人生趋势 K 线 + 年度热力日历
 */

import type { KlinePointV6, KlineAnchorV6 } from '@/lib/kline-v6';
import type { YongShenResult } from '@/lib/bazi-analyzer';
import type { Pillar } from '@/lib/user-types';

export interface DashboardData {
  version: 'dashboard-v6';
  generatedAt: string;
  hero: DashboardHero;
  constitution: DashboardConstitution;
  elements: DashboardElements;
  timeline: DashboardTimeline;
  strategy: DashboardStrategy;
  disclaimer: DashboardDisclaimer;
}

export interface DashboardHero {
  dayMaster: string;
  dayMasterElement: string;
  pattern: string;
  currentDayun: string;
  currentYear: number;
  age: number;
  overallScore: number;
  overallLabel: string;
}

export interface DashboardConstitution {
  pillars: Array<{ label: string; ganZhi: string; nayin: string; element: string }>;
  dayMasterStrength: string;
  yongShen: string[];
  jiShen: string[];
  specialSignals: string[];
}

export interface DashboardElements {
  radarData: {
    labels: string[];
    strengths: number[];
    yongShenPreference: number[];
  };
  topElement: string;
  bottomElement: string;
  fiveElementInsight: string;
}

export interface DashboardTimeline {
  currentPhase: string;
  currentPhaseDescription: string;
  anchors: KlineAnchorV6[];
  nextPeakHint: string;
  monthlyOutlook: Array<{ month: number; score: number; status: string }>;
}

export interface DashboardStrategy {
  primaryAction: string;
  avoidAction: string;
  bestDirection: string;
  bestColors: string[];
  luckyNumbers: number[];
  timingAdvice: string;
  priorities: string[];
  cautions: string[];
}

export interface DashboardDisclaimer {
  text: string;
  showAtTop: boolean;
  severity: 'info' | 'warning';
  expandedByDefault: boolean;
  version?: string;
}

// ── 主构建函数 ──

interface DashboardInput {
  dayMaster: string;
  pillars: Pillar[];
  yongShen: YongShenResult | null;
  pattern: { type?: string; description?: string };
  fiveElements: Record<string, { strength: number; quality: string }>;
  klineData: KlinePointV6[];
  anchors: KlineAnchorV6[];
  dayunLabel?: string;
  currentAge: number;
  birthPlace?: string;
}

export function buildDashboard(input: DashboardInput): DashboardData {
  const {
    dayMaster, pillars, yongShen, pattern, fiveElements,
    klineData, anchors, dayunLabel, currentAge, birthPlace,
  } = input;

  const dmElement = mapElementCn(dayMaster);
  const currentYear = new Date().getFullYear();
  const thisYearPoint = klineData.find(p => p.year === currentYear);
  const overallScore = thisYearPoint
    ? Math.round(average([thisYearPoint.career, thisYearPoint.wealth, thisYearPoint.marriage, thisYearPoint.health]))
    : 60;

  const sortedElements = Object.entries(fiveElements)
    .sort(([, a], [, b]) => (b.strength || 0) - (a.strength || 0));
  const topEl = sortedElements[0]?.[0] || '';
  const bottomEl = sortedElements[sortedElements.length - 1]?.[0] || '';

  // ── Hero ──
  const hero: DashboardHero = {
    dayMaster: `${dayMaster}（${dmElement}）`,
    dayMasterElement: dmElement,
    pattern: pattern.type || '正格',
    currentDayun: dayunLabel || '数据待查',
    currentYear,
    age: currentAge,
    overallScore,
    overallLabel: overallScore >= 80 ? '运旺可进' : overallScore >= 65 ? '稳中求进' : overallScore >= 50 ? '守势调整' : '蓄力待时',
  };

  // ── Constitution ──
  const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
  const constitution: DashboardConstitution = {
    pillars: pillars.map((p, i) => ({
      label: pillarLabels[i],
      ganZhi: `${p.celestialStem}${p.earthlyBranch}`,
      nayin: p.nayin || '',
      element: GAN_TO_WUXING_CN[p.celestialStem] || '',
    })),
    dayMasterStrength: yongShen?.strengthDesc || '待分析',
    yongShen: yongShen?.yongShen || [],
    jiShen: yongShen?.jiShen || [],
    specialSignals: buildSpecialSignals(yongShen),
  };

  // ── Elements ──
  const elements: DashboardElements = {
    radarData: {
      labels: sortedElements.map(([k]) => mapElementCn(k)),
      strengths: sortedElements.map(([, v]) => v.strength || 0),
      yongShenPreference: sortedElements.map(([k]) => {
        const cn = mapElementCn(k);
        if (yongShen?.yongShen?.includes(cn)) return 85;
        if (yongShen?.xiShen?.includes(cn)) return 65;
        if (yongShen?.jiShen?.includes(cn)) return 25;
        return 50;
      }),
    },
    topElement: mapElementCn(topEl),
    bottomElement: mapElementCn(bottomEl),
    fiveElementInsight: `${mapElementCn(topEl)}旺而${mapElementCn(bottomEl)}弱，${buildElementInsight(topEl, bottomEl, yongShen)}`,
  };

  // ── Timeline ──
  const currentAnchor = findCurrentAnchor(anchors, currentYear);
  const nextPeak = anchors.filter(a => a.type === 'peak' && a.year > currentYear).sort((a, b) => a.year - b.year)[0];

  const timeline: DashboardTimeline = {
    currentPhase: currentAnchor ? `${currentAnchor.type === 'peak' ? '上行' : currentAnchor.type === 'trough' ? '下行' : '盘整'}阶段` : '平稳过渡',
    currentPhaseDescription: currentAnchor?.reason || '当前处于平稳过渡期，无显著锚点信号。',
    anchors,
    nextPeakHint: nextPeak ? `${nextPeak.year}年附近可能出现下一个高点` : '未来几年宜稳步积累',
    monthlyOutlook: buildMonthlyOutlook(klineData.find(p => p.year === currentYear), yongShen),
  };

  // ── Strategy ──
  const strategy: DashboardStrategy = {
    primaryAction: yongShen?.yongShen?.length
      ? `优先补充${yongShen.yongShen.join('、')}对应的资源、人脉和环境`
      : '先稳定日主根基，再向外扩展',
    avoidAction: yongShen?.jiShen?.length
      ? `避开${yongShen.jiShen.join('、')}方向过度投入`
      : '避免在忌神触达期做大额决策',
    bestDirection: yongShen?.yongShen?.[0] ? directionMap[yongShen.yongShen[0]] || '东南' : '因地制宜',
    bestColors: yongShen?.yongShen?.length ? yongShen.yongShen.map(el => colorMap[el] || '').filter(Boolean).slice(0, 3) : ['红色', '紫色'],
    luckyNumbers: yongShen?.yongShen?.length ? yongShen.yongShen.flatMap(el => numberMap[el] || []).slice(0, 3) : [1, 6, 8],
    timingAdvice: overallScore >= 75 ? '当前时机有利，宜积极推进关键决策。' : overallScore >= 60 ? '可做小步验证，不宜大规模铺开。' : '先收敛守势，等待大运/流年转顺再推进。',
    priorities: yongShen?.yongShen?.map((e: string) => `${e}方向优先`) || [],
    cautions: yongShen?.jiShen?.map((e: string) => `注意${e}方向`) || [],
  };

  // ── Disclaimer ──
  const disclaimer: DashboardDisclaimer = {
    text: [
      '本报告由 Life Kline V6 确定性命理引擎生成，所有格局、用神、大运、K线数据均为八字理论和算法计算结果，不构成任何形式的投资、医疗、法律建议。',
      '命理分析仅供参考，人生决策请结合现实情况和专业意见。',
      '如出生时间不准确，时柱相关判断（婚恋、子女、晚年、短期窗口）可能受到影响。',
    ].join('\n'),
    showAtTop: true,
    severity: 'info',
    expandedByDefault: false,
  };

  return {
    version: 'dashboard-v6',
    generatedAt: new Date().toISOString(),
    hero,
    constitution,
    elements,
    timeline,
    strategy,
    disclaimer,
  };
}

// ── 辅助 ──

const GAN_TO_WUXING_CN: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

function mapElementCn(key: string): string {
  const map: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
  return map[key] || key;
}

const directionMap: Record<string, string> = { '木': '东南', '火': '南方', '土': '中', '金': '西方', '水': '北方' };
const colorMap: Record<string, string> = { '木': '绿色', '火': '红色', '土': '黄色', '金': '白色', '水': '黑色/蓝色' };
const numberMap: Record<string, number[]> = { '木': [3, 8], '火': [2, 7], '土': [5, 0], '金': [4, 9], '水': [1, 6] };

function average(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function findCurrentAnchor(anchors: KlineAnchorV6[], currentYear: number): KlineAnchorV6 | undefined {
  // 找最近的一个锚点（当前年份前后 2 年内）
  let closest: KlineAnchorV6 | undefined;
  let minDist = Infinity;
  for (const a of anchors) {
    const dist = Math.abs(a.year - currentYear);
    if (dist < minDist && dist <= 2) {
      minDist = dist;
      closest = a;
    }
  }
  return closest;
}

function buildSpecialSignals(yongShen: YongShenResult | null): string[] {
  const signals: string[] = [];
  if (yongShen?.tiaohuo) signals.push(`调候${yongShen.tiaohuo.element}：${yongShen.tiaohuo.note}`);
  if (yongShen?.tongguan) signals.push(`通关${yongShen.tongguan.element}：${yongShen.tongguan.note}`);
  if (yongShen?.pattern) signals.push(`特殊格局：${yongShen.pattern.pattern}`);
  return signals;
}

function buildElementInsight(top: string, bottom: string, yongShen: YongShenResult | null): string {
  const topCn = mapElementCn(top);
  const bottomCn = mapElementCn(bottom);
  const isTopYong = yongShen?.yongShen?.includes(topCn);
  const isBottomJi = yongShen?.jiShen?.includes(bottomCn);
  if (isTopYong && isBottomJi) return `${topCn}旺且为用神，这是核心优势；${bottomCn}弱且为忌神，不需要刻意补。`;
  if (isTopYong) return `${topCn}旺且为用神，应充分发挥优势。`;
  return `优先补齐${bottomCn}的短板，同时发挥${topCn}的优势。`;
}

function buildMonthlyOutlook(yearPoint: KlinePointV6 | undefined, yongShen: YongShenResult | null): DashboardTimeline['monthlyOutlook'] {
  const elementByMonth = ['水', '木', '木', '火', '火', '土', '土', '金', '金', '水', '水', '木'];
  const base = yearPoint ? Math.round(average([yearPoint.career, yearPoint.wealth, yearPoint.marriage, yearPoint.health])) : 60;

  return elementByMonth.map((el, i) => {
    const isYong = yongShen?.yongShen?.includes(el);
    const isJi = yongShen?.jiShen?.includes(el);
    const score = Math.max(30, Math.min(95, base + (isYong ? 8 : 0) + (isJi ? -8 : 0)));
    return {
      month: i + 1,
      score,
      status: score >= 72 ? 'push' : score >= 58 ? 'steady' : 'caution',
    };
  });
}

import { GAN_TO_WUXING } from '@/lib/bazi-constants';

// Re-export the import
export {};
