/**
 * Smoke: report/chat/tool fortune resolution linkage.
 * Run on production with: npx tsx scripts/smoke-context-linkage.ts
 */
import { resolveUserFortune, normalizePreferIntent } from '../lib/resolve-user-fortune';
import { fortuneOperations } from '../lib/database';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const users = (fortuneOperations as { getByUserId?: (id: string) => any[] }).getByUserId
    ? null
    : null;

  // Use any user that has fortunes — pick from listRecent if available
  const listRecent = (fortuneOperations as { listRecent?: (n: number) => any[] }).listRecent?.(20) || [];
  assert(listRecent.length > 0, 'no fortunes in DB');

  const sampleUserId = listRecent[0].userId || listRecent[0].user_id;
  assert(sampleUserId, 'no userId on fortune');

  const primary = resolveUserFortune(sampleUserId, { ensurePrimary: false });
  assert(primary?.id, 'resolveUserFortune returned null for user with fortunes');

  const withIntent = resolveUserFortune(sampleUserId, {
    preferIntent: 'wealth',
    ensurePrimary: false,
  });
  assert(withIntent?.id, 'intent resolve failed');

  const byId = resolveUserFortune(sampleUserId, {
    reportId: primary!.id,
    ensurePrimary: false,
  });
  assert(byId?.id === primary!.id, 'explicit reportId mismatch');

  console.log(
    JSON.stringify(
      {
        ok: true,
        sampleUserId,
        primaryId: primary!.id,
        primaryIntent: primary!.intent || null,
        wealthPickId: withIntent!.id,
        wealthIntent: withIntent!.intent || null,
        normalizeTeacher: normalizePreferIntent('wealth'),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error('SMOKE_FAIL', e);
  process.exit(1);
});
