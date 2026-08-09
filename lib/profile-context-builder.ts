import {
  fortuneOperations,
  userOperations,
} from '@/lib/database';
import { normalizeBirthAccuracy } from '@/lib/profile-birth-signature';
import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type SupplementDomain,
} from '@/lib/profile-settings-types';
import {
  ensureProfileSettingsSchema,
  profileDocumentOperations,
  profileSupplementOperations,
} from '@/lib/profile-settings-store';
import { buildFoundationPromptBundle, quickAstroPromptLines } from '@/lib/life-foundation/prompt-context';

export interface ProfileContextPack {
  account: {
    name: string;
    timezone: number;
    email?: string | null;
  };
  fortune: {
    id: string;
    name: string;
    relation?: string;
    relationLabel?: string | null;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    birthAccuracy: string;
    gender: 'male' | 'female';
    intent?: string | null;
  };
  supplements: Record<string, Record<string, string>>;
  documentExcerpts: Array<{ title: string; category: string; excerpt: string }>;
  completeness: number;
  industries: string[];
  /** 人生数据底座完整度 0–100 */
  foundationOverall?: number;
  foundationGradeLabel?: string;
  foundationLines?: string[];
}

function pickPrimaryFortune(userId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveUserFortune } = require('@/lib/resolve-user-fortune') as typeof import('@/lib/resolve-user-fortune');
    const resolved = resolveUserFortune(userId, { ensurePrimary: true });
    if (resolved) return resolved;
  } catch {
    // fall through
  }
  const fortunes = fortuneOperations.getByUserId(userId) ?? [];
  if (!Array.isArray(fortunes) || !fortunes.length) return null;
  return fortunes.find((item: any) => item.isPrimary)
    || fortunes.find((item: any) => !item.relation || item.relation === 'self')
    || fortunes[0];
}

export function buildProfileContextPack(userId: string, fortuneId?: string | null): ProfileContextPack | null {
  ensureProfileSettingsSchema();

  const user = userOperations.getById(userId) as {
    name?: string;
    timezone?: number;
    email?: string | null;
  } | undefined;

  if (!user) return null;

  const fortune = fortuneId
    ? fortuneOperations.getById(fortuneId)
    : pickPrimaryFortune(userId);

  if (!fortune) return null;

  // 合并档案级 + 账号级（对话渐进补全常写在 fortune_id 为空）
  const byFortune = profileSupplementOperations.listByUser(userId, fortune.id);
  const byAccount = profileSupplementOperations.listByUser(userId, null);
  const supplementMap: Record<string, Record<string, string>> = {};
  for (const item of [...byAccount, ...byFortune]) {
    supplementMap[item.domain] = { ...(supplementMap[item.domain] || {}), ...(item.fields || {}) };
  }

  const careerIndustry = supplementMap.career?.industry;
  const residenceCity = supplementMap.residence?.currentCity;
  const industries = [careerIndustry, residenceCity].filter(Boolean) as string[];

  const documents = profileDocumentOperations.listByUser(userId, fortune.id)
    .filter((doc) => doc.visibility === 'engine')
    .sort((left, right) => Number(right.pinned) - Number(left.pinned))
    .slice(0, 3);

  const documentExcerpts = documents.map((doc) => ({
    title: doc.title,
    category: doc.category,
    excerpt: doc.content.slice(0, 180),
  }));

  let foundationOverall: number | undefined;
  let foundationGradeLabel: string | undefined;
  let foundationLines: string[] | undefined;
  try {
    const bundle = buildFoundationPromptBundle(userId, fortune.id);
    if (bundle) {
      foundationOverall = bundle.overall;
      foundationGradeLabel = bundle.gradeLabel;
      foundationLines = bundle.lines;
    }
  } catch {
    // non-fatal
  }

  return {
    account: {
      name: user.name || fortune.name,
      timezone: user.timezone ?? 8,
      email: user.email || null,
    },
    fortune: {
      id: fortune.id,
      name: fortune.name,
      relation: fortune.relation,
      relationLabel: fortune.relationLabel || null,
      birthDate: fortune.birthDate,
      birthTime: fortune.birthTime,
      birthPlace: fortune.birthPlace || '北京',
      birthAccuracy: normalizeBirthAccuracy((fortune as any).birthAccuracy),
      gender: fortune.gender,
      intent: (fortune as any).intent || null,
    },
    supplements: supplementMap,
    documentExcerpts,
    completeness: foundationOverall ?? ((fortune as any).profileCompleteness || 0),
    industries,
    foundationOverall,
    foundationGradeLabel,
    foundationLines,
  };
}

