export const COHORT_LENS_IDS = [
  'childhood',
  'personality',
  'career',
  'relationship',
  'money',
  'blindspot',
  'roadmap',
] as const;

export type CohortLensId = (typeof COHORT_LENS_IDS)[number];

export type CohortVerdict = 'like' | 'partial' | 'unlike' | 'unsure';

export type CohortRegion = 'cn-mainland' | 'greater-china' | 'overseas';

export type CohortDimension =
  | 'career'
  | 'relationship'
  | 'wealth'
  | 'health'
  | 'self'
  | 'family';

export interface CohortFork {
  id: string;
  label: string;
  trait: string;
}

export interface CohortClaimDef {
  id: string;
  lensId: CohortLensId;
  text: string;
  checkPrompt: string;
  traitIfLike: string;
  traitIfUnlike: string;
  dimension: CohortDimension;
  forks: CohortFork[];
}

export interface CohortFacts {
  key: string;
  yearStart: number;
  yearEnd: number;
  label: string;
  generationName: string;
  childhoodSetting: string;
  mediaDiet: string;
  familyShape: string;
  schoolTone: string;
  comingOfAgeEvent: string;
  jobMarketEntry: string;
  careerAdvantage: string;
  careerTrap: string;
  relationshipNorm: string;
  attachmentPull: string;
  moneyFormative: string;
  moneyHabit: string;
  moneyBlind: string;
  blindspot: string;
  blindspotDaily: string;
  blindspotFlip: string;
  olderContrast: string;
  youngerContrast: string;
  valueCore: string;
}

export interface CohortJudgment {
  claimId: string;
  lensId: CohortLensId;
  verdict: CohortVerdict;
  note?: string;
  forkId?: string;
  judgedAt: string;
}

export interface CohortCalibrationState {
  version: 1;
  birthYear: number;
  cohortKey: string;
  region: CohortRegion;
  judgments: CohortJudgment[];
  confirmedTraits: string[];
  deniedTraits: string[];
  focusLenses: CohortLensId[];
  updatedAt: string;
}

export interface CohortClaimView {
  id: string;
  lensId: CohortLensId;
  text: string;
  checkPrompt: string;
  dimension: CohortDimension;
  verdict?: CohortVerdict;
  note?: string;
  forkId?: string;
  forks: CohortFork[];
}

export interface CohortLensView {
  id: CohortLensId;
  title: string;
  subtitle: string;
  overview: string;
  judged: boolean;
  claims: CohortClaimView[];
}

export interface CohortStageView {
  id: string;
  label: string;
  ageStart: number;
  ageEnd: number;
  current: boolean;
  priority: string;
  watch: string;
  decision: string;
}

export interface CohortMirrorView {
  birthYear: number;
  currentAge: number;
  region: CohortRegion;
  cohortKey: string;
  cohortLabel: string;
  generationName: string;
  headline: string;
  eraLine: string;
  compareLine: string;
  disclaimer: string;
  lenses: CohortLensView[];
  stages: CohortStageView[];
  progress: {
    judgedLenses: number;
    totalLenses: number;
    judgedClaims: number;
    totalClaims: number;
  };
  memory: {
    confirmed: string[];
    denied: string[];
    summary: string;
  };
  chatStarters: string[];
}

export const COHORT_CALIBRATION_VERSION = 1 as const;
