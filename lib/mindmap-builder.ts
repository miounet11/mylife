/**
 * 命盘思维导图构建器 V6。
 *
 * 输出 markmap / mermaid 兼容的节点树 JSON，可直接渲染为交互式思维导图。
 * 结构：日主 → 五行 → 十神 → 格局 → 用神 → 建议 六层树。
 */

import type { YongShenResult } from '@/lib/bazi-analyzer';
import type { Pillar } from '@/lib/user-types';
import { GAN_TO_WUXING } from '@/lib/bazi-constants';

// ── 思维导图节点类型 ──

export interface MindMapNode {
  content: string;
  children?: MindMapNode[];
  payload?: {
    score?: number;
    level?: 'strong' | 'good' | 'watch' | 'neutral' | 'risk';
    element?: string;
    note?: string;
  };
}

export interface MindMapOutput {
  version: 'mindmap-v6';
  title: string;
  subtitle: string;
  root: MindMapNode;
  flatLabels: string[]; // 给 UI 做搜索/索引
}

// ── 核心构建函数 ──

interface MindMapInput {
  dayMaster: string;
  pillars: Pillar[];
  yongShen: YongShenResult | null;
  pattern: { type?: string; description?: string };
  fiveElements: Record<string, { strength: number; quality: string }>;
  dayunLabel?: string;
  currentAge: number;
}

export function buildMindMap(input: MindMapInput): MindMapOutput {
  const { dayMaster, pillars, yongShen, pattern, fiveElements, dayunLabel, currentAge } = input;
  const dmElement = GAN_TO_WUXING[dayMaster] || '未知';

  // ── Layer 1: 日主 ──
  const root: MindMapNode = {
    content: `日主 ${dayMaster}（${mapElementName(dmElement)}）`,
    payload: { element: dmElement, level: yongShen?.strength === 'strong' || yongShen?.strength === 'very_strong' ? 'strong' : 'neutral' },
    children: [],
  };

  // ── Layer 2: 四柱 ──
  const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
  const pillarNode: MindMapNode = { content: '四柱八字', children: [] };
  pillars.forEach((p, i) => {
    pillarNode.children!.push({
      content: `${pillarLabels[i]}：${p.celestialStem}${p.earthlyBranch}`,
      payload: {
        element: GAN_TO_WUXING[p.celestialStem],
        note: `纳音${p.nayin || ''}`,
      },
    });
  });
  root.children!.push(pillarNode);

  // ── Layer 3: 五行力量 ──
  const fiveElNode: MindMapNode = { content: '五行力量', children: [] };
  const sortedElements = Object.entries(fiveElements)
    .sort(([, a], [, b]) => (b.strength || 0) - (a.strength || 0));
  sortedElements.forEach(([key, val]) => {
    const cnName = mapElementName(key);
    const strengthPct = val.strength?.toFixed(1) || '0';
    fiveElNode.children!.push({
      content: `${cnName}：${strengthPct}% ${val.quality === 'strong' ? '旺' : val.quality === 'weak' ? '弱' : '中'}`,
      payload: {
        score: val.strength,
        level: val.quality === 'strong' ? 'strong' : val.quality === 'weak' ? 'watch' : 'neutral',
        element: key,
      },
    });
  });
  root.children!.push(fiveElNode);

  // ── Layer 4: 十神结构 ──
  const shiShenNode: MindMapNode = { content: '十神结构', children: [] };
  const shiShenList = computeTopShiShen(pillars, dayMaster);
  shiShenList.forEach(ss => {
    shiShenNode.children!.push({
      content: `${ss.name} (${ss.count}透)`,
      payload: { note: ss.meaning },
    });
  });
  root.children!.push(shiShenNode);

  // ── Layer 5: 格局 ──
  const patternNode: MindMapNode = {
    content: `格局：${pattern.type || '正格'}`,
    payload: { level: 'good', note: pattern.description || '按月令和日主综合定格局' },
    children: [{
      content: pattern.description || '格局成形',
      payload: { note: '格局决定人生战略重心' },
    }],
  };
  root.children!.push(patternNode);

  // ── Layer 6: 用神系统 ──
  if (yongShen) {
    const ysNode: MindMapNode = { content: '用神系统', children: [] };

    if (yongShen.yongShen?.length) {
      ysNode.children!.push({
        content: `用神：${yongShen.yongShen.join('、')}`,
        payload: { level: 'strong', note: '优先补充的关键能量' },
      });
    }
    if (yongShen.xiShen?.length) {
      ysNode.children!.push({
        content: `喜神：${yongShen.xiShen.join('、')}`,
        payload: { level: 'good', note: '辅助增强的方向' },
      });
    }
    if (yongShen.jiShen?.length) {
      ysNode.children!.push({
        content: `忌神：${yongShen.jiShen.join('、')}`,
        payload: { level: 'risk', note: '需避开或缓行的方向' },
      });
    }
    if (yongShen.tiaohuo) {
      ysNode.children!.push({
        content: `调候：${yongShen.tiaohuo.element}（${yongShen.tiaohuo.reason}）`,
        payload: { level: 'good', note: yongShen.tiaohuo.note },
      });
    }
    if (yongShen.tongguan) {
      ysNode.children!.push({
        content: `通关：${yongShen.tongguan.element}（${yongShen.tongguan.reason}）`,
        payload: { level: 'good', note: yongShen.tongguan.note },
      });
    }
    root.children!.push(ysNode);
  }

  // ── Layer 7: 大运与建议 ──
  const actionNode: MindMapNode = { content: '当前阶段', children: [] };
  actionNode.children!.push({
    content: dayunLabel ? `大运：${dayunLabel}` : '大运数据待查',
    payload: { level: 'neutral' },
  });
  actionNode.children!.push({
    content: `当前年龄：${currentAge}岁`,
    payload: { note: '以周岁计算' },
  });
  root.children!.push(actionNode);

  return {
    version: 'mindmap-v6',
    title: `${dayMaster}日主命盘全息导图`,
    subtitle: `五行以${sortedElements[0]?.[0] || ''}为最显，以${sortedElements[sortedElements.length - 1]?.[0] || ''}为短板`,
    root,
    flatLabels: collectLabels(root),
  };
}

