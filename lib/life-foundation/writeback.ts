/**
 * 工具结果 → 人生数据底座写回
 * 统一入口，避免各 API 各自拼字段。
 */

import {
  ensureProfileSettingsSchema,
  profileChangeLogOperations,
  profileSupplementOperations,
} from '@/lib/profile-settings-store';
import type { SupplementDomain } from '@/lib/profile-settings-types';

export type FoundationWritebackResult = {
  ok: boolean;
  domain: SupplementDomain;
  fields: Record<string, string>;
};

function cleanFields(fields: Record<string, string | number | null | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v == null) continue;
    const t = `${v}`.trim().slice(0, 240);
    if (t) out[k] = t;
  }
  return out;
}

export function writeFoundationSupplement(params: {
  userId: string;
  fortuneId?: string | null;
  domain: SupplementDomain;
  fields: Record<string, string | number | null | undefined>;
  changeType: string;
  fieldPath?: string;
  meta?: Record<string, unknown>;
}): FoundationWritebackResult {
  ensureProfileSettingsSchema();
  const fields = cleanFields(params.fields);
  if (Object.keys(fields).length === 0) {
    return { ok: false, domain: params.domain, fields: {} };
  }

  profileSupplementOperations.upsert({
    userId: params.userId,
    fortuneId: params.fortuneId || null,
    domain: params.domain,
    fields,
  });

  profileChangeLogOperations.create({
    userId: params.userId,
    fortuneId: params.fortuneId || null,
    changeType: params.changeType,
    fieldPath: params.fieldPath || params.domain,
    newValue: Object.values(fields).slice(0, 2).join(' · ').slice(0, 200),
    triggeredRecalc: false,
    meta: params.meta || {},
  });

  return { ok: true, domain: params.domain, fields };
}

/** 面相 / 手相 */
export function writeXiangxueToFoundation(params: {
  userId: string;
  fortuneId?: string | null;
  kind: 'face' | 'palm';
  sessionId: string;
  summary: string;
  overallScore: number;
  physicalHeadline?: string;
  generatedAt?: string;
}): FoundationWritebackResult {
  const physical = params.physicalHeadline || params.summary;
  const fields: Record<string, string | number> = {
    bodyUpdatedAt: params.generatedAt || new Date().toISOString(),
    lastSessionId: params.sessionId,
  };
  if (params.kind === 'face') {
    fields.faceSummary = params.summary;
    fields.faceScore = Math.round(params.overallScore || 0);
    fields.facePhysical = physical;
  } else {
    fields.palmSummary = params.summary;
    fields.palmScore = Math.round(params.overallScore || 0);
    fields.palmPhysical = physical;
  }
  return writeFoundationSupplement({
    userId: params.userId,
    fortuneId: params.fortuneId,
    domain: 'body',
    fields,
    changeType: 'xiangxue_writeback',
    fieldPath: `body.${params.kind}`,
    meta: { sessionId: params.sessionId, kind: params.kind, overallScore: params.overallScore },
  });
}

/** 起名工坊 */
export function writeNamingToFoundation(params: {
  userId: string;
  fortuneId?: string | null;
  sessionId: string;
  mode: string;
  summary: string;
  topName?: string | null;
  topScore?: number | null;
  candidateCount?: number;
}): FoundationWritebackResult {
  return writeFoundationSupplement({
    userId: params.userId,
    fortuneId: params.fortuneId,
    domain: 'apps',
    fields: {
      namingSummary: params.summary,
      namingTop: params.topName || '',
      namingScore: params.topScore != null ? Math.round(params.topScore) : '',
      namingMode: params.mode,
      namingSessionId: params.sessionId,
      namingCount: params.candidateCount ?? '',
      appsUpdatedAt: new Date().toISOString(),
    },
    changeType: 'naming_writeback',
    fieldPath: 'apps.naming',
    meta: {
      sessionId: params.sessionId,
      mode: params.mode,
      topName: params.topName,
    },
  });
}

