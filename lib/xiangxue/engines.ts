/**
 * 面相 / 手相结构引擎（文化观察层）
 * 确定性启发式 + LLM 视觉结果合并；禁止疾病/寿命/定命断语
 */

import type { XiangxueDimScore, XiangxueKind, XiangxueObservation, XiangxueSessionResult } from './types';
import type { SavedUserMedia } from '@/lib/user-media-store';

const FACE_DIMS: Array<{ id: string; label: string }> = [
  { id: 'symmetry', label: '五官协调' },
  { id: 'forehead', label: '额部开阔度' },
  { id: 'brow_eye', label: '眉眼神采' },
  { id: 'nose', label: '鼻梁结构' },
  { id: 'mouth', label: '口唇线条' },
  { id: 'jaw', label: '下颌轮廓' },
  { id: 'tianshi', label: '天时（生辰）' },
  { id: 'photo', label: '照片可用性' },
];

const PALM_DIMS: Array<{ id: string; label: string }> = [
  { id: 'life_line', label: '生命线走向' },
  { id: 'head_line', label: '智慧线' },
  { id: 'heart_line', label: '感情线' },
  { id: 'fate_line', label: '事业/命运线' },
  { id: 'mounts', label: '掌丘分布' },
  { id: 'hand_shape', label: '手型比例' },
  { id: 'tianshi', label: '天时（生辰）' },
  { id: 'photo', label: '照片可用性' },
];

export function heuristicXiangxue(input: {
  kind: XiangxueKind;
  media: SavedUserMedia;
  hasBirth: boolean;
  yongShen?: string[];
  side?: string;
  gender?: string;
}): Omit<XiangxueSessionResult, 'media' | 'llmUsed' | 'birth'> {
  const dimsBase = input.kind === 'face' ? FACE_DIMS : PALM_DIMS;
  const photoScore = input.media.bytes > 80_000 ? 78 : input.media.bytes > 30_000 ? 62 : 45;
  const birthBoost = input.hasBirth ? 18 : 0;

  const dims: XiangxueDimScore[] = dimsBase.map((d) => {
    if (d.id === 'photo') {
      return {
        id: d.id,
        label: d.label,
        score: photoScore,
        note:
          photoScore >= 70
            ? '清晰度大致可用'
            : '建议补拍更清晰、光线均匀的照片',
      };
    }
    if (d.id === 'tianshi') {
      return {
        id: d.id,
        label: d.label,
        score: 45 + birthBoost,
        note: input.hasBirth
          ? `已关联生辰${input.yongShen?.length ? ` · 用神 ${input.yongShen.join('、')}` : ''}`
          : '未填生辰：仅作图像结构观察',
      };
    }
    // 稳定伪随机：由 media sha 派生，避免每次刷新乱跳
    const seed = hashStr(input.media.sha256 + d.id);
    const score = 52 + (seed % 28);
    return {
      id: d.id,
      label: d.label,
      score,
      note: input.kind === 'face' ? '结构示意（启发式）' : '掌纹结构示意（启发式）',
    };
  });

  const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length);

  const observations: XiangxueObservation[] =
    input.kind === 'face'
      ? [
          {
            id: 'o1',
            title: '整体观察',
            body: '当前以照片结构可用性与五官分区协调度为主，不构成性格定论或命运判断。',
            tone: 'default',
          },
          {
            id: 'o2',
            title: '神采与精神面',
            body: '眉眼与额部在清晰照片中最易观察；若光线过暗或侧脸过大，该区可信度下降。',
            tone: 'positive',
          },
          {
            id: 'o3',
            title: '边界',
            body: '面相仅为文化结构观察，不能用于疾病、寿命、婚恋必然或身份推断。',
            tone: 'muted',
          },
        ]
      : [
          {
            id: 'o1',
            title: '掌纹结构',
            body: '优先观察生命线、智慧线、感情线是否连贯、分叉与深浅，而非吉凶标签。',
            tone: 'default',
          },
          {
            id: 'o2',
            title: '拍摄建议',
            body: '手心向上、五指自然张开、掌心占画面 60% 以上，避免强反光。',
            tone: 'positive',
          },
          {
            id: 'o3',
            title: '边界',
            body: '手相不能判断疾病、寿命、财运必然或婚姻定数；仅作掌纹文化观察与自我复盘。',
            tone: 'muted',
          },
        ];

  const actions =
    input.kind === 'face'
      ? [
          '若需更高可信度，请补正面、自然光、无浓妆滤镜照片',
          input.hasBirth ? '可在结果页对照生辰用神做「人像 + 天时」综合阅读' : '补充生辰以开启天时维',
          '重要决策请结合八字完整报告与现实行动，不单靠面相',
        ]
      : [
          '补拍左右手各一张便于对照',
          '21 天内同一光线再拍一张，观察掌纹是否因拍摄差异而变',
          input.hasBirth ? '结合用神看「行动节奏」而非断定结果' : '可补充生辰做天时交叉',
        ];

  const visibleTags =
    input.kind === 'face'
      ? ['正面/近正面', '五官分区', photoScore >= 70 ? '可用图' : '图质一般']
      : ['掌心', '三大主线', photoScore >= 70 ? '可用图' : '图质一般', input.side || '手别未知'];

  return {
    schema: 'life-kline.xiangxue.v1',
    kind: input.kind,
    title: input.kind === 'face' ? '面相结构观察' : '手相结构观察',
    summary:
      input.kind === 'face'
        ? `综合结构分约 ${overall}。以照片可用性与五官协调为主，已${input.hasBirth ? '结合' : '未结合'}生辰天时。`
        : `掌纹结构综合约 ${overall}。三大主线与掌丘为示意观察，已${input.hasBirth ? '结合' : '未结合'}生辰。`,
    generatedAt: new Date().toISOString(),
    overallScore: overall,
    dims,
    observations,
    actions,
    disclaimers: [
      '本结果为相学文化与结构观察，非医学诊断、非命运定数。',
      '不得用于歧视、恐吓或替代专业医疗/法律意见。',
      '用户照片默认私有；授权后才可用于脱敏线图与 SEO 内容。',
    ],
    visibleTags,
  };
}

