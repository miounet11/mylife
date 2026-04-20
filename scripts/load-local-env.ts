import fs from 'fs';
import path from 'path';

export function loadLocalEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    if (!key || process.env[key]) continue;

    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  return true;
}

export function loadDefaultLocalEnv() {
  return loadLocalEnvFile(path.join(process.cwd(), '.env.local'));
}
