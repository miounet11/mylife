/**
 * Content OS v3 pipeline — single entry for automatic production.
 *
 * generate → multi-dimension score → LLM repair → uniqueness recheck → publish decision
 *
 * Constitution: docs/ldplayer-ops-and-google-alignment.md
 * North star: indexable search clicks → chart/chat (NOT URL count)
 */

import { listManagedContentEntries } from '@/lib/content-store';
import type { DestinyMatrixSlot } from '@/lib/content-os/matrix';
import {
  generateFromMatrixSlot,
  type ContentOsGeneratedArticle,
} from '@/lib/content-os/generator';
import { repairContentOsArticle, type RepairedArticle } from '@/lib/content-os/repair';
import {
  scoreContentOsDimensions,
  type MultiDimensionQuality,
} from '@/lib/content-os/quality-dimensions';
import {
  entryFingerprint,
  textSimilarity,
  maxNearDuplicateRatio,
  gateSlotForProduction,
  resolveContentOsMode,
} from '@/lib/content-os/production-policy';

export const PIPELINE_VERSION = 'content-os-pipeline-v3';

export type PipelineArticle = RepairedArticle & {
  pipelineVersion: string;
  uniquenessOk: boolean;
  uniquenessScore?: number;
  uniquenessAgainst?: string;
  gateBlocked?: string[];
};

export type PipelineRunItem = {
  slot: DestinyMatrixSlot;
  article: PipelineArticle;
};

function recheckUniqueness(
  article: ContentOsGeneratedArticle,
  slot: DestinyMatrixSlot,
): { ok: boolean; score: number; against?: string } {
  const published = listManagedContentEntries().filter(
    (e) => e.status === 'published' || e.status === 'draft',
  );
  const fp = `${article.title}\n${article.excerpt}\n${article.answerSummary}`;
  const maxDup = maxNearDuplicateRatio();
  let best = 0;
  let against = '';
  for (const entry of published) {
    // Allow same matrixKey refresh path to score high against itself later; skip exact matrixKey match only if same slug base
    const mk = `${(entry.meta as { matrixKey?: string } | undefined)?.matrixKey || ''}`;
    if (mk && mk === slot.key) continue;
    const score = textSimilarity(fp, entryFingerprint(entry));
    if (score > best) {
      best = score;
      against = entry.slug;
    }
  }
  return { ok: best < maxDup, score: best, against: against || undefined };
}

/**
 * Run one slot through the full people-first pipeline.
 * Fallback template body is never publish-ready (must LLM).
 */
export async function runSlotPipeline(
  slot: DestinyMatrixSlot,
  options?: {
    withImage?: boolean;
    repairRounds?: number;
  },
): Promise<PipelineArticle> {
  const mode = resolveContentOsMode();
  const published = listManagedContentEntries();

  const preGate = gateSlotForProduction(slot, published, { mode });
  if (!preGate.allow) {
    // Still generate a draft-only shell? Prefer skip generation to save LLM — return blocked marker
    const shell = await generateFromMatrixSlot(slot, { forceFallback: true });
    const multi = scoreContentOsDimensions(shell, slot);
    return {
      ...shell,
      multiQuality: multi,
      repairRounds: 0,
      publishedReady: false,
      pipelineVersion: PIPELINE_VERSION,
      uniquenessOk: false,
      gateBlocked: preGate.reasons,
      quality: {
        ...shell.quality,
        ready: false,
        score: 0,
        reasons: preGate.reasons,
      },
    };
  }

  // Pass 1: generate (prefer LLM; retry once on empty)
  let article = await generateFromMatrixSlot(slot, { withImage: options?.withImage });
  if (!article.llmUsed) {
    article = await generateFromMatrixSlot(slot, { withImage: options?.withImage });
  }

  // Pass 2–N: multi-dimension repair (forces full rewrite if template fallback)
  let repaired = await repairContentOsArticle(article, slot, {
    maxRounds: options?.repairRounds ?? 2,
  });

  // If still not LLM-backed, force one more repair round dedicated to full rewrite
  if (!repaired.llmUsed) {
    repaired = await repairContentOsArticle(
      { ...repaired, llmUsed: false },
      slot,
      { maxRounds: 1 },
    );
  }

  // Pass final: uniqueness against corpus
  const uniq = recheckUniqueness(repaired, slot);
  let multi: MultiDimensionQuality = repaired.multiQuality || scoreContentOsDimensions(repaired, slot);

  // People-first: never publish template fallback or near-dup
  let publishedReady = multi.publishReady && repaired.llmUsed && uniq.ok;
  if (!repaired.llmUsed) {
    publishedReady = false;
    multi = {
      ...multi,
      publishReady: false,
      summary: `${multi.summary}; blocked=no-llm`,
    };
  }
  if (!uniq.ok) {
    publishedReady = false;
    multi = {
      ...multi,
      publishReady: false,
      summary: `${multi.summary}; blocked=near-dup:${uniq.against}`,
    };
  }

  return {
    ...repaired,
    multiQuality: multi,
    publishedReady,
    pipelineVersion: PIPELINE_VERSION,
    uniquenessOk: uniq.ok,
    uniquenessScore: uniq.score,
    uniquenessAgainst: uniq.against,
    quality: {
      ...repaired.quality,
      ready: publishedReady,
      score: multi.overall,
      reasons: publishedReady
        ? []
        : [
            ...repaired.quality.reasons,
            ...(!repaired.llmUsed ? ['LLM 正文未成功，禁止自动发布'] : []),
            ...(!uniq.ok ? [`近重于 ${uniq.against} (${uniq.score.toFixed(2)})`] : []),
          ].slice(0, 8),
    },
  };
}

export async function runPipelineBatch(
  slots: DestinyMatrixSlot[],
  options?: {
    withImage?: boolean;
    repairRounds?: number;
    concurrency?: number;
    onProgress?: (done: number, total: number, item: PipelineRunItem) => void;
  },
): Promise<PipelineRunItem[]> {
  const concurrency = Math.max(1, Math.min(options?.concurrency || 1, 2));
  const results: PipelineRunItem[] = [];
  let index = 0;

  async function worker() {
    while (index < slots.length) {
      const i = index;
      index += 1;
      const slot = slots[i];
      const article = await runSlotPipeline(slot, {
        withImage: options?.withImage,
        repairRounds: options?.repairRounds,
      });
      const item = { slot, article };
      results[i] = item;
      options?.onProgress?.(i + 1, slots.length, item);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results.filter(Boolean);
}
