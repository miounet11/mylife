import Link from 'next/link';

export default function Custom500() {
  return (
    <main className="min-h-screen bg-[color:var(--bg)] px-4 py-20 text-[color:var(--ink)]">
      <section className="mx-auto max-w-xl rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-8">
        <p className="text-sm font-semibold text-[color:var(--ink-4)]">500</p>
        <h1 className="mt-3 text-3xl font-black">页面临时出错了</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--ink-4)]">
          系统正在恢复。请刷新页面，或返回首页重新进入。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-[color:var(--accent)] px-4 text-sm font-semibold text-white"
          >
            返回首页
          </Link>
        </div>
      </section>
    </main>
  );
}
