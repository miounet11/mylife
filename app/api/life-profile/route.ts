// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  listLifeProfilesForUser,
  upsertLifeProfilesForUser,
} from '@/lib/life-profile/server-store';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.id) {
      return NextResponse.json({ success: true, profiles: [], authenticated: false });
    }

    const profiles = listLifeProfilesForUser(session.user.id);
    return NextResponse.json({ success: true, profiles, authenticated: true });
  } catch (error) {
    console.error('[API] life-profile GET failed:', error);
    return NextResponse.json({ success: false, error: '读取人生档案失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.id) {
      return NextResponse.json({ success: false, error: '请先登录后再同步人生档案' }, { status: 401 });
    }

    const body = await request.json();
    const profiles = Array.isArray(body?.profiles)
      ? body.profiles
      : body?.profile
        ? [body.profile]
        : [];
    if (!profiles.length) {
      return NextResponse.json({ success: true, saved: 0 });
    }

    const saved = upsertLifeProfilesForUser(session.user.id, profiles);
    return NextResponse.json({ success: true, saved });
  } catch (error) {
    console.error('[API] life-profile POST failed:', error);
    return NextResponse.json({ success: false, error: '保存人生档案失败' }, { status: 500 });
  }
}