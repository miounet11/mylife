/**
 * Client-side remembered birth fields for free tools / hehun.
 * Only stores non-sensitive form defaults (date/time/gender/name/place) in localStorage.
 * birthPlace may include city + longitude hint (e.g. "成都 · 104.1°E"); no PII beyond that.
 */

export type RememberedBirthForm = {
  birthDate: string;
  birthTime: string;
  gender: 'male' | 'female';
  name: string;
  /** Optional birth place; may encode longitude as "城市 · 104.1°E" */
  birthPlace?: string;
};

const STORAGE_KEY = 'lk_birth_form_v1';
const HEHUN_STORAGE_KEY = 'lk_hehun_birth_pair_v1';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeParse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function normalizeGender(value: unknown): 'male' | 'female' {
  const g = `${value || ''}`.trim().toLowerCase();
  if (g === 'female' || g === '女' || g === 'f') return 'female';
  return 'male';
}

export function loadRememberedBirthForm(): RememberedBirthForm | null {
  if (!canUseStorage()) return null;
  const data = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (!data) return null;
  const birthDate = `${data.birthDate || ''}`.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(birthDate)) return null;
  const birthPlace = `${data.birthPlace || ''}`.trim().slice(0, 80);
  return {
    birthDate,
    birthTime: `${data.birthTime || '12:00'}`.trim() || '12:00',
    gender: normalizeGender(data.gender),
    name: `${data.name || ''}`.trim().slice(0, 40),
    ...(birthPlace ? { birthPlace } : {}),
  };
}

export function saveRememberedBirthForm(input: Partial<RememberedBirthForm>): void {
  if (!canUseStorage()) return;
  const prev = loadRememberedBirthForm();
  const birthPlace = `${input.birthPlace ?? prev?.birthPlace ?? ''}`.trim().slice(0, 80);
  const next: RememberedBirthForm = {
    birthDate: `${input.birthDate ?? prev?.birthDate ?? ''}`.trim(),
    birthTime: `${input.birthTime ?? prev?.birthTime ?? '12:00'}`.trim() || '12:00',
    gender: normalizeGender(input.gender ?? prev?.gender ?? 'male'),
    name: `${input.name ?? prev?.name ?? ''}`.trim().slice(0, 40),
    ...(birthPlace ? { birthPlace } : {}),
  };
  if (!/^\d{4}-\d{2}-\d{2}/.test(next.birthDate)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota / private mode
  }
}

export type RememberedHehunBirthPair = {
  a: RememberedBirthForm;
  b: RememberedBirthForm;
};

export function loadRememberedHehunBirthPair(): RememberedHehunBirthPair | null {
  if (!canUseStorage()) return null;
  const data = safeParse(window.localStorage.getItem(HEHUN_STORAGE_KEY));
  if (!data) return null;
  const aDate = `${(data.a as any)?.birthDate || ''}`.trim();
  const bDate = `${(data.b as any)?.birthDate || ''}`.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(aDate) || !/^\d{4}-\d{2}-\d{2}/.test(bDate)) return null;
  const aPlace = `${(data.a as any)?.birthPlace || ''}`.trim().slice(0, 80);
  const bPlace = `${(data.b as any)?.birthPlace || ''}`.trim().slice(0, 80);
  return {
    a: {
      birthDate: aDate,
      birthTime: `${(data.a as any)?.birthTime || '12:00'}`.trim() || '12:00',
      gender: normalizeGender((data.a as any)?.gender),
      name: `${(data.a as any)?.name || '本人'}`.trim().slice(0, 40),
      ...(aPlace ? { birthPlace: aPlace } : {}),
    },
    b: {
      birthDate: bDate,
      birthTime: `${(data.b as any)?.birthTime || '12:00'}`.trim() || '12:00',
      gender: normalizeGender((data.b as any)?.gender),
      name: `${(data.b as any)?.name || '对方'}`.trim().slice(0, 40),
      ...(bPlace ? { birthPlace: bPlace } : {}),
    },
  };
}

export function saveRememberedHehunBirthPair(pair: {
  a: Partial<RememberedBirthForm>;
  b: Partial<RememberedBirthForm>;
}): void {
  if (!canUseStorage()) return;
  const prev = loadRememberedHehunBirthPair();
  const aDate = `${pair.a.birthDate ?? prev?.a.birthDate ?? ''}`.trim();
  const bDate = `${pair.b.birthDate ?? prev?.b.birthDate ?? ''}`.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(aDate) || !/^\d{4}-\d{2}-\d{2}/.test(bDate)) return;
  const aPlace = `${pair.a.birthPlace ?? prev?.a.birthPlace ?? ''}`.trim().slice(0, 80);
  const bPlace = `${pair.b.birthPlace ?? prev?.b.birthPlace ?? ''}`.trim().slice(0, 80);
  const next: RememberedHehunBirthPair = {
    a: {
      birthDate: aDate,
      birthTime: `${pair.a.birthTime ?? prev?.a.birthTime ?? '12:00'}`.trim() || '12:00',
      gender: normalizeGender(pair.a.gender ?? prev?.a.gender ?? 'male'),
      name: `${pair.a.name ?? prev?.a.name ?? '本人'}`.trim().slice(0, 40),
      ...(aPlace ? { birthPlace: aPlace } : {}),
    },
    b: {
      birthDate: bDate,
      birthTime: `${pair.b.birthTime ?? prev?.b.birthTime ?? '12:00'}`.trim() || '12:00',
      gender: normalizeGender(pair.b.gender ?? prev?.b.gender ?? 'female'),
      name: `${pair.b.name ?? prev?.b.name ?? '对方'}`.trim().slice(0, 40),
      ...(bPlace ? { birthPlace: bPlace } : {}),
    },
  };
  try {
    window.localStorage.setItem(HEHUN_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  // Also keep primary side as default tool birth form
  saveRememberedBirthForm(next.a);
}
