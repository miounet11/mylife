const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const pkgDir = path.join(process.cwd(), 'node_modules', '@codeany', 'open-agent-sdk');
const distEntry = path.join(pkgDir, 'dist', 'index.js');
const localTsc = path.join(pkgDir, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');

if (!fs.existsSync(pkgDir)) {
  process.exit(0);
}

if (fs.existsSync(distEntry)) {
  process.exit(0);
}

const finalResult = fs.existsSync(localTsc)
  ? spawnSync(localTsc, ['-p', 'tsconfig.json'], {
      cwd: pkgDir,
      stdio: 'inherit',
      shell: false,
    })
  : spawnSync('npm', ['run', 'build'], {
    cwd: pkgDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

if (finalResult.status !== 0) {
  console.error('[prepare-open-agent-sdk] failed to build @codeany/open-agent-sdk');
  process.exit(finalResult.status || 1);
}

console.log('[prepare-open-agent-sdk] built @codeany/open-agent-sdk dist output');
