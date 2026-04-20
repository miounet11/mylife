import { runWorldYiOpenAgentAutonomyReview } from '@/lib/open-agent-runtime';
import { loadDefaultLocalEnv } from './load-local-env';

async function main() {
  loadDefaultLocalEnv();

  const result = await runWorldYiOpenAgentAutonomyReview();
  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[open-agent-review] failed:', error);
  process.exitCode = 1;
});
