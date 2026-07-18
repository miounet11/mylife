import type { ExpertDeskView, ExpertPillarRow } from '@/lib/report-expert-view';
import type { FortuneAnalysisResult } from '@/lib/user-types';
import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import ExpertLiunianProbe from '@/components/report-expert/expert-liunian-probe';
import ExpertPrintBar from '@/components/report-expert/expert-print-bar';
import ExpertPrintSheetView from '@/components/report-expert/expert-print-sheet';
import ExpertEnrichment from '@/components/report-expert/expert-enrichment';
import ExpertClientPackPanel from '@/components/report-expert/expert-client-pack';
import ExpertCrmPanel from '@/components/report-expert/expert-crm-panel';
import ExpertHandoffBar from '@/components/report-expert/expert-handoff-bar';
import ExpertRuleGlossary from '@/components/report-expert/expert-rule-glossary';
import ExpertDayunYearGrid from '@/components/report-expert/expert-dayun-year-grid';
import KnowledgeBaseStamp from '@/components/knowledge-base-stamp';
import { ReportIllustrationCite } from '@/components/report/report-illustration-cite';
import ProAnalyticsBeacon from '@/components/report-pro/pro-analytics-beacon';
import { buildExpertClientPack } from '@/lib/report-expert-client-pack';
import { buildExpertPrintSheet } from '@/lib/expert-print-sheet';
import { buildDayunYearGrid } from '@/lib/dayun-year-grid';

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => <div className="h-56 animate-pulse rounded bg-[#e2e8f0]" />,
});

/**
 * 专业命盘工作台：排盘 · 长生空亡 · 大运流年岁运 · 点盘 · 真太阳时 · 对客话术 · 排盘纸
 * 终局：从业者不必翻书，商业开业与对客解释在站内完成。
 */
