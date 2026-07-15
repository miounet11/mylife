import Link from 'next/link';
import { BadgeCheck, BookOpenCheck, MailCheck, MessageCircleReply, Shield } from 'lucide-react';

export default function EmailTrustPanel({
  email,
  compact = false,
}: {
  email?: string;
  compact?: boolean;
}) {
  const messagesHref = email
    ? `/updates/messages?email=${encodeURIComponent(email)}`
    : '/updates/messages';

  const items = [
    {
      icon: Shield,
      title: '确定性引擎 + 专业表达',
      text: '运势判断来自确定性命理引擎，邮件文案由专业表达层整理，避免空泛迷信话术。',
    },
    {
      icon: MailCheck,
      title: '发送记录可回看',
      text: '你收到的每封提醒都会在站内归档，随时查看主题、摘要与发送时间。',
    },
    {
      icon: MessageCircleReply,
      title: '支持追问与回复',
      text: '对任何一封邮件继续追问，系统会结合你的报告上下文生成专业回复，并同步发回邮箱。',
    },
    {
      icon: BookOpenCheck,
      title: '订阅完全可控',
      text: '日常提醒、月度窗口、报告更新等都可逐项开关，最多选 3 项重点关注。',
    },
  ];

  if (compact) {
    return (
      <div className="rounded-[var(--radius)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-strong)]">
            <BadgeCheck className="h-4 w-4" />
            专业可追溯的邮件服务
          </div>
          <Link href={messagesHref} className="text-xs font-semibold text-[color:var(--brand-strong)] hover:underline">
            查看我的邮件记录 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-card overflow-hidden">
      <div className="border-b border-[color:var(--fb-border)] bg-white px-4 py-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
          <BadgeCheck className="h-3.5 w-3.5" />
          专业可信
        </div>
        <h2 className="mt-1.5 text-[18px] font-bold text-[color:var(--fb-ink-1)]">
          我们如何把专业判断送到你的邮箱
        </h2>
        <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-[color:var(--fb-ink-2)]">
          人生K线的邮件不是单向群发。你会看到完整发送记录，也可以对任何提醒继续追问，获得基于报告上下文的专业回复。
        </p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-1)]">
                <Icon className="h-4 w-4 text-[color:var(--brand-strong)]" />
                {item.title}
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">{item.text}</p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-[color:var(--fb-border)] px-4 py-3">
        <Link href={messagesHref} className="fb-btn fb-btn-primary inline-flex h-9 items-center px-4 text-[13px]">
          进入邮件中心
        </Link>
        <Link href="/updates#my-updates-center" className="fb-btn inline-flex h-9 items-center px-4 text-[13px]">
          管理订阅设置
        </Link>
      </div>
    </div>
  );
}