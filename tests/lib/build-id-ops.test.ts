import fs from 'fs';
import path from 'path';

const {
  readNonEmptyCsvEnv,
  readPortEnv,
  readPositiveIntegerEnv,
  readPositiveIntegerValue,
} = require('../../scripts/ops-env.js') as {
  readNonEmptyCsvEnv: (name: string, defaultValues: string[]) => string[];
  readPortEnv: (name: string, defaultValue: number) => number;
  readPositiveIntegerEnv: (
    name: string,
    defaultValue: number,
    options?: { min?: number; max?: number },
  ) => number;
  readPositiveIntegerValue: (
    value: unknown,
    defaultValue: number,
    options?: { min?: number; max?: number },
  ) => number;
};

describe('build id operational scripts', () => {
  const deployScript = fs.readFileSync(path.join(process.cwd(), 'scripts/deploy-rolling-reload.js'), 'utf8');
  const watchdogScript = fs.readFileSync(path.join(process.cwd(), 'scripts/build-id-drift-watchdog.js'), 'utf8');
  const ecosystemConfig = fs.readFileSync(path.join(process.cwd(), 'ecosystem.config.js'), 'utf8');
  const packageJson = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
  const opsEnvScript = fs.readFileSync(path.join(process.cwd(), 'scripts/ops-env.js'), 'utf8');
  const pm2BuildEnvScript = fs.readFileSync(path.join(process.cwd(), 'scripts/pm2-build-env.js'), 'utf8');
  const userWatchdogScript = fs.readFileSync(path.join(process.cwd(), 'scripts/user-tier-watchdog.js'), 'utf8');
  const cronWatchdogScript = fs.readFileSync(path.join(process.cwd(), 'scripts/cron-tier-watchdog.js'), 'utf8');
  const publicWatchdogScript = fs.readFileSync(path.join(process.cwd(), 'scripts/public-surface-watchdog.js'), 'utf8');
  const stabilityMonitorScript = fs.readFileSync(path.join(process.cwd(), 'scripts/stability-monitor.js'), 'utf8');
  const userTierProbeScript = fs.readFileSync(path.join(process.cwd(), 'scripts/user-tier-probe.js'), 'utf8');
  const highConcurrencyWorldYiScript = fs.readFileSync(
    path.join(process.cwd(), 'scripts/high-concurrency-world-yi-generator.ts'),
    'utf8',
  );
  const forumDaemonScript = fs.readFileSync(path.join(process.cwd(), 'scripts/forum-daemon.js'), 'utf8');
  const knowledgeStatusScript = fs.readFileSync(path.join(process.cwd(), 'scripts/knowledge-status.js'), 'utf8');
  const verifyToolsRuntimeScript = fs.readFileSync(path.join(process.cwd(), 'scripts/verify-tools-runtime.js'), 'utf8');
  const longRunningDaemonScripts = [
    'scripts/content-radar-daemon.js',
    'scripts/content-generation-daemon.js',
    'scripts/content-scheduler-daemon.js',
    'scripts/knowledge-acquisition-daemon.js',
    'scripts/email-retry-daemon.js',
    'scripts/timing-email-daemon.js',
    'scripts/report-upgrade-daemon.js',
    'scripts/report-monthly-digest-daemon.js',
    'scripts/user-lifecycle-email-daemon.js',
  ].map((script) => fs.readFileSync(path.join(process.cwd(), script), 'utf8'));

  it('injects the current build id into Next PM2 app environments', () => {
    expect(ecosystemConfig).toContain('readCurrentBuildId');
    expect(ecosystemConfig).toContain('LIFE_KLINE_BUILD_ID: currentBuildId');
  });

  it('requires process-env runtime build proof during rolling reload', () => {
    expect(deployScript).toContain("last.source === 'process-env'");
    expect(deployScript).toContain('filesystemBuildId');
    expect(deployScript).toContain('withBuildIdEnv(expectedBuildId)');
  });

  it('fails rolling reload when any required PM2 tier is missing by default', () => {
    expect(deployScript).toContain('ALLOW_PARTIAL_PM2_TARGETS');
    expect(deployScript).toContain('missing.length && !ALLOW_PARTIAL_TARGETS');
    expect(deployScript).toContain('默认要求 cron/user/public replicas 全部参与滚动');
  });

  it('supports a no-side-effect rolling reload dry run', () => {
    expect(packageJson).toContain('deploy:reload:dry');
    expect(deployScript).toContain("process.argv.includes('--dry-run')");
    expect(deployScript).toContain('dry-run: inject LIFE_KLINE_BUILD_ID=');
  });

  it('requires process-env runtime build proof in the drift watchdog', () => {
    expect(watchdogScript).toContain("result.source === 'process-env'");
    expect(watchdogScript).toContain('filesystemBuildId');
    expect(watchdogScript).toContain('readNonEmptyCsvEnv');
    expect(watchdogScript).toContain('readPositiveIntegerValue');
  });

  it('injects current build id into watchdog PM2 recovery actions', () => {
    expect(pm2BuildEnvScript).toContain('LIFE_KLINE_BUILD_ID');
    expect(userWatchdogScript).toContain('withCurrentBuildEnv()');
    expect(cronWatchdogScript).toContain('withCurrentBuildEnv()');
    expect(publicWatchdogScript).toContain('withCurrentBuildEnv()');
    expect(stabilityMonitorScript).toContain('withCurrentBuildEnv()');
  });

  it('prevents overlapping watchdog and stability monitor ticks', () => {
    for (const source of [userWatchdogScript, cronWatchdogScript, publicWatchdogScript, stabilityMonitorScript]) {
      expect(source).toContain('let tickRunning = false');
      expect(source).toContain('previous tick still running');
      expect(source).toContain('tickRunning = true');
      expect(source).toContain('tickRunning = false');
    }
  });

  it('bounds operational numeric environment variables', () => {
    expect(opsEnvScript).toContain('function readPositiveIntegerEnv');
    expect(opsEnvScript).toContain('function readPositiveIntegerValue');
    expect(opsEnvScript).toContain('function readPortEnv');
    expect(opsEnvScript).toContain('function readNonEmptyCsvEnv');
    for (const source of [
      deployScript,
      watchdogScript,
      userWatchdogScript,
      cronWatchdogScript,
      publicWatchdogScript,
      stabilityMonitorScript,
    ]) {
      expect(source).toContain('readPositiveIntegerEnv');
    }
    for (const source of [userWatchdogScript, cronWatchdogScript, publicWatchdogScript]) {
      expect(source).not.toContain('parseInt(process.env.CHECK_INTERVAL_MS');
      expect(source).not.toContain('parseInt(process.env.PROBE_TIMEOUT_MS');
    }
    for (const source of [userWatchdogScript, cronWatchdogScript]) {
      expect(source).toContain('readPortEnv');
    }
    expect(publicWatchdogScript).toContain('readNonEmptyCsvEnv');
    expect(userWatchdogScript).not.toContain('Number(USER_PORT)');
    expect(cronWatchdogScript).not.toContain('Number(CRON_PORT)');
  });

  it('bounds user-tier probe CLI and timeout inputs', () => {
    expect(userTierProbeScript).toContain('readPositiveIntegerValue');
    expect(userTierProbeScript).toContain('readPositiveIntegerEnv');
    expect(userTierProbeScript).not.toContain('parseInt(');
  });

  it('bounds auxiliary operational and content worker inputs', () => {
    for (const source of [
      highConcurrencyWorldYiScript,
      forumDaemonScript,
      knowledgeStatusScript,
      verifyToolsRuntimeScript,
    ]) {
      expect(source).toContain('readPositiveIntegerEnv');
    }
    expect(highConcurrencyWorldYiScript).toContain('readPositiveIntegerValue');
    expect(highConcurrencyWorldYiScript).not.toContain('parseInt(');
    expect(forumDaemonScript).not.toContain('Number(process.env');
    expect(knowledgeStatusScript).not.toContain('Number(process.env');
    expect(verifyToolsRuntimeScript).not.toContain('Number(process.env');
    expect(verifyToolsRuntimeScript).toContain('REQUEST_TIMEOUT_MS');
  });

  it('bounds long-running daemon intervals and request timing env vars', () => {
    for (const source of longRunningDaemonScripts) {
      expect(source).toContain('readPositiveIntegerEnv');
      expect(source).not.toContain('Math.max(60_000, Number(process.env');
      expect(source).not.toContain('Math.max(30_000, Number(process.env');
      expect(source).not.toContain('Math.max(10_000, Number(process.env');
      expect(source).not.toContain('Math.max(5_000, Number(process.env');
      expect(source).not.toContain('Math.max(15_000, Number(process.env');
    }
  });

  describe('ops env parser behavior', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('falls back for invalid or out-of-range positive integer env values', () => {
      process.env.TEST_INTERVAL = '0';
      expect(readPositiveIntegerEnv('TEST_INTERVAL', 30000, { min: 5000, max: 60000 })).toBe(30000);

      process.env.TEST_INTERVAL = '90000';
      expect(readPositiveIntegerEnv('TEST_INTERVAL', 30000, { min: 5000, max: 60000 })).toBe(30000);

      process.env.TEST_INTERVAL = '45000';
      expect(readPositiveIntegerEnv('TEST_INTERVAL', 30000, { min: 5000, max: 60000 })).toBe(45000);
    });

    it('falls back for invalid or out-of-range positive integer values', () => {
      expect(readPositiveIntegerValue('abc', 12, { min: 1, max: 120 })).toBe(12);
      expect(readPositiveIntegerValue('0', 12, { min: 1, max: 120 })).toBe(12);
      expect(readPositiveIntegerValue('121', 12, { min: 1, max: 120 })).toBe(12);
      expect(readPositiveIntegerValue('24', 12, { min: 1, max: 120 })).toBe(24);
    });

    it('accepts only valid TCP port env values', () => {
      process.env.TEST_PORT = '65536';
      expect(readPortEnv('TEST_PORT', 3000)).toBe(3000);

      process.env.TEST_PORT = '3004';
      expect(readPortEnv('TEST_PORT', 3000)).toBe(3004);
    });

    it('cleans CSV env values and preserves a non-empty fallback', () => {
      process.env.TEST_CSV = ' web1, ,web2 ';
      expect(readNonEmptyCsvEnv('TEST_CSV', ['fallback'])).toEqual(['web1', 'web2']);

      process.env.TEST_CSV = ' , ';
      expect(readNonEmptyCsvEnv('TEST_CSV', ['web1', 'web2'])).toEqual(['web1', 'web2']);
    });
  });
});
