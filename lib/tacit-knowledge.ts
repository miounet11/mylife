export interface TacitKnowledgeInput {
  stateKeywords?: string[];
  bodySignals?: string[];
  relationshipSignals?: string[];
  pressureLevel?: number;
  clarityLevel?: number;
  urgencyLevel?: number;
  unsaidFear?: string;
  freeNote?: string;
}

export const TACIT_STATE_OPTIONS = [
  '说不清但很卡',
  '反复犹豫',
  '心里已经偏向一个答案',
  '表面平静但内里很乱',
  '明知该动却动不了',
  '怕做错比怕做慢更强',
] as const;

export const TACIT_BODY_OPTIONS = [
  '睡眠变浅',
  '胸口发紧',
  '容易疲惫',
  '胃口变差',
  '注意力散',
  '总想逃开这个问题',
] as const;

export const TACIT_RELATIONSHIP_OPTIONS = [
  '对方态度模糊',
  '家里给压力',
  '现实资源不够',
  '环境在逼我表态',
  '关系边界不清',
  '怕说出口就失去回旋',
] as const;

export const DEFAULT_TACIT_KNOWLEDGE_INPUT: Required<TacitKnowledgeInput> = {
  stateKeywords: [],
  bodySignals: [],
  relationshipSignals: [],
  pressureLevel: 3,
  clarityLevel: 3,
  urgencyLevel: 3,
  unsaidFear: '',
  freeNote: '',
};

function clampLevel(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.max(1, Math.min(5, Math.round(numeric)));
}

function sanitizeList(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => `${item || ''}`.trim())
        .filter(Boolean)
        .slice(0, limit)
    )
  );
}

function sanitizeText(value: unknown, limit: number) {
  const normalized = `${value || ''}`.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';
  return normalized.slice(0, limit);
}

function hasMeaningfulLevel(value?: number) {
  return typeof value === 'number' && value >= 1 && value <= 5 && value !== 3;
}

export function createEmptyTacitKnowledgeInput(): TacitKnowledgeInput {
  return {
    stateKeywords: [],
    bodySignals: [],
    relationshipSignals: [],
    pressureLevel: 3,
    clarityLevel: 3,
    urgencyLevel: 3,
    unsaidFear: '',
    freeNote: '',
  };
}

export function cloneTacitKnowledgeInput(input?: TacitKnowledgeInput | null): TacitKnowledgeInput {
  return {
    stateKeywords: [...(input?.stateKeywords || [])],
    bodySignals: [...(input?.bodySignals || [])],
    relationshipSignals: [...(input?.relationshipSignals || [])],
    pressureLevel: input?.pressureLevel ?? DEFAULT_TACIT_KNOWLEDGE_INPUT.pressureLevel,
    clarityLevel: input?.clarityLevel ?? DEFAULT_TACIT_KNOWLEDGE_INPUT.clarityLevel,
    urgencyLevel: input?.urgencyLevel ?? DEFAULT_TACIT_KNOWLEDGE_INPUT.urgencyLevel,
    unsaidFear: input?.unsaidFear || '',
    freeNote: input?.freeNote || '',
  };
}

export function hasTacitKnowledgeInput(input?: TacitKnowledgeInput | null) {
  if (!input) return false;
  return Boolean(
    input.stateKeywords?.length ||
    input.bodySignals?.length ||
    input.relationshipSignals?.length ||
    hasMeaningfulLevel(input.pressureLevel) ||
    hasMeaningfulLevel(input.clarityLevel) ||
    hasMeaningfulLevel(input.urgencyLevel) ||
    input.unsaidFear ||
    input.freeNote
  );
}

export function sanitizeTacitKnowledgeInput(input: unknown): TacitKnowledgeInput | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const normalized: TacitKnowledgeInput = {
    stateKeywords: sanitizeList(raw.stateKeywords, 6),
    bodySignals: sanitizeList(raw.bodySignals, 6),
    relationshipSignals: sanitizeList(raw.relationshipSignals, 6),
    pressureLevel: clampLevel(raw.pressureLevel) ?? DEFAULT_TACIT_KNOWLEDGE_INPUT.pressureLevel,
    clarityLevel: clampLevel(raw.clarityLevel) ?? DEFAULT_TACIT_KNOWLEDGE_INPUT.clarityLevel,
    urgencyLevel: clampLevel(raw.urgencyLevel) ?? DEFAULT_TACIT_KNOWLEDGE_INPUT.urgencyLevel,
    unsaidFear: sanitizeText(raw.unsaidFear, 80),
    freeNote: sanitizeText(raw.freeNote, 160),
  };

  return hasTacitKnowledgeInput(normalized) ? normalized : null;
}

export function areTacitKnowledgeInputsEqual(
  left?: TacitKnowledgeInput | null,
  right?: TacitKnowledgeInput | null
) {
  const normalizedLeft = sanitizeTacitKnowledgeInput(left) || createEmptyTacitKnowledgeInput();
  const normalizedRight = sanitizeTacitKnowledgeInput(right) || createEmptyTacitKnowledgeInput();

  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
}

export function buildTacitKnowledgeSummary(input?: TacitKnowledgeInput | null) {
  if (!hasTacitKnowledgeInput(input)) return '';

  const parts: string[] = [];
  if (input?.stateKeywords?.length) {
    parts.push(`当前隐性状态：${input.stateKeywords.join('、')}`);
  }
  if (input?.bodySignals?.length) {
    parts.push(`身体信号：${input.bodySignals.join('、')}`);
  }
  if (input?.relationshipSignals?.length) {
    parts.push(`关系/环境：${input.relationshipSignals.join('、')}`);
  }
  if (hasMeaningfulLevel(input?.pressureLevel)) {
    parts.push(`压力 ${input?.pressureLevel}/5`);
  }
  if (hasMeaningfulLevel(input?.clarityLevel)) {
    parts.push(`清晰度 ${input?.clarityLevel}/5`);
  }
  if (hasMeaningfulLevel(input?.urgencyLevel)) {
    parts.push(`紧迫度 ${input?.urgencyLevel}/5`);
  }
  if (input?.unsaidFear) {
    parts.push(`最怕发生：${input.unsaidFear}`);
  }
  if (input?.freeNote) {
    parts.push(`补充感受：${input.freeNote}`);
  }

  return parts.join('；');
}

export function buildTacitKnowledgeFocusTags(input?: TacitKnowledgeInput | null) {
  if (!hasTacitKnowledgeInput(input)) return [];

  return [
    ...(input?.stateKeywords || []).slice(0, 2),
    ...(input?.bodySignals || []).slice(0, 2),
    ...(input?.relationshipSignals || []).slice(0, 2),
    hasMeaningfulLevel(input?.pressureLevel) ? `压力${input?.pressureLevel}/5` : '',
    hasMeaningfulLevel(input?.clarityLevel) ? `清晰度${input?.clarityLevel}/5` : '',
    hasMeaningfulLevel(input?.urgencyLevel) ? `紧迫度${input?.urgencyLevel}/5` : '',
  ].filter(Boolean);
}
