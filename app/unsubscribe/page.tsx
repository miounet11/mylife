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
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">无效的退订链接</h1>
          <p className="text-sm text-[color:var(--ink-3)]">链接缺少 email 参数。</p>
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
    <main className="min-h-screen flex items-center justify-center px-6 bg-[color:var(--bg)]">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-[color:var(--ink-1)]">
          {success ? '已退订' : '退订失败'}
        </h1>
        <p className="text-sm text-[color:var(--ink-2)] leading-7">{message}</p>
        {success && (
          <p className="mt-4 text-xs text-[color:var(--ink-3)]">
            未来如果想再次收到提醒，可以在结果页底部重新订阅。
          </p>
        )}
      </div>
    </main>
  );
}
