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
      emphasis: 'primary',
    },
    {
      key: 'own',
      title: '生成我自己的判断',
      description: '公开报告只能参考，真正要判断自己，必须回到你的出生信息和阶段。',
      href: '/analyze?source=public_report_interaction',
      label: '开始我的报告',
      icon: Sparkles,
      emphasis: 'primary',
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
    <section className="glass-panel rounded-[2rem] p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <div className="section-label">
            <Share2 className="h-3.5 w-3.5" />
            公开互动动作
          </div>
          <h2 className="mt-4 text-2xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
            这份公开报告，
            <span className="text-[color:var(--accent-strong)]">不是只能被围观。</span>
          </h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
            {viewerModeText} 下一步要么继续追问这份判断，要么生成自己的报告，要么进入专项工具验证。
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="action-primary min-h-0 px-4 py-2 text-sm"
            >
              <Share2 className="h-4 w-4" />
              分享公开页
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="action-secondary min-h-0 px-4 py-2 text-sm"
            >
              <Copy className="h-4 w-4" />
              复制链接
            </button>
          </div>

          {message ? (
            <div className="mt-3 rounded-full bg-white/84 px-4 py-2 text-xs font-semibold text-[color:var(--accent-strong)]">
              {message}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.key}
                href={action.href}
                className={`rounded-[1.35rem] border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
                  action.emphasis === 'primary'
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                    : 'border-[color:var(--line)] bg-white/82'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[color:var(--accent-strong)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="mt-2 h-4 w-4 text-[color:var(--muted)]" />
                </div>
                <h3 className="mt-4 text-base font-black text-[color:var(--ink)]">{action.title}</h3>
                <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{action.description}</p>
                <div className="mt-4 text-sm font-bold text-[color:var(--accent-strong)]">{action.label}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