export default function ExpertDesk({
  desk,
  klineData,
  reportId,
}: {
  desk: ExpertDeskView;
  klineData?: FortuneAnalysisResult['klineData'] | null;
  reportId?: string;
}) {
  const clientPack = buildExpertClientPack(desk);
  const printSheet = buildExpertPrintSheet(desk);
  const dayunYearBlocks = buildDayunYearGrid({
    dayunRows: desk.dayun.rows,
    dayMaster: desk.dayMasterForTools || desk.dayMaster,
    dayPillarGanZhi: desk.dayPillarGanZhi,
    yongShen: desk.yongJi.yongShen,
    jiShen: desk.yongJi.jiShen,
    steps: 2,
  });

  return (
    <div id="expert-desk" className="expert-print-root space-y-4 md:space-y-5">
      {reportId ? <ProAnalyticsBeacon reportId={reportId} surface="expert" /> : null}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .expert-print-root, .expert-print-root * { visibility: visible !important; }
          .expert-print-root { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          a { text-decoration: none !important; color: inherit !important; }
          .expert-print-sheet { break-after: page; page-break-after: always; }
        }
      `}</style>

      {/* 维度目录 */}
      <nav className="no-print border-y border-[color:var(--hairline)] py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-[12px] font-medium text-[color:var(--ink-5)]">专业工具 · 工作台</div>
          <KnowledgeBaseStamp />
        </div>
        <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
          排盘 · 大运流年 · 对客话术 · 交付
        </p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
          {desk.dimensions.map((d) => (
            <a
              key={d.key}
              href={`#ex-${d.key}`}
              className="text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              title={d.description}
            >
              {d.short}
            </a>
          ))}
          <a href="#ex-client-pack" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            话术
          </a>
          <a href="#ex-dayun-years" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            逐年
          </a>
          <a href="#ex-handoff" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            交付
          </a>
          <a href="#ex-crm" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            CRM
          </a>
          <a href="#ex-print-sheet" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            排盘纸
          </a>
          <a href="#ex-glossary" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            速查
          </a>
          <a href="/hehun" className="text-[color:var(--ink-2)] underline-offset-2 hover:underline">
            合婚
          </a>
        </div>
      </nav>

      <div className="no-print space-y-3">
        <ReportIllustrationCite keys={['structure', 'cover']} title="四柱结构（教学）" limit={1} />
      </div>

      {/* 输入 + 真太阳时 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section id="ex-input" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>① 出生输入</SectionTitle>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <Row label="姓名/标识" value={desk.input.name} />
            <Row label="性别" value={desk.input.gender} />
            <Row label="公历日期" value={desk.input.birthDate} mono />
            <Row label="钟表时间" value={desk.input.birthTime} mono />
            <Row label="出生地" value={desk.input.birthPlace} />
            <Row label="时区" value={`UTC+${desk.input.timezone}`} mono />
          </dl>
        </section>

        <section id="ex-solar" className="scroll-mt-header rounded-[10px] border border-[color:var(--hairline)] bg-white p-4">
          <SectionTitle>② 真太阳时</SectionTitle>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <Row label="估算经度" value={desk.solar.longitude != null ? `${desk.solar.longitude.toFixed(2)}°E` : '—'} mono />
            <Row label="置信" value={desk.solar.locationConfidence} />
            <Row label="经度时差" value={fmtMin(desk.solar.longitudeOffset)} mono />
            <Row label="均时差" value={fmtMin(desk.solar.equationOfTime)} mono />
            <Row label="总修正" value={fmtMin(desk.solar.totalCorrection)} mono />
            <Row label="真太阳时" value={desk.solar.trueSolarText} mono emphasize />
          </dl>
          <p className="mt-2 text-[11px] leading-5 text-[color:var(--ink-5)]">
            {desk.solar.locationNote}
            {desk.solar.usedEstimate ? ' · 经度为城市中心估算，精确排盘请核实地级/县级经度。' : ''}
          </p>
        </section>
      </div>

      {/* 四柱排盘主盘 */}
      <section id="ex-chart" className="scroll-mt-header rounded-[10px] border border-[#0f172a] bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionTitle>③ 四柱专业排盘</SectionTitle>
          <div className="text-[13px] font-bold text-[#0f172a]">
            日主 <span className="font-serif text-[22px] text-[color:var(--ink-1)]">{desk.dayMaster}</span>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-center text-[13px]">
            <thead>
              <tr className="bg-[#0f172a] text-white">
                <th className="px-2 py-2 font-semibold">项目</th>
                {desk.pillars.map((p) => (
                  <th key={p.label} className="px-2 py-2 font-semibold">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">天干</td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-g`} className="px-2 py-3 font-serif text-[28px] font-black text-[#0f172a]">
                    {p.gan || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">天干十神</td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-ss`} className="px-2 py-2 text-[12px] font-medium text-[color:var(--ink-2)]">
                    {p.label === '日柱' ? '日主' : p.ganShiShen || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">地支</td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-z`} className="px-2 py-3 font-serif text-[28px] font-black text-[#0f172a]">
                    {p.zhi || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">藏干</td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-h`} className="px-2 py-2 text-[12px] text-[#334155]">
                    {p.hiddenStems.join(' ') || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">纳音</td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-n`} className="px-2 py-2 text-[12px] text-[#334155]">
                    {p.nayin}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">主五行</td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-e`} className="px-2 py-2 font-semibold text-[#0f172a]">
                    {p.mainElement}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">
                  十二长生
                  <div className="text-[10px] font-normal text-[#94a3b8]">日主临支</div>
                </td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-cs`} className="px-2 py-2 font-semibold text-[color:var(--ink-2)]">
                    {p.changSheng || '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#e2e8f0]">
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">空亡</td>
                {desk.pillars.map((p) => (
                  <td
                    key={`${p.label}-kw`}
                    className={`px-2 py-2 text-[12px] font-bold ${p.isKongWang ? 'text-[#b91c1c]' : 'text-[#94a3b8]'}`}
                  >
                    {p.isKongWang ? '空' : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="bg-[#f8fafc] px-2 py-2 text-left font-semibold text-[#64748b]">刑冲合害</td>
                {desk.pillars.map((p) => (
                  <td key={`${p.label}-r`} className="px-2 py-2 text-[11px] leading-5 text-[#475569]">
                    <RelationCell pillar={p} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 长生总览 + 空亡 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section id="ex-changsheng" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>④ 十二长生（日主 {desk.dayMaster}）</SectionTitle>
          <p className="mt-1 text-[11px] text-[#64748b]">阳干顺行、阴干逆行；下表为日主临各地支状态。</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {desk.pillars.map((p) => (
              <div
                key={`cs-${p.label}`}
                className="min-w-[88px] rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2 text-center"
              >
                <div className="text-[10px] text-[#94a3b8]">{p.label}</div>
                <div className="font-serif text-[14px] font-bold">{p.ganZhi}</div>
                <div className="mt-0.5 text-[12px] font-semibold text-[color:var(--ink-2)]">{p.changSheng}</div>
              </div>
            ))}
            {desk.dayun.current ? (
              <div className="min-w-[88px] rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-2.5 py-2 text-center">
                <div className="text-[10px] text-[#b45309]">现行大运</div>
                <div className="font-serif text-[14px] font-bold">{desk.dayun.current.ganZhi}</div>
                <div className="mt-0.5 text-[12px] font-semibold text-[#b45309]">
                  {desk.dayun.current.changSheng}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="ex-kongwang" className="scroll-mt-header rounded-[10px] border border-[#fecaca] bg-[#fff7f7] p-4">
          <SectionTitle>⑤ 空亡（日旬）</SectionTitle>
          <p className="mt-1 text-[11px] text-[#9a3412]">
            以日柱 <strong>{desk.dayPillarGanZhi || '—'}</strong> 定旬空亡
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-[#7f1d1d]">空亡地支：</span>
            {desk.kongWang.length ? (
              desk.kongWang.map((z) => (
                <span
                  key={z}
                  className="rounded-full bg-[#fee2e2] px-3 py-1 font-serif text-[16px] font-black text-[#b91c1c]"
                >
                  {z}
                </span>
              ))
            ) : (
              <span className="text-[12px] text-[#94a3b8]">未能推演（缺日柱）</span>
            )}
          </div>
          <ul className="mt-3 space-y-1 text-[12px] text-[#9a3412]">
            {desk.pillars
              .filter((p) => p.isKongWang)
              .map((p) => (
                <li key={`kw-note-${p.label}`}>
                  · {p.label} {p.ganZhi} 地支落空
                </li>
              ))}
            {desk.dayun.current?.isKongWang ? (
              <li>· 现行大运 {desk.dayun.current.ganZhi} 地支落空</li>
            ) : null}
            {!desk.pillars.some((p) => p.isKongWang) && !desk.dayun.current?.isKongWang ? (
              <li>· 四柱与现行大运地支均未落本日空亡</li>
            ) : null}
          </ul>
        </section>
      </div>

      {/* 五行 · 十神 · 格局 · 用忌 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section id="ex-elements" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>⑥ 五行强弱</SectionTitle>
          <div className="mt-3 space-y-2">
            {desk.fiveElements.map((el) => (
              <div key={el.key}>
                <div className="flex justify-between text-[12px]">
                  <span className="font-bold text-[#0f172a]">
                    {el.label}
                    <span className="ml-1 font-normal text-[#64748b]">({el.quality})</span>
                  </span>
                  <span className="font-mono tabular-nums">{el.strength.toFixed(1)}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
                  <div
                    className="h-full rounded-full bg-[#0f172a]"
                    style={{ width: `${Math.min(100, Math.max(2, el.strength))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="ex-tenGods" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>⑦ 十神配置</SectionTitle>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <Row label="比劫/自身" value={desk.tenGods.self} />
            <Row label="我生（食伤）" value={desk.tenGods.output.join('、') || '—'} />
            <Row label="生我（印）" value={desk.tenGods.input.join('、') || '—'} />
            <Row label="我克（财）" value={desk.tenGods.control.join('、') || '—'} />
            <Row label="克我（官杀）" value={desk.tenGods.controlled.join('、') || '—'} />
          </dl>
        </section>

        <section id="ex-pattern" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>⑧ 格局</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
            <Chip>{desk.pattern.type}</Chip>
            <Chip muted>强弱 {desk.pattern.strength}</Chip>
            <Chip muted>质量 {desk.pattern.quality}</Chip>
          </div>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#334155]">{desk.pattern.description || '—'}</p>
        </section>

        <section id="ex-yongJi" className="scroll-mt-header space-y-3 rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <div className="no-print">
            <ReportIllustrationCite keys={['yongshen']} title="用神示意（教学）" limit={1} />
          </div>
          <SectionTitle>⑨ 用神喜忌</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {desk.yongJi.yongShen.map((e) => (
              <span key={`y-${e}`} className="rounded-full bg-[#d1fae5] px-2.5 py-1 text-[12px] font-bold text-[#047857]">
                用 {e}
              </span>
            ))}
            {desk.yongJi.xiShen.map((e) => (
              <span key={`x-${e}`} className="rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[12px] font-semibold text-[#059669]">
                喜 {e}
              </span>
            ))}
            {desk.yongJi.jiShen.map((e) => (
              <span key={`j-${e}`} className="rounded-full bg-[#fee2e2] px-2.5 py-1 text-[12px] font-bold text-[#b91c1c]">
                忌 {e}
              </span>
            ))}
            {!desk.yongJi.yongShen.length && !desk.yongJi.jiShen.length ? (
              <span className="text-[12px] text-[#64748b]">用忌未落库，请据格局自行点用</span>
            ) : null}
          </div>
        </section>
      </div>

      {/* 大运 */}
      <section id="ex-dayun" className="scroll-mt-header space-y-3 rounded-[10px] border border-[#0f172a] bg-white p-4 md:p-5">
        <div className="no-print">
          <ReportIllustrationCite keys={['dayun', 'timing']} title="大运窗口（教学）" limit={1} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionTitle>⑩ 大运表 · 运局</SectionTitle>
          <div className="text-[12px] text-[#64748b]">
            起运约 {desk.dayun.startAge || '—'} 岁
            {desk.dayun.currentYearInDayun
              ? ` · 当前大运第 ${desk.dayun.currentYearInDayun} 年`
              : ''}
            {desk.dayun.current ? ` · 现行 ${desk.dayun.current.ganZhi}` : ''}
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-left text-[#64748b]">
                <th className="px-2 py-2">步</th>
                <th className="px-2 py-2">干支</th>
                <th className="px-2 py-2">年龄</th>
                <th className="px-2 py-2">公历</th>
                <th className="px-2 py-2">干/支</th>
                <th className="px-2 py-2">长生</th>
                <th className="px-2 py-2">空</th>
                <th className="px-2 py-2">用神</th>
                <th className="px-2 py-2">评级</th>
                <th className="px-2 py-2">备注</th>
              </tr>
            </thead>
            <tbody>
              {desk.dayun.rows.map((d) => (
                <tr
                  key={`${d.ganZhi}-${d.startAge}`}
                  className={`border-b border-[#f1f5f9] ${d.isCurrent ? 'bg-[#fef3c7]' : ''}`}
                >
                  <td className="px-2 py-2 font-mono">{d.index + 1}</td>
                  <td className="px-2 py-2 font-serif text-[16px] font-bold">
                    {d.ganZhi}
                    {d.isCurrent ? (
                      <span className="ml-1 text-[10px] font-bold text-[#b45309]">现行</span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2">
                    {d.startAge}–{d.endAge}
                  </td>
                  <td className="px-2 py-2 font-mono text-[11px]">
                    {d.startYear}–{d.endYear}
                  </td>
                  <td className="px-2 py-2">
                    {d.ganWuxing}/{d.zhiWuxing}
                  </td>
                  <td className="px-2 py-2 text-[color:var(--ink-2)]">{d.changSheng || '—'}</td>
                  <td className={`px-2 py-2 font-bold ${d.isKongWang ? 'text-[#b91c1c]' : 'text-[#cbd5e1]'}`}>
                    {d.isKongWang ? '空' : '—'}
                  </td>
                  <td className="px-2 py-2">{matchLabel(d.yongShenMatch)}</td>
                  <td className="px-2 py-2">{qualityLabel(d.quality)}</td>
                  <td className="max-w-[140px] truncate px-2 py-2 text-[#64748b]" title={d.description}>
                    {d.description || '—'}
                  </td>
                </tr>
              ))}
              {!desk.dayun.rows.length ? (
                <tr>
                  <td colSpan={10} className="px-2 py-6 text-center text-[#94a3b8]">
                    大运数据未落库
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* 大运 × 逐年网格 */}
      {dayunYearBlocks.length ? (
        <ExpertDayunYearGrid blocks={dayunYearBlocks} reportId={reportId} />
      ) : null}

      {/* 流月表 */}
      {desk.liuyue?.length ? (
        <section id="ex-liuyue" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>流月表 · 近 12 月</SectionTitle>
          <p className="mt-1 text-[11px] text-[#64748b]">近似月柱干支（节气精细交运可后续加强）· 长生/空亡速查</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-center text-[11px]">
              <thead>
                <tr className="border-b bg-[#f8fafc] text-[#64748b]">
                  <th className="px-2 py-1.5">月</th>
                  <th className="px-2 py-1.5">干支</th>
                  <th className="px-2 py-1.5">长生</th>
                  <th className="px-2 py-1.5">空亡</th>
                </tr>
              </thead>
              <tbody>
                {desk.liuyue.map((m) => (
                  <tr key={m.label} className="border-b border-[#f1f5f9]">
                    <td className="px-2 py-1.5 font-mono">{m.label}</td>
                    <td className="px-2 py-1.5 font-serif font-bold">{m.ganZhi}</td>
                    <td className="px-2 py-1.5 text-[color:var(--ink-2)]">{m.changSheng}</td>
                    <td className="px-2 py-1.5">{m.isKongWang ? '空' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a href="/hehun" className="mt-2 inline-block text-[12px] font-semibold text-[color:var(--ink-2)] hover:underline">
            合婚双盘工具 →
          </a>
        </section>
      ) : null}

      {/* 流年 + 岁运 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section id="ex-liunian" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>⑪ 流年</SectionTitle>
          <div className="mt-2 font-serif text-[22px] font-black text-[#0f172a]">
            {desk.liunian.currentGanZhi}
          </div>
          <p className="mt-2 text-[13px] leading-[1.7] text-[#334155]">{desk.liunian.currentText}</p>
          <div className="mt-3 rounded-[8px] bg-[#f8fafc] px-3 py-2 text-[12px] leading-6 text-[#475569]">
            <div className="font-semibold text-[#0f172a]">明年 / 后续</div>
            {desk.liunian.nextYearText}
          </div>
          <div className="mt-2 rounded-[8px] bg-[#f8fafc] px-3 py-2 text-[12px] leading-6 text-[#475569]">
            <div className="font-semibold text-[#0f172a]">趋势</div>
            {desk.liunian.trend}
          </div>
        </section>

        <section id="ex-suiyun" className="scroll-mt-header rounded-[10px] border border-[#fca5a5] bg-[#fff7f7] p-4">
          <SectionTitle>⑫ 岁运关系</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-2 text-[13px] font-bold">
            <span className="rounded-[6px] bg-white px-2.5 py-1 ring-1 ring-[#fecaca]">
              大运 {desk.suiyun.dayunGanZhi}
            </span>
            <span className="text-[#94a3b8]">×</span>
            <span className="rounded-[6px] bg-white px-2.5 py-1 ring-1 ring-[#fecaca]">
              流年 {desk.suiyun.liunianGanZhi}
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-[1.7] text-[#7f1d1d]">{desk.suiyun.summary}</p>
          <ul className="mt-3 space-y-1.5">
            {desk.suiyun.notes.map((n) => (
              <li key={n} className="text-[12px] leading-[1.55] text-[#9a3412]">
                · {n}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <ExpertLiunianProbe
        dayMaster={desk.probeDefaults.dayMaster}
        dayPillarGanZhi={desk.probeDefaults.dayPillarGanZhi}
        currentDayunGanZhi={desk.probeDefaults.currentDayunGanZhi}
        yongShen={desk.probeDefaults.yongShen}
        jiShen={desk.probeDefaults.jiShen}
        birthYear={desk.probeDefaults.birthYear}
      />

      <ExpertEnrichment
        cosmos={desk.cosmos}
        domains={desk.domains}
        playbook={desk.playbook}
        boost={desk.boost}
        yongJi={desk.yongJi}
        suiyun={desk.suiyun}
      />

      <ExpertHandoffBar clientPack={clientPack} printSheet={printSheet} reportId={reportId} />

      <ExpertClientPackPanel pack={clientPack} />

      <ExpertCrmPanel
        reportId={reportId}
        defaultName={desk.input.name !== '—' ? desk.input.name : ''}
        dayMaster={desk.dayMaster}
        dayun={desk.dayun.current?.ganZhi || desk.suiyun.dayunGanZhi}
        doThis={clientPack.closingActions[0]}
      />

      <ExpertPrintSheetView sheet={printSheet} />

      <ExpertRuleGlossary />

      {/* 神煞 */}
      <section id="ex-shensha" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
        <SectionTitle>神煞</SectionTitle>
        {desk.shenSha.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {desk.shenSha.map((s) => (
              <span key={s} className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[12px] font-semibold text-[#334155]">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-[#94a3b8]">本盘神煞列表为空或未启用神煞模块。</p>
        )}
      </section>

      {/* K 线对照 */}
      {Array.isArray(klineData) && klineData.length > 0 ? (
        <section id="ex-kline" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
          <SectionTitle>运势曲线对照（引擎 K 线）</SectionTitle>
          <p className="mt-1 text-[11px] text-[#64748b]">大运流年用神加权结果，供与岁运表交叉验证。</p>
          <div className="mt-3">
            <Suspense fallback={<div className="h-56 animate-pulse rounded bg-[#e2e8f0]" />}>
              <FortuneChart data={klineData as any} height={280} title="专业对照 · 人生 K 线" subtitle="综合 / 事业 / 财富 / 关系 / 健康" />
            </Suspense>
          </div>
        </section>
      ) : null}

      <ExpertPrintBar sheetOnlyHint reportId={reportId} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[14px] font-bold tracking-tight text-[#0f172a] md:text-[15px]">{children}</h2>;
}

function Row({
  label,
  value,
  mono,
  emphasize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">{label}</div>
      <div
        className={`mt-0.5 break-all ${emphasize ? 'font-bold text-[#b45309]' : 'text-[#0f172a]'} ${
          mono ? 'font-mono text-[12px]' : 'text-[12px] font-semibold'
        }`}
      >
        {value || '—'}
      </div>
    </div>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        muted ? 'bg-[#f1f5f9] text-[#64748b]' : 'bg-[#0f172a] text-white'
      }`}
    >
      {children}
    </span>
  );
}

function RelationCell({ pillar }: { pillar: ExpertPillarRow }) {
  const parts: string[] = [];
  if (pillar.combinations.length) parts.push(`合:${pillar.combinations.join('')}`);
  if (pillar.clashes.length) parts.push(`冲:${pillar.clashes.join('')}`);
  if (pillar.penalties.length) parts.push(`刑:${pillar.penalties.join('')}`);
  if (pillar.harms.length) parts.push(`害:${pillar.harms.join('')}`);
  return <>{parts.join(' · ') || '—'}</>;
}

function matchLabel(v: string) {
  if (v === 'good') return '助用';
  if (v === 'bad') return '逆用';
  if (v === 'neutral') return '中性';
  return v || '—';
}

function qualityLabel(v: string) {
  const map: Record<string, string> = {
    excellent: '优',
    good: '良',
    neutral: '中',
    bad: '弱',
    poor: '差',
  };
  return map[v] || v || '—';
}

function fmtMin(v: number | null) {
  if (v == null || !Number.isFinite(v)) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(1)} 分`;
}
