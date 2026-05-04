import { describe, expect, test } from '@jest/globals';
import { resolveDeviceProfile } from '@/lib/device-profile';

describe('device profile', () => {
  test('detects mobile safari on ios', () => {
    expect(resolveDeviceProfile('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toEqual({
      deviceType: 'mobile',
      os: 'ios',
      browser: 'safari',
    });
  });

  test('detects desktop chrome on windows', () => {
    expect(resolveDeviceProfile('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36')).toEqual({
      deviceType: 'desktop',
      os: 'windows',
      browser: 'chrome',
    });
  });

  test('returns unknowns for missing user agent', () => {
    expect(resolveDeviceProfile('')).toEqual({
      deviceType: 'unknown',
      os: 'unknown',
      browser: 'unknown',
    });
  });
});
