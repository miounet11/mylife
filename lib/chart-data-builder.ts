/**
 * V6 图表数据构建器。
 *
 * 输出可直接交给前端图表库（ECharts / Chart.js / D3）的结构化 JSON。
 * 包含：雷达图、桑基图、K 线 OHLC、热力日历、阶段时间轴。
 */

import type { Pillar, FortuneAnalysisResult } from '@/lib/user-types';
import type { YongShenResult } from '@/lib/bazi-analyzer';
import type { KlinePointV6, KlineAnchorV6 } from '@/lib/kline-v6';
import { GAN_TO_WUXING } from '@/lib/bazi-constants';

// ── 1. 命局雷达图 ──

export interface RadarChartData {
  version: 'radar-v6';
  title: string;
  indicators: Array<{ name: string; max: number }>;
  series: Array<{
    name: string;
    data: Array<{ name: string; value: number }>;
    areaStyle?: { color: string; opacity: number };
  }>;
}

export function buildRadarChart(input: {
  fiveElements: Record<string, { strength: number }>;
  yongShen: YongShenResult | null;
}): RadarChartData {
  const elements = ['wood', 'fire', 'earth', 'metal', 'water'];
  const cnNames: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
  const colors: Record<string, string> = { wood: '#4CAF50', fire: '#F44336', earth: '#FF9800', metal: '#FFD700', water: '#2196F3' };

  const data = elements.map(el => ({
    name: cnNames[el],
    value: Math.round((input.fiveElements[el]?.strength || 0) * 10) / 10,
  }));

  const yongData = elements.map(el => ({
    name: cnNames[el],
    value: input.yongShen?.yongShen?.includes(el) ? 90 :
           input.yongShen?.xiShen?.includes(el) ? 70 :
           input.yongShen?.jiShen?.includes(el) ? 30 : 50,
  }));

  return {
    version: 'radar-v6',
    title: '命局五行雷达图',
    indicators: elements.map(el => ({ name: cnNames[el], max: 100 })),
    series: [
      { name: '五行力量', data, areaStyle: { color: 'rgba(33,150,243,0.15)', opacity: 0.3 } },
      { name: '用神偏好', data: yongData, areaStyle: { color: 'rgba(76,175,80,0.1)', opacity: 0.2 } },
    ],
  };
}

// ── 2. 桑基图（五行流转） ──

export interface SankeyData {
  version: 'sankey-v6';
  nodes: Array<{ name: string; category: string }>;
  links: Array<{ source: string; target: string; value: number }>;
}

export function buildSankeyDiagram(pillars: Pillar[], yongShen: YongShenResult | null): SankeyData {
  const elements = ['木', '火', '土', '金', '水'];
  const categories = ['天干', '地支', '藏干', '用神'];
  const nodes: SankeyData['nodes'] = [];
  const links: SankeyData['links'] = [];

  // 天干节点
  elements.forEach(el => nodes.push({ name: `天干${el}`, category: '天干' }));
  // 地支节点
  elements.forEach(el => nodes.push({ name: `地支${el}`, category: '地支' }));
  // 用神方向
  elements.forEach(el => nodes.push({ name: `用神${el}`, category: '用神' }));

  // 天干 → 地支 flow
  pillars.forEach(p => {
    const ganEl = GAN_TO_WUXING[p.celestialStem];
    const zhiEl = p.fiveElements?.main;
    if (ganEl && zhiEl) {
      const cnGan = mapToChinese(ganEl);
      const cnZhi = mapToChinese(zhiEl);
      const existing = links.find(l => l.source === `天干${cnGan}` && l.target === `地支${cnZhi}`);
      if (existing) existing.value += 1;
      else links.push({ source: `天干${cnGan}`, target: `地支${cnZhi}`, value: 1 });
    }
  });

  // 地支 → 用神 flow
  if (yongShen?.yongShen) {
    elements.forEach(el => {
      const count = pillars.filter(p => {
        const zhiEl = p.fiveElements?.main;
        return zhiEl && mapToChinese(zhiEl) === el;
      }).length;
      yongShen.yongShen.forEach(ys => {
        const cnYs = mapToChinese(ys);
        if (count > 0) links.push({ source: `地支${el}`, target: `用神${cnYs}`, value: count });
      });
    });
  }

  return { version: 'sankey-v6', nodes, links };
}

