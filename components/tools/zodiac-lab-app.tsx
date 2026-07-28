'use client';

/**
 * 星座 · 生肖工具 — 由生辰推导太阳星座与生肖，可选填月亮/上升写入数据底座
 */

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  buildAstroFromBirth,
  WESTERN_SIGN_OPTIONS,
  CHINESE_ZODIAC,
} from '@/lib/life-foundation/zodiac';
import { trackClientEvent } from '@/lib/analytics-client';
import { fetchJsonWithTimeout } from '@/lib/utils';

export default function ZodiacLabApp() {
  const sp = useSearchParams();
  const initialBirth = sp.get('birthDate') || '';
  const fortuneId = sp.get('fortuneId') || '';
  const focus = sp.get('focus') || '';

  const [birthDate, setBirthDate] = useState(initialBirth);
  const [moonSign, setMoonSign] = useState('');
  const [risingSign, setRisingSign] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const computed = useMemo(() => buildAstroFromBirth(birthDate || null), [birthDate]);

  async function saveToFoundation() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { response, data } = await fetchJsonWithTimeout<{
        success: boolean;
        error?: string;
      }>('/api/profile/foundation/astro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fortuneId: fortuneId || null,
          birthDate,
          sunSign: computed.sunSign,
          chineseZodiac: computed.chineseZodiac,
          moonSign,
          risingSign,
        }),
        timeoutMs: 10_000,
        timeoutReason: 'zodiac-save',
      });
      if (!response.ok || !data.success) {
        setError(data.error || '保存失败');
        return;
      }
      setMessage('已写入人生数据底座');
      void trackClientEvent({
        eventName: 'foundation_astro_saved',
        page: '/tools/zodiac',
        meta: { hasMoon: Boolean(moonSign), hasRising: Boolean(risingSign) },
      });
    } catch {
      setError('网络超时');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5 shadow-card">
        <h2 className="text-[15px] font-semibold text-[color:var(--ink-1)]">输入出生日期</h2>
        <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
          太阳星座与生肖由公历生日推导；精确上升需准确出生时刻。立春前后生肖以年柱为准。
        </p>
        <label className="mt-4 block">
          <span className="text-[12px] text-[color:var(--ink-3)]">出生日期</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[color:var(--hairline)] px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--ink-3)]"
          />
        </label>
      </section>

      {computed.sunSign && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[color:var(--ink-5)]">
            推算结果
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4">
              <div className="text-[11px] text-[color:var(--ink-5)]">太阳星座</div>
              <div className="mt-1 text-[20px] font-semibold text-[color:var(--ink-1)]">
                {computed.sunSign}
              </div>
              <div className="mt-1 text-[12px] text-[color:var(--ink-4)]">
                {computed.sunSignEn}
                {computed.element ? ` · ${computed.element}象` : ''}
                {computed.modality ? ` · ${computed.modality}` : ''}
              </div>
            </div>
            <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4">
              <div className="text-[11px] text-[color:var(--ink-5)]">生肖（近立春近似）</div>
              <div className="mt-1 text-[20px] font-semibold text-[color:var(--ink-1)]">
                {computed.chineseZodiac}
              </div>
              <div className="mt-1 text-[12px] text-[color:var(--ink-4)]">
                {computed.chineseZodiacYear ? `${computed.chineseZodiacYear} 年生肖年` : ''}
              </div>
            </div>
          </div>
          {computed.note && (
            <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--ink-5)]">{computed.note}</p>
          )}

          <div className="mt-5 space-y-3 border-t border-[color:var(--hairline)] pt-4">
            <h3 className="text-[13px] font-semibold text-[color:var(--ink-1)]">选填 · 写入底座</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] text-[color:var(--ink-3)]">
                  月亮星座{focus === 'moon' ? '（当前焦点）' : ''}
                </span>
                <select
                  value={moonSign}
                  onChange={(e) => setMoonSign(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-[14px]"
                >
                  <option value="">未填写</option>
                  {WESTERN_SIGN_OPTIONS.map((s) => (
                    <option key={s.key} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[12px] text-[color:var(--ink-3)]">
                  上升星座{focus === 'rising' ? '（当前焦点）' : ''}
                </span>
                <select
                  value={risingSign}
                  onChange={(e) => setRisingSign(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-[14px]"
                >
                  <option value="">未填写</option>
                  {WESTERN_SIGN_OPTIONS.map((s) => (
                    <option key={s.key} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && <p className="text-[12px] text-red-600">{error}</p>}
            {message && <p className="text-[12px] text-[color:var(--brand)]">{message}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || !birthDate}
                onClick={() => void saveToFoundation()}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? '保存中…' : '写入数据底座'}
              </button>
              <Link
                href={`/profile/foundation${fortuneId ? `?fortuneId=${encodeURIComponent(fortuneId)}` : ''}`}
                className="rounded-lg border border-[color:var(--hairline)] px-4 py-2.5 text-[13px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
              >
                打开数据底座
              </Link>
              <Link
                href={`/analyze?birthDate=${encodeURIComponent(birthDate)}&source=zodiac_tool`}
                className="rounded-lg border border-[color:var(--hairline)] px-4 py-2.5 text-[13px] font-medium text-[color:var(--ink-1)] hover:bg-[color:var(--bg-sunken)]"
              >
                生成结构报告
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-5">
        <h3 className="text-[13px] font-semibold text-[color:var(--ink-1)]">十二星座速查</h3>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {WESTERN_SIGN_OPTIONS.map((s) => (
            <div
              key={s.key}
              className="rounded-lg border border-[color:var(--hairline)] px-2 py-2 text-center text-[12px] text-[color:var(--ink-2)]"
            >
              {s.label}
            </div>
          ))}
        </div>
        <h3 className="mt-5 text-[13px] font-semibold text-[color:var(--ink-1)]">十二生肖</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHINESE_ZODIAC.map((a) => (
            <span
              key={a}
              className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 text-[12px] text-[color:var(--ink-2)]"
            >
              {a}
            </span>
          ))}
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">
        星座为民用表达层，与八字结构并行；不替代四柱推演。完整参数请到{' '}
        <Link href="/profile/foundation" className="underline underline-offset-2">
          人生数据底座
        </Link>{' '}
        统一管理。
      </p>
    </div>
  );
}
