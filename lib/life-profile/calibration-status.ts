import type { LifeProfile } from '@/lib/life-profile/types';

export const CALIBRATED_REPORT_COUNT_MIN = 3;
export const CALIBRATED_SCORE_MIN = 0.7;
export const ANNUAL_REVIEW_HIT_RATE_GATE = 0.6;

export function isCalibratedUser(profile: Pick<LifeProfile, 'reportCount' | 'calibrationScore'>): boolean {
  return (
    profile.reportCount >= CALIBRATED_REPORT_COUNT_MIN
    && profile.calibrationScore >= CALIBRATED_SCORE_MIN
  );
}

export function shouldShowAnnualReviewEmailGate(params: {
  hitRate: number;
  hasEmail: boolean;
}): boolean {
  return !params.hasEmail && params.hitRate < ANNUAL_REVIEW_HIT_RATE_GATE;
}