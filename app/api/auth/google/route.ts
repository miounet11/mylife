import { NextRequest, NextResponse } from 'next/server';
import {
  buildGoogleAuthorizeUrl,
  buildPublicRedirectUrl,
  encodeGoogleOAuthState,
  isGoogleOAuthConfigured,
  sanitizeNext,
} from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

/**
 * Start Google OAuth — redirect to Google consent.
 * Query: next, reportId, source
 */
export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      buildPublicRedirectUrl('/login?error=google_not_configured', request),
    );
  }

  const next = sanitizeNext(request.nextUrl.searchParams.get('next'));
  const reportId = request.nextUrl.searchParams.get('reportId')?.trim() || '';
  const source = request.nextUrl.searchParams.get('source')?.trim() || 'google';

  const state = encodeGoogleOAuthState({
    next,
    reportId: reportId || undefined,
    source: source || 'google',
  });

  const url = buildGoogleAuthorizeUrl(state);
  return NextResponse.redirect(url);
}
