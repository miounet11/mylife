export default function Loading() {
  return (
    <div className="page-shell flex items-center justify-center px-4">
      <div className="glass-panel w-full max-w-xl rounded-[2rem] p-8 text-center md:p-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--accent-soft)]">
          <div className="h-14 w-14 rounded-full border-4 border-[rgba(15,118,110,0.18)] border-t-[color:var(--accent-strong)] animate-spin" />
        </div>
        <h2 className="mt-6 text-2xl font-black text-[color:var(--ink)]">正在为你整理页面</h2>
        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
          我们保留统一的加载反馈，避免用户在页面切换时误判为卡住或白屏。
        </p>
      </div>
    </div>
  );
}
