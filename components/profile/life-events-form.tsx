'use client';

import { useEffect, useState } from 'react';
import LifeEventsList from '@/components/profile/life-events-list';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { ProfileSettingsResponse } from '@/lib/profile-settings-types';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import {
  LIFE_EVENT_CATEGORY_OPTIONS,
  type LifeEvent,
  type LifeEventCategory,
} from '@/lib/life-profile/types';
import { recordLifeEvent } from '@/lib/life-profile/store';
import { fetchJsonWithTimeout } from '@/lib/utils';

type FormState = {
  category: LifeEventCategory;
  title: string;
  date: string;
  description: string;
  impact: string;
};

const EMPTY_FORM: FormState = {
  category: 'job_change',
  title: '',
  date: '',
  description: '',
  impact: '',
};

export default function LifeEventsForm({
  editingEvent,
  onSaved,
  onCancelEdit,
}: {
  editingEvent?: LifeEvent | null;
  onSaved?: () => void;
  onCancelEdit?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [birthSignature, setBirthSignature] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (editingEvent) {
      setForm({
        category: editingEvent.category,
        title: editingEvent.title,
        date: editingEvent.date,
        description: editingEvent.description || '',
        impact: editingEvent.impact || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingEvent]);

  useEffect(() => {
    const load = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<ProfileSettingsResponse>(
          '/api/profile/settings',
          { timeoutMs: 8000, timeoutReason: 'life-events-form-settings' },
        );
        if (!response.ok || !data.success) {
          setError('无法读取测算资料，请先完善出生信息。');
          return;
        }

        const primary = data.fortunes.find((item) => item.isPrimary) || data.fortunes[0];
        if (!primary?.birthDate) {
          setError('还没有可用的出生资料，请先创建档案。');
          return;
        }

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
      } catch {
        setError('网络异常，暂时无法记录事件。');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!birthSignature) {
      setError('缺少出生签名，无法保存事件。');
      return;
    }
    if (!form.title.trim() || !form.date) {
      setError('请填写事件标题和日期。');
      return;
    }

    setSaving(true);
    setError('');
    try {
      recordLifeEvent(birthSignature, {
        id: editingEvent?.id,
        category: form.category,
        title: form.title.trim(),
        date: form.date,
        description: form.description.trim() || undefined,
        impact: form.impact.trim() || undefined,
      });
      if (!editingEvent) {
        setForm(EMPTY_FORM);
      }
      onSaved?.();
    } catch {
      setError('保存失败，请稍后重试。');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fb-card flex items-center gap-2 p-4 text-[13px] text-[color:var(--ink-3)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        正在读取档案签名…
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

  return (
    <section className="fb-card p-4 md:p-5">
      <h2 className="text-base font-bold text-[color:var(--ink-1)]">
        {editingEvent ? '编辑人生事件' : '记录人生事件'}
      </h2>
      <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
        换工作、结婚、搬家等真实节点会用于校准趋势解读与命中率。
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-4)]">事件类型</span>
            <select
              value={form.category}
              onChange={(e) => setForm((current) => ({ ...current, category: e.target.value as LifeEventCategory }))}
              className="fb-input h-10 w-full px-3 text-sm"
            >
              {LIFE_EVENT_CATEGORY_OPTIONS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-4)]">发生日期</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
              className="fb-input h-10 w-full px-3 text-sm"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-4)]">事件标题</span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="如：跳槽到互联网公司"
            className="fb-input h-10 w-full px-3 text-sm"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-4)]">简短描述（可选）</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            rows={2}
            className="fb-input w-full px-3 py-2 text-sm"
            placeholder="补充背景，帮助后续报告理解语境"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[color:var(--ink-4)]">自述影响（可选）</span>
          <textarea
            value={form.impact}
            onChange={(e) => setForm((current) => ({ ...current, impact: e.target.value }))}
            rows={2}
            className="fb-input w-full px-3 py-2 text-sm"
            placeholder="这件事对你事业/关系/健康产生了什么影响？"
          />
        </label>

        {error ? <p className="text-[12px] text-[color:var(--danger, #c0392b)]">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="fb-btn fb-btn-primary h-9 px-4 text-sm disabled:opacity-60"
          >
            {saving ? '保存中…' : editingEvent ? '更新事件' : '保存事件'}
          </button>
          {editingEvent && onCancelEdit ? (
            <button type="button" onClick={onCancelEdit} className="fb-btn h-9 px-4 text-sm">
              取消编辑
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

export function LifeEventsPageBody() {
  const [editingEvent, setEditingEvent] = useState<LifeEvent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      <LifeEventsForm
        key={`${refreshKey}-${editingEvent?.id || 'new'}`}
        editingEvent={editingEvent}
        onSaved={() => {
          setRefreshKey((value) => value + 1);
          setEditingEvent(null);
        }}
        onCancelEdit={() => setEditingEvent(null)}
      />
      <LifeEventsList
        key={refreshKey}
        onEdit={(event) => {
          setEditingEvent(event);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}