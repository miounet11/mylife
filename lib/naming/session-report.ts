import type { NameCandidate, NamingMode } from './types';
import type { NamingLlmEnhancement } from './llm-enhance';

export type NamingSessionInput = {
  mode: NamingMode;
  surname?: string;
  gender?: string;
  yongShen?: string[];
  jiShen?: string[];
  generationChar?: string;
  industry?: string;
  keywords?: string[];
  tradeName?: string;
  region?: string;
  jurisdiction?: string;
  entityForm?: string;
  preferredLength?: number;
  category?: string;
  style?: string;
  enableWuge?: boolean;
  productKeywords?: string[];
};

export type NamingSessionResult = {
  schema: 'life-kline.naming-session.v1';
  generatedAt: string;
  mode: NamingMode;
  title: string;
  summary: string;
  input: NamingSessionInput;
  candidates: NameCandidate[];
  llm: NamingLlmEnhancement;
  disclaimer: string;
};

export function namingSessionTitle(mode: NamingMode, input: NamingSessionInput): string {
  if (mode === 'person') return `个人起名方案 · ${input.surname || '—'}姓`;
  if (mode === 'rename') return `改名方案 · ${input.surname || '—'}`;
  if (mode === 'company')
    return `公司起名方案 · ${input.industry || '综合'}${(input.keywords || [])[0] ? ` · ${input.keywords![0]}` : ''}`;
  return `产品起名方案 · ${input.category || '产品'}`;
}

export function encodeNameKey(name: string): string {
  return encodeURIComponent(name);
}

export function decodeNameKey(key: string): string {
  try {
    return decodeURIComponent(key);
  } catch {
    return key;
  }
}

export function findCandidate(
  candidates: NameCandidate[],
  nameKey: string,
): NameCandidate | null {
  const name = decodeNameKey(nameKey);
  return (
    candidates.find((c) => (c.fullName || c.name) === name) ||
    candidates.find((c) => c.name === name) ||
    null
  );
}
