/**
 * Chat conversation → desensitized eval cases for prompt/product optimization.
 * Not for fine-tuning; for regression scoring of structure / grounding / fallback.
 */

export type ChatEvalBucket =
  | 'grounded_ok'
  | 'fallback_template'
  | 'short_question'
  | 'noise'
  | 'palmistry'
  | 'unbound'
  | 'other';

export type ChatEvalCase = {
  id: string;
  bucket: ChatEvalBucket;
  question: string;
  answer: string;
  meta: {
    llmUsed: boolean | null;
    fallbackReason: string | null;
    hasReportId: boolean;
    intent: string | null;
    questionLen: number;
    answerLen: number;
    engineTermsHit: string[];
    createdAt?: string | null;
    feedbackRating?: string | null;
    structureFilled?: number | null;
    structureRich?: boolean | null;
    efcOk?: boolean | null;
  };
  /** Soft expectations for scorers / manual review */
  mustIncludeAny?: string[];
  mustExclude?: string[];
  notes?: string;
};

const ENGINE_TERMS = ['日主', '用神', '忌神', '大运', '流年', '格局', '十神'] as const;

const PII_PATTERNS: Array<[RegExp, string]> = [
  [/\b[\w.+-]+@[\w.-]+\.\w+\b/g, '[email]'],
  [/1[3-9]\d{9}/g, '[phone]'],
  [/[\u4e00-\u9fff]{2,4}(大学|学院|中学|公司|集团)/g, '[org]'],
];

export function desensitizeChatText(input: string): string {
  let out = `${input || ''}`.trim();
  for (const [re, rep] of PII_PATTERNS) {
    out = out.replace(re, rep);
  }
  // collapse long whitespace
  return out.replace(/\s+/g, ' ').slice(0, 2000);
}

export function hitEngineTerms(text: string): string[] {
  return ENGINE_TERMS.filter((t) => text.includes(t));
}

export function classifyChatEvalBucket(input: {
  question: string;
  answer: string;
  llmUsed?: boolean | null;
  hasReportId?: boolean;
  intent?: string | null;
}): ChatEvalBucket {
  const q = input.question || '';
  const a = input.answer || '';
  if (/^\d{4,}$/.test(q) || q.length < 4) return 'noise';
  if ((input.intent || '').includes('palm')) return 'palmistry';
  if (!input.hasReportId) return 'unbound';
  if (input.llmUsed === false || /没有拿到可用|简化回答|未硬编/.test(a)) {
    return 'fallback_template';
  }
  // Prefer grounded when answer cites engine terms (even if question is short).
  if (hitEngineTerms(a).length >= 1) return 'grounded_ok';
  if (q.length < 15) return 'short_question';
  return 'other';
}

export function buildChatEvalCase(raw: {
  id: string;
  question: string;
  answer: string;
  llmUsed?: boolean | null;
  fallbackReason?: string | null;
  reportId?: string | null;
  intent?: string | null;
  createdAt?: string | null;
  feedbackRating?: string | null;
  structureFilled?: number | null;
  structureRich?: boolean | null;
  efcOk?: boolean | null;
}): ChatEvalCase {
  const question = desensitizeChatText(raw.question);
  const answer = desensitizeChatText(raw.answer);
  const hasReportId = Boolean(raw.reportId);
  const engineTermsHit = hitEngineTerms(answer);
  const bucket = classifyChatEvalBucket({
    question,
    answer,
    llmUsed: raw.llmUsed,
    hasReportId,
    intent: raw.intent,
  });

  const mustIncludeAny =
    bucket === 'grounded_ok'
      ? ['判断依据', '建议', '风险', '日主', '用神', '大运']
      : bucket === 'fallback_template'
        ? ['重生成', '未硬编', '简化']
        : undefined;

  const mustExclude =
    bucket === 'noise' || bucket === 'unbound'
      ? ['必然发财', '一定能', '保证']
      : ['必然发财', '一定能找到工作'];

  const rating = raw.feedbackRating ? `${raw.feedbackRating}` : null;
  const notesParts: string[] = [];
  if (bucket === 'grounded_ok') notesParts.push('Expect engine terms when report bound');
  if (bucket === 'fallback_template') notesParts.push('Track fallback rate; do not treat as gold answer');
  if (rating === 'not_helpful' || rating === 'empty') {
    notesParts.push(`User rated ${rating} — prioritize for prompt review`);
  }
  if (raw.structureRich === false || (raw.structureFilled != null && raw.structureFilled < 2)) {
    notesParts.push('Structure thin');
  }
  if (raw.efcOk === false) notesParts.push('EFC flagged');

  return {
    id: raw.id,
    bucket,
    question,
    answer,
    meta: {
      llmUsed: raw.llmUsed ?? null,
      fallbackReason: raw.fallbackReason || null,
      hasReportId,
      intent: raw.intent || null,
      questionLen: question.length,
      answerLen: answer.length,
      engineTermsHit,
      createdAt: raw.createdAt || null,
      feedbackRating: rating,
      structureFilled: raw.structureFilled ?? null,
      structureRich: raw.structureRich ?? null,
      efcOk: raw.efcOk ?? null,
    },
    mustIncludeAny,
    mustExclude,
    notes: notesParts.length ? notesParts.join('; ') : undefined,
  };
}
