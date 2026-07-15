import { buildFortuneContextInput, type BirthInput } from '@/lib/fortune-context-builder';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import type { CreateContextInput } from '@/lib/agentic-report/create-agentic-context';

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