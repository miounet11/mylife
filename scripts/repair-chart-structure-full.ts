/**
 * Full structural chart repair for fortunes.
 *
 * Rebuilds: bazi pillars + dayun + kline + calculationIdentity from birth fields.
 * Does NOT run LLM narrative upgrade (use report-upgrade job for that).
 *
 *   npx tsx scripts/repair-chart-structure-full.ts --dry-run
 *   npx tsx scripts/repair-chart-structure-full.ts --apply --ids report_xxx
 *   npx tsx scripts/repair-chart-structure-full.ts --apply --all-drift
 *   npx tsx scripts/repair-chart-structure-full.ts --apply --verify-all
 *   npx tsx scripts/repair-chart-structure-full.ts --apply --missing-identity
 *
 * --from-stored-time (default): recompute pillars from fortunes.birth_date + birth_time
 * --from-identity: keep identity clock as source (only rewrite structure to match identity)
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import {
  normalizeClockTime,
  pillarsToFingerprint,
} from '../lib/calculation-identity';
import { buildFortuneContextInput } from '../lib/fortune-context-builder';

function parseArgs(argv: string[]) {
  const get = (name: string, fallback = '') => {
    const i = argv.indexOf(name);
    if (i === -1) return fallback;
    return argv[i + 1] || fallback;
  };
  return {
    apply: argv.includes('--apply'),
    allDrift: argv.includes('--all-drift'),
    verifyAll: argv.includes('--verify-all'),
    missingIdentity: argv.includes('--missing-identity'),
    fromIdentity: argv.includes('--from-identity'),
    ids: get('--ids', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dbPath =
    process.env.LIFEKLINE_DB || path.join(process.cwd(), 'data', 'lifekline.db');
  const db = new Database(dbPath);

  let rows = db
    .prepare(
      `SELECT id, user_id, name, birth_date, birth_time, birth_place, timezone, gender,
              birth_accuracy, bazi, analysis, dayun, kline_data
       FROM fortunes
       WHERE deleted_at IS NULL OR deleted_at = ''`,
    )
    .all() as Array<Record<string, unknown>>;

  if (args.ids.length) {
    const set = new Set(args.ids);
    rows = rows.filter((r) => set.has(String(r.id)));
  }

  const results: Array<Record<string, unknown>> = [];
  let fixed = 0;
  let checked = 0;

  const updateStmt = db.prepare(
    `UPDATE fortunes
     SET birth_time = ?, bazi = ?, dayun = ?, kline_data = ?, analysis = ?, updated_at = ?
     WHERE id = ?`,
  );

  for (const row of rows) {
    const id = String(row.id);
    const birthDate = String(row.birth_date || '');
    const storedTime = normalizeClockTime(String(row.birth_time || ''));
    const birthPlace = String(row.birth_place || '北京');
    const timezone = Number(row.timezone || 8) || 8;
    const gender = (row.gender === 'female' ? 'female' : 'male') as 'male' | 'female';
    const accuracy =
      row.birth_accuracy === 'exact' ||
      row.birth_accuracy === 'unknown' ||
      row.birth_accuracy === 'range'
        ? row.birth_accuracy
        : 'range';

    let analysis: Record<string, unknown> = {};
    try {
      analysis = JSON.parse(String(row.analysis || '{}'));
    } catch {
      analysis = {};
    }
    const signals = (analysis.contextSignals || {}) as Record<string, unknown>;
    const identity = (signals.calculationIdentity || {}) as Record<string, unknown>;
    const hasIdentity = Boolean(
      identity &&
        typeof identity === 'object' &&
        typeof identity.clockBirthTime === 'string' &&
        identity.clockBirthTime,
    );
    const identityClock = normalizeClockTime(
      typeof identity.clockBirthTime === 'string' ? identity.clockBirthTime : '',
    );
    const identityDate =
      typeof identity.clockBirthDate === 'string' ? identity.clockBirthDate : '';
    const identityFp =
      typeof identity.chartFingerprint === 'string' ? identity.chartFingerprint : '';

    let oldBazi: { pillars?: Array<{ celestialStem?: string; earthlyBranch?: string }> } =
      {};
    try {
      oldBazi = JSON.parse(String(row.bazi || '{}'));
    } catch {
      oldBazi = {};
    }
    const oldFp = pillarsToFingerprint(oldBazi.pillars as never);

    const timeMismatch = Boolean(
      identityClock && storedTime && identityClock !== storedTime,
    );
    const fpMismatch = Boolean(identityFp && oldFp && identityFp !== oldFp);

    const shouldScan =
      args.ids.length > 0 ||
      args.allDrift ||
      args.verifyAll ||
      (args.missingIdentity && !hasIdentity);

    if (!shouldScan) continue;
    if (args.allDrift && !timeMismatch && !fpMismatch && !args.verifyAll) continue;
    if (args.missingIdentity && hasIdentity && !args.ids.length && !args.verifyAll) {
      continue;
    }

    checked += 1;

    // Source of truth for recompute:
    // - from-identity: use identity clock/date if present
    // - default: use stored birth_date + birth_time (user-facing)
    const clockDate =
      args.fromIdentity && identityDate ? identityDate : birthDate;
    const clockTime =
      args.fromIdentity && identityClock ? identityClock : storedTime || '12:00';

    const useSolar =
      typeof identity.useSolarTime === 'boolean'
        ? Boolean(identity.useSolarTime)
        : accuracy !== 'unknown';
    const useSeparateZi =
      typeof identity.useSeparateZiHour === 'boolean'
        ? Boolean(identity.useSeparateZiHour)
        : false;
    const sect: 1 | 2 =
      identity.sect === 1 || identity.sect === 2
        ? identity.sect
        : useSeparateZi
          ? 1
          : 2;
    const longitude = Number.isFinite(Number(identity.longitude))
      ? Number(identity.longitude)
      : undefined;

    const rebuilt = buildFortuneContextInput({
      birthDate: clockDate,
      birthTime: clockTime,
      birthPlace,
      birthAccuracy: accuracy as 'exact' | 'range' | 'unknown',
      gender,
      name: String(row.name || ''),
      timezone,
      longitude,
      useTrueSolarTime: useSolar,
      useSeparateZiHour: useSeparateZi,
      sect,
    });

    const pillars = rebuilt.truthInput.pillars || [];
    const newFp = pillarsToFingerprint(pillars);
    const newIdentity = rebuilt.calculationIdentity;

    const needsWrite =
      timeMismatch ||
      fpMismatch ||
      !hasIdentity ||
      newFp !== oldFp ||
      normalizeClockTime(String(row.birth_time || '')) !== rebuilt.clockBirthTime ||
      args.ids.includes(id) ||
      args.verifyAll;

    results.push({
      id,
      storedTime,
      clockTime: rebuilt.clockBirthTime,
      oldFp,
      newFp,
      identityClock: identityClock || null,
      hasIdentity,
      needsWrite,
      timeMismatch,
      fpMismatch,
    });

    if (!args.apply || !needsWrite) continue;

    const prevSignals =
      signals && typeof signals === 'object' ? { ...signals } : {};
    const nextAnalysis = {
      ...analysis,
      dayMaster: rebuilt.reportRaw?.dayMaster || pillars[2]?.celestialStem,
      chartFingerprint: newFp,
      structureRepairedAt: new Date().toISOString(),
      structureRepairMode: args.fromIdentity ? 'from-identity' : 'from-stored-time',
      contextSignals: {
        ...prevSignals,
        calculationIdentity: newIdentity,
      },
    };

    const nextBazi = {
      ...(oldBazi || {}),
      dayMaster: rebuilt.reportRaw?.dayMaster || pillars[2]?.celestialStem,
      pillars,
    };

    updateStmt.run(
      rebuilt.clockBirthTime,
      JSON.stringify(nextBazi),
      JSON.stringify(rebuilt.truthInput.dayun || null),
      JSON.stringify(rebuilt.truthInput.kline || null),
      JSON.stringify(nextAnalysis),
      new Date().toISOString(),
      id,
    );
    fixed += 1;
  }

  console.log(
    JSON.stringify(
      {
        phase: args.apply ? 'apply' : 'dry-run',
        dbPath,
        checked,
        fixed,
        sample: results.slice(0, 20),
      },
      null,
      2,
    ),
  );
  db.close();
}

main();
