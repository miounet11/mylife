import { getContentLocalePresentation, getLocaleAnchorId } from '@/lib/content-locale';

describe('content locale helpers', () => {
  it('maps english locales into the english group', () => {
    const presentation = getContentLocalePresentation('en-US', 'English-speaking professionals');

    expect(presentation.groupKey).toBe('en');
    expect(presentation.groupLabel).toBe('English');
    expect(presentation.localeLabel).toBe('Global / US');
  });

  it('maps traditional chinese locales into the zh-Hant group', () => {
    const presentation = getContentLocalePresentation('zh-HK', '香港移居 / 換城市用戶');

    expect(presentation.groupKey).toBe('zh-Hant');
    expect(presentation.groupLabel).toBe('繁體中文');
    expect(presentation.localeLabel).toBe('香港');
  });

  it('builds stable anchor ids for locale sections', () => {
    expect(getLocaleAnchorId('zh-Hans')).toBe('content-locale-zh-Hans');
  });
});
