export type DeviceType = 'mobile' | 'desktop' | 'tablet' | 'bot' | 'unknown';

export type DeviceProfile = {
  deviceType: DeviceType;
  os: string;
  browser: string;
};

function includesAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

export function resolveDeviceProfile(userAgent?: string | null): DeviceProfile {
  const ua = `${userAgent || ''}`.trim();
  const normalized = ua.toLowerCase();

  if (!normalized) {
    return {
      deviceType: 'unknown',
      os: 'unknown',
      browser: 'unknown',
    };
  }

  const deviceType: DeviceType = includesAny(normalized, [/bot/i, /crawler/i, /spider/i, /preview/i])
    ? 'bot'
    : /ipad|tablet|playbook|silk/i.test(normalized)
      ? 'tablet'
      : /mobi|iphone|ipod|android.+mobile|windows phone/i.test(normalized)
        ? 'mobile'
        : /macintosh|windows nt|x11|linux x86_64|cros/i.test(normalized)
          ? 'desktop'
          : /android/i.test(normalized)
            ? 'mobile'
            : 'unknown';

  const os = /windows nt/i.test(normalized)
    ? 'windows'
    : /android/i.test(normalized)
      ? 'android'
      : /iphone|ipad|ipod|ios/i.test(normalized)
        ? 'ios'
        : /mac os x|macintosh/i.test(normalized)
          ? 'macos'
          : /cros/i.test(normalized)
            ? 'chromeos'
            : /linux/i.test(normalized)
              ? 'linux'
              : 'unknown';

  const browser = /edg\//i.test(normalized)
    ? 'edge'
    : /opr\//i.test(normalized)
      ? 'opera'
      : /chrome\//i.test(normalized) && !/edg\//i.test(normalized)
        ? 'chrome'
        : /firefox\//i.test(normalized)
          ? 'firefox'
          : /safari\//i.test(normalized) && !/chrome\//i.test(normalized)
            ? 'safari'
            : /micromessenger/i.test(normalized)
              ? 'wechat'
              : /qqbrowser/i.test(normalized)
                ? 'qqbrowser'
                : 'unknown';

  return {
    deviceType,
    os,
    browser,
  };
}
