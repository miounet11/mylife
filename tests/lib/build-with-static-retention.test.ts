import fs from 'fs';
import path from 'path';

describe('build-with-static-retention script', () => {
  const scriptPath = path.join(process.cwd(), 'scripts/build-with-static-retention.js');
  const source = fs.readFileSync(scriptPath, 'utf8');

  it('builds into a staged dist directory before promoting to .next', () => {
    expect(source).toContain('NEXT_DIST_DIR');
    expect(source).toContain('stagingBuildName');
    expect(source).toContain('fs.renameSync(stagingBuildDir, nextBuildDir)');
  });

  it('pins and validates the build id used by the staged build', () => {
    expect(source).toContain('NEXT_BUILD_ID_OVERRIDE');
    expect(source).toContain('validateBuildId(stagingBuildDir, buildId)');
  });

  it('validates required Next.js runtime artifacts before promotion', () => {
    expect(source).toContain('BUILD_ID');
    expect(source).toContain('prerender-manifest.json');
    expect(source).toContain('validateBuildArtifacts(stagingBuildDir)');
  });

  it('rewrites and rejects leaked staged dist directory references', () => {
    expect(source).toContain('rewriteStagedDistDirReferences(stagingBuildDir, stagingBuildName, \'.next\')');
    expect(source).toContain('validateNoStagedDistDirReferences(stagingBuildDir, stagingBuildName)');
  });

  it('drops the staged build cache before scanning and promoting production artifacts', () => {
    expect(source).toContain('function removeBuildCache(buildDir)');
    expect(source).toContain('removeBuildCache(stagingBuildDir)');
  });

  it('does not remove the live .next directory before running next build', () => {
    expect(source).not.toContain('removeDirectory(nextBuildDir);');
  });

  it('cleans only stale managed temporary build directories', () => {
    expect(source).toContain('function cleanupStaleManagedBuildDirs()');
    expect(source).toContain('isManagedTemporaryBuildDirName(entry.name)');
    expect(source).toContain("process.env.STALE_NEXT_BUILD_CLEANUP === '0'");
    expect(source).toContain('STALE_NEXT_BUILD_MAX_AGE_MS');
    expect(source).toContain("^\\.next-(?:build|previous)-\\d+-\\d+$");
    expect(source).not.toContain("removeDirectory(path.join(projectRoot, '.next'))");
  });

  it('only exits after cleanup has run', () => {
    expect(source).toContain('finally');
    expect(source).toContain('if (exitCode !== 0)');
    expect(source).not.toContain('process.exit(result.status || 1)');
    expect(source).not.toContain('process.exit(1);');
  });
});
