'use client';

/**
 * 内容 / 落地页 → 排盘 的轻量生辰桥
 * 设计：全站 Linear 浅色 token；主 CTA 一条；可带 source 归因
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackClientEvent } from '@/lib/analytics-client';
import { trackFunnel } from '@/components/funnel-tracker';

type Props = {
  /** 归因：如 knowledge:world-yi-naming-system */
  source: string;
  /** 页面 path，用于埋点 */
  page?: string;
  /** 标题覆盖 */
  title?: string;
  description?: string;
  /** compact = 更矮，适合 rail 内嵌 */
  compact?: boolean;
  /** 默认意图 career | wealth | relationship | yearly */
  intent?: string;
  className?: string;
};

export function LightBirthBridge({
  source,
  page,
  title = '把阅读变成你的结构报告',
  description = '填出生日期即可进入排盘；不必先注册。先看清自己的结构，再决定是否深聊。',
  compact = false,
  intent = 'career',
  className = '',
}: Props) {
  const router = useRouter();
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [hour, setHour] = useState('unknown');
  const [busy, setBusy] = useState(false);

  const canGo = Boolean(birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate));

  const href = useMemo(() => {
    const q = new URLSearchParams();
    q.set('source', source);
    q.set('from', source);
    if (intent) q.set('intent', intent);
    if (birthDate) q.set('birthDate', birthDate);
    if (gender !== 'unknown') q.set('gender', gender);
    if (hour !== 'unknown') {
      q.set('birthTime', `${hour.padStart(2, '0')}:00`);
    } else {
      q.set('timeUnknown', '1');
    }
    return `/analyze?${q.toString()}`;
  }, [source, intent, birthDate, gender, hour]);

  const go = (mode: 'with_birth' | 'empty') => {
    setBusy(true);
    const target = mode === 'with_birth' && canGo ? href : `/analyze?source=${encodeURIComponent(source)}&from=${encodeURIComponent(source)}&intent=${encodeURIComponent(intent)}`;
    trackFunnel('chat_to_analyze_click', {
      source,
      intent,
      surface: 'light_birth_bridge',
      mode,
    });
    void trackClientEvent({
      eventName: 'content_quick_analyze_started',
      page: page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      meta: {
        source,
        intent,
        mode,
        hasBirth: mode === 'with_birth' && canGo,
        surface: 'light_birth_bridge',
      },
    });
    void trackClientEvent({
      eventName: 'article_cta_clicked',
      page: page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      meta: {
        target: mode === 'with_birth' ? 'light_birth_submit' : 'light_birth_skip',
        source,
        intent,
      },
    });
    router.push(target);
  };

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] shadow-[var(--shadow-card)] ${
        compact ? 'p-3.5' : 'p-4 md:p-5'
      } ${className}`}
      data-bridge="light-birth"
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
        下一步 · 结构报告
      </div>
      <h3
        className={`mt-1 font-bold text-[color:var(--ink-1)] ${
          compact ? 'text-[14px]' : 'text-[16px]'
        }`}
      >
        {title}
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-3)]">{description}</p>

      <div className={`mt-3 grid gap-2 ${compact ? '' : 'sm:grid-cols-3'}`}>
        <label className="text-[11px] font-semibold text-[color:var(--ink-3)]">
          出生日期
          <input
            type="date"
            className="field mt-1"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>
        <label className="text-[11px] font-semibold text-[color:var(--ink-3)]">
          时辰（可后填）
          <select
            className="field mt-1"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          >
            <option value="unknown">暂不知时辰</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={String(i)}>
                {i} 时
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-[color:var(--ink-3)]">
          性别
          <select
            className="field mt-1"
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
          >
            <option value="unknown">不限</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !canGo}
          onClick={() => go('with_birth')}
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-slate-900 px-4 text-[13px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? '进入…' : '生成我的结构报告'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => go('empty')}
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-[13px] font-semibold text-[color:var(--ink-2)] hover:border-[color:var(--brand)]"
        >
          打开排盘页再填
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[color:var(--ink-4)]">
        免费结构版 · 不判断疾病寿命 · 生成后可绑定邮箱跨设备找回
      </p>
    </section>
  );
}
