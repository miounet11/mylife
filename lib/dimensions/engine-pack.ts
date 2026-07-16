import { buildFortuneContextInput, type BirthInput } from '@/lib/fortune-context-builder';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import type { CreateContextInput } from '@/lib/agentic-report/create-agentic-context';
import {
  buildGroundTruthPackFromBirth,
  type GroundTruthPack,
} from '@/lib/ground-truth/pack';

export function buildDimensionEnginePack(input: BirthInput): CreateContextInput & { birthSignature: string } {
  const context = buildFortuneContextInput(input);
  const birthSignature = buildBirthSignature({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    birthAccuracy: input.birthAccuracy,
    gender: input.gender,
  });
  return { ...context, birthSignature };
}

/**
 * Dimension path with full GroundTruthPack (tenGods filled, locked facts, preserve tokens).
 * Prefer when wiring free tools or chat anchors from the same birth input.
 */
export function buildDimensionGroundTruthPack(input: BirthInput): GroundTruthPack {
  return buildGroundTruthPackFromBirth(input);
}