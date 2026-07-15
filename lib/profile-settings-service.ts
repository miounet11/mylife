import { db, emailSubscriptionOperations, fortuneOperations, reportUpgradeJobOperations, userOperations } from '@/lib/database';
import { buildFortuneContextInput } from '@/lib/fortune-context-builder';
import {
  computeFortuneCompleteness,
  computeProfileCompleteness,
  type ProfileCompletenessBreakdown,
} from '@/lib/profile-completeness';
import { buildBirthSignature, normalizeBirthAccuracy } from '@/lib/profile-birth-signature';
import { buildSubscriptionFocusCopy } from '@/lib/profile-focus-copy';
import { listMissingRecommendations } from '@/lib/profile-supplement-recommendations';
import {
  PROFILE_ENGINE_FIELDS,
  PROFILE_SUPPLEMENT_DOMAINS,
  type BirthAccuracy,
  type ProfileDocumentCategory,
  type ProfileDocumentView,
  type ProfileDocumentVisibility,
  type ProfileFortuneView,
  type ProfileIntent,
  type ProfileMissingRecommendationView,
  type ProfileSettingsResponse,
  type ProfileSubscriptionFocusView,
  type ProfileSupplementView,
  type SupplementDomain,
} from '@/lib/profile-settings-types';
import { parseEmailSubscriptionMeta } from '@/lib/email-subscription-focus';
import {
  ensureProfileSettingsSchema,
  invalidateUserTimingProfile,
  profileChangeLogOperations,
  profileDocumentOperations,
  profileSupplementOperations,
} from '@/lib/profile-settings-store';
import { generateId } from '@/lib/utils';

type RawUserRow = {
  id: string;
  name: string;
  email?: string | null;
  timezone?: number | null;
};

type FortuneLike = {
  id: string;
  userId?: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace?: string | null;
  timezone?: number | null;
  gender: 'male' | 'female';
  bazi?: string | Record<string, unknown>;
  relation?: string | null;
  relationLabel?: string | null;
  birthAccuracy?: string | null;
  intent?: string | null;
  isPrimary?: boolean | number | null;
  birthSignature?: string | null;
  profileCompleteness?: number | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
};

function parseBaziSummary(bazi: string | Record<string, unknown> | undefined): string | null {
  if (!bazi) return null;
  const parsed = typeof bazi === 'string'
    ? (() => {
        try {
          return JSON.parse(bazi) as Record<string, unknown>;
        } catch {
          return null;
        }
      })()
    : bazi;

  if (!parsed) return null;
  const pillars = Array.isArray(parsed.pillars) ? parsed.pillars : null;
  if (pillars?.length) {
    const labels = ['年', '月', '日', '时'];
    return pillars.slice(0, 4).map((pillar: any, index: number) => {
      const stem = pillar?.celestialStem || pillar?.gan || '';
      const branch = pillar?.earthlyBranch || pillar?.zhi || '';
      return `${labels[index] || ''}${stem}${branch}`;
    }).join(' ');
  }

  const dayMaster = parsed.dayMaster || parsed.day_master;
  return dayMaster ? `日主 ${dayMaster}` : null;
}

function resolveRelation(relation?: string | null) {
  if (!relation || relation === 'self') return 'self';
  return relation;
}

function isPrimaryFortune(row: FortuneLike) {
  if (row.isPrimary === true || row.isPrimary === 1) return true;
  const relation = resolveRelation(row.relation);
  return relation === 'self';
}

function pickActiveFortune(rows: FortuneLike[]) {
  if (rows.length === 0) return null;
  return rows.find((row) => row.isPrimary === true || row.isPrimary === 1)
    || rows.find((row) => resolveRelation(row.relation) === 'self')
    || rows[0];
}

function mapFortuneView(
  row: FortuneLike,
  supplements: ProfileSupplementView[],
  documents: ProfileDocumentView[],
): ProfileFortuneView {
  return {
    id: row.id,
    name: row.name,
    relation: resolveRelation(row.relation),
    relationLabel: row.relationLabel || null,
    isPrimary: isPrimaryFortune(row),
    birthDate: row.birthDate,
    birthTime: row.birthTime,
    birthPlace: row.birthPlace || '北京',
    birthAccuracy: normalizeBirthAccuracy(row.birthAccuracy),
    gender: row.gender,
    intent: (row.intent as ProfileIntent | null) || null,
    timezone: row.timezone ?? 8,
    birthSignature: row.birthSignature || null,
    reportId: row.id,
    pillarSummary: parseBaziSummary(row.bazi as any),
    completeness: row.profileCompleteness ?? computeProfileCompleteness(row, supplements, documents).overall,
    updatedAt: row.updatedAt || null,
  };
}

