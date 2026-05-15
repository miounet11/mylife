jest.mock('@/lib/database', () => ({
  fortuneOperations: {
    getById: jest.fn(),
  },
}));

jest.mock('@/lib/public-growth-feed', () => ({
  getPublicQuestionFeedItem: jest.fn(),
}));

import { fortuneOperations } from '@/lib/database';
import { getPublicQuestionFeedItem } from '@/lib/public-growth-feed';
import { resolveLegacyContentShortlink } from '@/lib/public-content-shortlink';

const mockedGetById = fortuneOperations.getById as jest.Mock;
const mockedGetPublicQuestionFeedItem = getPublicQuestionFeedItem as jest.Mock;

describe('legacy content shortlink resolver', () => {
  beforeEach(() => {
    mockedGetById.mockReset();
    mockedGetPublicQuestionFeedItem.mockReset();
  });

  test('redirects public reports to canonical result page', () => {
    mockedGetById.mockReturnValue({ id: 'r1', isPublic: true });

    expect(resolveLegacyContentShortlink('r1')).toEqual({ type: 'redirect', href: '/result/r1' });
    expect(mockedGetPublicQuestionFeedItem).not.toHaveBeenCalled();
  });

  test('does not redirect private reports', () => {
    mockedGetById.mockReturnValue({ id: 'r_private', isPublic: false });

    expect(resolveLegacyContentShortlink('r_private')).toEqual({ type: 'expired', reason: 'private-report' });
    expect(mockedGetPublicQuestionFeedItem).not.toHaveBeenCalled();
  });

  test('redirects public questions to canonical question page', () => {
    mockedGetById.mockReturnValue(null);
    mockedGetPublicQuestionFeedItem.mockReturnValue({ id: 'q1', href: '/questions/q1' });

    expect(resolveLegacyContentShortlink('q1')).toEqual({ type: 'redirect', href: '/questions/q1' });
  });

  test('returns expired for missing ids', () => {
    mockedGetById.mockReturnValue(null);
    mockedGetPublicQuestionFeedItem.mockReturnValue(null);

    expect(resolveLegacyContentShortlink('missing')).toEqual({ type: 'expired', reason: 'missing' });
  });
});
