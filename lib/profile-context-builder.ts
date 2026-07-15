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
}

function pickPrimaryFortune(userId: string) {
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

  const supplements = profileSupplementOperations.listByUser(userId, fortune.id);
  const supplementMap = supplements.reduce<Record<string, Record<string, string>>>((acc, item) => {
    acc[item.domain] = item.fields;
    return acc;
  }, {});

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
    completeness: (fortune as any).profileCompleteness || 0,
    industries,
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

  for (const domain of Object.keys(PROFILE_SUPPLEMENT_DOMAINS) as SupplementDomain[]) {
    const fields = pack.supplements[domain];
    if (!fields || Object.keys(fields).length === 0) continue;
    const label = PROFILE_SUPPLEMENT_DOMAINS[domain].label;
    const detail = Object.entries(fields)
      .map(([key, value]) => {
        const field = PROFILE_SUPPLEMENT_DOMAINS[domain]?.fields?.find((item) => item.key === key);
        return `${field?.label || key}：${value}`;
      })
      .join('；');
    lines.push(`${label}：${detail}`);
  }

  for (const doc of pack.documentExcerpts) {
    lines.push(`附加文档·${doc.title}：${doc.excerpt}`);
  }

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

  return parts.slice(0, 2).join('。');
}