/**
 * 根据报告内容生成相关阅读推荐（内部算法，勿把排序策略写进用户文案）
 */

import type { ProReportView, ProTopicCard } from '@/lib/report-pro-view';
import {
  KNOWLEDGE_LEVELS,
  METHOD_NODES,
  TERM_KNOWLEDGE,
  TOPIC_LEARNING,
  VERIFY_NODES,
  type KnowledgeLevel,
  type KnowledgeNode,
  levelMeta,
} from '@/lib/knowledge-ladder';
import { resolveLearningTrackFromCategory } from '@/lib/learning-tracks';

export interface ReportLearningPath {
  /** 一句话引导 */
  headline: string;
  /** 可选副文案；默认空，避免元叙事 */
  manifesto: string;
  /** 建议从哪一层开始 */
  startLevel: KnowledgeLevel;
  /** 分层节点（已按个人报告裁剪） */
  levels: Array<{
    level: KnowledgeLevel;
    title: string;
    subtitle: string;
    phaseLabel: string;
    description: string;
    nodes: KnowledgeNode[];
  }>;
  /** 扁平推荐（报告卡首屏 5–7 条） */
  recommended: KnowledgeNode[];
  /** 最弱议题（优先学） */
  focusTopicKey?: string;
}

function weakestTopic(topics: ProTopicCard[]): ProTopicCard | undefined {
  if (!topics.length) return undefined;
  return [...topics].sort((a, b) => a.score10 - b.score10 || (a.status === 'caution' ? -1 : 1))[0];
}

function strongestCaution(topics: ProTopicCard[]): ProTopicCard | undefined {
  return topics.find((t) => t.status === 'caution') || weakestTopic(topics);
}

