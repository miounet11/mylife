'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BellRing, Mail, RefreshCcw, Sparkles, Stars } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';

type MonthlyHighlight = {
  label: string;
  theme: string;
  status: 'push' | 'steady' | 'caution';
};

export default function ReportSubscriptionPanel({
  reportId,
  canManage,
  deliveryTierLabel,
  qualityScore,
  qualityGrade,
  targetAchieved,
  upgradeStatusLabel,
  monthlyHighlights,
}: {
  reportId: string;
  canManage: boolean;
  deliveryTierLabel: string;
  qualityScore?: number;
  qualityGrade?: 'S' | 'A' | 'B' | 'C';
  targetAchieved?: boolean;
  upgradeStatusLabel?: string;
  monthlyHighlights: MonthlyHighlight[];
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const benefits = [
    {
      title: '月度窗口更新',
      description: '每个月给你一版新的节律摘要，不需要反复重读同一份旧报告。',
      icon: Sparkles,
    },
    {
      title: '报告升级提醒',
      description: '当前报告继续增强成功后，第一时间知道，不必自己反复回来检查。',
      icon: RefreshCcw,
    },
    {
      title: '关键节点通知',
      description: '把真正值得注意的推进期、收缩期和风险点提前推到你面前。',
      icon: BellRing,
    },
    {
      title: '长期复盘闭环',
      description: '把每次判断和后续现实事件串起来，逐步形成更有价值的个人节律档案。',
      icon: Stars,
    },
    {
      title: '专项断事与推演',
      description: '后续可承接事件推演、断事、事件剖析和卦象增强，让高价值问题进入付费深度服务。',
      icon: Sparkles,
    },
  ];

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || loading) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      void trackClientEvent({
        eventName: 'result_cta_clicked',
        page: `/result/${reportId}`,
        meta: {
          reportId,
          target: 'report_subscription_submit',
          source: 'report_subscription_panel',
        },
      });

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'result_report',
          tags: ['monthly_report', 'report_upgrade', 'knowledge_updates'],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '订阅失败，请稍后重试');
        return;
      }

      setMessage('订阅已生效，后续月度更新和报告升级提醒会发送到你的邮箱。');
      setEmail('');
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="section-label">月度订阅与升级承接</div>
          <h2 className="mt-4 text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
            让这份报告持续生长，
            <span className="font-serif text-[color:var(--accent-strong)]">而不是一次看完就结束。</span>
          </h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
            当前这份结果是你此刻的阶段快照。真正的长期价值，在于后续每个月的窗口变化、报告升级状态、关键节点提醒和复盘记录。
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              当前交付：{deliveryTierLabel}
            </span>
            <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              质量 {qualityScore || '--'} / {qualityGrade || 'B'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              targetAchieved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
            }`}>
              {targetAchieved ? '已达到专家版门槛' : (upgradeStatusLabel || '继续增强中')}
            </span>
          </div>

          {monthlyHighlights.length > 0 ? (
            <div className="mt-5 rounded-[1.5rem] bg-white/80 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">接下来值得关注</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {monthlyHighlights.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="mt-1 text-xs leading-6 text-[color:var(--accent-strong)]">{item.theme}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                      {item.status === 'push' ? '适合推进' : item.status === 'steady' ? '适合稳步布局' : '适合谨慎收缩'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.4rem] bg-white/82 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="soft-card rounded-[1.75rem] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">立即建立长期关系</div>
          <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">
            {canManage ? '订阅你的月度更新与升级提醒' : '订阅站点更新并了解更多节律内容'}
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
            {canManage
              ? '如果你希望这份报告后续继续产生价值，最重要的不是重复刷新页面，而是让系统在月度变化、升级完成和关键窗口出现时主动通知你。'
              : '你正在查看公开结果页。真正更有价值的是建立自己的节律档案，同时接收持续更新。'}
          </p>

          <form onSubmit={handleSubscribe} className="mt-5">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="输入邮箱接收月度更新"
                className="w-full rounded-full border border-[color:var(--line)] bg-white py-3 pl-11 pr-4 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? '提交中...' : '开启月度更新'}
            </button>
          </form>

          {message ? <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {error ? <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          <div className="mt-5 grid gap-3">
            <Link
              href={canManage ? `/chat?reportId=${encodeURIComponent(reportId)}` : '/analyze'}
              onClick={() => {
                void trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page: `/result/${reportId}`,
                  meta: {
                    reportId,
                    target: canManage ? 'chat' : 'analyze',
                    source: 'report_subscription_panel',
                  },
                });
              }}
              className="inline-flex items-center justify-between rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
            >
              {canManage ? '继续深问这份报告' : '生成我的专属报告'}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/updates"
              onClick={() => {
                void trackClientEvent({
                  eventName: 'result_cta_clicked',
                  page: `/result/${reportId}`,
                  meta: {
                    reportId,
                    target: 'updates',
                    source: 'report_subscription_panel',
                  },
                });
              }}
              className="inline-flex items-center justify-between rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
            >
              管理订阅与邮件更新
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
