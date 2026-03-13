import { buildContextSignals } from '@/lib/agentic-report/build-context-signals';
import { buildEngineGroundTruth } from '@/lib/agentic-report/build-ground-truth';
import type {
  BuildContextSignalsInput,
  BuildGroundTruthInput,
  StructuredAgenticContext,
} from '@/lib/agentic-report/types';

export function createAgenticContext(input: {
  groundTruth: BuildGroundTruthInput;
  context: Omit<BuildContextSignalsInput, 'engine'>;
}) : StructuredAgenticContext {
  const engine = buildEngineGroundTruth(input.groundTruth);
  const context = buildContextSignals({
    ...input.context,
    engine,
  });

  return {
    engine,
    context,
    report: {
      advice: input.context.report?.advice,
      fortune: input.context.report?.fortune,
    },
  };
}
