import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { appendClientError } from '@/lib/client-error-log';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = `${body.message || body.error || ''}`.trim().slice(0, 2000);
    if (message.length < 2) {
      return NextResponse.json({ success: false, error: 'empty' }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const session = await getAuthSession();
      if (session.authenticated && session.user?.id) userId = session.user.id;
    } catch {
      // anonymous ok
    }

    const entry = appendClientError({
      route: `${body.route || body.path || ''}`.slice(0, 500) || null,
      message,
      name: body.name ? `${body.name}`.slice(0, 120) : null,
      digest: body.digest ? `${body.digest}`.slice(0, 200) : null,
      stack: body.stack ? `${body.stack}`.slice(0, 4000) : null,
      componentStack: body.componentStack ? `${body.componentStack}`.slice(0, 2000) : null,
      userAgent: request.headers.get('user-agent'),
      userId,
      meta: {
        href: typeof body.href === 'string' ? body.href.slice(0, 500) : undefined,
        source: typeof body.source === 'string' ? body.source.slice(0, 80) : undefined,
      },
    });

    trackServerEvent({
      userId: userId || undefined,
      sessionId: userId || request.headers.get('x-forwarded-for') || 'anon',
      eventName: 'client_error',
      page: entry.route || '/unknown',
      userAgent: request.headers.get('user-agent'),
      meta: {
        errorId: entry.id,
        name: entry.name,
        digest: entry.digest,
        message: entry.message.slice(0, 200),
      },
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    console.error('[client-error] POST', error);
    return NextResponse.json({ success: false, error: 'log_failed' }, { status: 500 });
  }
}
