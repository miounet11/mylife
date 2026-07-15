// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { createProfileFortune, getProfileSettings } from '@/lib/profile-settings-service';
import type { BirthAccuracy, ProfileIntent } from '@/lib/profile-settings-types';
import { getOrCreateGuestUserId } from '@/lib/user-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name || !body.birthDate || !body.gender) {
      return NextResponse.json({ success: false, error: '请填写姓名、出生日期和性别' }, { status: 400 });
    }

    const result = createProfileFortune(userId, {
      name: body.name,
      gender: body.gender,
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      birthPlace: body.birthPlace,
      birthAccuracy: body.birthAccuracy as BirthAccuracy | undefined,
      intent: body.intent as ProfileIntent | null | undefined,
      relation: body.relation,
      relationLabel: body.relationLabel,
      timezone: typeof body.timezone === 'number' ? body.timezone : undefined,
      setPrimary: body.setPrimary === true,
    });

    const settings = getProfileSettings(userId, result.fortuneId);
    return NextResponse.json({
      ...result,
      message: '新档案已创建，命盘将在后台生成。',
      settings,
      authenticated: Boolean(session.authenticated),
      userId,
    });
  } catch (error) {
    console.error('[API] profile fortune POST failed:', error);
    return NextResponse.json({ success: false, error: '创建档案失败，请稍后重试' }, { status: 500 });
  }
}
