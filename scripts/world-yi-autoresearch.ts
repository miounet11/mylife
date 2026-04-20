import { execFileSync } from 'node:child_process';
import { buildWorldYiAutoresearchSnapshot, type WorldYiAutoresearchSnapshot } from '@/lib/world-yi-autoresearch';

type LaneKey = 'main' | 'wave2' | 'global';

interface LaneConfig {
  key: LaneKey;
  label: string;
  statusScript: string;
  generateScript: string;
  promoteScript: string;
}

interface LaneStatus {
  key: LaneKey;
  label: string;
  targetCount: number;
  missingCount: number;
  queueLength: number;
  topQueueTitle: string | null;
  topPriorityScore: number;
  promoteQueueLength: number;
  readyPromoteCount: number;
  topPromoteTitle: string | null;
  topPromoteScore: number;
}

interface CheckResult {
  script: string;
  ok: boolean;
  output: string;
}

interface ScriptRunOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

const lanes: LaneConfig[] = [
  {
    key: 'main',
    label: 'Public Growth Main',
    statusScript: 'growth:status',
    generateScript: 'growth:generate',
    promoteScript: 'growth:promote',
  },
  {
    key: 'wave2',
    label: 'Public Growth Wave2',
    statusScript: 'growth:wave2:status',
    generateScript: 'growth:wave2:generate',
    promoteScript: 'growth:wave2:promote',
  },
  {
    key: 'global',
    label: 'Public Growth Global',
    statusScript: 'growth:global:status',
    generateScript: 'growth:global:generate',
    promoteScript: 'growth:global:promote',
  },
];

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