// ── 辅助函数 ──

function mapElementName(key: string): string {
  const map: Record<string, string> = {
    wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
  };
  return map[key] || key;
}

interface ShiShenSummary {
  name: string;
  count: number;
  meaning: string;
}

const SHI_SHEN_MEANING: Record<string, string> = {
  '正官': '规则、职位、身份、长期秩序',
  '七杀': '压力、执行力、风险控制',
  '正印': '贵人、资质、保护系统、恢复力',
  '偏印': '洞察、学习、非标路径',
  '正财': '稳定收入、预算、责任结构',
  '偏财': '机会捕捉、流动收入、市场嗅觉',
  '食神': '表达、作品、长期输出',
  '伤官': '创新、反规则能力',
  '比肩': '自主性、同辈竞争',
  '劫财': '资源争夺、合作边界',
};

function computeTopShiShen(pillars: Pillar[], dayMaster: string): ShiShenSummary[] {
  const count: Record<string, number> = {};
  pillars.forEach((p, idx) => {
    if (idx === 2) return; // skip 日柱天干
    const ss = computeShiShenForGan(dayMaster, p.celestialStem);
    if (ss && SHI_SHEN_MEANING[ss]) {
      count[ss] = (count[ss] || 0) + 1;
    }
  });
  return Object.entries(count)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, c]) => ({ name, count: c, meaning: SHI_SHEN_MEANING[name] || '' }));
}

import { calculateShiShen } from '@/lib/bazi-constants';
function computeShiShenForGan(dayMaster: string, targetGan: string): string | null {
  return calculateShiShen(dayMaster, targetGan);
}

// ── 将所有节点标签扁平化（给搜索/索引用） ──
function collectLabels(node: MindMapNode): string[] {
  const labels = [node.content];
  if (node.children) {
    for (const child of node.children) {
      labels.push(...collectLabels(child));
    }
  }
  return labels;
}

// ── 导出 markmap 兼容格式 ──
export function toMarkmapFormat(mindMap: MindMapOutput): string {
  function render(node: MindMapNode, depth: number): string {
    const indent = '  '.repeat(depth);
    let text = `${indent}- ${node.content}`;
    if (node.payload?.note) {
      text += `  \`${node.payload.note}\``;
    }
    if (node.children?.length) {
      text += '\n' + node.children.map(c => render(c, depth + 1)).join('\n');
    }
    return text;
  }
  return `# ${mindMap.title}\n\n## ${mindMap.subtitle}\n\n${render(mindMap.root, 0)}`;
}
