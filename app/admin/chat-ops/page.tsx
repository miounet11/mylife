import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireAdminUser } from '@/lib/auth';
import { getChatOpsSnapshot } from '@/lib/chat-ops-snapshot';
import { AppPage } from '@/components/layout/app-page';

export const dynamic = 'force-dynamic';

export default async function AdminChatOpsPage() {
  await requireAdminUser('/admin/chat-ops');
  const snap = getChatOpsSnapshot(24);

  return (
    <AppPage header={{ ctaHref: '/admin/dashboard', ctaLabel: '运营看板' }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6d28d9]">
            Chat Ops
          </div>
          <h1 className="mt-1 text-[20px] font-bold text-[#0f172a]">对话运营 · 24h</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            顾问开场 · 结构合规 · 用户反馈 · EFC 校验 · 自 {snap.since}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[12px] font-semibold text-[#6d28d9]">
          <Link href="/admin/product-funnel" className="hover:underline">
            双轨漏斗
          </Link>
          <Link href="/admin/dashboard" className="hover:underline">
            ← 看板
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="开场曝光" value={snap.openingFunnel.shown} />
        <Stat
          label="Starter 点击"
          value={snap.openingFunnel.starterClicked}
          helper={
            snap.openingFunnel.starterRate != null
              ? `转化 ${snap.openingFunnel.starterRate}%`
              : '—'
          }
          accent
        />
        <Stat
          label="结构丰富率"
          value={snap.structure.richRate != null ? snap.structure.richRate : snap.structure.scored}
          helper={
            snap.structure.richRate != null
              ? `rich ${snap.structure.rich}/${snap.structure.scored} · 均填 ${snap.structure.avgFilled ?? '—'}`
              : '尚无结构评分样本'
          }
          suffix={snap.structure.richRate != null ? '%' : undefined}
        />
        <Stat
          label="有用反馈率"
          value={
            snap.feedbackQuality.helpfulRate != null
              ? snap.feedbackQuality.helpfulRate
              : snap.feedbackQuality.total
          }
          helper={
            snap.feedbackQuality.helpfulRate != null
              ? `${snap.feedbackQuality.helpful}/${snap.feedbackQuality.total} · EFC ${snap.efcFlags}`
              : `EFC 告警 ${snap.efcFlags}`
          }
          suffix={snap.feedbackQuality.helpfulRate != null ? '%' : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card title="开场漏斗">
          <Row k="chat_opening_shown" v={snap.openingFunnel.shown} />
          <Row k="chat_starter_clicked" v={snap.openingFunnel.starterClicked} />
          <Row k="chat_topic_chip" v={snap.openingFunnel.topicChip} />
          <Row k="chat_greeting_swiped" v={snap.openingFunnel.greetingSwiped} />
        </Card>
        <Card title="对话量">
          <Row k="chat_page_viewed" v={snap.chatVolume.pageViewed} />
          <Row k="chat_message_sent" v={snap.chatVolume.messageSent} />
          <Row k="chat_completed" v={snap.chatVolume.completed} />
        </Card>
        <Card title="回答结构合规">
          <Row k="scored" v={snap.structure.scored} />
          <Row k="rich" v={snap.structure.rich} />
          <Row k="thin" v={snap.structure.thin} />
          <Row
            k="rich_rate"
            v={snap.structure.richRate != null ? snap.structure.richRate : 0}
            suffix={snap.structure.richRate != null ? '%' : ''}
          />
          <Row
            k="thin_rate"
            v={snap.structure.thinRate != null ? snap.structure.thinRate : 0}
            suffix={snap.structure.thinRate != null ? '%' : ''}
          />
          <Row
            k="avg_filled"
            v={snap.structure.avgFilled != null ? snap.structure.avgFilled : 0}
          />
        </Card>
        <Card title="用户反馈 · EFC">
          {Object.keys(snap.feedback).length === 0 ? (
            <p className="text-[12px] text-[#94a3b8]">暂无反馈（有用 / 无帮助 / 太空）</p>
          ) : (
            Object.entries(snap.feedback).map(([k, v]) => <Row key={k} k={k} v={v} />)
          )}
          <Row
            k="helpful_rate"
            v={snap.feedbackQuality.helpfulRate != null ? snap.feedbackQuality.helpfulRate : 0}
            suffix={snap.feedbackQuality.helpfulRate != null ? '%' : ''}
          />
          <Row k="chat_efc_flagged" v={snap.efcFlags} />
        </Card>
      </div>

      <p className="mt-6 text-[11px] leading-5 text-[#94a3b8]">
        目标：开场→starter 转化与「有用」占比上升；结构丰富率上升、thin 与 EFC 告警趋近 0。
        数据来自 analytics_events（含 chat_structure_scored）。
      </p>
    </AppPage>
  );
}

function Stat({
  label,
  value,
  helper,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  helper?: string;
  accent?: boolean;
  suffix?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border bg-white p-4 ${
        accent ? 'border-[#c4b5fd]' : 'border-[#e2e8f0]'
      }`}
    >
      <div className="text-[11px] font-semibold text-[#64748b]">{label}</div>
      <div className="mt-1 font-mono text-[22px] tabular-nums text-[#0f172a]">
        {value}
        {suffix ? <span className="text-[14px] text-[#64748b]">{suffix}</span> : null}
      </div>
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

function Row({ k, v, suffix }: { k: string; v: number; suffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] py-1.5 text-[12px] last:border-0">
      <span className="font-mono text-[#64748b]">{k}</span>
      <span className="font-mono tabular-nums text-[#0f172a]">
        {v}
        {suffix || ''}
      </span>
    </div>
  );
}
