interface Props {
  baziPillars: string;
}

// v5-D65 (2026-05-22) 拍平：内容直接展开，不再折叠
export default function DetailedFoldBlock({ baziPillars }: Props) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5">
      <h3 className="text-sm font-bold text-[color:var(--ink-2)]">
        详细命理依据
      </h3>
      <div className="mt-3 text-sm text-[color:var(--ink-2)] leading-6 space-y-2">
        <p>
          这个版本的报告优先展示「未来你会怎样」。
          完整的八字、五行、十神、神煞详情会在后续版本里补充到这里。
        </p>
        <p className="font-mono text-xs text-[color:var(--ink-3)]">
          你的八字：{baziPillars}
        </p>
      </div>
    </section>
  );
}
