import { NextRequest, NextResponse } from 'next/server';
import { createSessionForVerifiedEmail } from '@/lib/auth';
import { emailSubscriptionOperations } from '@/lib/database';
import {
  isEmailDeliveryConfigured,
  sendWelcomeEmail,
} from '@/lib/email';
import {
  LOGIN_AUTO_SUBSCRIPTION_TAGS,
  REPORT_SUBSCRIPTION_TAGS,
} from '@/lib/email-subscription-focus';
import {
  decodeGoogleOAuthState,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  isGoogleOAuthConfigured,
  sanitizeNext,
} from '@/lib/google-oauth';
import { getCurrentUserId } from '@/lib/user-utils';
import { trackServerEvent } from '@/lib/analytics';
import { getClientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

function loginErrorRedirect(request: NextRequest, code: string, next = '/profile') {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', code);
  if (next && next !== '/profile') url.searchParams.set('next', next);
  return NextResponse.redirect(url);
}

/**
 * Google OAuth callback — exchange code, create session, redirect to next.
 */
export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return loginErrorRedirect(request, 'google_not_configured');
  }

  const sp = request.nextUrl.searchParams;
  const err = sp.get('error');
  if (err) {
    console.warn('[auth/google] user denied or error', err);
    return loginErrorRedirect(request, err === 'access_denied' ? 'google_denied' : 'google_failed');
  }

  const code = sp.get('code');
  const stateRaw = sp.get('state');
  const state = decodeGoogleOAuthState(stateRaw);
  if (!code || !state) {
    return loginErrorRedirect(request, 'google_invalid_state');
  }

  const next = sanitizeNext(state.next);
  const reportId = state.reportId || '';
  const source = state.source || 'google';

  try {
    const tokens = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    if (!profile.email_verified) {
      return loginErrorRedirect(request, 'google_email_unverified', next);
    }

    const currentUserId = await getCurrentUserId();
    const result = await createSessionForVerifiedEmail({
      email: profile.email,
      currentUserId,
      reportId: reportId || null,
      displayName: profile.name || profile.given_name || null,
    });

    if (!result.success) {
      return loginErrorRedirect(request, 'google_session_failed', next);
    }

    const subSource = reportId ? source || 'report_bind' : source || 'google';
    const tags = [
      ...new Set([
        ...LOGIN_AUTO_SUBSCRIPTION_TAGS,
        'google_oauth',
        ...(reportId ? REPORT_SUBSCRIPTION_TAGS : []),
      ]),
    ];
    const metaPatch = reportId ? { focusReportId: reportId } : undefined;

    try {
      emailSubscriptionOperations.upsert(profile.email, subSource, tags, metaPatch);
    } catch (subError) {
      console.error('[auth/google] subscription upsert failed:', subError);
    }

    if (isEmailDeliveryConfigured() && result.user?.email && result.isNewUser) {
      // Welcome only for new users; skip subscription-confirm spam for Google (quota).
      sendWelcomeEmail(result.user.email, result.user.name || '用户').catch((e) => {
        console.error('[auth/google] welcome email failed:', e);
      });
    }

    trackServerEvent({
      userId: result.user?.id,
      sessionId: currentUserId || result.user?.id || getClientKey(request),
      eventName: 'auth_google_verified',
      page: '/api/auth/google/callback',
      userAgent: request.headers.get('user-agent'),
      meta: {
        emailDomain: profile.email.split('@')[1] || '',
        source: subSource,
        reportId: reportId || null,
        reportClaimed: !!result.reportClaimed,
        isNewUser: !!result.isNewUser,
        provider: 'google',
      },
    });

    const dest = new URL(next, request.url);
    // stay same-origin
    if (dest.origin !== new URL(request.url).origin) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
    return NextResponse.redirect(dest);
  } catch (error) {
    console.error('[auth/google] callback failed:', error);
    return loginErrorRedirect(request, 'google_failed', next);
  }
}
