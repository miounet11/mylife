import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { exportChatEvalCases, summarizeBuckets } from '@/lib/chat-eval-export';
import { AppPage } from '@/components/layout/app-page';

export const dynamic = 'force-dynamic';

export default async function AdminChatEvalPage() {
  await requireAdminUser('/admin/chat-eval');
  const snap = exportChatEvalCases({
    limit: 60,
    onlyFeedback: true,
    prioritizeNegative: true,
    windowHours: 168,
  });
  const buckets = summarizeBuckets(snap.byBucket);

  return (
    <AppPage header={{ ctaHref: '/admin/chat-ops', ctaLabel: '对话运营' }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6d28d9]">
            Chat Eval
          </div>
          <h1 className="mt-1 text-[20px] font-bold text-[#0f172a]">对话评测导出 · 7 天</h1>
          <p className="mt-1 max-w-2xl text-[12px] text-[#64748b]">
            脱敏后的 Q/A 样本，优先「无帮助 / 太空」。用于 prompt 回归与结构验收，不做模型微调语料。
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[12px] font-semibold text-[#6d28d9]">
          <a
            href="/api/admin/chat-eval?format=jsonl&onlyFeedback=1&windowHours=168&limit=200"
            className="hover:underline"
          >
            下载 JSONL
          </a>
          <a
            href="/api/admin/chat-eval?format=json&onlyFeedback=0&windowHours=72&limit=100"
            className="hover:underline"
          >
            近 72h 全量 JSON
          </a>
          <Link href="/admin/chat-ops" className="hover:underline">
            ← Chat Ops
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="样本数" value={snap.count} />
        <Stat
          label="无帮助"
          value={snap.byFeedback.not_helpful || 0}
          helper="优先审阅"
          accent
        />
        <Stat label="太空/套话" value={snap.byFeedback.empty || 0} />
        <Stat label="有用" value={snap.byFeedback.helpful || 0} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title="按 bucket">
          {buckets.length === 0 ? (
            <p className="text-[12px] text-[#94a3b8]">暂无带反馈的对话样本</p>
          ) : (
            buckets.map((b) => <Row key={b.bucket} k={b.bucket} v={b.count} />)
          )}
        </Card>
        <Card title="按反馈 rating">
          {Object.keys(snap.byFeedback).length === 0 ? (
            <p className="text-[12px] text-[#94a3b8]">暂无反馈</p>
          ) : (
            Object.entries(snap.byFeedback).map(([k, v]) => <Row key={k} k={k} v={v} />)
          )}
        </Card>
      </div>

      <section className="rounded-[12px] border border-[#e2e8f0] bg-white">
        <div className="border-b border-[#e2e8f0] px-4 py-3">
          <h2 className="text-[13px] font-bold text-[#0f172a]">样本预览（最多 60）</h2>
          <p className="mt-0.5 text-[11px] text-[#94a3b8]">
            已脱敏；生成于 {snap.generatedAt}
          </p>
        </div>
        <div className="divide-y divide-[#f1f5f9]">
          {snap.cases.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-[#94a3b8]">
              还没有用户点「有用 / 无帮助 / 太空」的样本。可先聊几轮并打分，或导出 72h
              全量 JSON 做结构抽检。
            </p>
          ) : (
            snap.cases.map((item) => (
              <article key={item.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-[3px] bg-[#f1f5f9] px-1.5 py-0.5 font-mono text-[#475569]">
                    {item.bucket}
                  </span>
                  {item.meta.feedbackRating ? (
                    <span className="rounded-[3px] bg-[#faf5ff] px-1.5 py-0.5 font-semibold text-[#6d28d9]">
                      {item.meta.feedbackRating}
                    </span>
                  ) : null}
                  {item.meta.structureFilled != null ? (
                    <span className="text-[#94a3b8]">结构 {item.meta.structureFilled}</span>
                  ) : null}
                  {item.meta.efcOk === false ? (
                    <span className="text-[#b45309]">EFC</span>
                  ) : null}
                  <span className="font-mono text-[#cbd5e1]">{item.id.slice(0, 12)}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.5] text-[#0f172a]">
                  <span className="font-semibold text-[#64748b]">Q · </span>
                  {item.question}
                </p>
                <p className="mt-1 line-clamp-3 text-[12px] leading-[1.5] text-[#475569]">
                  <span className="font-semibold text-[#94a3b8]">A · </span>
                  {item.answer}
                </p>
                {item.notes ? (
                  <p className="mt-1 text-[11px] text-[#94a3b8]">{item.notes}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </AppPage>
  );
}

function Stat({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: number;
  helper?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border bg-white p-4 ${
        accent ? 'border-[#c4b5fd]' : 'border-[#e2e8f0]'
      }`}
    >
      <div className="text-[11px] font-semibold text-[#64748b]">{label}</div>
      <div className="mt-1 font-mono text-[22px] tabular-nums text-[#0f172a]">{value}</div>
      {helper ? <div className="mt-0.5 text-[11px] text-[#94a3b8]">{helper}</div> : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <h2 className="text-[13px] font-bold text-[#0f172a]">{title}</h2>
      <div className="mt-3 space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] py-1.5 text-[12px] last:border-0">
      <span className="font-mono text-[#64748b]">{k}</span>
      <span className="font-mono tabular-nums text-[#0f172a]">{v}</span>
    </div>
  );
}