function mapSupplementViews(
  supplements: ReturnType<typeof profileSupplementOperations.listByUser>,
): ProfileSupplementView[] {
  const domains = Object.keys(PROFILE_SUPPLEMENT_DOMAINS) as SupplementDomain[];
  return domains.map((domain) => {
    const existing = supplements.find((item) => item.domain === domain);
    return {
      domain,
      fields: existing?.fields || {},
      updatedAt: existing?.updatedAt || null,
    };
  });
}

export function getProfileSettings(userId: string, activeFortuneId?: string | null): ProfileSettingsResponse {
  ensureProfileSettingsSchema();

  const user = userOperations.getById(userId) as RawUserRow | undefined;
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const fortunes = (fortuneOperations.getByUserId(userId) as FortuneLike[])
    .filter((row) => !row.deletedAt && !(row as any).deleted_at);
  const activeFortune = activeFortuneId
    ? fortunes.find((row) => row.id === activeFortuneId) || pickActiveFortune(fortunes)
    : pickActiveFortune(fortunes);

  // 合并档案级 + 账号级（对话渐进补全常写在 fortune_id 为空）
  const supplements = mergeSupplementViews(
    mapSupplementViews(profileSupplementOperations.listByUser(userId, activeFortune?.id || null)),
    mapSupplementViews(profileSupplementOperations.listByUser(userId, null)),
  );
  const documents = mapDocumentViews(
    profileDocumentOperations.listByUser(userId, activeFortune?.id || null),
  );
  const changeLog = profileChangeLogOperations.listRecent(userId, 12);

  const completenessBreakdown = buildCompletenessBreakdown(activeFortune, supplements, documents);
  const subscriptionFocus = buildSubscriptionFocusView(user.email || null);
  const topMissingRecommendations = buildTopMissingRecommendations(activeFortune, supplements);

  let pendingRecalc = null as ProfileSettingsResponse['pendingRecalc'];
  if (activeFortune?.id) {
    const job = reportUpgradeJobOperations.getByReportId(activeFortune.id);
    if (job && ['pending', 'retry', 'running'].includes(job.status)) {
      pendingRecalc = {
        fortuneId: activeFortune.id,
        jobId: job.id,
        status: job.status,
      };
    }
  }

  return {
    success: true,
    account: {
      id: user.id,
      name: user.name,
      email: user.email || null,
      timezone: user.timezone ?? 8,
    },
    activeFortuneId: activeFortune?.id || null,
    fortunes: fortunes.map((row) => {
      const fortuneSupplements = mapSupplementViews(
        profileSupplementOperations.listByUser(userId, row.id),
      );
      const fortuneDocuments = mapDocumentViews(
        profileDocumentOperations.listByUser(userId, row.id),
      );
      return mapFortuneView(row, fortuneSupplements, fortuneDocuments);
    }),
    supplements,
    documents,
    changeLog,
    completeness: completenessBreakdown.overall,
    completenessBreakdown,
    subscriptionFocus,
    topMissingRecommendations,
    pendingRecalc,
  };
}

function mapDocumentViews(
  documents: ReturnType<typeof profileDocumentOperations.listByUser>,
): ProfileDocumentView[] {
  return documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    content: doc.content,
    visibility: doc.visibility,
    pinned: doc.pinned,
    wordCount: doc.wordCount,
    updatedAt: doc.updatedAt,
  }));
}

/** 档案补充优先，账号级（对话补全）填补空位 */
function mergeSupplementViews(
  primary: ProfileSupplementView[],
  fallback: ProfileSupplementView[],
): ProfileSupplementView[] {
  const map = new Map<string, ProfileSupplementView>();
  for (const row of fallback) {
    map.set(row.domain, { ...row, fields: { ...(row.fields || {}) } });
  }
  for (const row of primary) {
    const prev = map.get(row.domain);
    if (!prev) {
      map.set(row.domain, { ...row, fields: { ...(row.fields || {}) } });
      continue;
    }
    map.set(row.domain, {
      domain: row.domain,
      fields: { ...prev.fields, ...row.fields },
      updatedAt: row.updatedAt || prev.updatedAt,
    });
  }
  return [...map.values()];
}

