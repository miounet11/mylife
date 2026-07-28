import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  ensureProfileSettingsSchema,
  profileChangeLogOperations,
  profileSupplementOperations,
} from '@/lib/profile-settings-store';
import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type SupplementDomain,
} from '@/lib/profile-settings-types';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';

const DOMAINS = Object.keys(PROFILE_SUPPLEMENT_DOMAINS) as SupplementDomain[];

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session.user?.id || (await getOrCreateGuestUserId());
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话' }, { status: 401 });
    }

    const body = await request.json();
    const fortuneId = body?.fortuneId ? String(body.fortuneId) : null;
    const domain = String(body?.domain || '') as SupplementDomain;
    const fieldsIn = (body?.fields || {}) as Record<string, unknown>;

    if (!DOMAINS.includes(domain)) {
      return NextResponse.json({ success: false, error: '无效的问答域' }, { status: 400 });
    }

    const allowedKeys = new Set(PROFILE_SUPPLEMENT_DOMAINS[domain].fields.map((f) => f.key));
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(fieldsIn)) {
      if (!allowedKeys.has(k)) continue;
      const t = `${v ?? ''}`.trim().slice(0, 200);
      if (t) fields[k] = t;
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ success: false, error: '没有可保存的字段' }, { status: 400 });
    }

    ensureProfileSettingsSchema();
    profileSupplementOperations.upsert({
      userId,
      fortuneId,
      domain,
      fields,
    });

    profileChangeLogOperations.create({
      userId,
      fortuneId,
      changeType: 'foundation_qa',
      fieldPath: `supplements.${domain}`,
      newValue: Object.keys(fields).join(','),
      triggeredRecalc: false,
      meta: {
        summary: `问答向导更新「${PROFILE_SUPPLEMENT_DOMAINS[domain].label}」${Object.keys(fields).length} 项`,
      },
    });

    trackServerEvent({
      userId,
      eventName: 'foundation_qa_saved',
      page: '/profile/foundation',
      meta: { domain, fieldCount: Object.keys(fields).length },
    });

    return NextResponse.json({ success: true, domain, fields });
  } catch (error) {
    console.error('[API] foundation qa POST failed:', error);
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 });
  }
}