function runNpmScript(script: string, extraArgs: string[] = [], options: ScriptRunOptions = {}) {
  const retries = Math.max(0, options.retries ?? 0);
  const retryDelayMs = Math.max(200, options.retryDelayMs ?? 1_200);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return execFileSync('npm', ['run', script, '--', ...extraArgs], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: options.timeoutMs,
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

function parseJsonFromScript(script: string) {
  const output = runNpmScript(script);
  const lines = output.trim().split('\n');
  const jsonStart = lines.findIndex((line) => line.trim().startsWith('{'));
  if (jsonStart < 0) {
    throw new Error(`script ${script} did not return JSON output`);
  }
  return JSON.parse(lines.slice(jsonStart).join('\n')) as Record<string, any>;
}

function getLaneStatuses() {
  return lanes.map((lane) => {
    const status = parseJsonFromScript(lane.statusScript);
    const queue = Array.isArray(status.queue) ? status.queue : [];
    const promoteQueue = Array.isArray(status.promoteQueue) ? status.promoteQueue : [];
    const topQueue = queue[0] || null;
    const topPromote = promoteQueue[0] || null;
    const readyPromoteCount = promoteQueue.filter((item) => item?.ready === true).length;

    return {
      key: lane.key,
      label: lane.label,
      targetCount: Number(status.targetCount || 0),
      missingCount: Number(status.missingCount || 0),
      queueLength: queue.length,
      topQueueTitle: typeof topQueue?.title === 'string' ? topQueue.title : null,
      topPriorityScore: Number(topQueue?.priorityScore || 0),
      promoteQueueLength: promoteQueue.length,
      readyPromoteCount,
      topPromoteTitle: typeof topPromote?.title === 'string' ? topPromote.title : null,
      topPromoteScore: Number(topPromote?.score || 0),
    } satisfies LaneStatus;
  });
}

function pickLane(statuses: LaneStatus[]) {
  const ranked = [...statuses].sort((left, right) => {
    const rightScore = (
      right.missingCount * 1000
      + right.queueLength * 200
      + right.readyPromoteCount * 120
      + right.promoteQueueLength * 40
      + right.topPriorityScore
      + right.topPromoteScore
    );
    const leftScore = (
      left.missingCount * 1000
      + left.queueLength * 200
      + left.readyPromoteCount * 120
      + left.promoteQueueLength * 40
      + left.topPriorityScore
      + left.topPromoteScore
    );

    return rightScore - leftScore;
  });

  const candidate = ranked[0] || null;
  if (!candidate) {
    return null;
  }

  const hasWork = candidate.missingCount > 0
    || candidate.queueLength > 0
    || candidate.promoteQueueLength > 0;

  return hasWork ? candidate : null;
}

function runChecks() {
  const scripts = ['qa:world-yi-surfaces', 'qa:public-surfaces'];

  return scripts.map((script) => {
    try {
      const output = runNpmScript(script);
      return {
        script,
        ok: true,
        output: output.trim().split('\n').slice(-6).join('\n'),
      } satisfies CheckResult;
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      return {
        script,
        ok: false,
        output,
      } satisfies CheckResult;
    }
  });
}

function stringifyExecError(error: unknown) {
  if (error && typeof error === 'object') {
    const maybeError = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
      message?: string;
      signal?: string;
      killed?: boolean;
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

    return [maybeError.message || 'script failed', stdout, stderr]
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return String(error);
}

function runLaneActions(laneStatus: LaneStatus, limit: number, timeoutMs: number) {
  const lane = lanes.find((item) => item.key === laneStatus.key);
  if (!lane) {
    throw new Error(`unknown lane ${laneStatus.key}`);
  }

  const retries = Math.max(1, parseNumberFlag('retries', 2));
  const retryDelayMs = Math.max(200, parseNumberFlag('retry-delay-ms', 1_200));
  const generateArgs = [`--limit=${limit}`];
  const shouldRepairDrafts = laneStatus.queueLength === 0 && laneStatus.promoteQueueLength > 0;
  if (shouldRepairDrafts) {
    generateArgs.push('--repair-drafts');
  }

  try {
    return {
      ok: true,
      mode: shouldRepairDrafts ? 'repair-drafts' : 'generate',
      generate: runNpmScript(lane.generateScript, generateArgs, { timeoutMs, retries, retryDelayMs }),
      promote: runNpmScript(lane.promoteScript, [`--limit=${limit}`], { timeoutMs, retries, retryDelayMs }),
      error: null,
      retries,
    } as const;
  } catch (error) {
    return {
      ok: false,
      mode: shouldRepairDrafts ? 'repair-drafts' : 'generate',
      generate: '',
      promote: '',
      error: stringifyExecError(error),
      retries,
    } as const;
  }
}

function formatSnapshot(snapshot: WorldYiAutoresearchSnapshot) {
  const lines = [
    `score ${snapshot.score}/${snapshot.maxScore}`,
    snapshot.headline,
    '',
    'metrics:',
    ...snapshot.metrics.map((metric) => `- ${metric.label}: ${metric.points}/${metric.maxPoints} (${metric.detail})`),
    '',
    'recommendations:',
    ...snapshot.recommendations.map((item) => `- ${item}`),
  ];

  return lines.join('\n');
}

function main() {
  const rounds = Math.min(6, parseNumberFlag('rounds', 1));
  const applyGrowth = parseFlag('apply-growth');
  const limit = Math.min(8, parseNumberFlag('limit', 2));
  const actionTimeoutMs = Math.max(5_000, parseNumberFlag('timeout-ms', 120_000));
  const retries = Math.max(1, parseNumberFlag('retries', 2));
  const retryDelayMs = Math.max(200, parseNumberFlag('retry-delay-ms', 1_200));
  const json = parseFlag('json');
  const checks = !parseFlag('skip-checks');
  const results = [];

  for (let round = 1; round <= rounds; round += 1) {
    const before = buildWorldYiAutoresearchSnapshot();
    const laneStatuses = getLaneStatuses();
    const chosenLane = pickLane(laneStatuses);
    const actions = applyGrowth && chosenLane
      ? runLaneActions(chosenLane, limit, actionTimeoutMs)
      : null;
    const after = buildWorldYiAutoresearchSnapshot();
    const checkResults = checks ? runChecks() : [];

    results.push({
      round,
      chosenLane,
      before,
      after,
      checks: checkResults,
      actions: actions ? {
        ok: actions.ok,
        mode: actions.mode,
        retries: actions.retries,
        generateTail: tailOutput(actions.generate),
        promoteTail: tailOutput(actions.promote),
        error: actions.error,
      } : null,
      laneStatuses,
    });
  }

  if (json) {
    console.log(JSON.stringify({
      checkedAt: new Date().toISOString(),
      rounds,
      applyGrowth,
      limit,
      actionTimeoutMs,
      retries,
      retryDelayMs,
      results,
    }, null, 2));
    return;
  }

  const latest = results[results.length - 1];
  const checkLines = latest.checks.length > 0
    ? latest.checks.map((item) => `- ${item.script}: ${item.ok ? 'ok' : 'failed'}`)
    : ['- checks skipped'];

  const laneLines = latest.laneStatuses.map((lane) => (
    `- ${lane.label}: missing=${lane.missingCount}, queue=${lane.queueLength}, promote=${lane.promoteQueueLength}, top=${lane.topQueueTitle || lane.topPromoteTitle || 'none'}`
  ));

  console.log([
    `World Yi autoresearch rounds: ${rounds}`,
    `Apply growth actions: ${applyGrowth ? 'yes' : 'no'}`,
    latest.chosenLane
      ? `Chosen lane: ${latest.chosenLane.label}`
      : 'Chosen lane: none',
    '',
    'Before:',
    formatSnapshot(latest.before),
    '',
    'After:',
    formatSnapshot(latest.after),
    '',
    'Lane status:',
    ...laneLines,
    '',
    'Checks:',
    ...checkLines,
  ].join('\n'));
}

main();
