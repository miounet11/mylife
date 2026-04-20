import { execFileSync } from 'node:child_process';
import { buildWorldYiPublicationMechanismSnapshot } from '@/lib/world-yi-publication-mechanism';

type LaneKey = 'main' | 'wave2' | 'global';
type SlotAction = 'generate' | 'promote';

const laneScripts: Record<LaneKey, { generate: string; promote: string }> = {
  main: {
    generate: 'growth:generate',
    promote: 'growth:promote',
  },
  wave2: {
    generate: 'growth:wave2:generate',
    promote: 'growth:wave2:promote',
  },
  global: {
    generate: 'growth:global:generate',
    promote: 'growth:global:promote',
  },
};

interface RecoveryStepResult {
  action: SlotAction;
  key: string;
  ok: boolean;
  outputTail: string;
  error: string | null;
}

function parseFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function parseNumberFlag(name: string, fallback: number) {
  const raw = process.argv.find((item) => item.startsWith(`--${name}=`));
  const value = raw ? Number(raw.split('=')[1]) : fallback;
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function sleep(delayMs: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
}

function tailOutput(output: string, lines = 10) {
  return output.trim().split('\n').slice(-lines).join('\n');
}

function stringifyExecError(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
    };
    const stdout = typeof maybeError.stdout === 'string'
      ? maybeError.stdout
      : Buffer.isBuffer(maybeError.stdout)
      ? maybeError.stdout.toString('utf8')
      : '';
    const stderr = typeof maybeError.stderr === 'string'
      ? maybeError.stderr
      : Buffer.isBuffer(maybeError.stderr)
      ? maybeError.stderr.toString('utf8')
      : '';

    return [maybeError.message || 'script failed', tailOutput(stdout), tailOutput(stderr)]
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return String(error);
}

function buildLaneWorkItems(
  lane: ReturnType<typeof buildWorldYiPublicationMechanismSnapshot>['lanes'][number],
  quota: number
) {
  const promoteRows = lane.promoteQueue.slice(0, quota);
  const generateRows = lane.queue
    .filter((row) => !promoteRows.some((item) => item.key === row.key))
    .slice(0, Math.max(0, quota - promoteRows.length));

  return { promoteRows, generateRows };
}

function runNpmScript(
  script: string,
  extraArgs: string[] = [],
  timeoutMs = 120_000,
  retries = 2,
  retryDelayMs = 1_200
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return execFileSync('npm', ['run', script, '--', ...extraArgs], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: timeoutMs,
      });
    } catch (error) {
      lastError = error;
      if (attempt <= retries) {
        sleep(retryDelayMs * attempt);
        continue;
      }
    }
  }

  throw new Error(`[${script}] failed after ${retries + 1} attempts\n${stringifyExecError(lastError)}`);
}

function runRecoverySteps(
  laneKey: LaneKey,
  promoteRows: Array<{ key: string }>,
  generateRows: Array<{ key: string }>,
  timeoutMs: number,
  retries: number,
  retryDelayMs: number
) {
  const scripts = laneScripts[laneKey];
  const steps: RecoveryStepResult[] = [];

  for (const row of promoteRows) {
    try {
      const output = runNpmScript(scripts.promote, [`--key=${row.key}`, '--limit=1'], timeoutMs, retries, retryDelayMs);
      steps.push({
        action: 'promote',
        key: row.key,
        ok: true,
        outputTail: tailOutput(output),
        error: null,
      });
    } catch (error) {
      steps.push({
        action: 'promote',
        key: row.key,
        ok: false,
        outputTail: '',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const row of generateRows) {
    try {
      const generateOutput = runNpmScript(
        scripts.generate,
        [`--key=${row.key}`, '--limit=1'],
        timeoutMs,
        retries,
        retryDelayMs
      );
      steps.push({
        action: 'generate',
        key: row.key,
        ok: true,
        outputTail: tailOutput(generateOutput),
        error: null,
      });
    } catch (error) {
      steps.push({
        action: 'generate',
        key: row.key,
        ok: false,
        outputTail: '',
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    try {
      const promoteOutput = runNpmScript(
        scripts.promote,
        [`--key=${row.key}`, '--limit=1'],
        timeoutMs,
        retries,
        retryDelayMs
      );
      steps.push({
        action: 'promote',
        key: row.key,
        ok: true,
        outputTail: tailOutput(promoteOutput),
        error: null,
      });
    } catch (error) {
      steps.push({
        action: 'promote',
        key: row.key,
        ok: false,
        outputTail: '',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return steps;
}

function main() {
  const json = parseFlag('json');
  const timeoutMs = Math.max(5_000, parseNumberFlag('timeout-ms', 120_000));
  const retries = Math.max(1, parseNumberFlag('retries', 2));
  const retryDelayMs = Math.max(200, parseNumberFlag('retry-delay-ms', 1_200));
  const before = buildWorldYiPublicationMechanismSnapshot();
  const results = before.lanes
    .filter((lane) => lane.queueLength > 0 || lane.promoteQueueLength > 0)
    .map((lane) => {
      const quota = before.laneQuotas[lane.key] || 0;
      const { promoteRows, generateRows } = buildLaneWorkItems(lane, quota);
      const generateLimit = generateRows.length;
      const promoteLimit = promoteRows.length;
      const scripts = laneScripts[lane.key];

      let generateOutput = '';
      let promoteOutput = '';
      let error: string | null = null;
      let recoverySteps: RecoveryStepResult[] = [];

      try {
        if (generateLimit > 0) {
          generateOutput = runNpmScript(scripts.generate, [`--limit=${generateLimit}`], timeoutMs, retries, retryDelayMs);
        }
        if (promoteLimit > 0 || generateLimit > 0) {
          promoteOutput = runNpmScript(
            scripts.promote,
            [`--limit=${Math.max(promoteLimit, generateLimit)}`],
            timeoutMs,
            retries,
            retryDelayMs
          );
        }
      } catch (executionError) {
        error = executionError instanceof Error ? executionError.message : String(executionError);
        recoverySteps = runRecoverySteps(
          lane.key,
          promoteRows,
          generateRows,
          timeoutMs,
          retries,
          retryDelayMs
        );
        if (recoverySteps.every((step) => step.ok)) {
          error = null;
        }
      }

      return {
        lane: lane.key,
        label: lane.label,
        quota,
        generateLimit,
        promoteLimit,
        retries,
        ok: !error,
        generateTail: tailOutput(generateOutput),
        promoteTail: tailOutput(promoteOutput),
        recoverySteps,
        error,
      };
    });
  const after = buildWorldYiPublicationMechanismSnapshot();

  const payload = {
    checkedAt: new Date().toISOString(),
    before,
    results,
    after,
  };

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

main();
