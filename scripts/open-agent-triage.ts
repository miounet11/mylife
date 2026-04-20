import { runWorldYiOpenAgentOpsTriage } from '@/lib/open-agent-runtime';
import { loadDefaultLocalEnv } from './load-local-env';

async function main() {
  loadDefaultLocalEnv();

  const result = await runWorldYiOpenAgentOpsTriage();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('[open-agent-triage] failed:', error);
  process.exit(1);
});
