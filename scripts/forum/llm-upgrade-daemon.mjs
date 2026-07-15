/**
 * Forum LLM upgrader daemon.
 * Continuously upgrades template posts to LLM-quality until done.
 * Runs upgrade.mjs with auto-incrementing offset, with cooldown between batches.
 */

import { spawnSync } from "child_process";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = new URL(".", import.meta.url).pathname;
const ROOT = resolve(__dirname, "..", "..");

const BATCH_SIZE = 100;
const COOLDOWN_MS = 5000;
const MAX_BATCHES = parseInt(process.argv[2] || "999", 10);

const API_KEY = process.env.API_KEY || "";
const API_BASE = process.env.API_BASE_URL || "https://ttqq.inping.com/v1";

function runBatch(offset) {
  const cmd = process.execPath;
  const args = [resolve(__dirname, "llm-upgrade.mjs"), String(BATCH_SIZE), String(offset)];
  const env = { ...process.env, API_KEY, API_BASE_URL: API_BASE };

  const start = Date.now();
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "inherit"],
    timeout: 10 * 60 * 1000,
    maxBuffer: 10 * 1024 * 1024,
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);

  if (r.status === 0 && r.stdout) {
    const out = r.stdout.toString();
    const match = out.match(/Done: (\d+) upgraded.*Remaining: (\d+)/);
    if (match) {
      return { ok: true, upgraded: parseInt(match[1]), remaining: parseInt(match[2]), elapsed };
    }
    return { ok: true, upgraded: 0, remaining: -1, elapsed };
  }
  return { ok: false, error: r.stderr?.toString().slice(0, 200) || "timeout", elapsed };
}

async function main() {
  let offset = 0;
  let totalUpgraded = 0;
  let batchNum = 0;

  console.log(`[upgrade-daemon] API: ${API_BASE} | Batch: ${BATCH_SIZE} | Max: ${MAX_BATCHES} batches`);
  console.log(`[upgrade-daemon] Starting at ${new Date().toISOString()}`);

  while (batchNum < MAX_BATCHES) {
    batchNum++;
    const result = runBatch(offset);

    if (result.ok && result.remaining === 0) {
      console.log(`[upgrade-daemon] Batch ${batchNum} ✓ ${result.upgraded} upgraded, 0 remaining. DONE!`);
      totalUpgraded += result.upgraded;
      break;
    }

    if (result.ok) {
      totalUpgraded += result.upgraded;
      offset += BATCH_SIZE;
      const pct = result.remaining >= 0
        ? `| ${((1 - result.remaining / (result.remaining + totalUpgraded)) * 100).toFixed(1)}% done`
        : "";
      console.log(`[upgrade-daemon] Batch ${batchNum} ✓ +${result.upgraded} (${result.elapsed}s) | total: ${totalUpgraded} | remaining: ${result.remaining} ${pct}`);
    } else {
      console.log(`[upgrade-daemon] Batch ${batchNum} ✗ ${result.error || "failed"} | retrying offset ${offset} after longer cooldown...`);
      await new Promise(r => setTimeout(r, COOLDOWN_MS * 3));
      continue; // retry same offset
    }

    if (batchNum < MAX_BATCHES) {
      await new Promise(r => setTimeout(r, COOLDOWN_MS));
    }
  }

  console.log(`[upgrade-daemon] Finished. Total: ${totalUpgraded} upgraded across ${batchNum} batches.`);
}

main().catch(e => { console.error("[upgrade-daemon] Fatal:", e); process.exit(1); });
