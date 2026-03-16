type LooseRecord = Record<string, unknown> | null | undefined;

export function hasMeaningfulProfileIdentity(user: LooseRecord) {
  if (!user) {
    return false;
  }

  const name = typeof user.name === 'string' ? user.name.trim() : '';
  const email = typeof user.email === 'string' ? user.email.trim() : '';
  const birthDate = typeof user.birth_date === 'string' ? user.birth_date.trim() : '';
  const birthPlace = typeof user.birth_place === 'string' ? user.birth_place.trim() : '';

  if (email) {
    return true;
  }

  if (birthDate || birthPlace) {
    return true;
  }

  return !!name && name !== '未命名测算者';
}

function strengthToBase(strength?: string) {
  if (strength === 'strong') return 85;
  if (strength === 'weak') return 55;
  return 70;
}

export function buildProfileChartData(fortunes: Record<string, unknown>[] = []) {
  const points = fortunes.map((item) => {
    const createdAt = typeof item.created_at === 'string' || typeof item.createdAt === 'string'
      ? `${item.created_at || item.createdAt}`
      : '';
    const year = new Date(createdAt || Date.now()).getFullYear();
    const pattern = (item.pattern as Record<string, unknown> | undefined) || undefined;
    const base = strengthToBase(typeof pattern?.strength === 'string' ? pattern.strength : undefined);

    return {
      year,
      career: base,
      wealth: Math.min(100, base + 5),
      marriage: Math.max(0, base - 5),
      health: base,
    };
  });

  const byYear = new Map<number, { year: number; career: number; wealth: number; marriage: number; health: number }>();
  points.forEach((point) => byYear.set(point.year, point));
  return Array.from(byYear.values()).sort((left, right) => left.year - right.year);
}

export function hasProfileContent(params: {
  user?: LooseRecord;
  fortunes?: Record<string, unknown>[];
  eventCount?: number;
}) {
  const fortunes = params.fortunes || [];
  const eventCount = params.eventCount || 0;

  return fortunes.length > 0 || eventCount > 0 || hasMeaningfulProfileIdentity(params.user);
}