export function mergeLlmXiangxue(
  base: Omit<XiangxueSessionResult, 'media' | 'llmUsed' | 'birth'>,
  llm: {
    summary?: string;
    observations?: Array<{ title: string; body: string }>;
    actions?: string[];
    dimNotes?: Record<string, string>;
    tags?: string[];
  } | null,
): Omit<XiangxueSessionResult, 'media' | 'llmUsed' | 'birth'> {
  if (!llm) return base;
  const dims = base.dims.map((d) =>
    llm.dimNotes?.[d.id] ? { ...d, note: llm.dimNotes[d.id] } : d,
  );
  const observations =
    llm.observations?.length
      ? llm.observations.slice(0, 6).map((o, i) => ({
          id: `llm-${i}`,
          title: o.title.slice(0, 40),
          body: sanitizeText(o.body).slice(0, 500),
          tone: 'default' as const,
        }))
      : base.observations;
  return {
    ...base,
    summary: llm.summary ? sanitizeText(llm.summary).slice(0, 280) : base.summary,
    dims,
    observations,
    actions: llm.actions?.length
      ? llm.actions.map((a) => sanitizeText(a).slice(0, 120)).slice(0, 6)
      : base.actions,
    visibleTags: [...new Set([...(base.visibleTags || []), ...(llm.tags || [])])].slice(0, 12),
  };
}

function sanitizeText(s: string): string {
  return s
    .replace(/必死|短命|绝症|克妻|克夫|牢狱/g, '（已屏蔽不当表述）')
    .replace(/\s+/g, ' ')
    .trim();
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const FACE_VISION_SYSTEM = `你是相学文化观察助手。根据人脸照片做「结构观察」，禁止：疾病诊断、寿命、吉凶恐吓、身份识别、人格定论、婚姻/财富必然。
输出 JSON：
{"summary":"80字内","observations":[{"title":"","body":""}],"actions":["可执行建议"],"dimNotes":{"symmetry":"","forehead":"","brow_eye":"","nose":"","mouth":"","jaw":"","photo":""},"tags":["可见特征"]}`;

export const PALM_VISION_SYSTEM = `你是手相文化观察助手。根据手掌照片观察掌纹/掌丘/手型，禁止：疾病、寿命、吉凶恐吓、财富必然、婚姻定数。
输出 JSON：
{"summary":"80字内","observations":[{"title":"","body":""}],"actions":["可执行建议"],"dimNotes":{"life_line":"","head_line":"","heart_line":"","fate_line":"","mounts":"","hand_shape":"","photo":""},"tags":["可见掌纹特征"]}`;
