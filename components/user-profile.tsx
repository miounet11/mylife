'use client';

export default function UserProfile({
  user,
  fortunes = [],
  eventCount = 0,
}: {
  user?: Record<string, unknown> | null;
  fortunes?: Record<string, unknown>[];
  eventCount?: number;
}) {
  if (!user) return null;

  const displayName = String(user.name || user.email || '用户');
  const latest = fortunes[0] as Record<string, unknown> | undefined;

  return (
    <section className="fb-card p-4 md:p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-4)]">
        个人资料
      </div>
      <h2 className="mt-1 text-lg font-bold text-[color:var(--ink-1)]">{displayName}</h2>
      <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
        {fortunes.length} 份报告 · {eventCount} 个关键事件
      </p>

      {latest ? (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
          <div className="text-[11px] font-semibold text-[color:var(--ink-4)]">最近报告</div>
          <div className="mt-1 text-[13px] font-bold text-[color:var(--ink-2)]">
            {(latest.pattern as { type?: string } | undefined)?.type || '结构判断报告'}
          </div>
          {latest.createdAt ? (
            <div className="mt-1 text-[11px] text-[color:var(--ink-4)]">
              {String(latest.createdAt).slice(0, 10)}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}