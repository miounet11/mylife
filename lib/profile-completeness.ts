import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type ProfileDocumentView,
  type ProfileIntent,
  type ProfileSupplementView,
  type SupplementDomain,
} from '@/lib/profile-settings-types';

export type ProfileCompletenessBreakdown = {
  overall: number;
  fortuneScore: number;
  supplementScore: number;
  documentScore: number;
  intent: ProfileIntent | null;
  domainScores: Record<SupplementDomain, number>;
  topWeightedDomains: SupplementDomain[];
};

type FortuneLike = {
  name?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  gender?: string | null;
  intent?: string | null;
  birthAccuracy?: string | null;
};

const OVERALL_WEIGHTS = {
  fortune: 0.55,
  supplement: 0.30,
  document: 0.15,
} as const;

const INTENT_DOMAIN_WEIGHTS: Record<ProfileIntent, Record<SupplementDomain, number>> = {
  career: {
    career: 0.35,
    goals: 0.25,
    wealth: 0.15,
    relationship: 0.10,
    health: 0.08,
    residence: 0.07,
  },
  wealth: {
    wealth: 0.35,
    career: 0.25,
    goals: 0.20,
    relationship: 0.08,
    health: 0.07,
    residence: 0.05,
  },
  relationship: {
    relationship: 0.35,
    goals: 0.25,
    career: 0.12,
    wealth: 0.10,
    health: 0.10,
    residence: 0.08,
  },
  yearly: {
    goals: 0.35,
    residence: 0.18,
    health: 0.17,
    career: 0.15,
    wealth: 0.10,
    relationship: 0.05,
  },
};

const DEFAULT_DOMAIN_WEIGHTS: Record<SupplementDomain, number> = {
  goals: 0.25,
  career: 0.20,
  relationship: 0.15,
  wealth: 0.15,
  health: 0.13,
  residence: 0.12,
};

const SUPPLEMENT_DOMAINS = Object.keys(PROFILE_SUPPLEMENT_DOMAINS) as SupplementDomain[];

export function getDomainWeights(intent: ProfileIntent | null | undefined): Record<SupplementDomain, number> {
  if (intent && INTENT_DOMAIN_WEIGHTS[intent]) {
    return INTENT_DOMAIN_WEIGHTS[intent];
  }
  return DEFAULT_DOMAIN_WEIGHTS;
}

function computeDomainScore(
  supplement: ProfileSupplementView | undefined,
  domain: SupplementDomain,
): number {
  const fields = PROFILE_SUPPLEMENT_DOMAINS[domain].fields;
  if (fields.length === 0) return 0;
  const filled = fields.filter((field) => `${supplement?.fields[field.key] || ''}`.trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export function computeSupplementCompletenessWeighted(
  supplements: ProfileSupplementView[],
  intent: ProfileIntent | null | undefined,
): { score: number; domainScores: Record<SupplementDomain, number> } {
  const weights = getDomainWeights(intent);
  const domainScores = {} as Record<SupplementDomain, number>;
  let weightedSum = 0;

  for (const domain of SUPPLEMENT_DOMAINS) {
    const supplement = supplements.find((item) => item.domain === domain);
    const domainScore = computeDomainScore(supplement, domain);
    domainScores[domain] = domainScore;
    weightedSum += domainScore * weights[domain];
  }

  return { score: Math.round(weightedSum), domainScores };
}

export function computeFortuneCompleteness(fortune: FortuneLike | null | undefined): number {
  if (!fortune) return 0;
  const checks = [
    fortune.name,
    fortune.birthDate,
    fortune.birthTime,
    fortune.birthPlace,
    fortune.gender,
    fortune.intent,
    fortune.birthAccuracy,
  ];
  const filled = checks.filter((value) => `${value || ''}`.trim()).length;
  return Math.round((filled / checks.length) * 100);
}

export function computeDocumentCompleteness(documents: ProfileDocumentView[]): number {
  if (documents.length === 0) return 0;
  if (documents.length >= 3) return 100;
  return Math.round((documents.length / 3) * 100);
}

export function rankWeightedDomains(intent: ProfileIntent | null | undefined): SupplementDomain[] {
  const weights = getDomainWeights(intent);
  return [...SUPPLEMENT_DOMAINS].sort((left, right) => weights[right] - weights[left]);
}

export function computeProfileCompleteness(
  fortune: FortuneLike | null | undefined,
  supplements: ProfileSupplementView[],
  documents: ProfileDocumentView[],
): ProfileCompletenessBreakdown {
  const intent = (fortune?.intent as ProfileIntent | null) || null;
  const fortuneScore = computeFortuneCompleteness(fortune);
  const { score: supplementScore, domainScores } = computeSupplementCompletenessWeighted(supplements, intent);
  const documentScore = computeDocumentCompleteness(documents);
  const overall = Math.round(
    (fortuneScore * OVERALL_WEIGHTS.fortune)
    + (supplementScore * OVERALL_WEIGHTS.supplement)
    + (documentScore * OVERALL_WEIGHTS.document),
  );

  return {
    overall,
    fortuneScore,
    supplementScore,
    documentScore,
    intent,
    domainScores,
    topWeightedDomains: rankWeightedDomains(intent).slice(0, 3),
  };
}

export function completenessIntentHint(intent: ProfileIntent | null | undefined): string | null {
  if (!intent) return null;
  const labels: Record<ProfileIntent, string> = {
    career: '事业关注',
    wealth: '财运关注',
    relationship: '关系关注',
    yearly: '流年关注',
  };
  return `按「${labels[intent]}」加权计算`;
}