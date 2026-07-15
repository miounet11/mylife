import { getAuthSession } from '@/lib/auth';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

/**
 * Resolve the user id for profile/fortune/document APIs.
 * Guest cookie identity is enough; email login is not required.
 * Subscription-only endpoints should still require session.authenticated + email.
 */
export async function resolveProfileUserId(): Promise<{
  userId: string;
  authenticated: boolean;
  email: string | null;
}> {
  const session = await getAuthSession();
  const userId = session.user?.id || (await getOrCreateGuestUserId());
  return {
    userId,
    authenticated: Boolean(session.authenticated),
    email: session.user?.email || null,
  };
}
