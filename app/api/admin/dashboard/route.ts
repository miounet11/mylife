import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getAdminOpsDashboardSnapshot } from '@/lib/admin-ops-dashboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
    }

    const data = getAdminOpsDashboardSnapshot();
    const totalUsers = data.users.total || 0;
    const withEmail = data.users.withEmail || 0;
    const guests = data.users.guests || 0;
    // Compact 1d/7d usage strip for ops UIs (mirrors scripts/ops-prod-usage-1d.remote.js).
    // conversion: guest-heavy funnel (prod ~10k guests / ~24 emails).
    const usageStrip = {
      window: '1d+7d',
      users: {
        total: totalUsers,
        guests,
        withEmail,
        registered: data.users.registered,
        emailRatePct:
          totalUsers > 0 ? Math.round((withEmail / totalUsers) * 10000) / 100 : 0,
        guestRatePct:
          totalUsers > 0 ? Math.round((guests / totalUsers) * 10000) / 100 : 0,
        new24h: data.users.new24h,
        new7d: data.users.new7d,
        guestNew24h: data.users.guestNew24h,
        active24h: data.users.active24h,
        active7d: data.users.active7d,
        activeFortunes24h: data.users.activeFortunes24h,
        activeTools24h: data.users.activeTools24h,
        activeFortunes7d: data.users.activeFortunes7d,
        activeTools7d: data.users.activeTools7d,
      },
      fortunes: {
        d24h: data.fortunes.d24h,
        d7d: data.fortunes.d7d,
      },
      tools: {
        sessions24h: data.tools.sessions24h,
        sessions7d: data.tools.sessions7d,
      },
      analytics: {
        events24h: data.analytics.events24h,
        events7d: data.analytics.events7d,
      },
      // One-glance ops read of the product bottleneck.
      conversion: {
        label: 'guest_to_email',
        withEmail,
        guests,
        emailRatePct:
          totalUsers > 0 ? Math.round((withEmail / totalUsers) * 10000) / 100 : 0,
        note: 'Most traffic is guest; prioritize save/login after career/hehun value.',
      },
    };
    return NextResponse.json({
      success: true,
      data,
      usageStrip,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] admin dashboard failed:', error);
    return NextResponse.json({ success: false, error: '获取看板失败' }, { status: 500 });
  }
}
