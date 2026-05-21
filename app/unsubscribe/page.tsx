import { NextRequest, NextResponse } from 'next/server';
import { emailSubscriptionOperations } from '@/lib/database';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { email } = await searchParams;

  if (!email) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="fb-card w-full max-w-md p-6 text-center">
          <h1 className="mb-2 text-[20px] font-bold text-[color:var(--fb-ink-1)]">无效的退订链接</h1>
          <p className="text-[13px] text-[color:var(--fb-ink-3)]">链接缺少 email 参数。</p>
          <a href="/" className="mt-4 inline-block text-[13px] text-[color:var(--fb-blue-link)] hover:underline">
            返回首页
          </a>
        </div>
      </main>
    );
  }

  // 简单退订（无 token 校验，因为我们的承诺是"随时可退订，无门槛"）
  let success = false;
  let message = '';
  try {
    emailSubscriptionOperations.upsert(email, 'unsubscribe', []);
    // 实际改成 status='unsubscribed'
    const { db } = await import('@/lib/database');
    db.prepare(`UPDATE email_subscriptions SET status='unsubscribed', updated_at=datetime('now') WHERE email=?`)
      .run(email.toLowerCase().trim());
    success = true;
    message = `已为 ${email} 退订所有提醒邮件。`;
  } catch (err) {
    message = `退订失败：${err instanceof Error ? err.message : '未知错误'}`;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="fb-card w-full max-w-md p-6 text-center">
        <h1 className="mb-2 text-[20px] font-bold text-[color:var(--fb-ink-1)]">
          {success ? '已退订' : '退订失败'}
        </h1>
        <p className="text-[14px] leading-[1.5] text-[color:var(--fb-ink-2)]">{message}</p>
        {success && (
          <p className="mt-3 text-[12px] text-[color:var(--fb-ink-3)]">
            未来如果想再次收到提醒，可以在结果页底部重新订阅。
          </p>
        )}
        <a
          href="/"
          className="mt-4 inline-flex h-7 items-center rounded-[2px] border border-[color:var(--fb-border-strong)] bg-[#f5f6f7] px-3 text-[13px] font-bold text-[color:var(--fb-ink-1)] no-underline hover:bg-[#ebedf0] hover:no-underline"
        >
          返回首页
        </a>
      </div>
    </main>
  );
}
