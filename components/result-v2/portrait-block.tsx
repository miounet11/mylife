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
    <section className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] p-5 md:p-6">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        你是这样的人
      </div>
      <h2 className="mt-2 text-xl md:text-2xl font-black leading-tight text-[color:var(--ink-1)]">
        {summary}
      </h2>
      <div className="mt-3 text-xs text-[color:var(--ink-3)] font-mono">
        八字：{baziPillars}
      </div>
    </section>
  );
}
