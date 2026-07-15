import {
  getLearningTrack,
  type LearningTrackKey,
  type LearningTrackStep,
} from '@/lib/learning-tracks';

export function getClientRecommendedTrackSteps(
  trackKey: LearningTrackKey,
  limit = 3,
): Array<LearningTrackStep & { trackKey: LearningTrackKey; trackTitle: string }> {
  const track = getLearningTrack(trackKey);
  return track.steps.slice(0, limit).map((step) => ({
    ...step,
    trackKey: track.key,
    trackTitle: track.title,
  }));
}