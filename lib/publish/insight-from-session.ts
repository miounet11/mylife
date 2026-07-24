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
  sourceType: 'space_lab' | 'chat' | 'tool' | 'mixed';
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
