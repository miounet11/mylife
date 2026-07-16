import type { LLMCallParams, LLMCallResult } from '@/lib/agentic-report/types';
import type { CreateContextInput } from '@/lib/agentic-report/create-agentic-context';

/** Lazy-load llm-client so pure token-merge helpers stay importable without openai. */
async function callJsonLLMWithError<T>(params: LLMCallParams): Promise<LLMCallResult<T>> {
  const started = Date.now();
  try {
    const agenticLlm = await import('@/lib/agentic-report/llm-client');
    const mod = agenticLlm as {
      callJsonLLMWithError?: <R>(p: LLMCallParams) => Promise<LLMCallResult<R>>;
      callJsonLLM?: <R>(p: LLMCallParams) => Promise<R | null>;
    };

    if (typeof mod.callJsonLLMWithError === 'function') {
      return mod.callJsonLLMWithError<T>(params);
    }

    const data = mod.callJsonLLM ? await mod.callJsonLLM<T>(params) : null;
    return {
      data,
      error: data == null ? 'EMPTY_OR_UNSUPPORTED_CLIENT' : undefined,
      model: params.model || 'auto',
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'LLM_CALL_FAILED',
      model: params.model || 'auto',
      durationMs: Date.now() - started,
    };
  }
}
import { getDimension } from './config';
import { buildDimensionEnhancePrompt } from './prompt-registry';
import { containsForbiddenInvestmentClaim } from './shared';
import type { DimensionReport, DimensionReportSection, DimensionSlug } from './types';

const DEFAULT_TIMEOUT_MS = 20000;
const P0_SLUGS = new Set<DimensionSlug>(['fortune-rhythm', 'career-industry', 'investment']);

export interface DimensionLlmOutput {
  sections?: Array<{ key: string; items: string[] }>;
  narrativeSummary?: string;
  predictions?: Array<{ index: number; statement: string }>;
}

export function isDimensionLlmEnabled(): boolean {
  if (process.env.DIMENSION_LLM_ENABLED === '0') return false;
  if (process.env.DIMENSION_LLM_ENABLED === 'false') return false;
  return true;
}

// Shared with agentic/chat ground-truth fusion (ganzhi + ten gods + years/scores).
import {
  extractPreservedTokens,
  tokensPreservedInItems,
} from '@/lib/ground-truth/preserve-tokens';

export { extractPreservedTokens, tokensPreservedInItems };

export function mergeEnhancedSections(
  engineSections: DimensionReportSection[],
  llmSections: DimensionLlmOutput['sections'],
): { sections: DimensionReportSection[]; enhancedCount: number } {
  if (!llmSections?.length) {
    return { sections: engineSections, enhancedCount: 0 };
  }

  const llmByKey = new Map(llmSections.map((item) => [item.key, item]));
  let enhancedCount = 0;

  const sections = engineSections.map((block) => {
    const llmBlock = llmByKey.get(block.key);
    if (!llmBlock?.items?.length) return block;

    const cleaned = llmBlock.items.map((item) => `${item || ''}`.trim()).filter(Boolean);
    if (!tokensPreservedInItems(block.items, cleaned)) return block;

    enhancedCount += 1;
    return { ...block, items: cleaned };
  });

  return { sections, enhancedCount };
}

export function mergeEnhancedPredictions(
  enginePredictions: DimensionReport['predictions'],
  llmPredictions: DimensionLlmOutput['predictions'],
  options?: { slug?: DimensionSlug },
): { predictions: DimensionReport['predictions']; enhancedCount: number } {
  if (!llmPredictions?.length || !enginePredictions.length) {
    return { predictions: enginePredictions, enhancedCount: 0 };
  }

  let enhancedCount = 0;
  const predictions = enginePredictions.map((prediction, index) => {
    const llmItem = llmPredictions.find((item) => item.index === index);
    if (!llmItem?.statement?.trim()) return prediction;

    const statement = llmItem.statement.trim();
    if (!tokensPreservedInItems([prediction.statement], [statement])) return prediction;

    // Investment compliance: reject yield / guarantee language invented by LLM
    if (options?.slug === 'investment' || prediction.category === 'wealth') {
      if (containsForbiddenInvestmentClaim(statement)) return prediction;
    }

    // Keep dueDate / window immutable; only statement may be paraphrased
    enhancedCount += 1;
    return { ...prediction, statement };
  });

  return { predictions, enhancedCount };
}

