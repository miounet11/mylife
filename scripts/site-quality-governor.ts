import {
  buildSiteQualityGovernorSnapshot,
  refreshSiteQualityGovernorSnapshot,
  renderSiteQualityGovernorTextReport,
} from '@/lib/site-quality-governor';
import { loadDefaultLocalEnv } from './load-local-env';

function readFlag(args: string[], name: string) {
  const exact = args.find((arg) => arg.startsWith(`${name}=`));
  return exact ? exact.slice(name.length + 1) : '';
}

async function main() {
  loadDefaultLocalEnv();

  const args = process.argv.slice(2);
  const jsonOnly = args.includes('--json');
  const saveSnapshot = args.includes('--save');
  const retroMinutesRaw = readFlag(args, '--retro-minutes');
  const retroWindowMinutes = retroMinutesRaw
    ? Math.max(60, Number.parseInt(retroMinutesRaw, 10) || 0)
    : undefined;

  const snapshot = saveSnapshot
    ? refreshSiteQualityGovernorSnapshot({ retroWindowMinutes })
    : buildSiteQualityGovernorSnapshot({ retroWindowMinutes });

  if (jsonOnly) {
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  process.stdout.write(renderSiteQualityGovernorTextReport(snapshot));
}

main().catch((error) => {
  console.error('[site-quality-governor] failed:', error);
  process.exitCode = 1;
});
