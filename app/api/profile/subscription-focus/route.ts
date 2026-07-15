// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { emailSubscriptionOperations, fortuneOperations } from '@/lib/database';
import {
  buildFocusOptionsFromReport,
  MAX_EMAIL_FOCUS_ITEMS,
  mergeEmailSubscriptionMeta,
  normalizeEmailFocusItems,
  parseEmailSubscriptionMeta,
} from '@/lib/email-subscription-focus';
import { buildSubscriptionFocusCopy } from '@/lib/profile-focus-copy';
import { getProfileSettings } from '@/lib/profile-settings-service';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.email) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const subscription = emailSubscriptionOperations.getByEmail(session.user.email);
    const meta = parseEmailSubscriptionMeta(subscription?.meta);
    const fortune = meta.focusReportId ? fortuneOperations.getById(meta.focusReportId) : null;

    const subscriptionFocus = buildSubscriptionFocusCopy({
      focusReportId: meta.focusReportId || null,
      focusFortuneName: fortune?.name || null,
      focusFortuneRelation: fortune?.relation || null,
      focusFortuneRelationLabel: fortune?.relationLabel || null,
    });

    return NextResponse.json({
      success: true,
      focusReportId: meta.focusReportId || null,
      focusItems: meta.focusItems || [],
      focusFortuneName: fortune?.name || null,
      focusFortuneRelation: fortune?.relationLabel || fortune?.relation || null,
      subscriptionFocus,
    });
  } catch (error) {
    console.error('[API] profile subscription-focus GET failed:', error);
    return NextResponse.json({ success: false, error: '读取失败' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session.authenticated || !session.user?.email || !session.user.id) {
      return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const fortuneId = `${body.fortuneId || ''}`.trim();
    if (!fortuneId) {
      return NextResponse.json({ success: false, error: '请指定档案' }, { status: 400 });
    }

    const fortune = fortuneOperations.getById(fortuneId);
    if (!fortune || fortune.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: '档案不存在' }, { status: 404 });
    }

    const email = session.user.email.trim().toLowerCase();
    const existing = emailSubscriptionOperations.getByEmail(email);
    const existingMeta = parseEmailSubscriptionMeta(existing?.meta);

    let focusItems = normalizeEmailFocusItems(body.focusItems);
    if (!focusItems.length) {
      const analysis = (fortune.analysis || {}) as Record<string, unknown>;
      const actionSuggestions = Array.isArray(analysis.actionSuggestions)
        ? analysis.actionSuggestions as Array<{ title?: string; description?: string }>
        : [];
      focusItems = buildFocusOptionsFromReport({
        reportHighlights: [
          { label: '日主', value: `${(fortune.bazi as { dayMaster?: string })?.dayMaster || '待补全'}` },
          { label: '格局', value: `${(fortune.pattern as { type?: string })?.type || '待补全'}` },
        ],
        actionSuggestions,
      }).slice(0, MAX_EMAIL_FOCUS_ITEMS);
    }

    const mergedMeta = mergeEmailSubscriptionMeta(existingMeta, {
      focusReportId: fortuneId,
      focusItems,
      focusUpdatedAt: new Date().toISOString(),
    });

    if (existing) {
      emailSubscriptionOperations.updatePreferences(
        email,
        existing.tags || [],
        mergedMeta,
      );
    } else {
      emailSubscriptionOperations.upsert(email, 'profile_settings', [], mergedMeta);
    }

    const settings = getProfileSettings(session.user.id, fortuneId);
    return NextResponse.json({
      success: true,
      message: `已将「${fortune.name}」设为邮件提醒档案`,
      focusReportId: fortuneId,
      focusItems,
      settings,
    });
  } catch (error) {
    console.error('[API] profile subscription-focus PATCH failed:', error);
    return NextResponse.json({ success: false, error: '保存失败，请稍后重试' }, { status: 500 });
  }
}