function mapToChinese(element: string): string {
  const map: Record<string, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
  return map[element] || element;
}

// ── 3. K 线 OHLC 图 ──

export interface KlineOHLCData {
  version: 'kline-ohlc-v6';
  title: string;
  xAxis: string[]; // 年份标签
  series: Array<{
    name: string;
    type: 'candlestick' | 'line';
    data: Array<number[] | number>;
    markPoints?: Array<{
      name: string;
      coord: [string, number];
      symbol: 'pin' | 'circle';
      itemStyle: { color: string };
    }>;
  }>;
  anchors: KlineAnchorV6[];
}

export function buildKlineOHLC(klineData: KlinePointV6[], anchors: KlineAnchorV6[]): KlineOHLCData {
  const points = klineData.map(p => {
    const vals = [p.career, p.wealth, p.marriage, p.health];
    return {
      year: String(p.year),
      open: Math.round(average(vals) - 3),
      close: Math.round(average(vals) + 2),
      low: Math.min(...vals),
      high: Math.max(...vals),
    };
  });

  const anchorMarks = anchors.map(a => ({
    name: a.type === 'peak' ? '高点' : a.type === 'trough' ? '低点' : '转折',
    coord: [String(a.year), a.score] as [string, number],
    symbol: (a.type === 'peak' ? 'pin' : 'circle') as 'pin' | 'circle',
    itemStyle: { color: a.type === 'peak' ? '#4CAF50' : a.type === 'trough' ? '#F44336' : '#FF9800' },
  }));

  return {
    version: 'kline-ohlc-v6',
    title: '人生趋势 K 线图',
    xAxis: points.map(p => p.year),
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: points.map(p => [p.open, p.close, p.low, p.high]),
        markPoints: anchorMarks,
      },
      {
        name: '均线',
        type: 'line',
        data: points.map(p => Math.round((p.open + p.close) / 2)),
      },
    ],
    anchors,
  };
}

// ── 4. 年度热力日历 ──

export interface MonthlyHeatCell {
  month: number;
  label: string;
  score: number;
  status: 'push' | 'steady' | 'caution';
  element: string;
}

export interface HeatCalendarData {
  version: 'heat-calendar-v6';
  year: number;
  months: MonthlyHeatCell[];
  bestMonths: number[];
  cautionMonths: number[];
}

export function buildHeatCalendar(
  year: number,
  klinePoint: KlinePointV6,
  yongShen: YongShenResult | null,
): HeatCalendarData {
  const elementByMonth = ['水', '木', '木', '火', '火', '土', '土', '金', '金', '水', '水', '木'];
  const months: MonthlyHeatCell[] = [];

  for (let m = 0; m < 12; m++) {
    const el = elementByMonth[m];
    const isYong = yongShen?.yongShen?.includes(el);
    const isJi = yongShen?.jiShen?.includes(el);
    const base = average([klinePoint.career, klinePoint.wealth, klinePoint.marriage, klinePoint.health]);
    const score = clamp(Math.round(base + (isYong ? 8 : 0) + (isJi ? -8 : 0)), 35, 95);
    const status: MonthlyHeatCell['status'] = score >= 72 ? 'push' : score >= 58 ? 'steady' : 'caution';

    months.push({
      month: m + 1,
      label: `${year}.${String(m + 1).padStart(2, '0')}`,
      score,
      status,
      element: el,
    });
  }

  return {
    version: 'heat-calendar-v6',
    year,
    months,
    bestMonths: months.filter(m => m.status === 'push').map(m => m.month),
    cautionMonths: months.filter(m => m.status === 'caution').map(m => m.month),
  };
}

// ── 5. 人生阶段时间轴 ──

