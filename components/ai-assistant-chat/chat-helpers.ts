// v5-D11 (2026-05-17) 从 ai-assistant-chat.tsx 抽离纯助手函数 + 常量。
// 这里只放零副作用的纯函数和静态映射；保持原行为不变。

import {
  Compass,
  FileText,
  GraduationCap,
  Hand,
  Image as ImageIcon,
  PenLine,
  ScanFace,
  ScrollText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ChatContextEvent, ChatExperienceContext } from '@/lib/chat-context';
import { getChatIntentPreset } from '@/lib/chat-intent';
import type { ReportActionSuggestion } from '@/lib/report-v2';
import {
  cloneTacitKnowledgeInput,
  createEmptyTacitKnowledgeInput,
  hasTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';
import { buildChatHref } from '@/lib/chat-entry';

export type ChatContextState = ChatExperienceContext;
export type SuggestedEventDraft = ReportActionSuggestion;

/** User rating on an assistant reply — used for product/prompt optimization. */
export type ChatFeedbackRating = 'helpful' | 'not_helpful' | 'empty';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | null;
  llmUsed?: boolean;
  edited?: boolean;
  regenerated?: boolean;
  reportId?: string | null;
  eventId?: string | null;
  responseToQuestionId?: string | null;
  tacitContext?: TacitKnowledgeInput | null;
  tacitSummary?: string | null;
  materials?: ChatMaterialDisplay[];
  materialSummary?: string | null;
  /** Assistant only: last stored feedback rating */
  feedbackRating?: ChatFeedbackRating | null;
  /** Assistant only: why LLM path fell back */
  fallbackReason?: string | null;
}

export type IntentPreset = {
  entryLabel: string;
  helper: string;
  placeholder: string;
  prefillQuestion: string;
  questions: string[];
};

export function getIntentPreset(intent: string): IntentPreset | null {
  const preset = getChatIntentPreset(intent);
  if (!preset) {
    return null;
  }

  return {
    entryLabel: preset.entryLabel,
    helper: preset.helper,
    placeholder: preset.placeholder,
    prefillQuestion: preset.prefillQuestion,
    questions: preset.questions,
  };
}

export type ChatMaterialKind =
  | 'floor_plan'
  | 'face_photo'
  | 'palm_photo'
  | 'handwriting'
  | 'study_material'
  | 'scene_photo'
  | 'legal_document'
  | 'other_document';

export type ChatMaterialDisplay = {
  id: string;
  kind: ChatMaterialKind;
  label: string;
  note?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  hasImage?: boolean;
  previewUrl?: string;
  imageIncluded?: boolean;
};

export type ChatMaterialDraft = ChatMaterialDisplay & {
  dataUrl?: string;
};

export const defaultWorldYiQuestions = [
  '结合我的命局结构和当前阶段，现在最该先推进哪一件事？',
  '如果把这件事放到接下来三个月看，我更该推进、观察还是收手？',
  '这段关系现在的问题更像结构不合、阶段不对，还是环境压力过大？',
  '我现在最需要规避的误判是什么，为什么？',
];

export const materialKindOptions: Array<{
  kind: ChatMaterialKind;
  label: string;
  icon: LucideIcon;
  accept: string;
  placeholder: string;
}> = [
  {
    kind: 'floor_plan',
    label: '户型图',
    icon: Compass,
    accept: 'image/*',
    placeholder: '方向/城市/居住人数/困扰点，例如睡眠、潮湿、动线乱',
  },
  {
    kind: 'face_photo',
    label: '面相',
    icon: ScanFace,
    accept: 'image/*',
    placeholder: '正面/侧面、近期状态、想重点看哪件事',
  },
  {
    kind: 'palm_photo',
    label: '手相',
    icon: Hand,
    accept: 'image/*',
    placeholder: '左/右手、掌纹清晰度、当前问题',
  },
  {
    kind: 'handwriting',
    label: '字迹',
    icon: PenLine,
    accept: 'image/*',
    placeholder: '手写内容、书写场景、想观察的性格/状态',
  },
  {
    kind: 'study_material',
    label: '学习材料',
    icon: GraduationCap,
    accept: 'image/*,.pdf,.txt',
    placeholder: '课程/成绩/学习计划摘要，最卡的点',
  },
  {
    kind: 'scene_photo',
    label: '场景照片',
    icon: ImageIcon,
    accept: 'image/*',
    placeholder: '照片场景、时间、相关人物关系',
  },
  {
    kind: 'legal_document',
    label: '法院/合同',
    icon: ScrollText,
    accept: 'image/*,.pdf,.txt',
    placeholder: '文书类型、争议点、关键条款；先打码',
  },
  {
    kind: 'other_document',
    label: '其他资料',
    icon: FileText,
    accept: 'image/*,.pdf,.txt',
    placeholder: '资料来源、关键内容、希望判断的问题',
  },
];

export const maxMaterialCount = 4;
export const maxInlineImageBytes = 1.8 * 1024 * 1024;

export function getMaterialOption(kind: ChatMaterialKind) {
  return (
    materialKindOptions.find((item) => item.kind === kind) ||
    materialKindOptions[materialKindOptions.length - 1]
  );
}

export function formatFileSize(size?: number) {
  if (!size || size <= 0) return '';
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

export function toMaterialPayload(materials: ChatMaterialDraft[]) {
  return materials.map((item) => ({
    id: item.id,
    kind: item.kind,
    label: item.label,
    note: item.note || '',
    fileName: item.fileName || '',
    mimeType: item.mimeType || '',
    size: item.size || 0,
    dataUrl: item.dataUrl || '',
  }));
}

export function formatChatTime(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) {
    return '--:--';
  }

  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export function buildScopedChatHref(params: {
  reportId?: string;
  eventId?: string;
  intent?: string;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  return buildChatHref(params);
}

export function findLatestScopedTacitContext(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const tacitContext = messages[index]?.tacitContext;
    if (messages[index]?.role === 'user' && hasTacitKnowledgeInput(tacitContext)) {
      return cloneTacitKnowledgeInput(tacitContext);
    }
  }

  return createEmptyTacitKnowledgeInput();
}

export function buildPreviousUserQuestionMap(messages: ChatMessage[]) {
  const previousUserQuestions: Record<string, string> = {};
  let latestUserQuestion = '';

  for (const message of messages) {
    previousUserQuestions[message.id] = latestUserQuestion;
    if (message.role === 'user') {
      latestUserQuestion = message.content;
    }
  }

  return previousUserQuestions;
}

export function mapEventTypeLabel(type: string) {
  switch (type) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '关系';
    case 'health':
      return '健康';
    case 'family':
      return '家庭';
    default:
      return '其他';
  }
}

export function mapImpactLabel(impact: ChatContextEvent['impact']) {
  switch (impact) {
    case 'positive':
      return '积极';
    case 'negative':
      return '风险';
    default:
      return '中性';
  }
}

export function mapValidationLabel(status: ChatContextEvent['validationStatus']) {
  switch (status) {
    case 'accurate':
      return '已验证准确';
    case 'drift':
      return '已记录偏差';
    default:
      return '待验证';
  }
}
