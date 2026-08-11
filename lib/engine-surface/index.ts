/**
 * Engine Surface — reusable structured display pack.
 *
 * Build once from report / expert / tool data, mount anywhere:
 *   import { buildEngineSurfaceFromProView } from '@/lib/engine-surface';
 *   import EngineSurfaceMount from '@/components/engine-surface/engine-surface-mount';
 */

export {
  ENGINE_MODULE_META,
  type EngineModuleId,
  type EngineSurfacePack,
  type EngineSurfaceIdentity,
  type EngineSurfacePillar,
  type EngineSurfaceDayunRow,
  type EngineSurfaceKlineSnap,
  type EngineSurfaceMonthItem,
} from '@/lib/engine-surface/types';

export {
  buildEngineSurfacePack,
  buildEngineSurfaceFromFortuneLike,
  buildEngineSurfaceFromProView,
  buildEngineSurfaceFromExpertDesk,
  type BuildEngineSurfaceInput,
} from '@/lib/engine-surface/build-engine-surface-pack';
