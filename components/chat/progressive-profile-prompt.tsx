'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProfileFieldSlot } from '@/lib/progressive-profile';
import { trackProductEvent } from '@/lib/product-analytics';

/**
 * 对话中轻量补全条：不打断主对话，可跳过
 */
export default function ProgressiveProfilePrompt({
  reportId,
  teacherId,
  onApplyAnswer,
  onSaved,
}: {
  reportId?: string;
  teacherId?: string;
  /** 把用户选择写进输入框并发出 */
  onApplyAnswer?: (text: string) => void;
  onSaved?: (summary: string) => void;
}) {
  const [slot, setSlot] = useState<ProfileFieldSlot | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadNext = useCallback(async (askedKeys: string[]) => {
    try {
      const q = new URLSearchParams();
      if (reportId) q.set('reportId', reportId);
      if (teacherId) q.set('teacher', teacherId);
      if (askedKeys.length) q.set('asked', askedKeys.join(','));
      const res = await fetch(`/api/profile/progressive?${q.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && data.next) {
        setSlot(data.next as ProfileFieldSlot);
      } else {
        setSlot(null);
      }
    } catch {
      setSlot(null);
    }
  }, [reportId, teacherId]);

  useEffect(() => {
    setDismissed(false);
    setNotice('');
    void loadNext(asked);
  }, [teacherId, reportId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveValue(value: string) {
    if (!slot || !value.trim() || saving) return;
    setSaving(true);
    setNotice('');
    try {
      const res = await fetch('/api/profile/progressive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: reportId || undefined,
          teacher: teacherId,
          message: value.trim(),
          hint: { domain: slot.domain, fieldKey: slot.fieldKey },
          fields: {
            [slot.domain]: { [slot.fieldKey]: value.trim() },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setNotice(data?.error || '保存失败');
        return;
      }
      const key = `${slot.domain}.${slot.fieldKey}`;
      const nextAsked = [...asked, key];
      setAsked(nextAsked);
      setNotice(`已记下：${slot.label}`);
      onSaved?.(`${slot.label}：${value.trim()}`);
      trackProductEvent('mass_profile_field_saved', {
        domain: slot.domain,
        fieldKey: slot.fieldKey,
        teacherId: teacherId || '',
        reportId: reportId || '',
      });
      setSlot(null);
      // 稍后再拉下一项，避免连珠炮
      setTimeout(() => void loadNext(nextAsked), 1200);
    } catch {
      setNotice('网络异常');
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    if (!slot) return;
    const key = `${slot.domain}.${slot.fieldKey}`;
    const nextAsked = [...asked, key];
    setAsked(nextAsked);
    setDismissed(true);
    setSlot(null);
    trackProductEvent('mass_profile_field_skipped', {
      domain: slot.domain,
      fieldKey: slot.fieldKey,
      teacherId: teacherId || '',
    });
    setTimeout(() => {
      setDismissed(false);
      void loadNext(nextAsked);
    }, 8000);
  }

  if (dismissed && !notice) return null;
  if (!slot && !notice) return null;

  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-3 py-2.5">
      {notice ? (
        <p className="text-[11px] text-[color:var(--ink-4)]">{notice}</p>
      ) : null}
      {slot ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[12px] leading-[1.55] text-[color:var(--ink-3)]">
              <span className="font-medium text-[color:var(--ink-2)]">补充</span>
              <span className="mx-1 text-[color:var(--ink-5)]">·</span>
              {slot.ask}
            </p>
            <button
              type="button"
              onClick={skip}
              className="shrink-0 text-[11px] text-[color:var(--ink-5)] hover:underline"
            >
              稍后
            </button>
          </div>
          {slot.chips && slot.chips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {slot.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    onApplyAnswer?.(chip);
                    void saveValue(chip);
                  }}
                  className="text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">可在下方输入；或点「稍后」</p>
          )}
        </>
      ) : null}
    </div>
  );
}
