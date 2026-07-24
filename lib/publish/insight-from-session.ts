/**
 * 将测算/对话摘要整理为可公开发布的文章结构（调用方再写库）。
 */

import type { SuggestedOpening } from '@/lib/fengshui/space/opening-suggest';

export type PublicInsightDraft = {
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  tags: string[];
  domain?: string;
  sourceType: 'space_lab' | 'space_report' | 'naming' | 'chat' | 'tool' | 'mixed';
  metrics?: Record<string, number | string>;
  planSnapshotDataUrl?: string | null;
  profileLinked?: boolean;
};

export function buildSpaceInsightDraft(input: {
  summaryNotes?: string[];
  actions?: string[];
  qimenNotes?: string[];
  meta?: Record<string, unknown>;
  layoutTitle?: string;
  areaSqm?: number;
  geoAddressPublic?: string | null;
}): PublicInsightDraft {
  const layout = input.layoutTitle || '空间结构观察';
  const area = input.areaSqm ? `约 ${Math.round(input.areaSqm)}㎡` : '';
  const title = `空间场笔记：${layout}${area ? ` · ${area}` : ''}`;
  const sections: PublicInsightDraft['sections'] = [];

  if (input.summaryNotes?.length) {
    sections.push({
      heading: '结构观察',
      body: input.summaryNotes.map((n, i) => `${i + 1}. ${n}`).join('\n'),
    });
  }
  if (input.qimenNotes?.length) {
    sections.push({
      heading: '奇门遁甲示意（教学层）',
      body: input.qimenNotes.join('\n'),
    });
  }
  if (input.actions?.length) {
    sections.push({
      heading: '可验证动作',
      body: input.actions.map((a, i) => `${i + 1}. ${a}`).join('\n'),
    });
  }
  if (input.geoAddressPublic) {
    sections.push({
      heading: '区位（已脱敏）',
      body: `参考区位：${input.geoAddressPublic}。具体门牌与坐标已隐藏。`,
    });
  }
  sections.push({
    heading: '阅读说明',
    body: '本文由用户授权将测算摘要公开发布，已去除联系方式与精确地址。内容为结构观察与教学示意，不构成吉凶断语或投资建议。',
  });

  return {
    title,
    summary: (input.summaryNotes?.[0] || '一篇空间结构观察笔记。').slice(0, 160),
    sections,
    tags: ['空间场', '结构观察', '公开笔记', input.layoutTitle || '布局'].filter(Boolean) as string[],
    domain: 'space',
    sourceType: 'space_lab',
  };
}

/** 完整空间场报表 → 公开页（已脱敏字段由调用方保证） */
export function buildSpaceFullReportDraft(input: {
  title?: string;
  summary?: string;
  sections?: Array<{ heading: string; body: string }>;
  metrics?: Record<string, number | string>;
  layoutTitle?: string;
  areaSqm?: number;
  geoAddressPublic?: string | null;
  profileLinked?: boolean;
  planSnapshotDataUrl?: string | null;
  priorityActions?: string[];
}): PublicInsightDraft {
  const layout = input.layoutTitle || '空间结构';
  const area = input.areaSqm ? `约 ${Math.round(input.areaSqm)}㎡` : '';
  const sections = [...(input.sections || [])];
  if (input.priorityActions?.length && !sections.some((s) => s.heading.includes('优先'))) {
    sections.push({
      heading: '优先动作',
      body: input.priorityActions.map((a, i) => `${i + 1}. ${a}`).join('\n'),
    });
  }
  if (input.geoAddressPublic) {
    sections.push({
      heading: '区位（已脱敏）',
      body: `参考区位：${input.geoAddressPublic}`,
    });
  }
  sections.push({
    heading: '阅读说明',
    body: '用户授权公开发布的完整空间场报表摘要，已去除精确地址与隐私。结构教学示意，非吉凶断事。',
  });

  return {
    title: (input.title || `空间场报表：${layout}${area ? ` · ${area}` : ''}`).slice(0, 80),
    summary: (input.summary || '一篇完整空间场结构报表。').slice(0, 200),
    sections: sections.slice(0, 12),
    tags: [
      '空间场',
      '完整报表',
      '公开',
      layout,
      input.profileLinked ? '人宅合参' : '结构评估',
    ].filter(Boolean) as string[],
    domain: 'space',
    sourceType: 'space_report',
    metrics: input.metrics,
    planSnapshotDataUrl: input.planSnapshotDataUrl || null,
    profileLinked: Boolean(input.profileLinked),
  };
}

export function buildNamingInsightDraft(input: {
  mode: 'person' | 'company' | 'product';
  surnameOrBrand?: string;
  candidates: Array<{ name: string; score: number; reason?: string }>;
  summary?: string;
}): PublicInsightDraft {
  const modeLabel =
    input.mode === 'person' ? '个人起名' : input.mode === 'company' ? '公司起名' : '产品起名';
  const head = input.surnameOrBrand ? `${input.surnameOrBrand} · ` : '';
  const body = input.candidates
    .slice(0, 12)
    .map((c, i) => `${i + 1}. ${c.name}（${c.score}分）${c.reason ? ` — ${c.reason}` : ''}`)
    .join('\n');
  return {
    title: `${modeLabel}短名单：${head}结构候选`.slice(0, 60),
    summary: (input.summary || `${modeLabel}候选 ${input.candidates.length} 个`).slice(0, 160),
    sections: [
      { heading: '候选短名单', body: body || '暂无候选' },
      {
        heading: '阅读说明',
        body: '公开短名单已脱敏出生信息。姓名学为文化与结构参考，非命运承诺；公司/产品名请核验工商与商标。',
      },
    ],
    tags: ['起名', modeLabel, '公开短名单'],
    domain: 'naming',
    sourceType: 'naming',
  };
}

export function buildChatInsightDraft(input: {
  topic?: string;
  bullets?: string[];
  rawSummary?: string;
}): PublicInsightDraft {
  const topic = input.topic || '命理结构对话摘录';
  const body =
    input.rawSummary ||
    (input.bullets || []).map((b, i) => `${i + 1}. ${b}`).join('\n') ||
    '对话要点已整理。';
  return {
    title: `对话笔记：${topic}`.slice(0, 60),
    summary: body.slice(0, 160),
    sections: [
      { heading: '要点', body },
      {
        heading: '阅读说明',
        body: '由用户授权公开的对话结构摘要，已脱敏。不替代专业咨询。',
      },
    ],
    tags: ['对话笔记', '公开', topic].slice(0, 6),
    sourceType: 'chat',
  };
}

export type { SuggestedOpening };
