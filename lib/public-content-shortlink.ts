import { fortuneOperations } from '@/lib/database';
import { getPublicQuestionFeedItem } from '@/lib/public-growth-feed';

export type LegacyContentShortlinkResolution =
  | { type: 'redirect'; href: string }
  | { type: 'expired'; reason: 'missing' | 'private-report' };

export function resolveLegacyContentShortlink(id: string): LegacyContentShortlinkResolution {
  const report = fortuneOperations.getById(id);

  if (report) {
    return report.isPublic !== false
      ? { type: 'redirect', href: `/result/${encodeURIComponent(id)}` }
      : { type: 'expired', reason: 'private-report' };
  }

  const question = getPublicQuestionFeedItem(id);
  if (question) return { type: 'redirect', href: question.href };

  return { type: 'expired', reason: 'missing' };
}
