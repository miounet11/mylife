import { emailSubscriptionOperations, userOperations } from '@/lib/database';

export function backfillEmailSubscriptionsFromUsers(limit = 500) {
  const users = userOperations.listWithEmail(limit) as Array<{ email?: string | null }>;
  let createdOrUpdated = 0;

  for (const user of users) {
    const email = `${user.email || ''}`.trim().toLowerCase();
    if (!email) {
      continue;
    }

    const existing = emailSubscriptionOperations.getByEmail(email);
    if (existing) {
      continue;
    }

    emailSubscriptionOperations.upsert(email, 'user_backfill', [
      'auth',
      'welcome',
      'updates',
      'monthly_report',
      'report_upgrade',
    ]);
    createdOrUpdated += 1;
  }

  return {
    scanned: users.length,
    createdOrUpdated,
  };
}