function buildCompletenessBreakdown(
  fortune: FortuneLike | null | undefined,
  supplements: ProfileSupplementView[],
  documents: ProfileDocumentView[],
): ProfileCompletenessBreakdown {
  const breakdown = computeProfileCompleteness(fortune, supplements, documents);
  const intentLabels: Record<ProfileIntent, string> = {
    career: '事业',
    wealth: '财运',
    relationship: '关系',
    yearly: '流年',
  };
  return {
    ...breakdown,
    intentHint: breakdown.intent ? `当前更关注${intentLabels[breakdown.intent]}` : null,
  };
}

function buildSubscriptionFocusView(userEmail: string | null): ProfileSubscriptionFocusView {
  if (!userEmail) {
    return buildSubscriptionFocusCopy({});
  }

  const subscription = emailSubscriptionOperations.getByEmail(userEmail.trim().toLowerCase());
  const meta = parseEmailSubscriptionMeta(subscription?.meta);
  const focusFortune = meta.focusReportId ? fortuneOperations.getById(meta.focusReportId) as FortuneLike | null : null;

  return buildSubscriptionFocusCopy({
    focusReportId: meta.focusReportId || null,
    focusFortuneName: focusFortune?.name || null,
    focusFortuneRelation: focusFortune?.relation || null,
    focusFortuneRelationLabel: focusFortune?.relationLabel || null,
  });
}

function buildTopMissingRecommendations(
  fortune: FortuneLike | null | undefined,
  supplements: ProfileSupplementView[],
): ProfileMissingRecommendationView[] {
  const supplementMap = supplements.reduce<Record<string, Record<string, string>>>((acc, item) => {
    acc[item.domain] = item.fields;
    return acc;
  }, {});
  const intent = (fortune?.intent as ProfileIntent | null) || null;
  return listMissingRecommendations(intent, supplementMap).slice(0, 3);
}

function buildMinimalFortunePayload(input: {
  fortuneId: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthAccuracy: BirthAccuracy;
  gender: 'male' | 'female';
  timezone: number;
  relation: string;
  relationLabel?: string | null;
  intent?: ProfileIntent | null;
  isPrimary?: boolean;
}) {
  const rebuilt = buildFortuneContextInput({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    birthAccuracy: input.birthAccuracy,
    gender: input.gender,
    name: input.name,
  });

  const birthSignature = buildBirthSignature({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    birthAccuracy: input.birthAccuracy,
    gender: input.gender,
  });

  return {
    id: input.fortuneId,
    userId: input.userId,
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    timezone: input.timezone,
    gender: input.gender,
    bazi: {
      pillars: rebuilt.truthInput.pillars,
      dayMaster: rebuilt.reportRaw?.dayMaster,
    },
    fiveElements: rebuilt.signalsInput.elements || {},
    tenGods: {},
    pattern: {
      type: rebuilt.truthInput.pattern || '正格',
      strength: '中和',
      quality: '基础',
      description: '由资料设置新建的基础命盘',
    },
    fortune: {},
    advice: {},
    evidence: {
      statistics: {
        totalSamples: 0,
        similarCases: 0,
        successRate: 0,
        averageIncome: 0,
        averageAge: 0,
      },
      celebrities: [],
    },
    analysis: {
      dayMaster: rebuilt.reportRaw?.dayMaster,
      birthAccuracy: input.birthAccuracy,
      createdFrom: 'profile_settings',
    },
    klineData: rebuilt.truthInput.kline,
    dayun: rebuilt.truthInput.dayun,
    shenSha: rebuilt.truthInput.shenSha || [],
    reportVersion: 'v6-profile',
    isPublic: false,
    relation: input.relation === 'self' ? undefined : input.relation,
    relationLabel: input.relationLabel || null,
    birthAccuracy: input.birthAccuracy,
    birthSignature,
    intent: input.intent || null,
    isPrimary: input.isPrimary ? 1 : 0,
    profileCompleteness: 0,
  };
}

