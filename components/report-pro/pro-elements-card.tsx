import type { ProElementGuide } from '@/lib/report-pro-view';
import ProTermTip from '@/components/report-pro/pro-term-tip';

export default function ProElementsCard({ elements }: { elements: ProElementGuide }) {
  return (
    <section className="border-y border-[color:var(--hairline)] py-4">
      <div>
        <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">喜用与趋利避害</h2>
        <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
          顺着
          <ProTermTip term="用神" />
          /
          <ProTermTip term="喜神" />
          ，躲开
          <ProTermTip term="忌神" />
        </p>
      </div>

      <p className="mt-3 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">{elements.plainSummary}</p>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
        忌神是高压时别硬刚的提醒，不是诅咒。
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[color:var(--ink-2)]">
        {elements.yongShen.map((el) => (
          <span key={`y-${el}`} title="用神：对你最有帮助的方向">
            用神 · {el}
          </span>
        ))}
        {elements.xiShen.map((el) => (
          <span key={`x-${el}`} title="喜神：辅助用神的有利因素">
            喜神 · {el}
          </span>
        ))}
        {elements.jiShen.map((el) => (
          <span key={`j-${el}`} title="忌神：容易消耗你的方向">
            忌神 · {el}
          </span>
        ))}
        {!elements.yongShen.length && !elements.jiShen.length ? (
          <span className="text-[12px] text-[color:var(--ink-5)]">喜用信息不足，以下按结构建议行事</span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-0 border-t border-[color:var(--hairline)] md:grid-cols-2">
        <div className="border-b border-[color:var(--hairline)] py-3 md:border-b-0 md:border-r md:pr-4">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">趋利 · 可以多做</div>
          <ul className="mt-2 space-y-1">
            {elements.doList.map((item) => (
              <li key={item} className="text-[12px] leading-[1.55] text-[color:var(--ink-2)]">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="py-3 md:pl-4">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">避害 · 尽量少做</div>
          <ul className="mt-2 space-y-1">
            {elements.avoidList.map((item) => (
              <li key={item} className="text-[12px] leading-[1.55] text-[color:var(--ink-2)]">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
