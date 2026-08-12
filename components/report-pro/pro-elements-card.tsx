import type { ProElementGuide } from '@/lib/report-pro-view';
import ProTermTip from '@/components/report-pro/pro-term-tip';
import ReportErrorButton from '@/components/report/report-error-button';

export default function ProElementsCard({
  elements,
  reportId,
}: {
  elements: ProElementGuide;
  reportId?: string;
}) {
  const chain = elements.reasonChain || [];

  return (
    <section className="border-y border-[color:var(--hairline)] py-4" id="pro-elements">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">喜用与趋利避害</h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-5)]">
            先定
            <ProTermTip term="用神" />
            （扶抑主线），再看
            <ProTermTip term="喜神" />
            /
            调候，躲开
            <ProTermTip term="忌神" />
            {elements.strengthDesc ? (
              <span className="ml-1 text-[color:var(--ink-4)]">
                · {elements.strengthDesc}
                {elements.actionHint ? ` · ${elements.actionHint}` : ''}
              </span>
            ) : null}
          </p>
        </div>
        <ReportErrorButton
          compact
          reportId={reportId}
          category="yongshen_wrong"
          label="喜忌不准？"
          presetMessage={
            reportId
              ? `【喜忌报错】\n报告ID：${reportId}\n系统用神：${elements.yongShen.join('、') || '—'}\n系统忌神：${elements.jiShen.join('、') || '—'}\n强弱：${elements.strengthDesc || '—'}\n\n我认为：\n`
              : undefined
          }
        />
      </div>

      <p className="mt-3 text-[13px] leading-[1.65] text-[color:var(--ink-2)]">{elements.plainSummary}</p>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
        忌神是高压时别硬刚的提醒，不是诅咒。调候是季节调节，不替代主用神。
      </p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[color:var(--ink-2)]">
        {elements.yongShen.map((el) => (
          <span
            key={`y-${el}`}
            title="用神（扶抑主线）：对你最有帮助的方向"
            className="font-medium text-[color:var(--brand-strong)]"
          >
            用神 · {el}
          </span>
        ))}
        {elements.tiaohuoElement ? (
          <span
            key={`t-${elements.tiaohuoElement}`}
            title={elements.tiaohuoNote || '调候：季节调节，辅助而非主用'}
            className="text-[color:var(--ink-3)]"
          >
            调候 · {elements.tiaohuoElement}
          </span>
        ) : null}
        {elements.xiShen
          .filter((el) => el !== elements.tiaohuoElement)
          .map((el) => (
            <span key={`x-${el}`} title="喜神：辅助用神的有利因素">
              喜神 · {el}
            </span>
          ))}
        {elements.jiShen.map((el) => (
          <span key={`j-${el}`} title="忌神：容易消耗你的方向" className="text-[color:var(--ink-3)]">
            忌神 · {el}
          </span>
        ))}
        {!elements.yongShen.length && !elements.jiShen.length ? (
          <span className="text-[12px] text-[color:var(--ink-5)]">喜用信息不足，以下按结构建议行事</span>
        ) : null}
      </div>

      {chain.length > 0 ? (
        <div className="mt-3 rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken,#f5f7f2)]/50 px-3 py-2.5">
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">
            怎么判的（得令 → 得地得势 → 扶抑）
          </div>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4">
            {chain.map((line) => (
              <li key={line} className="text-[12px] leading-[1.55] text-[color:var(--ink-3)]">
                {line}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

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