function buildFortuneSnapshot(row: FortuneLike) {
  return {
    birthDate: row.birthDate,
    birthTime: row.birthTime,
    birthPlace: row.birthPlace || '北京',
    birthAccuracy: normalizeBirthAccuracy(row.birthAccuracy),
    gender: row.gender,
  };
}

function hasEngineFieldChanges(
  current: ReturnType<typeof buildFortuneSnapshot>,
  updates: Partial<Record<(typeof PROFILE_ENGINE_FIELDS)[number], string>>,
) {
  return PROFILE_ENGINE_FIELDS.some((field) => {
    if (updates[field] === undefined) return false;
    return `${updates[field]}` !== `${current[field]}`;
  });
}

export function updateProfileAccount(
  userId: string,
  updates: { name?: string; timezone?: number },
) {
  const allowed: Partial<{ name: string; timezone: number }> = {};
  if (typeof updates.name === 'string' && updates.name.trim()) {
    allowed.name = updates.name.trim();
  }
  if (typeof updates.timezone === 'number' && Number.isFinite(updates.timezone)) {
    allowed.timezone = Math.max(-12, Math.min(14, Math.round(updates.timezone)));
  }

  if (Object.keys(allowed).length === 0) {
    return { success: true, updated: false };
  }

  userOperations.update(userId, allowed);
  profileChangeLogOperations.create({
    userId,
    changeType: 'account',
    fieldPath: Object.keys(allowed).join(','),
    newValue: JSON.stringify(allowed),
  });

  return { success: true, updated: true };
}

