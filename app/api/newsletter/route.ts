// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { emailSubscriptionOperations, fortuneOperations } from '@/lib/database';
import { isEmailDeliveryConfigured, sendSubscriptionConfirmationEmail } from '@/lib/email';
import {
  MAX_EMAIL_FOCUS_ITEMS,
  buildFocusOptionsFromReport,
  countEnabledPreferences,
  listDefaultEnabledTags,
  mergeSubscriptionTags,
  normalizeEmailFocusItems,
  normalizeEnabledTags,
  parseEmailSubscriptionMeta,
  resolveSubscriptionPreferences,
  type EmailSubscriptionMeta,
} from '@/lib/email-subscription-focus';
import { buildSubscriptionFocusCopy } from '@/lib/profile-focus-copy';
import { validateEmail } from '@/lib/validators';
import { trackServerEvent } from '@/lib/analytics';

function buildSubscriptionPayload(email: string) {
  const subscription = emailSubscriptionOperations.getByEmail(email);
  if (!subscription) {
    return null;
  }

  const meta = parseEmailSubscriptionMeta(subscription.meta);
  const preferences = resolveSubscriptionPreferences(subscription.tags || []);
  let availableFocusOptions = [] as ReturnType<typeof buildFocusOptionsFromReport>;

  const focusFortune = meta.focusReportId ? fortuneOperations.getById(meta.focusReportId) : null;
  const subscriptionFocus = buildSubscriptionFocusCopy({
    focusReportId: meta.focusReportId || null,
    focusFortuneName: focusFortune?.name || null,
    focusFortuneRelation: focusFortune?.relation || null,
    focusFortuneRelationLabel: focusFortune?.relationLabel || null,
  });

  if (meta.focusReportId && focusFortune) {
    const report = focusFortune;
    if (report) {
      const fiveElements = (report.fiveElements || {}) as Record<string, { strength?: number }>;
      const sortedElements = Object.entries(fiveElements).sort(
        (left, right) => Number(right[1]?.strength || 0) - Number(left[1]?.strength || 0),
      );
      const elementLabelMap: Record<string, string> = {
        wood: '木',
        fire: '火',
        earth: '土',
        metal: '金',
        water: '水',
      };
      const strongestEntry = sortedElements[0];
      const weakestEntry = [...sortedElements].reverse()[0];
      const bazi = report.bazi as { dayMaster?: string; dayGan?: string } | undefined;
      const pattern = report.pattern as { type?: string } | undefined;
      const advice = report.advice as {
        yongShen?: string[];
        career?: string;
        wealth?: string;
        relationship?: string;
      } | undefined;
      const reportHighlights = [
        { label: '日主', value: bazi?.dayMaster || bazi?.dayGan || '' },
        { label: '格局', value: pattern?.type || '' },
        {
          label: '最强五行',
          value: strongestEntry ? elementLabelMap[strongestEntry[0]] || strongestEntry[0] : '',
        },
        {
          label: '最弱五行',
          value: weakestEntry ? elementLabelMap[weakestEntry[0]] || weakestEntry[0] : '',
        },
      ];
      const actionSuggestions = [
        advice?.career ? { title: '事业', description: advice.career } : null,
        advice?.wealth ? { title: '财运', description: advice.wealth } : null,
        advice?.relationship ? { title: '关系', description: advice.relationship } : null,
        advice?.yongShen?.length
          ? { title: '用神方向', description: `顺势重点：${advice.yongShen.join('、')}` }
          : null,
      ].filter((item): item is { title: string; description: string } => !!item);

      availableFocusOptions = buildFocusOptionsFromReport({
        reportHighlights,
        actionSuggestions,
      });
    }
  }

  return {
    ...subscription,
    meta,
    preferences,
    enabledPreferenceCount: countEnabledPreferences(subscription.tags || []),
    availableFocusOptions,
    focusFortuneName: focusFortune?.name || null,
    focusFortuneRelation: focusFortune?.relationLabel || focusFortune?.relation || null,
    subscriptionFocus,
  };
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email') || '';
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json(
      { success: false, error: emailError.message },
      { status: 400 }
    );
  }

  try {
    const subscription = buildSubscriptionPayload(email);
    return NextResponse.json({
      success: true,
      exists: !!subscription,
      subscription,
    });
  } catch (error) {
    console.error('[API] 查询订阅邮箱失败:', error);
    return NextResponse.json(
      { success: false, error: '查询失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent');
    const body = await request.json();
    const email = `${body.email || ''}`;
    const source = `${body.source || 'site'}`;
    const tags = Array.isArray(body.tags)
      ? normalizeEnabledTags(body.tags)
      : listDefaultEnabledTags();
    const reportId = typeof body.reportId === 'string' ? body.reportId.trim() : '';
    const focusItems = normalizeEmailFocusItems(body.focusItems);

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 400 }
      );
    }

    if (Array.isArray(body.focusItems) && body.focusItems.length > MAX_EMAIL_FOCUS_ITEMS) {
      return NextResponse.json(
        { success: false, error: `最多只能选择 ${MAX_EMAIL_FOCUS_ITEMS} 个提醒重点` },
        { status: 400 }
      );
    }

    const existing = emailSubscriptionOperations.getByEmail(email);
    const mergedTags = mergeSubscriptionTags(existing?.tags || [], tags);

    const metaPatch: EmailSubscriptionMeta = {};
    if (reportId) {
      metaPatch.focusReportId = reportId;
    }
    if (focusItems.length > 0) {
      metaPatch.focusItems = focusItems;
      metaPatch.focusUpdatedAt = new Date().toISOString();
    }

    emailSubscriptionOperations.upsert(email, source, mergedTags, metaPatch);

    const emailConfigured = isEmailDeliveryConfigured();
    if (emailConfigured) {
      void sendSubscriptionConfirmationEmail(email, { source }).then((deliveryResult) => {
        if (deliveryResult?.success) {
          trackServerEvent({
            eventName: 'email_delivery_succeeded',
            page: '/updates',
            userAgent,
            meta: {
              channel: 'newsletter_confirmation',
              emailDomain: email.split('@')[1] || '',
              source,
            },
          });
          return;
        }

        trackServerEvent({
          eventName: 'email_delivery_failed',
          page: '/updates',
          userAgent,
          meta: {
            channel: 'newsletter_confirmation',
            emailDomain: email.split('@')[1] || '',
            source,
            reason: deliveryResult?.message || 'unknown',
          },
        });
      }).catch((error) => {
        console.error('[Newsletter] 发送订阅确认邮件失败:', error);
      });
    }

    trackServerEvent({
      eventName: 'newsletter_subscribed',
      page: '/updates',
      userAgent,
      meta: {
        source,
        emailDomain: email.split('@')[1] || '',
        deliveryConfigured: emailConfigured,
        tags: mergedTags,
        focusCount: focusItems.length,
        reportId: reportId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: '订阅已保存',
      deliveryConfigured: emailConfigured,
      focusItems,
      subscription: buildSubscriptionPayload(email),
    });
  } catch (error) {
    console.error('[API] 订阅邮箱失败:', error);
    return NextResponse.json(
      { success: false, error: '订阅失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent');
    const body = await request.json();
    const email = `${body.email || ''}`;
    const enabledTags = normalizeEnabledTags(body.enabledTags);
    const focusItems = body.focusItems === undefined
      ? undefined
      : normalizeEmailFocusItems(body.focusItems);
    const reportId = typeof body.reportId === 'string' ? body.reportId.trim() : '';

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 400 }
      );
    }

    if (Array.isArray(body.focusItems) && body.focusItems.length > MAX_EMAIL_FOCUS_ITEMS) {
      return NextResponse.json(
        { success: false, error: `最多只能选择 ${MAX_EMAIL_FOCUS_ITEMS} 个提醒重点` },
        { status: 400 }
      );
    }

    const existing = emailSubscriptionOperations.getByEmail(email);
    if (!existing || existing.status !== 'active') {
      return NextResponse.json(
        { success: false, error: '当前邮箱没有有效订阅，请先开启订阅。' },
        { status: 404 }
      );
    }

    const metaPatch: EmailSubscriptionMeta = {};
    if (reportId) {
      metaPatch.focusReportId = reportId;
    }
    if (focusItems !== undefined) {
      metaPatch.focusItems = focusItems;
      metaPatch.focusUpdatedAt = new Date().toISOString();
    }

    emailSubscriptionOperations.updatePreferences(email, enabledTags, metaPatch);

    trackServerEvent({
      eventName: 'newsletter_preferences_updated',
      page: '/updates',
      userAgent,
      meta: {
        emailDomain: email.split('@')[1] || '',
        enabledCount: enabledTags.length,
        focusCount: focusItems?.length || existing.meta?.focusItems?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: '订阅设置已保存',
      subscription: buildSubscriptionPayload(email),
    });
  } catch (error) {
    console.error('[API] 更新订阅设置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError.message },
        { status: 400 }
      );
    }

    const result = emailSubscriptionOperations.unsubscribe(email);
    return NextResponse.json({
      success: true,
      message: '已退订',
      updated: result.changes > 0,
    });
  } catch (error) {
    console.error('[API] 退订邮箱失败:', error);
    return NextResponse.json(
      { success: false, error: '退订失败，请稍后重试' },
      { status: 500 }
    );
  }
}