const intervalMs = Math.max(60_000, Number(process.env.KNOWLEDGE_ACQUISITION_INTERVAL_MS || 1000 * 60 * 30));
const runUrl = process.env.KNOWLEDGE_ACQUISITION_RUN_URL || 'http://127.0.0.1:3000/api/admin/knowledge/sources/cron';
const token = process.env.KNOWLEDGE_ACQUISITION_CRON_TOKEN || process.env.CONTENT_RADAR_CRON_TOKEN || '';
const requestTimeoutMs = Math.max(10_000, Number(process.env.KNOWLEDGE_ACQUISITION_REQUEST_TIMEOUT_MS || 180_000));
const startupDelayMs = Math.max(5_000, Number(process.env.KNOWLEDGE_ACQUISITION_STARTUP_DELAY_MS || 25_000));
const retryDelayMs = Math.max(15_000, Number(process.env.KNOWLEDGE_ACQUISITION_RETRY_DELAY_MS || Math.min(intervalMs, 60_000)));

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCycle() {
  if (!token) {
    console.error('[knowledge-acquisition-daemon] missing KNOWLEDGE_ACQUISITION_CRON_TOKEN');
    return false;
  }

  try {
    const response = await fetchWithTimeout(runUrl, {
      method: 'POST',
      headers: {
        'x-knowledge-cron-token': token,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (response.status === 409) {
      console.warn('[knowledge-acquisition-daemon] skipped: cycle already running');
      return true;
    }

    if (!response.ok || !data.success) {
      console.error('[knowledge-acquisition-daemon] run failed:', data.error || response.statusText);
      return false;
    }

    console.log(
      `[knowledge-acquisition-daemon] coreSeeded=${data.coreSeededCount || 0}`
      + ` domainSeeds=${(data.domainSeedResults || []).map((item) => `${item.domain}:${item.insertedCount}`).join(',') || '0'}`
      + ` promotedSignals=${data.promotedSignalsCount || 0}`
      + ` extractedTopics=${data.extractedObjects?.topicCount || 0}`
      + ` extractedQuestions=${data.extractedObjects?.questionCount || 0}`
      + ` extractedConcepts=${data.extractedObjects?.conceptCount || 0}`
      + ` extractedBooks=${data.extractedObjects?.bookCount || 0}`
      + ` relations=${data.extractedObjects?.relationCount || 0}`
      + ` synthesisDrafts=${data.synthesizedDrafts?.draftCount || 0}`
      + ` publishCandidates=${data.synthesizedDrafts?.candidateCount || 0}`
      + ` published=${data.synthesizedDrafts?.publishedCount || 0}`
      + ` topicBridges=${data.graphEnrichment?.relatedTopicCount || 0}`
      + ` radarRefreshed=${data.radarRefreshed ? '1' : '0'}`
      + ` durationMs=${data.durationMs || 0}`
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    console.error('[knowledge-acquisition-daemon] request failed:', message);
    return false;
  }
}

async function main() {
  console.log(
    `[knowledge-acquisition-daemon] started interval=${intervalMs}ms url=${runUrl}`
    + ` timeout=${requestTimeoutMs}ms startupDelay=${startupDelayMs}ms retryDelay=${retryDelayMs}ms`
  );
  await sleep(startupDelayMs);
  while (true) {
    const success = await runCycle();
    await sleep(success ? intervalMs : retryDelayMs);
  }
}

main().catch((error) => {
  console.error('[knowledge-acquisition-daemon] fatal:', error);
  process.exit(1);
});