export function buildReportLearningPath(
  view: ProReportView,
  opts?: { reportId?: string }
): ReportLearningPath {
  const reportId = opts?.reportId;
  const withReport = (href: string) => {
    if (!reportId) return href;
    if (href.startsWith('/events') || href.startsWith('/predictions')) {
      const sep = href.includes('?') ? '&' : '?';
      return `${href}${sep}reportId=${encodeURIComponent(reportId)}`;
    }
    if (href.startsWith('/knowledge') || href.startsWith('/learn')) {
      const sep = href.includes('?') ? '&' : '?';
      return `${href}${sep}source=report:${encodeURIComponent(reportId)}`;
    }
    return href;
  };

  const focus = strongestCaution(view.topics);
  const focusKey = focus?.key;
  const dayMaster = view.dayMaster || '日主';
  const yong = view.elements.yongShen[0];
  const ji = view.elements.jiShen[0];

  // L0：锚在本报告（标题只写用户动作，不写内部层级叙事）
  const l0: KnowledgeNode[] = [
    {
      id: 'l0-decision',
      level: 'L0',
      kind: 'result',
      title: '决策一页通',
      promise: '结构、阶段与 30 天要点',
      whyNow: '',
      href: '#pro-decision',
      readMinutes: 2,
    },
    {
      id: 'l0-action',
      level: 'L0',
      kind: 'result',
      title: '现在最该做 / 最别做',
      promise: view.nowAction.doThis.slice(0, 48),
      whyNow: '',
      href: '#pro-action',
      readMinutes: 2,
    },
    {
      id: 'l0-overview',
      level: 'L0',
      kind: 'result',
      title: '命理总评',
      promise: '结构、用忌、岁运与时间节奏',
      whyNow: '',
      href: '#pro-overview',
      readMinutes: 8,
    },
    {
      id: 'l0-kline',
      level: 'L0',
      kind: 'result',
      title: '人生 K 线',
      promise: view.klinePeak
        ? `高低点参考 · 高点约 ${view.klinePeak.year} 年`
        : '一生节奏与当前落点',
      whyNow: '',
      href: '#pro-kline',
      readMinutes: 4,
      terms: ['人生K线'],
    },
  ];

  // L1：按报告术语裁剪
  const termKeys = [
    '日主',
    yong || ji ? '用神' : '',
    ji ? '忌神' : '',
    '大运',
    '流年',
    '格局',
    '人生K线',
    '四柱',
  ].filter(Boolean) as string[];

  const seenTermHref = new Set<string>();
  const l1: KnowledgeNode[] = [];
  for (const term of termKeys) {
    const meta = TERM_KNOWLEDGE[term];
    if (!meta || seenTermHref.has(meta.href + term)) continue;
    seenTermHref.add(meta.href + term);
    const personal =
      term === '日主'
        ? `本盘日主「${dayMaster}」`
        : term === '用神' && yong
          ? `本盘用神含「${yong}」`
          : term === '忌神' && ji
            ? `本盘忌神含「${ji}」`
            : meta.plain;
    l1.push({
      id: `l1-${term}`,
      level: 'L1',
      kind: 'term',
      title: term === '日主' || term === '用神' || term === '忌神' ? `${term}说明` : term,
      promise: personal,
      whyNow: '',
      href: withReport(meta.href),
      readMinutes: meta.readMinutes,
      terms: [term],
    });
  }

  // L2 方法
  const l2: KnowledgeNode[] = METHOD_NODES.map((n) => ({
    ...n,
    href: withReport(n.href),
  }));

  // L3 议题：优先 caution / 低分，其次全部四维入口
  const topicOrder = [...view.topics].sort((a, b) => {
    const rank = (t: ProTopicCard) =>
      (t.status === 'caution' ? 0 : t.status === 'steady' ? 1 : 2) * 10 + t.score10;
    return rank(a) - rank(b);
  });

  const l3: KnowledgeNode[] = [];
  for (const t of topicOrder) {
    const pack = TOPIC_LEARNING[t.key];
    if (!pack) continue;
    l3.push({
      id: `l3-${t.key}-article`,
      level: 'L3',
      kind: 'topic',
      title: pack.articleTitle,
      promise: `${t.title} ${t.score10}/10`,
      whyNow: '',
      href: withReport(pack.articleHref),
      readMinutes: 8,
      topicKey: t.key,
    });
    l3.push({
      id: `l3-${t.key}-track`,
      level: 'L3',
      kind: 'track',
      title: pack.track,
      promise: t.title,
      whyNow: '',
      href: withReport(pack.trackHref),
      readMinutes: 20,
      topicKey: t.key,
    });
  }
  if (l3.length < 2) {
    const track = resolveLearningTrackFromCategory(focusKey || 'career');
    l3.push({
      id: 'l3-intro-track',
      level: 'L3',
      kind: 'track',
      title: '入门专题',
      promise: '基础概念与读盘顺序',
      whyNow: '',
      href: withReport(`/learn/${track === 'intro' ? 'intro' : track}`),
      readMinutes: 30,
    });
  }

  const l4: KnowledgeNode[] = VERIFY_NODES.map((n) => ({
    ...n,
    href: withReport(n.href),
  }));

  const byLevel: Record<KnowledgeLevel, KnowledgeNode[]> = {
    L0: l0,
    L1: l1,
    L2: l2,
    L3: l3,
    L4: l4,
  };

  const levels = KNOWLEDGE_LEVELS.map((meta) => ({
    level: meta.level,
    title: meta.title,
    subtitle: meta.subtitle,
    phaseLabel: meta.phaseLabel,
    description: meta.description,
    nodes: byLevel[meta.level] || [],
  }));

  // 内部排序：行动 → 用忌/日主 → 读法 → 焦点议题 → 回访（不对外解释排序逻辑）
  const recommended: KnowledgeNode[] = [];
  const pushUnique = (n?: KnowledgeNode) => {
    if (!n || recommended.some((x) => x.id === n.id)) return;
    recommended.push(n);
  };
  pushUnique(l0[1]);
  pushUnique(l1.find((n) => n.terms?.includes('用神')) || l1[0]);
  pushUnique(l1.find((n) => n.terms?.includes('日主')));
  pushUnique(l2.find((n) => n.id === 'method-read-report'));
  if (focusKey) {
    pushUnique(l3.find((n) => n.id === `l3-${focusKey}-article`));
  } else {
    pushUnique(l3[0]);
  }
  pushUnique(l4.find((n) => n.id === 'verify-predictions') || l4[1]);
  pushUnique(l0[3]); // kline

  return {
    headline: '结合本盘 · 相关阅读',
    manifesto: '',
    startLevel: 'L0',
    levels,
    recommended: recommended.slice(0, 6),
    focusTopicKey: focusKey,
  };
}

export function learningPathPlainText(path: ReportLearningPath): string {
  return path.recommended
    .map((n, i) => `${i + 1}. ${n.title}${n.promise ? ` — ${n.promise}` : ''}\n   ${n.href}`)
    .join('\n');
}

export { levelMeta };
