export * from '@/lib/life-foundation/types';
export * from '@/lib/life-foundation/zodiac';
export * from '@/lib/life-foundation/modules';
export { buildLifeFoundation } from '@/lib/life-foundation/build';
export {
  buildFoundationPromptBundle,
  formatFoundationSnapshotLines,
  buildTaisuiLines,
  quickAstroPromptLines,
  supplementMapToPromptLines,
} from '@/lib/life-foundation/prompt-context';
export {
  writeFoundationSupplement,
  writeXiangxueToFoundation,
  writeNamingToFoundation,
  writeSpaceToFoundation,
} from '@/lib/life-foundation/writeback';