export function updateProfileFortune(
  userId: string,
  fortuneId: string,
  updates: {
    name?: string;
    gender?: 'male' | 'female';
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    birthAccuracy?: BirthAccuracy;
    intent?: ProfileIntent | null;
    timezone?: number;
    relationLabel?: string | null;
    confirmRecalc?: boolean;
  },
) {
  ensureProfileSettingsSchema();

  const fortune = fortuneOperations.getById(fortuneId);
  if (!fortune || fortune.userId !== userId) {
    throw new Error('FORTUNE_NOT_FOUND');
  }

  const current = buildFortuneSnapshot(fortune as FortuneLike);

  const engineUpdates: Partial<Record<(typeof PROFILE_ENGINE_FIELDS)[number], string>> = {};
  if (updates.birthDate !== undefined) engineUpdates.birthDate = updates.birthDate;
  if (updates.birthTime !== undefined) engineUpdates.birthTime = updates.birthTime;
  if (updates.birthPlace !== undefined) engineUpdates.birthPlace = updates.birthPlace;
  if (updates.birthAccuracy !== undefined) engineUpdates.birthAccuracy = updates.birthAccuracy;
  if (updates.gender !== undefined) engineUpdates.gender = updates.gender;

  const engineChanged = hasEngineFieldChanges(current, engineUpdates);
  if (engineChanged && !updates.confirmRecalc) {
    return {
      success: false,
      error: 'CONFIRM_RECALC_REQUIRED',
      engineChanged: true,
    };
  }

  const nextBirthDate = updates.birthDate ?? fortune.birthDate;
  const nextBirthAccuracy = updates.birthAccuracy ?? normalizeBirthAccuracy((fortune as any).birthAccuracy);
  const nextBirthTime = nextBirthAccuracy === 'unknown'
    ? '12:00'
    : (updates.birthTime ?? fortune.birthTime);
  const nextBirthPlace = (updates.birthPlace ?? fortune.birthPlace ?? '北京').trim() || '北京';
  const nextGender = updates.gender ?? fortune.gender;

  const fortuneUpdates: Record<string, unknown> = {};
  if (updates.name?.trim()) fortuneUpdates.name = updates.name.trim();
  if (updates.gender) fortuneUpdates.gender = updates.gender;
  if (updates.birthDate) fortuneUpdates.birthDate = updates.birthDate;
  if (updates.birthTime !== undefined || updates.birthAccuracy !== undefined) {
    fortuneUpdates.birthTime = nextBirthTime;
  }
  if (updates.birthPlace !== undefined) fortuneUpdates.birthPlace = nextBirthPlace;
  if (updates.intent !== undefined) fortuneUpdates.intent = updates.intent;
  if (updates.timezone !== undefined) fortuneUpdates.timezone = updates.timezone;
  if (updates.relationLabel !== undefined) fortuneUpdates.relationLabel = updates.relationLabel || null;

  fortuneUpdates.birthAccuracy = nextBirthAccuracy;
  fortuneUpdates.birthSignature = buildBirthSignature({
    birthDate: nextBirthDate,
    birthTime: nextBirthTime,
    birthPlace: nextBirthPlace,
    birthAccuracy: nextBirthAccuracy,
    gender: nextGender,
  });

  let recalcQueued = false;
  let jobId: string | null = null;

  if (engineChanged) {
    const rebuilt = buildFortuneContextInput({
      birthDate: nextBirthDate,
      birthTime: nextBirthTime,
      birthPlace: nextBirthPlace,
      birthAccuracy: nextBirthAccuracy,
      gender: nextGender,
      name: updates.name?.trim() || fortune.name,
    });

    fortuneUpdates.klineData = rebuilt.truthInput.kline;
    fortuneUpdates.dayun = rebuilt.truthInput.dayun;
    fortuneUpdates.analysis = {
      ...(fortune.analysis || {}),
      dayMaster: rebuilt.reportRaw?.dayMaster,
      birthAccuracy: nextBirthAccuracy,
      profileRecalcAt: new Date().toISOString(),
    };

    const jobRecord = {
      id: `ruj_${generateId()}`,
      reportId: fortuneId,
      userId,
      status: 'pending' as const,
      targetScore: 95,
      attempts: 0,
      maxAttempts: 6,
      nextRunAt: new Date().toISOString(),
      meta: {
        reason: 'profile_birth_update',
        birthSignature: fortuneUpdates.birthSignature,
      },
    };
    reportUpgradeJobOperations.enqueue(jobRecord);
    recalcQueued = true;
    jobId = jobRecord.id;
    invalidateUserTimingProfile(userId);

    profileChangeLogOperations.create({
      userId,
      fortuneId,
      changeType: 'birth_field',
      fieldPath: Object.keys(engineUpdates).join(','),
      oldValue: JSON.stringify(current),
      newValue: JSON.stringify({
        birthDate: nextBirthDate,
        birthTime: nextBirthTime,
        birthPlace: nextBirthPlace,
        birthAccuracy: nextBirthAccuracy,
        gender: nextGender,
      }),
      triggeredRecalc: true,
      meta: { jobId },
    });
  } else if (Object.keys(fortuneUpdates).length > 0) {
    profileChangeLogOperations.create({
      userId,
      fortuneId,
      changeType: 'fortune_field',
      fieldPath: Object.keys(fortuneUpdates).join(','),
      newValue: JSON.stringify(fortuneUpdates),
    });
  }

  const mergedCompleteness = computeFortuneCompleteness({
    birthDate: nextBirthDate,
    birthTime: nextBirthTime,
    birthPlace: nextBirthPlace,
    gender: nextGender,
    name: updates.name?.trim() || fortune.name,
    intent: updates.intent ?? (fortune as FortuneLike).intent,
    birthAccuracy: nextBirthAccuracy,
  });
  fortuneUpdates.profileCompleteness = mergedCompleteness;

  if (Object.keys(fortuneUpdates).length > 0) {
    fortuneOperations.update(fortuneId, fortuneUpdates as any);
  }

  if (isPrimaryFortune({
    id: fortune.id,
    name: fortune.name,
    birthDate: fortune.birthDate,
    birthTime: fortune.birthTime,
    gender: fortune.gender,
    relation: fortune.relation || 'self',
    isPrimary: (fortune as FortuneLike).isPrimary,
  })) {
    userOperations.update(userId, {
      name: updates.name?.trim() || fortune.name,
      gender: nextGender,
      birthDate: nextBirthDate,
      birthTime: nextBirthTime,
      birthPlace: nextBirthPlace,
      timezone: updates.timezone ?? fortune.timezone,
    });
  }

  return {
    success: true,
    recalcQueued,
    jobId,
    engineChanged,
  };
}

