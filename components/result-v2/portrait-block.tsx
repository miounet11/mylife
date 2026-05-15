interface Props {
  baziPillars: string;
  pattern?: string;
}

export default function PortraitBlock({ baziPillars, pattern }: Props) {
  // B1 直接命理依据，B2 LLM 重写为人话
  const summary = pattern
    ? `${pattern}结构：你不是靠拼命赢的人，你的发力靠节奏和复利。`
    : '你的命局有清晰的结构，发力点不在硬扛，在节奏。';

  return (
    <section className="h-full rounded-[var(--radius-md)] border border-white/60 bg-white/75 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="inline-flex rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        你是这样的人
      </div>
      <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[color:var(--ink-1)] md:text-3xl">
        {summary}
      </h2>
      <div className="mt-4 inline-flex max-w-full rounded-full border border-[color:var(--line)] bg-[color:var(--paper)] px-3 py-1.5 text-xs text-[color:var(--ink-3)] font-mono">
        八字：{baziPillars}
      </div>
    </section>
  );
}