/** For P0 dimensions, narrative may not invent return / medical claims. */
export function sanitizeNarrativeSummary(slug: DimensionSlug, summary: string): string {
  const text = `${summary || ''}`.trim();
  if (!text) return '';
  if (slug === 'investment' && containsForbiddenInvestmentClaim(text)) return '';
  if (slug === 'health' && /确诊|处方|治愈|疗效保证/.test(text)) return '';
  return text.slice(0, 120);
}

function buildEnginePayload(report: DimensionReport): string {
  return JSON.stringify(
    {
      slug: report.slug,
      title: report.title,
      sections: report.sections.map((block) => ({
        key: block.key,
        title: block.title,
        tone: block.tone,
        items: block.items,
      })),
      predictions: report.predictions.map((item, index) => ({
        index,
        statement: item.statement,
        dueDate: item.dueDate,
        window: item.window,
      })),
      disclaimers: report.disclaimers,
    },
    null,
    0,
  );
}

function buildPromptContext(
  slug: DimensionSlug,
  pack?: CreateContextInput & { birthSignature?: string },
  name?: string,
  gender?: string,
) {
  const definition = getDimension(slug);
  const yongShen = pack?.truthInput?.yongShen;

  return {
    slug,
    title: definition?.title || slug,
    question: definition?.question || '',
    disclaimer: definition?.disclaimer,
    dayMaster: yongShen?.dayMaster,
    yongShen: yongShen?.yongShen,
    xiShen: yongShen?.xiShen,
    jiShen: yongShen?.jiShen,
    name,
    gender,
  };
}

export async function enhanceDimensionReport(
  slug: DimensionSlug,
  engineReport: DimensionReport,
  options?: {
    pack?: CreateContextInput & { birthSignature?: string };
    name?: string;
    gender?: string;
    enabled?: boolean;
    timeoutMs?: number;
  },
): Promise<DimensionReport> {
  const enabled = options?.enabled ?? isDimensionLlmEnabled();
  if (!enabled) {
    return {
      ...engineReport,
      meta: { ...engineReport.meta, llmEnhanced: 0, llmSkipped: 'disabled' },
    };
  }

  const promptContext = buildPromptContext(slug, options?.pack, options?.name, options?.gender);
  const { system, user } = buildDimensionEnhancePrompt(promptContext, buildEnginePayload(engineReport));

  const result = await callJsonLLMWithError<DimensionLlmOutput>({
    system,
    user,
    temperature: 0.35,
    timeoutMs: options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  });

  if (!result.data) {
    return {
      ...engineReport,
      meta: {
        ...engineReport.meta,
        llmEnhanced: 0,
        llmError: result.error || 'llm_failed',
        llmModel: result.model,
        llmDurationMs: result.durationMs,
      },
    };
  }

  const { sections, enhancedCount: sectionCount } = mergeEnhancedSections(
    engineReport.sections,
    result.data.sections,
  );
  const { predictions, enhancedCount: predictionCount } = mergeEnhancedPredictions(
    engineReport.predictions,
    result.data.predictions,
    { slug },
  );

  // Engine predictions are always the source of truth for structure (id/dueDate/window)
  if (predictions.length !== engineReport.predictions.length) {
    return {
      ...engineReport,
      meta: {
        ...engineReport.meta,
        llmEnhanced: 0,
        llmError: 'prediction_count_mismatch',
        llmModel: result.model,
        llmDurationMs: result.durationMs,
      },
    };
  }

  const narrativeSummary = sanitizeNarrativeSummary(
    slug,
    `${result.data.narrativeSummary || ''}`.trim(),
  );
  const anyEnhanced = sectionCount > 0 || predictionCount > 0 || Boolean(narrativeSummary);

  // P0: if LLM ran but changed nothing safely, still keep engine report (not a failure)
  return {
    ...engineReport,
    sections,
    predictions,
    meta: {
      ...engineReport.meta,
      llmEnhanced: anyEnhanced ? 1 : 0,
      llmSectionsEnhanced: sectionCount,
      llmPredictionsEnhanced: predictionCount,
      llmModel: result.model,
      llmDurationMs: result.durationMs,
      llmTier: P0_SLUGS.has(slug) ? 'p0' : 'standard',
      ...(narrativeSummary ? { narrativeSummary } : {}),
    },
  };
}