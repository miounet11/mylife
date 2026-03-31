const { execSync, spawn } = require('child_process');

function findListeningPidsOn3000() {
  try {
    const output = execSync("ss -ltnp | rg ':3000\\\\b' || true", {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });

    const pidMatches = output.match(/pid=(\d+)/g) || [];
    return Array.from(new Set(
      pidMatches
        .map((item) => Number(item.replace('pid=', '')))
        .filter((pid) => Number.isInteger(pid) && pid > 1),
    ));
  } catch {
    return [];
  }
}

function shouldTerminatePid(pid) {
  try {
    const cmdline = execSync(`ps -p ${pid} -o command=`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    return cmdline.includes('next-server') || cmdline.includes('next dev') || cmdline.includes('node_modules/.bin/next');
  } catch {
    return false;
  }
}

function terminatePid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

const pids = findListeningPidsOn3000().filter(shouldTerminatePid);
if (pids.length > 0) {
  console.log(`[dev:clean] terminating stale Next processes on :3000 -> ${pids.join(', ')}`);
  pids.forEach((pid) => terminatePid(pid));
}

const child = spawn('node', ['node_modules/.bin/next', 'dev'], {
  stdio: 'inherit',
  env: process.env,
});

const relaySignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => relaySignal('SIGINT'));
process.on('SIGTERM', () => relaySignal('SIGTERM'));

child.on('exit', (code) => {
  process.exit(code || 0);
});
