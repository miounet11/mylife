import fs from 'node:fs';
import path from 'node:path';
import { getDefaultModel } from '@/lib/env';

export type VisualAssetWorkflow = {
  id: string;
  name: string;
  description?: string;
  runtime: {
    maxConcurrentImageJobs: number;
    maxConcurrentNarrativeJobs: number;
    maxAttempts: number;
    retryBaseDelayMs: number;
    retryMaxDelayMs: number;
    stallTimeoutMs: number;
  };
  stages: {
    importManifest: boolean;
    generateImages: boolean;
    downloadToServer: boolean;
    generateNarratives: boolean;
    qaSnapshot: boolean;
    publishToR2: boolean;
  };
  providers: {
    image: {
      baseUrlEnv: string;
      apiKeyEnv: string;
      defaultModel: string;
      coreModel: string;
    };
    narrative: {
      baseUrlEnv: string;
      apiKeyEnv: string;
      defaultModel: string;
    };
  };
  qualityPolicy: {
    brandSignatureCanvasShare: string;
    mustContainReadableText: boolean;
    mustStoreOnServer: boolean;
    mustGenerateNarrative: boolean;
    mustKeepProviderUrlForTraceability: boolean;
    mustAvoidGenericTemplateRepetition: boolean;
    requiresHumanReviewBeforePublish: boolean;
  };
  promptContract: string[];
  storage: {
    localPublicRoot: string;
    publicUrlPrefix: string;
    futureR2: {
      enabled: boolean;
      bucketEnv: string;
      publicBaseUrlEnv: string;
    };
  };
};

export const DEFAULT_VISUAL_ASSET_WORKFLOW_PATH = 'data/visual-assets/workflows/visual-production-v1.json';

function readNumber(value: unknown, fallback: number, min = 1) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.round(numeric)) : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => `${item || ''}`.trim()).filter(Boolean)
    : [];
}

export function parseVisualAssetWorkflow(input: unknown): VisualAssetWorkflow {
  const raw = input && typeof input === 'object' ? input as Record<string, any> : {};
  const runtime = raw.runtime && typeof raw.runtime === 'object' ? raw.runtime : {};
  const stages = raw.stages && typeof raw.stages === 'object' ? raw.stages : {};
  const providers = raw.providers && typeof raw.providers === 'object' ? raw.providers : {};
  const imageProvider = providers.image && typeof providers.image === 'object' ? providers.image : {};
  const narrativeProvider = providers.narrative && typeof providers.narrative === 'object' ? providers.narrative : {};
  const qualityPolicy = raw.qualityPolicy && typeof raw.qualityPolicy === 'object' ? raw.qualityPolicy : {};
  const storage = raw.storage && typeof raw.storage === 'object' ? raw.storage : {};
  const futureR2 = storage.futureR2 && typeof storage.futureR2 === 'object' ? storage.futureR2 : {};

  return {
    id: readString(raw.id, 'visual-production-v1'),
    name: readString(raw.name, 'Life Kline Visual Asset Production Workflow'),
    description: readString(raw.description, ''),
    runtime: {
      maxConcurrentImageJobs: readNumber(runtime.maxConcurrentImageJobs, 20),
      maxConcurrentNarrativeJobs: readNumber(runtime.maxConcurrentNarrativeJobs, 4),
      maxAttempts: readNumber(runtime.maxAttempts, 2),
      retryBaseDelayMs: readNumber(runtime.retryBaseDelayMs, 1500, 0),
      retryMaxDelayMs: readNumber(runtime.retryMaxDelayMs, 15000, 0),
      stallTimeoutMs: readNumber(runtime.stallTimeoutMs, 180000, 30_000),
    },
    stages: {
      importManifest: readBoolean(stages.importManifest, true),
      generateImages: readBoolean(stages.generateImages, true),
      downloadToServer: readBoolean(stages.downloadToServer, true),
      generateNarratives: readBoolean(stages.generateNarratives, true),
      qaSnapshot: readBoolean(stages.qaSnapshot, true),
      publishToR2: readBoolean(stages.publishToR2, false),
    },
    providers: {
      image: {
        baseUrlEnv: readString(imageProvider.baseUrlEnv, 'VISUAL_ASSET_API_BASE_URL'),
        apiKeyEnv: readString(imageProvider.apiKeyEnv, 'VISUAL_ASSET_API_KEY'),
        defaultModel: readString(imageProvider.defaultModel, 'gpt-image-2'),
        coreModel: readString(imageProvider.coreModel, 'gpt-image-2-pro'),
      },
      narrative: {
        baseUrlEnv: readString(narrativeProvider.baseUrlEnv, 'API_BASE_URL'),
        apiKeyEnv: readString(narrativeProvider.apiKeyEnv, 'OPENAI_API_KEY'),
        defaultModel: readString(narrativeProvider.defaultModel, getDefaultModel()),
      },
    },
    qualityPolicy: {
      brandSignatureCanvasShare: readString(qualityPolicy.brandSignatureCanvasShare, '4-7%'),
      mustContainReadableText: readBoolean(qualityPolicy.mustContainReadableText, true),
      mustStoreOnServer: readBoolean(qualityPolicy.mustStoreOnServer, true),
      mustGenerateNarrative: readBoolean(qualityPolicy.mustGenerateNarrative, true),
      mustKeepProviderUrlForTraceability: readBoolean(qualityPolicy.mustKeepProviderUrlForTraceability, true),
      mustAvoidGenericTemplateRepetition: readBoolean(qualityPolicy.mustAvoidGenericTemplateRepetition, true),
      requiresHumanReviewBeforePublish: readBoolean(qualityPolicy.requiresHumanReviewBeforePublish, true),
    },
    promptContract: readStringArray(raw.promptContract),
    storage: {
      localPublicRoot: readString(storage.localPublicRoot, 'public/images/visual-assets'),
      publicUrlPrefix: readString(storage.publicUrlPrefix, '/images/visual-assets'),
      futureR2: {
        enabled: readBoolean(futureR2.enabled, false),
        bucketEnv: readString(futureR2.bucketEnv, 'R2_VISUAL_ASSET_BUCKET'),
        publicBaseUrlEnv: readString(futureR2.publicBaseUrlEnv, 'R2_VISUAL_ASSET_PUBLIC_BASE_URL'),
      },
    },
  };
}

export function loadVisualAssetWorkflow(workflowPath = DEFAULT_VISUAL_ASSET_WORKFLOW_PATH): VisualAssetWorkflow {
  const absolutePath = path.resolve(process.cwd(), workflowPath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return parseVisualAssetWorkflow(JSON.parse(raw));
}
