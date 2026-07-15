// @ts-nocheck
/**
 * 渐进资料 API
 * GET  — 下一条可补字段（按老师）
 * POST — 抽取/确认写入 profile_supplements（合并字段）
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveProfileUserId } from '@/lib/profile-session';
import {
  PROFILE_SUPPLEMENT_DOMAINS,
  type SupplementDomain,
} from '@/lib/profile-settings-types';
import {
  getProfileSettings,
  upsertProfileSupplement,
} from '@/lib/profile-settings-service';
import {
  profileChangeLogOperations,
  profileSupplementOperations,
} from '@/lib/profile-settings-store';
import {
  extractProfileFieldsFromMessage,
  mergeDomainFields,
  pickNextProfileSlot,
  snapshotFromSupplementList,
  type ProgressiveProfileSnapshot,
} from '@/lib/progressive-profile';

function loadSnapshot(userId: string, fortuneId: string | null): ProgressiveProfileSnapshot {
  const rows = profileSupplementOperations.listByUser(userId, fortuneId);
  // also merge account-level (null fortune) if fortune scoped empty fields
  const accountRows = fortuneId ? profileSupplementOperations.listByUser(userId, null) : [];
  const map = new Map<string, Record<string, string>>();
  for (const row of [...accountRows, ...rows]) {
    const prev = map.get(row.domain) || {};
    map.set(row.domain, { ...prev, ...(row.fields || {}) });
  }
  return snapshotFromSupplementList(
    [...map.entries()].map(([domain, fields]) => ({ domain, fields })),
  );
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fortuneId = searchParams.get('fortuneId') || searchParams.get('reportId') || null;
    const teacherId = searchParams.get('teacher') || 'overview';
    const asked = (searchParams.get('asked') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const snapshot = loadSnapshot(userId, fortuneId);
    const next = pickNextProfileSlot({
      teacherId,
      snapshot,
      askedKeys: asked,
    });

    return NextResponse.json({
      success: true,
      next,
      profileLines: Object.keys(snapshot.domains).length
        ? snapshot
        : { domains: {} },
    });
  } catch (error) {
    console.error('[API] progressive GET failed', error);
    return NextResponse.json({ success: false, error: '读取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await resolveProfileUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: '无法建立会话' }, { status: 401 });
    }

    const body = await request.json();
    const fortuneId =
      typeof body.fortuneId === 'string'
        ? body.fortuneId
        : typeof body.reportId === 'string'
          ? body.reportId
          : null;
    const message = typeof body.message === 'string' ? body.message : '';
    const teacherId = typeof body.teacher === 'string' ? body.teacher : 'overview';
    const hint =
      body.hint && typeof body.hint === 'object'
        ? {
            domain: body.hint.domain as SupplementDomain | undefined,
            fieldKey: typeof body.hint.fieldKey === 'string' ? body.hint.fieldKey : undefined,
          }
        : null;

    // 显式 fields 优先
    const explicit =
      body.fields && typeof body.fields === 'object'
        ? (body.fields as Record<string, Record<string, string>>)
        : null;

    const extracted = explicit
      ? []
      : extractProfileFieldsFromMessage(message, hint?.domain && hint?.fieldKey ? hint : null);

    const byDomain = new Map<SupplementDomain, Record<string, string>>();

    if (explicit) {
      for (const [domain, fields] of Object.entries(explicit)) {
        if (!(domain in PROFILE_SUPPLEMENT_DOMAINS)) continue;
        byDomain.set(domain as SupplementDomain, fields || {});
      }
    } else {
      for (const item of extracted) {
        if (!(item.domain in PROFILE_SUPPLEMENT_DOMAINS)) continue;
        const prev = byDomain.get(item.domain) || {};
        prev[item.fieldKey] = item.value;
        byDomain.set(item.domain, prev);
      }
    }

    if (byDomain.size === 0) {
      return NextResponse.json({
        success: true,
        saved: false,
        extracted: [],
        message: '未识别到可保存的资料',
      });
    }

    const snapshot = loadSnapshot(userId, fortuneId);
    const saved: Array<{ domain: string; fields: Record<string, string> }> = [];

    for (const [domain, patch] of byDomain.entries()) {
      const existing = snapshot.domains[domain] || {};
      const merged = mergeDomainFields(existing, patch);
      // fortune 可能不在 fortunes 表（仅 reportId）时降级写 account 级
      let wroteFortuneId: string | null = fortuneId;
      try {
        upsertProfileSupplement(userId, fortuneId, domain, merged);
      } catch (e: any) {
        if (`${e?.message || ''}` === 'FORTUNE_NOT_FOUND') {
          upsertProfileSupplement(userId, null, domain, merged);
          wroteFortuneId = null;
        } else {
          throw e;
        }
      }
      // 再写一份账号级，保证对话补全能在无档案绑定时空读
      if (wroteFortuneId) {
        try {
          const accountExisting = snapshot.domains[domain] || {};
          const accountMerged = mergeDomainFields(accountExisting, patch);
          upsertProfileSupplement(userId, null, domain, accountMerged);
        } catch {
          // ignore dual-write failures
        }
      }
      try {
        profileChangeLogOperations.create({
          userId,
          fortuneId: wroteFortuneId,
          changeType: 'chat_progressive',
          fieldPath: domain,
          newValue: JSON.stringify(patch),
          meta: { source: 'chat', teacherId, fields: patch },
        });
      } catch {
        // ignore log failures
      }
      saved.push({ domain, fields: patch });
    }

    const nextSnapshot = loadSnapshot(userId, fortuneId);
    const next = pickNextProfileSlot({
      teacherId,
      snapshot: nextSnapshot,
      askedKeys: saved.map((s) => Object.keys(s.fields).map((k) => `${s.domain}.${k}`)).flat(),
    });

    let settings = null;
    try {
      settings = getProfileSettings(userId, fortuneId);
    } catch {
      try {
        settings = getProfileSettings(userId, null);
      } catch {
        settings = null;
      }
    }

    return NextResponse.json({
      success: true,
      saved: true,
      extracted: saved,
      next,
      settings,
    });
  } catch (error) {
    console.error('[API] progressive POST failed', error);
    return NextResponse.json({ success: false, error: '保存失败' }, { status: 500 });
  }
}