/** 空间场完整报表 */
export function writeSpaceToFoundation(params: {
  userId: string;
  fortuneId?: string | null;
  sessionId: string;
  summary: string;
  domain?: string | null;
  score?: number | null;
  profileLinked?: boolean;
  title?: string | null;
}): FoundationWritebackResult {
  return writeFoundationSupplement({
    userId: params.userId,
    fortuneId: params.fortuneId,
    domain: 'apps',
    fields: {
      spaceSummary: params.summary,
      spaceDomain: params.domain || '',
      spaceScore: params.score != null ? Math.round(params.score) : '',
      spaceSessionId: params.sessionId,
      spaceTitle: params.title || '',
      spaceLinked: params.profileLinked ? '1' : '0',
      appsUpdatedAt: new Date().toISOString(),
    },
    changeType: 'space_writeback',
    fieldPath: 'apps.space',
    meta: {
      sessionId: params.sessionId,
      domain: params.domain,
      profileLinked: params.profileLinked,
    },
  });
}

/** 合婚双盘 */
export function writeHehunToFoundation(params: {
  userId: string;
  fortuneId?: string | null;
  sessionId?: string | null;
  score: number;
  band?: string | null;
  headline: string;
  summary?: string | null;
  partnerLabel?: string | null;
}): FoundationWritebackResult {
  return writeFoundationSupplement({
    userId: params.userId,
    fortuneId: params.fortuneId,
    domain: 'apps',
    fields: {
      hehunScore: Math.round(params.score),
      hehunBand: params.band || '',
      hehunHeadline: params.headline,
      hehunSummary: (params.summary || params.headline).slice(0, 200),
      hehunPartner: params.partnerLabel || '',
      hehunSessionId: params.sessionId || '',
      appsUpdatedAt: new Date().toISOString(),
    },
    changeType: 'hehun_writeback',
    fieldPath: 'apps.hehun',
    meta: {
      sessionId: params.sessionId,
      score: params.score,
      band: params.band,
    },
  });
}

/** 十维度研判 */
export function writeDimensionToFoundation(params: {
  userId: string;
  fortuneId?: string | null;
  sessionId?: string | null;
  slug: string;
  title: string;
  summary: string;
  predictionCount?: number;
}): FoundationWritebackResult {
  const slugSafe = `${params.slug}`.slice(0, 40);
  return writeFoundationSupplement({
    userId: params.userId,
    fortuneId: params.fortuneId,
    domain: 'apps',
    fields: {
      dimLastSlug: slugSafe,
      dimLastTitle: params.title.slice(0, 40),
      dimLastSummary: params.summary.slice(0, 200),
      dimLastAt: new Date().toISOString(),
      dimLastSessionId: params.sessionId || '',
      dimPredictionCount: params.predictionCount ?? '',
      // rolling list of recent slugs (append unique)
      dimSlugs: slugSafe,
      appsUpdatedAt: new Date().toISOString(),
    },
    changeType: 'dimension_writeback',
    fieldPath: `apps.dimension.${slugSafe}`,
    meta: {
      sessionId: params.sessionId,
      slug: params.slug,
      title: params.title,
    },
  });
}

/** 通用工具运行（tool-run-orchestrator） */
export function writeGenericToolToFoundation(params: {
  userId: string;
  fortuneId?: string | null;
  sessionId: string;
  toolSlug: string;
  toolTitle: string;
  summary?: string | null;
  qualityScore?: number | null;
}): FoundationWritebackResult {
  return writeFoundationSupplement({
    userId: params.userId,
    fortuneId: params.fortuneId,
    domain: 'apps',
    fields: {
      lastToolSlug: params.toolSlug.slice(0, 48),
      lastToolTitle: params.toolTitle.slice(0, 40),
      lastToolSummary: (params.summary || params.toolTitle).slice(0, 200),
      lastToolScore: params.qualityScore != null ? Math.round(params.qualityScore) : '',
      lastToolSessionId: params.sessionId,
      appsUpdatedAt: new Date().toISOString(),
    },
    changeType: 'tool_writeback',
    fieldPath: `apps.tool.${params.toolSlug}`,
    meta: {
      sessionId: params.sessionId,
      toolSlug: params.toolSlug,
    },
  });
}
