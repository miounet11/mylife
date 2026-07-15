import { BAZI_RULE_GLOSSARY } from '@/lib/bazi-rule-glossary';

/** 不必翻书 · 规则速查 */
export default function ExpertRuleGlossary() {
  return (
    <section
      id="ex-glossary"
      className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4"
    >
      <h2 className="text-[14px] font-bold text-[#0f172a]">规则速查 · 不必翻书</h2>
      <p className="mt-0.5 text-[11px] text-[#64748b]">
        悬停/展开看短释义；推演仍以本页引擎字段为准
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BAZI_RULE_GLOSSARY.map((item) => (
          <details
            key={item.term}
            className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2"
          >
            <summary className="cursor-pointer list-none text-[12px] font-bold text-[#0f172a]">
              {item.term}
              <span className="ml-1.5 font-normal text-[#64748b]">{item.short}</span>
            </summary>
            <p className="mt-1.5 text-[11px] leading-[1.55] text-[#475569]">{item.detail}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
