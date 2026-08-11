/**
 * Google OAuth (OpenID Connect) for Life K-Line web login.
 * Credentials: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI
 * Never commit secrets — production .env.local only.
 */

import crypto from 'node:crypto';

export type GoogleOAuthState = {
  next: string;
  reportId?: string;
  source?: string;
  nonce: string;
  ts: number;
};

function env(name: string, fallback = ''): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() || fallback : fallback;
}

export function getGoogleClientId(): string {
  return env('GOOGLE_CLIENT_ID');
}

export function getGoogleClientSecret(): string {
  return env('GOOGLE_CLIENT_SECRET');
}

export function getGoogleRedirectUri(): string {
  return (
    env('GOOGLE_REDIRECT_URI') ||
    'https://www.life-kline.com/api/auth/google/callback'
  );
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(getGoogleClientId() && getGoogleClientSecret());
}

function stateSecret(): string {
  return (
    getGoogleClientSecret() ||
    env('AUTH_STATE_SECRET') ||
    'life-kline-oauth-state'
  );
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

export function encodeGoogleOAuthState(payload: Omit<GoogleOAuthState, 'nonce' | 'ts'> & {
  nonce?: string;
}): string {
  const body: GoogleOAuthState = {
    next: sanitizeNext(payload.next),
    reportId: payload.reportId?.trim().slice(0, 120) || undefined,
    source: payload.source?.trim().slice(0, 80) || undefined,
    nonce: payload.nonce || crypto.randomBytes(12).toString('hex'),
    ts: Date.now(),
  };
  const raw = b64url(JSON.stringify(body));
  const sig = crypto
    .createHmac('sha256', stateSecret())
    .update(raw)
    .digest();
  return `${raw}.${b64url(sig)}`;
}

export function decodeGoogleOAuthState(
  state: string | null | undefined,
): GoogleOAuthState | null {
  if (!state || !state.includes('.')) return null;
  const [raw, sig] = state.split('.');
  if (!raw || !sig) return null;
  const expected = crypto
    .createHmac('sha256', stateSecret())
    .update(raw)
    .digest();
  const given = fromB64url(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return null;
  }
  try {
    const body = JSON.parse(fromB64url(raw).toString('utf8')) as GoogleOAuthState;
    if (!body || typeof body.next !== 'string' || !body.nonce) return null;
    // 15 min
    if (typeof body.ts !== 'number' || Date.now() - body.ts > 15 * 60 * 1000) {
      return null;
    }
    return {
      next: sanitizeNext(body.next),
      reportId: body.reportId,
      source: body.source,
      nonce: body.nonce,
      ts: body.ts,
    };
  } catch {
    return null;
  }
}

/** Only same-origin relative paths */
export function sanitizeNext(raw?: string | null): string {
  const v = `${raw || ''}`.trim() || '/profile';
  if (!v.startsWith('/') || v.startsWith('//')) return '/profile';
  if (v.includes('://')) return '/profile';
  return v.slice(0, 500);
}

/**
 * Public site origin for post-login redirects.
 * Behind nginx, request.url is often http://localhost:3000 — never use that for Location.
 */
export function resolvePublicOrigin(request?: {
  headers?: { get(name: string): string | null };
  url?: string;
}): string {
  const fromEnv =
    env('APP_BASE_URL') ||
    env('NEXT_PUBLIC_APP_URL') ||
    env('SITE_URL') ||
    '';
  if (fromEnv) {
    try {
      const u = new URL(fromEnv);
      if (!isLoopbackHost(u.hostname)) {
        return u.origin;
      }
    } catch {
      // fall through
    }
  }

  const headers = request?.headers;
  if (headers) {
    const xfHost = (headers.get('x-forwarded-host') || '').split(',')[0]?.trim();
    const host = xfHost || (headers.get('host') || '').split(',')[0]?.trim();
    if (host && !isLoopbackHost(host.split(':')[0] || host)) {
      const xfProto = (headers.get('x-forwarded-proto') || '').split(',')[0]?.trim();
      const proto =
        xfProto === 'http' || xfProto === 'https'
          ? xfProto
          : host.includes('localhost') || host.startsWith('127.')
            ? 'http'
            : 'https';
      return `${proto}://${host}`;
    }
  }

  // Last resort: production canonical (matches GOOGLE_REDIRECT_URI host)
  try {
    const redirect = getGoogleRedirectUri();
    if (redirect) return new URL(redirect).origin;
  } catch {
    // ignore
  }
  return 'https://www.life-kline.com';
}

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '0.0.0.0' ||
    h === '::1' ||
    h.endsWith('.local')
  );
}

/** Absolute same-site URL for a relative next path */
export function buildPublicRedirectUrl(
  path: string,
  request?: { headers?: { get(name: string): string | null }; url?: string },
): string {
  const origin = resolvePublicOrigin(request);
  const next = sanitizeNext(path);
  return new URL(next, origin).toString();
}

export function buildGoogleAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleTokenResult = {
  access_token: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResult> {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(),
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as GoogleTokenResult & {
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description || data.error || `Google token exchange failed (${res.status})`,
    );
  }
  return data;
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
};

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json().catch(() => ({}))) as GoogleUserInfo & {
    error?: string;
  };
  if (!res.ok || !data.email) {
    throw new Error(data.error || `Google userinfo failed (${res.status})`);
  }
  return {
    sub: data.sub,
    email: `${data.email}`.trim().toLowerCase(),
    email_verified: Boolean(data.email_verified),
    name: data.name,
    picture: data.picture,
    given_name: data.given_name,
  };
}
