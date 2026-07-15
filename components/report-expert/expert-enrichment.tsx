import type {
  ExpertBoostPack,
  ExpertCosmosPack,
  ExpertDomainCard,
  ExpertPlaybookRow,
} from '@/lib/report-expert-view';

/** 时空大盘 + 专项（婚配/行业/健康/财富）+ 剧本 + 增运 — 引擎信息打满 */
export default function ExpertEnrichment({
  cosmos,
  domains,
  playbook,
  boost,
  yongJi,
  suiyun,
}: {
  cosmos: ExpertCosmosPack;
  domains: ExpertDomainCard[];
  playbook: ExpertPlaybookRow[];
  boost: ExpertBoostPack;
  yongJi?: { yongShen: string[]; xiShen: string[]; jiShen: string[] };
  suiyun?: { dayunGanZhi: string; liunianGanZhi: string; summary: string };
}) {
  const sourceLabel =
    cosmos.source === 'stored'
      ? '报告落库信号'
      : cosmos.source === 'mixed'
        ? '落库 + 专业版即时补算'
        : '专业版即时补算（引擎上下文模块）';

  return (
    <div className="space-y-4 md:space-y-5">
      {/* 时空大盘 */}
      <section id="ex-cosmos" className="scroll-mt-header rounded-[10px] border border-[#0f172a] bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-bold text-[#0f172a] md:text-[15px]">⑯ 时空大盘 · 测算时点</h2>
            <p className="mt-1 text-[11px] text-[#64748b]">
              时间（节气流年）· 空间（地理方位）· 更大纬度（宏观/行业/人生阶段）
            </p>
          </div>
          <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[10px] font-semibold text-[#475569]">
            {sourceLabel}
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Mini label="节气" value={`${cosmos.temporal.solarTerm} → ${cosmos.temporal.nextSolarTerm}`} />
          <Mini label="农历年 / 流年" value={`${cosmos.temporal.lunarYear} / ${cosmos.temporal.liuNian}`} />
          <Mini label="阶段" value={cosmos.temporal.phaseLabel} />
          <Mini
            label="测算日"
            value={`${cosmos.temporal.year}.${String(cosmos.temporal.month).padStart(2, '0')}.${String(cosmos.temporal.day).padStart(2, '0')}`}
            mono
          />
          <Mini label="立春前" value={cosmos.temporal.isBeforeLichun ? '是（年柱注意）' : '否'} />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {cosmos.stateVector.map((s) => (
            <div
              key={s.label}
              className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3 text-center"
            >
              <div className="text-[11px] font-semibold tracking-[0.12em] text-[#64748b]">{s.label}</div>
              <div className="mt-1 font-mono text-[22px] font-black text-[#0f172a]">
                {s.value > 0 ? s.value.toFixed(1) : '—'}
              </div>
              <div className="mt-0.5 text-[10px] text-[#94a3b8]">{s.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[8px] border border-[#e2e8f0] p-3">
            <div className="text-[12px] font-bold text-[#0f172a]">宏观周期</div>
            {cosmos.nationalCycle ? (
              <p className="mt-1.5 text-[12px] leading-[1.65] text-[#334155]">
                <span className="font-semibold">国运/环境 · {cosmos.nationalCycle.label}</span>
                <span className="text-[#64748b]">（{cosmos.nationalCycle.direction}）</span>
                <br />
                {cosmos.nationalCycle.reason}
              </p>
            ) : (
              <p className="mt-1 text-[12px] text-[#94a3b8]">暂无国运周期信号</p>
            )}
            {cosmos.economicCycle ? (
              <p className="mt-2 text-[12px] leading-[1.65] text-[#334155]">
                <span className="font-semibold">经济 · {cosmos.economicCycle.label}</span>
                <span className="text-[#64748b]">（{cosmos.economicCycle.direction}）</span>
                <br />
                {cosmos.economicCycle.reason}
              </p>
            ) : null}
          </div>

          <div className="rounded-[8px] border border-[#e2e8f0] p-3">
            <div className="text-[12px] font-bold text-[#0f172a]">行业周期（更大纬度）</div>
            {cosmos.industries.length ? (
              <ul className="mt-2 space-y-1.5">
                {cosmos.industries.map((ind) => (
                  <li key={ind.industry} className="text-[12px] leading-[1.55] text-[#334155]">
                    <span className="font-semibold">{ind.industry}</span>
                    <span className="text-[#64748b]">
                      {' '}
                      · {ind.direction}
                      {ind.confidence > 0 ? ` · 置信 ${(ind.confidence * 100).toFixed(0)}%` : ''}
                    </span>
                    {ind.reason ? <span className="block text-[#64748b]">{ind.reason}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[12px] text-[#94a3b8]">暂无行业周期明细</p>
            )}
          </div>

          <div className="rounded-[8px] border border-[#e2e8f0] p-3">
            <div className="text-[12px] font-bold text-[#0f172a]">地理 · 气候</div>
            <p className="mt-1.5 text-[12px] text-[#334155]">
              出生地 {cosmos.geo.birthPlace} · 当前地 {cosmos.geo.currentPlace}
            </p>
            <TagList items={cosmos.geo.climateBias} />
            <TagList items={cosmos.geo.geographyPreference} />
            <TagList items={cosmos.geo.cityEnergyTags} />
          </div>

          <div className="rounded-[8px] border border-[#e2e8f0] p-3">
            <div className="text-[12px] font-bold text-[#0f172a]">空间 · 方位</div>
            <p className="mt-1.5 text-[12px] text-[#047857]">
              宜向：{cosmos.spatial.favorableDirections.join('、') || '—'}
            </p>
            <p className="text-[12px] text-[#b91c1c]">
              慎向：{cosmos.spatial.unfavorableDirections.join('、') || '—'}
            </p>
            <TagList items={cosmos.spatial.movementAdvice} />
            <TagList items={cosmos.spatial.environmentAdvice} />
          </div>

          <div className="rounded-[8px] border border-[#e2e8f0] p-3 lg:col-span-2">
            <div className="text-[12px] font-bold text-[#0f172a]">人生阶段 · 人和维度</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Mini label="生命阶段" value={cosmos.human.lifeStage} />
              <Mini label="关系焦点" value={cosmos.human.relationshipFocus} />
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 text-[11px] text-[#475569]">
              <div>
                <div className="font-semibold text-[#0f172a]">家庭角色压力</div>
                <TagList items={cosmos.human.familyRolePressure} />
              </div>
              <div>
                <div className="font-semibold text-[#0f172a]">协作模式建议</div>
                <TagList items={cosmos.human.collaborationMode} />
              </div>
            </div>
          </div>
        </div>

        {cosmos.domainTimeline.length > 0 ? (
          <div className="mt-4">
            <div className="text-[12px] font-bold text-[#0f172a]">近窗四维运势（K 线 · 事业/财/婚/健）</div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[11px]">
                <thead>
                  <tr className="border-b bg-[#0f172a] text-left text-white">
                    <th className="px-2 py-1.5">年</th>
                    <th className="px-2 py-1.5">干支</th>
                    <th className="px-2 py-1.5">事业</th>
                    <th className="px-2 py-1.5">财富</th>
                    <th className="px-2 py-1.5">婚配</th>
                    <th className="px-2 py-1.5">身体</th>
                    <th className="px-2 py-1.5">均分</th>
                  </tr>
                </thead>
                <tbody>
                  {cosmos.domainTimeline.map((w) => {
                    const avg = Math.round((w.career + w.wealth + w.marriage + w.health) / 4);
                    const isNow = w.year === cosmos.temporal.year;
                    return (
                      <tr
                        key={w.year}
                        className={`border-b border-[#f1f5f9] ${isNow ? 'bg-[#fef3c7]/60 font-semibold' : ''}`}
                      >
                        <td className="px-2 py-1.5 font-mono">{w.year}</td>
                        <td className="px-2 py-1.5 font-mono">{w.ganZhi || '—'}</td>
                        <td className="px-2 py-1.5 font-mono">{w.career}</td>
                        <td className="px-2 py-1.5 font-mono">{w.wealth}</td>
                        <td className="px-2 py-1.5 font-mono">{w.marriage}</td>
                        <td className="px-2 py-1.5 font-mono">{w.health}</td>
                        <td className="px-2 py-1.5 font-mono font-bold text-[color:var(--ink-2)]">{avg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {cosmos.monthlyWindows.length > 0 ? (
          <div className="mt-4">
            <div className="text-[12px] font-bold text-[#0f172a]">近月窗口（专业速查）</div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[11px]">
                <thead>
                  <tr className="border-b bg-[#f8fafc] text-left text-[#64748b]">
                    <th className="px-2 py-1.5">月</th>
                    <th className="px-2 py-1.5">分</th>
                    <th className="px-2 py-1.5">态</th>
                    <th className="px-2 py-1.5">主题</th>
                    <th className="px-2 py-1.5">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {cosmos.monthlyWindows.map((w) => (
                    <tr key={w.label} className="border-b border-[#f1f5f9]">
                      <td className="px-2 py-1.5 font-mono">{w.label}</td>
                      <td className="px-2 py-1.5 font-mono font-bold">{w.score}</td>
                      <td className="px-2 py-1.5">{w.status}</td>
                      <td className="px-2 py-1.5">{w.theme}</td>
                      <td className="max-w-[260px] px-2 py-1.5 text-[#64748b]" title={w.reason}>
                        {w.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      {/* 专项：婚配/行业/健康/财富 */}
      <section id="ex-domains" className="scroll-mt-header space-y-3">
        <div>
          <h2 className="text-[14px] font-bold text-[#0f172a] md:text-[15px]">⑰ 专项研判（引擎全量）</h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">
            事业行业 · 财富投资 · 婚配情感 · 身体健康 · 体貌 · 行业映射（含驱动/行动/风险）
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {domains.map((d) => (
            <article
              key={d.key}
              className="rounded-[10px] border border-[#cbd5e1] bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[14px] font-bold text-[#0f172a]">{d.title}</h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  {d.score != null ? (
                    <span className="font-mono font-bold text-[color:var(--ink-2)]">{d.score}/100</span>
                  ) : null}
                  {d.klineScore != null ? (
                    <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 font-mono font-semibold text-[color:var(--ink-2)]">
                      K线 {d.klineScore}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 font-semibold text-[#64748b]">
                    {d.status}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-[12px] leading-[1.75] text-[#334155] whitespace-pre-wrap">{d.general}</p>

              {/* 推演链：用忌 → 岁运 → 场景 → 建议 */}
              <details className="mt-2 rounded-[8px] border border-[#ede9fe] bg-[color:var(--bg-sunken)]/60 px-2.5 py-2">
                <summary className="cursor-pointer text-[11px] font-bold text-[color:var(--ink-2)]">
                  推演链（因为所以 · 对客可讲）
                </summary>
                <ol className="mt-1.5 space-y-1 text-[11px] leading-[1.55] text-[#4c1d95]">
                  <li>
                    1. 用忌：顺 {yongJi?.yongShen?.join('、') || '用神'} · 慎{' '}
                    {yongJi?.jiShen?.join('、') || '忌神'}
                  </li>
                  <li>
                    2. 岁运：{suiyun?.dayunGanZhi || '—'} × {suiyun?.liunianGanZhi || '—'}
                    {suiyun?.summary ? ` · ${suiyun.summary.slice(0, 60)}` : ''}
                  </li>
                  <li>
                    3. 场景分：{d.score != null ? `${d.score}/100` : '—'} · 态 {d.status}
                    {d.klineScore != null ? ` · K线 ${d.klineScore}` : ''}
                  </li>
                  <li>
                    4. 建议：
                    {d.actions[0] || d.specific[0] || d.timing || '见下方要点'}
                  </li>
                </ol>
              </details>

              {d.drivers.length ? (
                <div className="mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">驱动</div>
                  <TagList items={d.drivers} />
                </div>
              ) : null}

              {d.specific.length ? (
                <div className="mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">要点</div>
                  <ul className="mt-1 space-y-1">
                    {d.specific.map((s) => (
                      <li key={s} className="text-[11px] leading-[1.55] text-[#475569]">
                        · {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {d.actions.length ? (
                <div className="mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">宜做</div>
                  <ul className="mt-1 space-y-1">
                    {d.actions.map((s) => (
                      <li key={s} className="text-[11px] leading-[1.55] text-[#065f46]">
                        · {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {d.timing ? (
                <p className="mt-2 text-[11px] text-[color:var(--ink-2)]">
                  <span className="font-semibold">时机：</span>
                  {d.timing}
                </p>
              ) : null}

              {d.avoid.length ? (
                <p className="mt-1 text-[11px] text-[#b91c1c]">
                  <span className="font-semibold">忌：</span>
                  {d.avoid.join('；')}
                </p>
              ) : null}

              {d.risks.length ? (
                <p className="mt-1 text-[11px] text-[#9f1239]">
                  <span className="font-semibold">风险：</span>
                  {d.risks.join('；')}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {(d.directions.length ? d.directions : d.direction ? [d.direction] : []).map((dir) => (
                  <span
                    key={dir}
                    className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]"
                  >
                    方位 {dir}
                  </span>
                ))}
                {d.colors.map((c) => (
                  <span key={c} className="rounded-full bg-[#f8fafc] px-2 py-0.5 text-[10px] text-[#475569]">
                    {c}
                  </span>
                ))}
              </div>

              {d.focus.length ? (
                <div className="mt-2 text-[11px] text-[#64748b]">焦点：{d.focus.join('、')}</div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* 操作剧本 */}
      {playbook.length > 0 ? (
        <section id="ex-playbook" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4 md:p-5">
          <h2 className="text-[14px] font-bold text-[#0f172a]">⑱ 分轨操作剧本</h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">decisionPlaybook · 供专业人士拆轨执行</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b bg-[#f8fafc] text-left text-[#64748b]">
                  <th className="px-2 py-2">轨</th>
                  <th className="px-2 py-2">优先级</th>
                  <th className="px-2 py-2">姿态</th>
                  <th className="px-2 py-2">分</th>
                  <th className="px-2 py-2">窗口</th>
                  <th className="px-2 py-2">为何现在</th>
                  <th className="px-2 py-2">做</th>
                  <th className="px-2 py-2">不做</th>
                </tr>
              </thead>
              <tbody>
                {playbook.map((p) => (
                  <tr key={p.key} className="border-b border-[#f1f5f9] align-top">
                    <td className="px-2 py-2 font-semibold text-[#0f172a]">{p.title}</td>
                    <td className="px-2 py-2">{p.priority}</td>
                    <td className="px-2 py-2">{p.stance}</td>
                    <td className="px-2 py-2 font-mono">{p.score}</td>
                    <td className="px-2 py-2 font-mono">{p.bestWindow}</td>
                    <td className="max-w-[160px] px-2 py-2 text-[#475569]">{p.whyNow}</td>
                    <td className="max-w-[140px] px-2 py-2 text-[#047857]">{p.nowAction}</td>
                    <td className="max-w-[140px] px-2 py-2 text-[#b91c1c]">{p.avoidAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* 增运参数 */}
      <section id="ex-boost" className="scroll-mt-header rounded-[10px] border border-[#cbd5e1] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">⑲ 增运参数（颜色 / 方位 / 数字 / 时机）</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BoostCol title="颜色" items={boost.colors} />
          <BoostCol title="方位" items={boost.directions} />
          <BoostCol title="数字" items={boost.numbers} />
          <BoostCol title="时机要点" items={boost.timing} />
        </div>
      </section>
    </div>
  );
}

function Mini({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-2">
      <div className="text-[10px] font-semibold text-[#94a3b8]">{label}</div>
      <div className={`mt-0.5 text-[12px] font-semibold text-[#0f172a] ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-1.5 space-y-1">
      {items.map((t) => (
        <li key={t} className="text-[11px] leading-[1.5] text-[#475569]">
          · {t}
        </li>
      ))}
    </ul>
  );
}

function BoostCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <div className="text-[12px] font-bold text-[#0f172a]">{title}</div>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((x) => (
            <span
              key={x}
              className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#334155] ring-1 ring-[#e2e8f0]"
            >
              {x}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[#94a3b8]">暂无</p>
      )}
    </div>
  );
}