export function upsertProfileSupplement(
  userId: string,
  fortuneId: string | null,
  domain: SupplementDomain,
  fields: Record<string, string>,
) {
  ensureProfileSettingsSchema();

  if (fortuneId) {
    const fortune = fortuneOperations.getById(fortuneId);
    if (!fortune || fortune.userId !== userId) {
      throw new Error('FORTUNE_NOT_FOUND');
    }
  }

  const allowedFieldKeys = new Set(
    PROFILE_SUPPLEMENT_DOMAINS[domain].fields.map((field) => field.key),
  );
  const cleaned = Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => allowedFieldKeys.has(key))
      .map(([key, value]) => [key, `${value || ''}`.trim()])
      .filter(([, value]) => value.length > 0),
  );

  profileSupplementOperations.upsert({
    userId,
    fortuneId,
    domain,
    fields: cleaned,
  });

  profileChangeLogOperations.create({
    userId,
    fortuneId,
    changeType: 'supplement',
    fieldPath: domain,
    newValue: JSON.stringify(cleaned),
  });

  if (fortuneId) {
    const supplements = mapSupplementViews(profileSupplementOperations.listByUser(userId, fortuneId));
    const documents = mapDocumentViews(profileDocumentOperations.listByUser(userId, fortuneId));
    const latestFortune = fortuneOperations.getById(fortuneId) as FortuneLike | null;
    const completeness = buildCompletenessBreakdown(latestFortune, supplements, documents).overall;
    fortuneOperations.update(fortuneId, { profileCompleteness: completeness } as any);
  }

  return { success: true };
}

export function createProfileFortune(
  userId: string,
  input: {
    name: string;
    gender: 'male' | 'female';
    birthDate: string;
    birthTime?: string;
    birthPlace?: string;
    birthAccuracy?: BirthAccuracy;
    intent?: ProfileIntent | null;
    relation?: string;
    relationLabel?: string | null;
    timezone?: number;
    setPrimary?: boolean;
  },
) {
  ensureProfileSettingsSchema();

  const birthAccuracy = input.birthAccuracy || 'range';
  const birthTime = birthAccuracy === 'unknown' ? '12:00' : (input.birthTime || '12:00');
  const birthPlace = (input.birthPlace || '北京').trim() || '北京';
  const relation = input.relation && input.relation !== 'self' ? input.relation : 'other';
  const fortuneId = `fort_${generateId()}`;
  const shouldSetPrimary = !!input.setPrimary || relation === 'self';

  if (shouldSetPrimary) {
    clearPrimaryFortuneFlag(userId);
  }

  const payload = buildMinimalFortunePayload({
    fortuneId,
    userId,
    name: input.name.trim(),
    birthDate: input.birthDate,
    birthTime,
    birthPlace,
    birthAccuracy,
    gender: input.gender,
    timezone: input.timezone ?? 8,
    relation,
    relationLabel: input.relationLabel,
    intent: input.intent,
    isPrimary: shouldSetPrimary,
  });

  fortuneOperations.create(payload as any);
  fortuneOperations.update(fortuneId, {
    birthAccuracy,
    birthSignature: payload.birthSignature,
    intent: input.intent || null,
    isPrimary: shouldSetPrimary,
    profileCompleteness: 0,
  } as any);

  if (shouldSetPrimary) {
    userOperations.update(userId, {
      name: input.name.trim(),
      gender: input.gender,
      birthDate: input.birthDate,
      birthTime,
      birthPlace,
      timezone: input.timezone ?? 8,
    });
  }

  reportUpgradeJobOperations.enqueue({
    id: `ruj_${generateId()}`,
    reportId: fortuneId,
    userId,
    status: 'pending',
    targetScore: 95,
    attempts: 0,
    maxAttempts: 6,
    nextRunAt: new Date().toISOString(),
    meta: { reason: 'profile_archive_create' },
  });

  profileChangeLogOperations.create({
    userId,
    fortuneId,
    changeType: 'archive_create',
    fieldPath: relation,
    newValue: input.name.trim(),
  });

  return { success: true, fortuneId };
}

function clearPrimaryFortuneFlag(userId: string) {
  db.prepare(`
    UPDATE fortunes
    SET is_primary = 0, updated_at = ?
    WHERE user_id = ? AND is_primary = 1
  `).run(new Date().toISOString(), userId);
}

