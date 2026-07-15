'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import {
  deleteLifeEvent,
  getProfile,
  hydrateLifeProfilesFromServer,
  subscribeLifeProfileUpdates,
} from '@/lib/life-profile/store';
import {
  LIFE_EVENT_CATEGORY_OPTIONS,
  type LifeEvent,
  type LifeProfile,
} from '@/lib/life-profile/types';
import { fetchJsonWithTimeout } from '@/lib/utils';

const CATEGORY_LABELS = Object.fromEntries(
  LIFE_EVENT_CATEGORY_OPTIONS.map((item) => [item.key, item.label]),
) as Record<string, string>;

export default function LifeEventsList({
  onEdit,
}: {
  onEdit?: (event: LifeEvent) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [birthSignature, setBirthSignature] = useState('');
  const [profile, setProfile] = useState<LifeProfile | null>(null);
  const [error, setError] = useState('');

  const refreshProfile = useCallback((signature: string) => {
    setProfile(getProfile(signature));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          '/api/profile/settings',
          { timeoutMs: 8000, timeoutReason: 'life-events-list-settings' },
        );
        if (!response.ok || !data.success) {
          setError('无法读取档案资料。');
          return;
        }

        const primary = data.fortunes.find((item) => item.isPrimary) || data.fortunes[0];
        if (!primary?.birthDate) {
          setError('还没有出生资料。');
          return;
        }

        await hydrateLifeProfilesFromServer();

        const signature =
          primary.birthSignature ||
          buildBirthSignature({
            birthDate: primary.birthDate,
            birthTime: primary.birthTime,
            birthPlace: primary.birthPlace,
            birthAccuracy: primary.birthAccuracy,
            gender: primary.gender,
          });
        setBirthSignature(signature);
        refreshProfile(signature);
      } catch {
        setError('网络异常，无法加载事件列表。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [refreshProfile]);

  useEffect(() => {
    if (!birthSignature) return undefined;
    return subscribeLifeProfileUpdates((signature) => {
      if (signature === birthSignature) {
        refreshProfile(signature);
      }
    });
  }, [birthSignature, refreshProfile]);

  const handleDelete = (eventId: string) => {
    if (!birthSignature) return;
    if (!window.confirm('确定删除这条人生事件吗？')) return;
    deleteLifeEvent(birthSignature, eventId);
    refreshProfile(birthSignature);
  };

  if (loading) {
    return (
      <div className="fb-card flex items-center gap-2 p-4 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在加载事件列表…
      </div>
    );
  }

  if (!birthSignature) {
    return (
      <section className="fb-card p-4 md:p-5">
        <p className="text-[13px] text-[color:var(--ink-3)]">{error || '请先完善测算资料。'}</p>
        <Link href="/profile/settings" className="fb-btn mt-3 h-9 px-3 text-sm hover:no-underline">
          去完善资料
        </Link>
      </section>
    );
  }

  const events = profile?.keyEvents || [];

  return (
    <section className="fb-card p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[color:var(--ink-1)]">已记录事件</h2>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            校准分数 {Math.round((profile?.calibrationScore || 0) * 100)}%
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[color:var(--ink-4)]">{events.length} 条</span>
      </div>

      {!events.length ? (
        <p className="mt-4 text-[13px] text-[color:var(--ink-3)]">还没有人生事件，先在上方记录第一条。</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[color:var(--ink-2)]">{event.title}</div>
                  <div className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">
                    {event.date} · {CATEGORY_LABELS[event.category] || event.category}
                  </div>
                  {event.description ? (
                    <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">{event.description}</p>
                  ) : null}
                  {event.impact ? (
                    <p className="mt-1 text-[12px] text-[color:var(--ink-3)]">影响：{event.impact}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(event)}
                      className="fb-btn h-8 w-8 p-0"
                      aria-label="编辑事件"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id)}
                    className="fb-btn h-8 w-8 p-0"
                    aria-label="删除事件"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}