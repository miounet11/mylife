/**
 * Content OS public API — destiny-centered, LDPlayer-parity SEO engine.
 */

export {
  buildContentOsMatrix,
  buildPeopleFirstCatalog,
  summarizeContentOsMatrix,
  listDestinyEntityHubs,
  getDestinyEntityHub,
  slotsForEntity,
  CONTENT_OS_LOCALES,
  type DestinyMatrixSlot,
  type DestinyEntityKind,
  type ContentOsLocale,
  type ContentTemplateKind,
} from '@/lib/content-os/matrix';

export {
  resolveContentOsMode,
  resolveProductionLocales,
  gateSlotForProduction,
  canExpandLocale,
  peopleFirstPriorityBoost,
  textSimilarity,
  PRODUCTION_CONSTITUTION_SUMMARY,
  type ContentOsMode,
  type ProductionGateResult,
} from '@/lib/content-os/production-policy';

export {
  resolveContentOsTextEndpoint,
  resolveContentOsImageEndpoint,
  contentOsChatCompletion,
  contentOsChatJson,
  contentOsGenerateImage,
} from '@/lib/content-os/client';

export {
  generateFromMatrixSlot,
  generateBatchFromSlots,
  articleToManagedInput,
  type ContentOsGeneratedArticle,
} from '@/lib/content-os/generator';

export {
  buildCoverageMap,
  buildContentOsRunPlan,
  runContentOsCycle,
  persistContentOsArticles,
  readLastContentOsRun,
  getContentOsPaths,
  type ContentOsRunPlan,
  type ContentOsRunResult,
  type ContentOsCoverageRow,
} from '@/lib/content-os/scheduler';

export {
  scoreContentOsDimensions,
  buildRepairBrief,
  type MultiDimensionQuality,
  type QualityDimensionKey,
} from '@/lib/content-os/quality-dimensions';

export {
  repairContentOsArticle,
  repairBatch,
  type RepairedArticle,
} from '@/lib/content-os/repair';

export {
  listPublishedContentOsEntries,
  listContentForEntity,
  buildHotlist,
  type EntityContentCard,
} from '@/lib/content-os/entity-content';

export {
  collectDemandSignals,
  buildSatelliteSlotsFromDemand,
  demandBoostForSlot,
  summarizeDemandSignals,
  type DemandSignal,
} from '@/lib/content-os/demand-signals';
