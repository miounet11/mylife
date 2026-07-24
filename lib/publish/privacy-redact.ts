/**
 * 公开发文前脱敏：去掉邮箱/手机/精确地址/身份证等。
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?<!\d)(?:\+?86[-\s]?)?1[3-9]\d{9}(?!\d)/g;
const ID_RE = /(?<!\d)\d{17}[\dXx](?!\d)/g;
const LONG_DIGIT_RE = /(?<!\d)\d{11,}(?!\d)/g;

/** 保留省市，去掉门牌与精确坐标串 */
export function redactAddress(address: string): string {
  if (!address) return '';
  let s = address.trim();
  s = s.replace(/\d+号.*$/u, '某号附近');
  s = s.replace(/\d+弄.*$/u, '某弄附近');
  s = s.replace(/\d+室/gu, '某室');
  s = s.replace(/-?\d+\.\d{3,},\s*-?\d+\.\d{3,}/g, '[坐标已隐藏]');
  return s.slice(0, 80);
}

export function redactText(input: string): string {
  if (!input) return '';
  return input
    .replace(EMAIL_RE, '[邮箱已隐藏]')
    .replace(PHONE_RE, '[手机已隐藏]')
    .replace(ID_RE, '[证件已隐藏]')
    .replace(LONG_DIGIT_RE, '[数字已隐藏]')
    .replace(/guest_[a-z0-9-]+/gi, '[访客]')
    .slice(0, 12000);
}

export function redactRecord(obj: unknown): unknown {
  if (obj == null) return obj;
  if (typeof obj === 'string') return redactText(obj);
  if (Array.isArray(obj)) return obj.map(redactRecord);
  if (typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = k.toLowerCase();
      if (['email', 'phone', 'mobile', 'idcard', 'password', 'token'].includes(key)) {
        out[k] = '[已隐藏]';
        continue;
      }
      if (key.includes('address') || key === 'geo') {
        out[k] = typeof v === 'string' ? redactAddress(v) : redactRecord(v);
        continue;
      }
      out[k] = redactRecord(v);
    }
    return out;
  }
  return obj;
}
