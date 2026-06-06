#!/usr/bin/env node
/**
 * PM2 entry for World Yi v2 content workers.
 * Loads .env.local secrets, then runs the tsx orchestrator with forwarded CLI args.
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('./load-ecosystem-env.js');

const generatorScript = path.join(__dirname, 'high-concurrency-world-yi-generator.ts');
const forwardedArgs = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', generatorScript, ...forwardedArgs],
  {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error('[world-yi-worker-entry] failed to start:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);