export function formatProfileContextForPrompt(pack: ProfileContextPack): string {
  const lines: string[] = [
    `用户称呼：${pack.account.name}`,
    `档案：${pack.fortune.name}${pack.fortune.relationLabel ? `（${pack.fortune.relationLabel}）` : ''}`,
  ];

  if (pack.fortune.intent) {
    lines.push(`当前关注：${pack.fortune.intent}`);
  }

  if (pack.foundationOverall != null) {
    lines.push(
      `数据底座完整度：${pack.foundationOverall}%${pack.foundationGradeLabel ? `（${pack.foundationGradeLabel}）` : ''}`,
    );
  }

  // Prefer precomputed foundation lines (含星座/太岁/体貌/缺口)
  if (pack.foundationLines?.length) {
    for (const line of pack.foundationLines.slice(0, 12)) {
      if (!lines.includes(line)) lines.push(line);
    }
  } else {
    for (const line of quickAstroPromptLines(pack.fortune.birthDate)) {
      lines.push(line);
    }
  }

  const domainOrder: SupplementDomain[] = [
    'astro',
    'body',
    'apps',
    'goals',
    'career',
    'relationship',
    'wealth',
    'health',
    'residence',
  ];
  for (const domain of domainOrder) {
    const fields = pack.supplements[domain];
    if (!fields || Object.keys(fields).length === 0) continue;
    // skip heavy technical keys
    const skipKeys = new Set([
      'lastSessionId',
      'bodyUpdatedAt',
      'namingSessionId',
      'spaceSessionId',
      'hehunSessionId',
      'dimLastSessionId',
      'dimLastAt',
      'dimSlugs',
      'dimPredictionCount',
      'lastToolSessionId',
      'appsUpdatedAt',
      'namingCount',
      'spaceLinked',
    ]);
    const label = PROFILE_SUPPLEMENT_DOMAINS[domain].label;
    const detail = Object.entries(fields)
      .filter(([key, value]) => !skipKeys.has(key) && `${value || ''}`.trim())
      .map(([key, value]) => {
        const field = PROFILE_SUPPLEMENT_DOMAINS[domain]?.fields?.find((item) => item.key === key);
        const v = `${value}`.slice(0, 120);
        return `${field?.label || key}：${v}`;
      })
      .join('；');
    if (detail) lines.push(`${label}：${detail}`);
  }

  for (const doc of pack.documentExcerpts) {
    lines.push(`附加文档·${doc.title}：${doc.excerpt}`);
  }

  lines.push(
    '【使用规则】以上为用户固定参数与观测摘要；命盘四柱/用神以引擎真值为准，不可改写。表达层可结合星座、体貌、生活问答，禁止恐吓定命。',
  );

  return lines.join('\n');
}

export function buildProfilePersonalizationNote(pack: ProfileContextPack): string {
  const parts: string[] = [];

  const goals = pack.supplements.goals;
  if (goals?.primaryConcern) {
    parts.push(`你此刻最关心：${goals.primaryConcern}`);
  } else if (goals?.decisionPending) {
    parts.push(`待做决定：${goals.decisionPending}`);
  }

  const astro = pack.supplements.astro;
  if (astro?.sunSign || astro?.chineseZodiac) {
    parts.push(
      [astro.sunSign, astro.chineseZodiac ? `${astro.chineseZodiac}肖` : null].filter(Boolean).join(' · ') as string,
    );
  }

  if (pack.supplements.body?.faceSummary) {
    parts.push(`面相：${pack.supplements.body.faceSummary.slice(0, 40)}`);
  }

  const pinnedDoc = pack.documentExcerpts[0];
  if (pinnedDoc?.excerpt) {
    parts.push(`补充背景：${pinnedDoc.excerpt.slice(0, 80)}`);
  }

  if (pack.fortune.intent) {
    const intentLabels: Record<string, string> = {
      career: '事业',
      wealth: '财运',
      relationship: '关系',
      yearly: '流年',
    };
    parts.push(`当前测算关注：${intentLabels[pack.fortune.intent] || pack.fortune.intent}`);
  }

  if (pack.foundationOverall != null && pack.foundationOverall < 50) {
    parts.push('资料底座仍在完善中');
  }

  return parts.slice(0, 3).join('。');
}