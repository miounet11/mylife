'use client';

import Link from 'next/link';
import type { XiangxueSessionResult } from '@/lib/xiangxue';

type Props = {
  sessionId: string;
  result: XiangxueSessionResult;
};

export function XiangxueResultView({ sessionId, result }: Props) {
  const kindPath = result.kind === 'face' ? 'physiognomy' : 'palmistry';

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-6 sm:px-4 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700">
            {result.kind === 'face' ? '面相' : '手相'} · 结果页
            {result.llmUsed ? ' · 视觉模型' : ' · 结构引擎'}
          </div>
          <h1 className="mt-1 text-[24px] font-black">{result.title}</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-600">
            {result.summary}
          </p>
        </div>
        <Link
          href={`/tools/${kindPath}`}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-semibold"
        >
          再测一张
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {result.media?.publicPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.media.publicPath}
            alt=""
            className="h-36 w-auto rounded-xl border border-slate-200 object-cover"
          />
        ) : null}
        <div>
          <div className="text-[11px] text-slate-500">综合结构分</div>
          <div className="text-[36px] font-black text-indigo-600">{result.overallScore}</div>
          <div className="flex flex-wrap gap-1">
            {(result.visibleTags || []).map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold">
                {t}
              </span>
            ))}
          </div>
          {result.media?.r2Key ? (
            <div className="mt-1 text-[10px] text-emerald-700">已同步对象存储 · 关联用户会话</div>
          ) : (
            <div className="mt-1 text-[10px] text-slate-400">已存本地媒体库 · 会话 {sessionId.slice(0, 12)}…</div>
          )}
        </div>
      </div>

      {result.birth ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2 text-[12px] text-amber-900">
          天时：{result.birth.birthDate || '档案'}
          {result.birth.yongShen?.length ? ` · 用神 ${result.birth.yongShen.join('、')}` : ''}
          {result.birth.note ? ` · ${result.birth.note}` : ''}
        </div>
      ) : null}

      <section>
        <h2 className="text-[15px] font-bold">多维结构分</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {result.dims.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex justify-between text-[12px]">
                <span className="font-semibold text-slate-700">{d.label}</span>
                <span className="font-black text-indigo-600">{d.score}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(100, d.score)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{d.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-bold">观察要点</h2>
        {result.observations.map((o) => (
          <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[13px] font-bold text-slate-900">{o.title}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{o.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
        <h2 className="text-[13px] font-bold text-indigo-900">可执行动作</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-indigo-950/80">
          {result.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 text-[12px]">
        <Link href="/tools/naming" className="font-semibold text-indigo-700 underline">
          起名中心
        </Link>
        <Link href="/analyze" className="underline">
          完整八字报告
        </Link>
        <Link href="/tools/fengshui-space" className="underline">
          空间场
        </Link>
      </div>

      <div className="space-y-1 text-[11px] text-slate-400">
        {result.disclaimers.map((d) => (
          <p key={d}>· {d}</p>
        ))}
        {result.media?.allowSeoLineArt ? (
          <p className="text-emerald-700">已授权脱敏线图用于教学内容（原图不公开）。</p>
        ) : null}
      </div>
    </div>
  );
}
