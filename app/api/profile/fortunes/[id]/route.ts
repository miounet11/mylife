// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getProfileSettings, updateProfileFortune } from '@/lib/profile-settings-service';
import { resolveProfileUserId } from '@/lib/profile-session';
import type { BirthAccuracy, ProfileIntent } from '@/lib/profile-settings-types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '无法建立会话，请刷新后重试' },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateProfileFortune(userId, id, {
      name: body.name,
      gender: body.gender,
      birthDate: body.birthDate,
      birthTime: body.birthTime,
      birthPlace: body.birthPlace,
      birthAccuracy: body.birthAccuracy as BirthAccuracy | undefined,
      intent: body.intent as ProfileIntent | null | undefined,
      timezone: typeof body.timezone === 'number' ? body.timezone : undefined,
      relationLabel: body.relationLabel,
      confirmRecalc: body.confirmRecalc === true,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 409 });
    }

    const settings = getProfileSettings(userId, id);
    return NextResponse.json({
      ...result,
      message: result.recalcQueued
        ? '资料已保存，命盘将在后台重新计算。'
        : '测算资料已保存。',
      settings,
    });
  } catch (error: any) {
    if (`${error?.message || ''}` === 'FORTUNE_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: '未找到对应档案' },
        { status: 404 },
      );
    }

    console.error('[API] profile fortune PATCH failed:', error);
    return NextResponse.json(
      { success: false, error: '更新失败，请稍后重试' },
      { status: 500 },
    );
  }
}