export function setPrimaryProfileFortune(userId: string, fortuneId: string) {
  ensureProfileSettingsSchema();
  const fortune = fortuneOperations.getById(fortuneId) as FortuneLike | null;
  if (!fortune || fortune.userId !== userId || fortune.deletedAt) {
    throw new Error('FORTUNE_NOT_FOUND');
  }

  clearPrimaryFortuneFlag(userId);
  fortuneOperations.update(fortuneId, { isPrimary: true, relation: 'self' } as any);
  userOperations.update(userId, {
    name: fortune.name,
    gender: fortune.gender,
    birthDate: fortune.birthDate,
    birthTime: fortune.birthTime,
    birthPlace: fortune.birthPlace || '北京',
    timezone: fortune.timezone ?? 8,
  });

  profileChangeLogOperations.create({
    userId,
    fortuneId,
    changeType: 'archive_primary',
    newValue: fortune.name,
  });

  return { success: true };
}

export function softDeleteProfileFortune(userId: string, fortuneId: string) {
  ensureProfileSettingsSchema();
  const fortunes = (fortuneOperations.getByUserId(userId) as FortuneLike[])
    .filter((row) => !row.deletedAt);
  const fortune = fortunes.find((row) => row.id === fortuneId);
  if (!fortune) {
    throw new Error('FORTUNE_NOT_FOUND');
  }
  if (fortunes.length <= 1) {
    throw new Error('LAST_FORTUNE_PROTECTED');
  }
  if (isPrimaryFortune(fortune)) {
    throw new Error('PRIMARY_FORTUNE_PROTECTED');
  }

  fortuneOperations.update(fortuneId, { deletedAt: new Date().toISOString() } as any);

  profileChangeLogOperations.create({
    userId,
    fortuneId,
    changeType: 'archive_delete',
    newValue: fortune.name,
  });

  return { success: true };
}

export function createProfileDocument(
  userId: string,
  input: {
    fortuneId?: string | null;
    title: string;
    category: ProfileDocumentCategory;
    content: string;
    visibility?: ProfileDocumentVisibility;
    pinned?: boolean;
  },
) {
  if (input.fortuneId) {
    const fortune = fortuneOperations.getById(input.fortuneId);
    if (!fortune || fortune.userId !== userId) {
      throw new Error('FORTUNE_NOT_FOUND');
    }
  }

  const id = profileDocumentOperations.create({
    userId,
    fortuneId: input.fortuneId || null,
    title: input.title,
    category: input.category,
    content: input.content,
    visibility: input.visibility,
    pinned: input.pinned,
  });

  profileChangeLogOperations.create({
    userId,
    fortuneId: input.fortuneId || null,
    changeType: 'document',
    fieldPath: 'create',
    newValue: input.title,
  });

  refreshFortuneCompleteness(userId, input.fortuneId || null);
  return { success: true, id };
}

export function updateProfileDocument(
  userId: string,
  documentId: string,
  input: {
    title?: string;
    category?: ProfileDocumentCategory;
    content?: string;
    visibility?: ProfileDocumentVisibility;
    pinned?: boolean;
  },
) {
  const existing = profileDocumentOperations.getById(documentId, userId);
  if (!existing) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  profileDocumentOperations.update({
    id: documentId,
    userId,
    ...input,
  });

  profileChangeLogOperations.create({
    userId,
    fortuneId: existing.fortuneId,
    changeType: 'document',
    fieldPath: 'update',
    newValue: input.title || existing.title,
  });

  refreshFortuneCompleteness(userId, existing.fortuneId);
  return { success: true };
}

export function deleteProfileDocument(userId: string, documentId: string) {
  const existing = profileDocumentOperations.getById(documentId, userId);
  if (!existing) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  profileDocumentOperations.softDelete(documentId, userId);
  profileChangeLogOperations.create({
    userId,
    fortuneId: existing.fortuneId,
    changeType: 'document',
    fieldPath: 'delete',
    newValue: existing.title,
  });

  refreshFortuneCompleteness(userId, existing.fortuneId);
  return { success: true };
}

function refreshFortuneCompleteness(userId: string, fortuneId: string | null) {
  if (!fortuneId) return;
  const supplements = mapSupplementViews(profileSupplementOperations.listByUser(userId, fortuneId));
  const documents = mapDocumentViews(profileDocumentOperations.listByUser(userId, fortuneId));
  const fortune = fortuneOperations.getById(fortuneId) as FortuneLike | null;
  const completeness = buildCompletenessBreakdown(fortune, supplements, documents).overall;
  fortuneOperations.update(fortuneId, { profileCompleteness: completeness } as any);
}
