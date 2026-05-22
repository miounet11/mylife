// v5-D63 简繁互转 helper
import * as cc from 'chinese-conv';

export type Locale = 'zh-CN' | 'zh-Hant';

export function detectLocaleFromQuery(lang?: string | null): Locale {
  if (!lang) return 'zh-CN';
  const l = lang.toLowerCase();
  if (l === 'zh-hant' || l === 'zh-tw' || l === 'zh-hk' || l === 'zh-mo' || l === 'hant') return 'zh-Hant';
  return 'zh-CN';
}

export function toLocale(text: string, locale: Locale): string {
  if (!text) return text;
  if (locale === 'zh-Hant') return cc.tify(text);
  return text;
}

// 批量转换对象的指定字段
export function localizeFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[], locale: Locale): T {
  if (locale === 'zh-CN') return obj;
  const out = { ...obj };
  for (const f of fields) {
    const v = out[f];
    if (typeof v === 'string') (out as Record<string, unknown>)[f as string] = cc.tify(v);
  }
  return out;
}
