import fs from 'fs';
import path from 'path';

let cachedBuildId: string | null = null;

export function getRuntimeBuildId() {
  if (cachedBuildId) {
    return cachedBuildId;
  }

  const candidates = [
    path.join(process.cwd(), '.next', 'BUILD_ID'),
    path.join(process.cwd(), '.next', 'standalone', '.next', 'BUILD_ID'),
  ];

  for (const candidate of candidates) {
    try {
      const value = fs.readFileSync(candidate, 'utf8').trim();
      if (value) {
        cachedBuildId = value;
        return value;
      }
    } catch {
      continue;
    }
  }

  cachedBuildId = 'unknown-build';
  return cachedBuildId;
}