export interface TimelineEvent {
  age: number;
  year: number;
  label: string;
  description: string;
  type: 'peak' | 'trough' | 'turning' | 'stable' | 'dayun-start';
  score?: number;
}

export interface TimelineData {
  version: 'timeline-v6';
  events: TimelineEvent[];
  currentAge: number;
}

export function buildTimeline(params: {
  birthYear: number;
  currentAge: number;
  anchors: KlineAnchorV6[];
  dayunWindows?: Array<{ startYear: number; endYear: number; startAge: number; endAge: number; label: string; ganZhi?: string }>;
  klinePoints: KlinePointV6[];
}): TimelineData {
  const events: TimelineEvent[] = [];

  // 大运切换事件
  params.dayunWindows?.forEach(dw => {
    events.push({
      age: dw.startAge,
      year: dw.startYear,
      label: `入${dw.label}大运`,
      description: `${dw.startYear}年起入${dw.ganZhi || dw.label}大运（${dw.startAge}-${dw.endAge}岁），人生节奏发生结构性变化。`,
      type: 'dayun-start',
    });
  });

  // K线锚点事件
  params.anchors.forEach(a => {
    events.push({
      age: a.age,
      year: a.year,
      label: a.type === 'peak' ? `运势高点` : a.type === 'trough' ? `运势低谷` : `运势转折`,
      description: a.reason,
      type: a.type,
      score: a.score,
    });
  });

  // 按年份排序
  events.sort((a, b) => a.year - b.year);

  return {
    version: 'timeline-v6',
    events,
    currentAge: params.currentAge,
  };
}

// ── 6. 五行流转网络图（力导向图） ──

export interface ForceGraphData {
  version: 'force-v6';
  nodes: Array<{
    id: string;
    name: string;
    category: 'pillar' | 'element' | 'shiShen' | 'yongShen';
    value: number;
    symbolSize: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    label: string;
    lineStyle: { color: string; width: number; type: 'solid' | 'dashed' };
  }>;
}

export function buildForceGraph(pillars: Pillar[], yongShen: YongShenResult | null): ForceGraphData {
  const nodes: ForceGraphData['nodes'] = [];
  const links: ForceGraphData['links'] = [];
  const nodeSet = new Set<string>();

  const addNode = (id: string, name: string, category: ForceGraphData['nodes'][0]['category'], value: number) => {
    if (!nodeSet.has(id)) {
      nodes.push({ id, name, category, value, symbolSize: Math.max(20, Math.min(60, value * 12)) });
      nodeSet.add(id);
    }
  };

  // 四柱节点
  const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
  pillars.forEach((p, i) => {
    const id = `pillar-${i}`;
    addNode(id, `${pillarLabels[i]} ${p.celestialStem}${p.earthlyBranch}`, 'pillar', 4 - i);
    const el = GAN_TO_WUXING[p.celestialStem];
    if (el) {
      const cn = mapToChinese(el);
      addNode(`element-${cn}`, cn, 'element', 3);
      links.push({ source: id, target: `element-${cn}`, label: '天干', lineStyle: { color: '#2196F3', width: 2, type: 'solid' } });
    }
  });

  // 用神节点
  yongShen?.yongShen?.forEach(ys => {
    const cn = mapToChinese(ys);
    addNode(`yong-${cn}`, `用神${cn}`, 'yongShen', 5);
    links.push({ source: `element-${cn}`, target: `yong-${cn}`, label: '用神', lineStyle: { color: '#4CAF50', width: 3, type: 'solid' } });
  });

  yongShen?.jiShen?.forEach(js => {
    const cn = mapToChinese(js);
    addNode(`ji-${cn}`, `忌神${cn}`, 'yongShen', 3);
    links.push({ source: `element-${cn}`, target: `ji-${cn}`, label: '忌神', lineStyle: { color: '#F44336', width: 2, type: 'dashed' } });
  });

  return { version: 'force-v6', nodes, links };
}

// ── 辅助 ──

function average(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
