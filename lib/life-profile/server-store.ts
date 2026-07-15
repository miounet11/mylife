import 'server-only';

import type { LifeProfile } from './types';

function getOperations() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { lifeProfileOperations } = require('@/lib/database') as {
      lifeProfileOperations?: {
        listByUserId: (userId: string) => LifeProfile[];
        upsertMany: (userId: string, profiles: LifeProfile[]) => void;
      };
    };
    return lifeProfileOperations || null;
  } catch {
    return null;
  }
}

export function listLifeProfilesForUser(userId: string): LifeProfile[] {
  const ops = getOperations();
  if (!ops) return [];
  const rows = ops.listByUserId(userId) as Array<LifeProfile | { profile: LifeProfile }>;
  return rows
    .map((row) => ('profile' in row && row.profile ? row.profile : row))
    .filter((item): item is LifeProfile => Boolean(item?.birthSignature));
}

export function upsertLifeProfilesForUser(userId: string, profiles: LifeProfile[]): number {
  const ops = getOperations();
  if (!ops || !profiles.length) return 0;
  const sanitized = sanitizeProfiles(profiles);
  ops.upsertMany(userId, sanitized);
  return sanitized.length;
}

function sanitizeProfiles(profiles: LifeProfile[]): LifeProfile[] {
  return profiles.filter((item) => Boolean(item?.birthSignature));
}