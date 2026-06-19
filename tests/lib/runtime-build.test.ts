import fs from 'fs';
import os from 'os';
import path from 'path';

describe('runtime-build', () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  let tempDir = '';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-build-'));
    process.chdir(tempDir);
    process.env = { ...originalEnv };
    delete process.env.LIFE_KLINE_BUILD_ID;
    delete process.env.NEXT_BUILD_ID_OVERRIDE;
    delete process.env.NEXT_DIST_DIR;
    jest.resetModules();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    jest.resetModules();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('uses the process build id as the authoritative runtime value', async () => {
    fs.mkdirSync(path.join(tempDir, '.next'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.next', 'BUILD_ID'), 'filesystem-build');
    process.env.LIFE_KLINE_BUILD_ID = 'process-build';

    const { getRuntimeBuildInfo } = await import('@/lib/runtime-build');

    expect(getRuntimeBuildInfo()).toMatchObject({
      buildId: 'process-build',
      source: 'process-env',
      filesystemBuildId: 'filesystem-build',
    });
  });

  it('falls back to filesystem build id for local next start without PM2 env', async () => {
    fs.mkdirSync(path.join(tempDir, '.next'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.next', 'BUILD_ID'), 'filesystem-build');

    const { getRuntimeBuildInfo } = await import('@/lib/runtime-build');

    expect(getRuntimeBuildInfo()).toMatchObject({
      buildId: 'filesystem-build',
      source: 'filesystem',
      filesystemBuildId: 'filesystem-build',
    });
  });

  it('caches the first process value for the lifetime of the module', async () => {
    process.env.LIFE_KLINE_BUILD_ID = 'first-build';
    const { getRuntimeBuildInfo } = await import('@/lib/runtime-build');

    expect(getRuntimeBuildInfo().buildId).toBe('first-build');
    process.env.LIFE_KLINE_BUILD_ID = 'second-build';
    expect(getRuntimeBuildInfo().buildId).toBe('first-build');
  });
});
