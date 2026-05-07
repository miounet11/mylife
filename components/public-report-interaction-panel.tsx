'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Copy,
  Share2,
  Sparkles,
  Users,
  WandSparkles,
} from 'lucide-react';

const DEFAULT_SITE_ORIGIN = 'https://www.life-kline.com';

type PublicReportInteractionPanelProps = {
  reportId: string;
  publicName: string;
  canManage: boolean;
  isPublic: boolean;
  reportChatHref: string;
  toolHref?: string;
};

function getPublicReportUrl(reportId: string) {
  if (typeof window === 'undefined') {
    return `${DEFAULT_SITE_ORIGIN}/result/${reportId}`;
  }

  const origin = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? DEFAULT_SITE_ORIGIN
    : window.location.origin;

  return `${origin}/result/${reportId}`;
}

export default function PublicReportInteractionPanel({
  reportId,
  publicName,
  canManage,
  isPublic,
  reportChatHref,
  toolHref = '/tools',
}: PublicReportInteractionPanelProps) {
  const [message, setMessage] = useState('');
  const reportUrl = useMemo(() => getPublicReportUrl(reportId), [reportId]);
  const shareTitle = `${publicName}的结构判断报告`;
  const viewerModeText = canManage
    ? isPublic
      ? '这是别人看到公开报告时的互动入口。'
      : '先在下方分享卡片打开公开开关，别人才能访问这份报告。'
    : '你正在查看一份公开报告，只能看到脱敏后的结构判断。';

  const showMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(''), 2200);
  };

  const handleCopy = async () => {
    if (!isPublic) {
      showMessage('这份报告当前未公开');
      return;
    }

    try {
      await navigator.clipboard.writeText(reportUrl);
      showMessage('已复制公开链接');
    } catch {
      showMessage('复制失败，请手动复制地址栏链接');
    }
  };

  const handleShare = async () => {
    if (!isPublic) {
      showMessage('这份报告当前未公开');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareTitle}，可以继续追问、跑工具或生成自己的报告。`,
          url: reportUrl,
        });
        showMessage('已打开系统分享');
        return;
      } catch {
        // fallback to copy
      }
    }

    await handleCopy();
  };

  const actions = [
    {
      key: 'ask',
      title: '围绕这份报告追问',
      description: '把公开结论带到追问页，继续问为什么、先做什么、要防什么。',
      href: reportChatHref,
      label: '继续追问',
      icon: Bot,
      emphasis: 'primary' as const,
    },
    {
      key: 'own',
      title: '生成我自己的判断',
      description: '公开报告只能参考，真正要判断自己，必须回到你的出生信息和阶段。',
      href: '/analyze?source=public_report_interaction',
      label: '开始我的报告',
      icon: Sparkles,
      emphasis: 'primary' as const,
    },
    {
      key: 'tool',
      title: '按问题线继续拆',
      description: '从事业、财富、关系、健康、迁移等问题线里选一个工具继续验证。',
      href: toolHref,
      label: '打开推荐工具',
      icon: WandSparkles,
    },
    {
      key: 'method',
      title: '看方法和案例',
      description: '先理解报告怎么读，再看类似场景如何把结构转成现实动作。',
      href: '/cases',
      label: '查看公开案例',
      icon: Users,
    },
  ];

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Share2 className="h-3 w-3" />
            公开互动动作
          </div>
          <h2 className="mt-2 text-xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-2xl">
            这份公开报告，<br />
            <span className="text-[color:var(--brand-strong)]">不是只能被围观</span>
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-3)]">
            {viewerModeText} 下一步要么继续追问，要么生成自己的报告，要么进入专项工具验证。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
            >
              <Share2 className="h-4 w-4" />
              分享公开页
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            >
              <Copy className="h-4 w-4" />
              复制链接
            </button>
          </div>

          {message ? (
            <div className="mt-3 inline-flex h-7 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2.5 text-[10px] font-bold text-[color:var(--brand-strong)]">
              {message}
            </div>
          ) : null}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isPrimary = action.emphasis === 'primary';
            return (
              <Link
                key={action.key}
                href={action.href}
                className={`group block rounded-[var(--radius)] border p-4 transition hover:-translate-y-px ${
                  isPrimary
                    ? 'border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] hover:border-[color:var(--brand)]'
                    : 'border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] ${
                      isPrimary
                        ? 'border border-[color:var(--brand)] bg-[color:var(--paper)] text-[color:var(--brand-strong)]'
                        : 'border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 text-[color:var(--ink-5)] transition-all group-hover:translate-x-0.5 group-hover:text-[color:var(--brand-strong)]" />
                </div>
                <h3 className="mt-3 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                  {action.title}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
                  {action.description}
                </p>
                <div className="mt-3 text-xs font-bold text-[color:var(--brand-strong)]">
                  {action.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
