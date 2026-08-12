/**
 * Single key for 五行 across engines.
 * Stems (GAN_TO_WUXING) are English; some branch tables and UI lists are 中文.
 * Comparing them raw made 大运地支 / 证据五行角色永远对不上用神.
 */

const TO_EN: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
  wood: 'wood',
  fire: 'fire',
  earth: 'earth',
  metal: 'metal',
  water: 'water',
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water',
};

const TO_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
};

export type ElementEn = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export function toElementEn(raw: string | null | undefined): ElementEn | '' {
  const key = `${raw || ''}`.trim();
  return TO_EN[key] || TO_EN[key.toLowerCase()] || '';
}

export function toElementCn(raw: string | null | undefined): string {
  const key = `${raw || ''}`.trim();
  return TO_CN[key] || TO_CN[key.toLowerCase()] || '';
}

export function listHasElement(list: unknown, raw: string | null | undefined): boolean {
  const want = toElementEn(raw);
  if (!want || !Array.isArray(list)) return false;
  return list.some((item) => toElementEn(`${item || ''}`) === want);
}

export function normalizeElementList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const cn = toElementCn(`${item || ''}`);
    if (!cn || seen.has(cn)) continue;
    seen.add(cn);
    out.push(cn);
  }
  return out;
}
