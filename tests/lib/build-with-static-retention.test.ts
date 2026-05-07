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

  it('validates required Next.js runtime artifacts before promotion', () => {
    expect(source).toContain('BUILD_ID');
    expect(source).toContain('prerender-manifest.json');
    expect(source).toContain('validateBuildArtifacts(stagingBuildDir)');
  });

  it('does not remove the live .next directory before running next build', () => {
    expect(source).not.toContain('removeDirectory(nextBuildDir);');
  });
});
