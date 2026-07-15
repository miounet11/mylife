import 'server-only';

import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import {
  getAllLearningTracks,
  type LearningTrack,
  type LearningTrackKey,
  type LearningTrackStep,
} from '@/lib/learning-tracks';

export interface LearningTrackProgress {
  key: LearningTrackKey;
  publishedStepCount: number;
  totalStepCount: number;
  requiredStepCount: number;
  requiredPublishedCount: number;
  completionRate: number;
  isLearnable: boolean;
  totalReadMinutes: number;
}

export interface LearningTracksOverview {
  tracks: Array<LearningTrack & { progress: LearningTrackProgress }>;
  totalPublishedSteps: number;
  totalSteps: number;
}

function buildPublishedSlugSet() {
  const slugs = new Set<string>();
  for (const type of ['knowledge', 'case', 'insight'] as const) {
    for (const entry of listPublishedManagedContentEntriesByType(type)) {
      if (entry.slug) slugs.add(entry.slug);
    }
  }
  return slugs;
}

function isStepPublished(step: LearningTrackStep, publishedSlugs: Set<string>) {
  if (!step.slug) {
    return step.kind === 'tool' || step.kind === 'action' || step.kind === 'hub';
  }
  return publishedSlugs.has(step.slug);
}

function computeTrackProgress(track: LearningTrack, publishedSlugs: Set<string>): LearningTrackProgress {
  const publishedSteps = track.steps.filter((step) => isStepPublished(step, publishedSlugs));
  const requiredSteps = track.steps.filter((step) => step.required);
  const requiredPublished = requiredSteps.filter((step) => isStepPublished(step, publishedSlugs));
  const totalReadMinutes = track.steps.reduce((sum, step) => sum + (step.readMinutes || 0), 0);
  const completionRate = track.steps.length
    ? Math.round((publishedSteps.length / track.steps.length) * 100)
    : 0;

  return {
    key: track.key,
    publishedStepCount: publishedSteps.length,
    totalStepCount: track.steps.length,
    requiredStepCount: requiredSteps.length,
    requiredPublishedCount: requiredPublished.length,
    completionRate,
    isLearnable: requiredPublished.length >= Math.min(requiredSteps.length, 2) || publishedSteps.length >= 3,
    totalReadMinutes,
  };
}

let cachedOverview: { value: LearningTracksOverview; expiresAt: number } | null = null;
const TTL_MS = 60_000;

export function getLearningTracksOverview(): LearningTracksOverview {
  const now = Date.now();
  if (cachedOverview && cachedOverview.expiresAt > now) {
    return cachedOverview.value;
  }

  const publishedSlugs = buildPublishedSlugSet();
  const tracks = getAllLearningTracks().map((track) => ({
    ...track,
    progress: computeTrackProgress(track, publishedSlugs),
  }));

  const value: LearningTracksOverview = {
    tracks,
    totalPublishedSteps: tracks.reduce((sum, track) => sum + track.progress.publishedStepCount, 0),
    totalSteps: tracks.reduce((sum, track) => sum + track.progress.totalStepCount, 0),
  };

  cachedOverview = { value, expiresAt: now + TTL_MS };
  return value;
}

export function invalidateLearningTracksOverview() {
  cachedOverview = null;
}

export function getRecommendedTrackSteps(
  trackKey: LearningTrackKey,
  limit = 3,
): Array<LearningTrackStep & { trackKey: LearningTrackKey; trackTitle: string }> {
  const overview = getLearningTracksOverview();
  const track = overview.tracks.find((item) => item.key === trackKey) || overview.tracks[0];
  return track.steps.slice(0, limit).map((step) => ({
    ...step,
    trackKey: track.key,
    trackTitle: track.title,
  }));
}