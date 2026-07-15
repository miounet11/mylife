import { createHash } from 'crypto';
import type { BirthAccuracy } from '@/lib/profile-settings-types';

export function buildBirthSignature(input: {
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  birthAccuracy?: BirthAccuracy | string;
  gender?: string;
}): string {
  const payload = [
    input.birthDate,
    input.birthTime || '12:00',
    (input.birthPlace || '北京').trim(),
    input.birthAccuracy || 'range',
    input.gender || 'male',
  ].join('|');

  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function normalizeBirthAccuracy(value: unknown): BirthAccuracy {
  if (value === 'exact' || value === 'range' || value === 'unknown') {
    return value;
  }
  return 'range';
}