/** Structured engine pack for 星座 × 万年历 daily pages — no freeform spam. */

import type { AlmanacLuck, PersonalDayStance } from '@/lib/almanac/types';
import type { SignKey } from '@/lib/astro/types';

export type AstroDailyKind =
  | 'sign'
  | 'zone'
  | 'rising'
  | 'birth'
  | 'element'
  | 'modality'
  | 'shengxiao';

export type AstroDailyIdentity =
  | { kind: 'sign'; key: SignKey }
  | { kind: 'zone'; id: string }
  | { kind: 'rising'; key: SignKey }
  | { kind: 'birth'; birthDate: string; birthHour?: number }
  | { kind: 'element'; slug: string }
  | { kind: 'modality'; slug: string }
  | { kind: 'shengxiao'; slug: string };

export type AstroEvidence = {
  code: string;
  label: string;
  weight: number;
};

export type AstroHourNote = {
  ganZhi: string;
  timeLabel: string;
  score: number;
  reason: string;
  publicLuck: AlmanacLuck;
};

export type AstroDailyMatchPack = {
  targetDate: string;
  identity: {
    kind: AstroDailyKind;
    key: string;
    title: string;
    subtitle: string;
    signKey?: SignKey;
    zoneId?: string;
  };
  almanac: {
    dayGanZhi: string;
    lunarText: string;
    yi: string[];
    ji: string[];
    chong: string;
    sha: string;
    jieQi: string | null;
    hoursSummary: Array<{ ganZhi: string; timeLabel: string; luck: AlmanacLuck }>;
    westernSign: string;
    packPath: string;
  };
  natal: null | {
    birthDate?: string;
    dayMaster: string;
    dayPillar: string;
    dayBranch: string;
    yongShen: string[];
    source: 'engine' | 'birth_noon' | 'cohort';
    sun?: { zh: string; key: SignKey };
    zone?: { id: string; title: string };
    chineseZodiac?: string;
  };
  scores: {
    structure: number;
    expression: number;
    composite: number;
    stars: number;
    stance: PersonalDayStance;
  };
  narrative: {
    headline: string;
    moodLine: string;
    favors: string[];
    watchouts: string[];
    topHours: AstroHourNote[];
    avoidHours: AstroHourNote[];
    expressionNote: string;
    worldYiBridge: string;
  };
  evidence: AstroEvidence[];
  bridges: {
    almanac: string;
    worldYi: string[];
    analyze: string;
    foundation: string;
    siblingDays: { prev: string; next: string };
    siblings: Array<{ href: string; label: string }>;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
    faqs: Array<{ question: string; answer: string }>;
  };
  disclaimer: string;
  quality: { ok: true; evidenceCount: number };
};
