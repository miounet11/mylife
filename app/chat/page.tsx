import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';

import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import UpdatesStatusPanelWithQuery from '@/components/updates-status-panel-with-query';

import { listChatIntentPresets, getChatIntentPreset } from '@/lib/chat-intent';
import { buildChatHref, normalizeAttributionSource } from '@/lib/chat-entry';
import { appendSourceToHref } from '@/lib/source-url';

// v5-D60: FB Messenger 2017 风 chat 工作区
// 左侧栏 260px（对话历史 / 上下文档案 / 推荐追问）+ 中央消息流 flex-1
// 移动端 < md 隐藏左栏，靠 drawer 触发

const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  loading: () => <ChatSkeleton />,
});

interface ChatPageProps {
  searchParams?: Promise<{
    reportId?: string;
    eventId?: string;
    intent?: string;
    question?: string;
    source?: string;
    ctaStrategyKey?: string;
    sourceFamily?: string;
  }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reportId = resolvedSearchParams.reportId?.trim() || '';
  const eventId = resolvedSearchParams.eventId?.trim() || '';
  const intent = resolvedSearchParams.intent?.trim() || '';
  const question = resolvedSearchParams.question?.trim() || '';
  const source = normalizeAttributionSource(resolvedSearchParams.source);
  const ctaStrategyKey = resolvedSearchParams.ctaStrategyKey?.trim() || '';
  const sourceFamily = resolvedSearchParams.sourceFamily?.trim() || '';
  const reportHref = reportId
    ? appendSourceToHref(`/result/${encodeURIComponent(reportId)}`, source)
    : '/profile';
  const eventsHref = reportId
    ? appendSourceToHref(`/events?reportId=${encodeURIComponent(reportId)}`, source)
    : appendSourceToHref('/events', source);
  const intentPreset = getChatIntentPreset(intent);
  const scopedIntentLinks = listChatIntentPresets().map((item) => ({
    ...item,
    href: buildChatHref({
      reportId: reportId || undefined,
      eventId: eventId || undefined,
      intent: item.key,
      source: source || undefined,
      ctaStrategyKey: ctaStrategyKey || undefined,
      sourceFamily: sourceFamily || undefined,
    }),
  }));

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="chat_page_viewed"
        page="/chat"
        meta={{
          surfaceKey: 'assistant',
          reportId: reportId || null,
          eventId: eventId || null,
          intent: intentPreset?.key || null,
          source: source || null,
          ctaStrategyKey: ctaStrategyKey || null,
          sourceFamily: sourceFamily || null,
          prefilledQuestion: question ? 'yes' : 'no',
        }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="重新判断" />

      <main className="page-frame py-3 md:py-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {/* FB Messenger 2017 风工作区：白底 + 1px 灰边外框 */}
        <div
          className="overflow-hidden rounded-[3px] border border-[#dddfe2] bg-white"
          style={{ minHeight: 'calc(100vh - 220px)' }}
        >
          <div className="grid h-full lg:grid-cols-[260px_1fr]">
            {/* 桌面 lg+ 左侧栏 */}
            <aside className="hidden border-r border-[#dddfe2] bg-[#f5f6f7] lg:flex lg:flex-col">
              <ChatSidebar
                intentKey={intentPreset?.key || ''}
                intentLabel={intentPreset?.entryLabel || '自由结构追问'}
                reportId={reportId}
                eventId={eventId}
                reportHref={reportHref}
                eventsHref={eventsHref}
                scopedIntentLinks={scopedIntentLinks}
              />
            </aside>

            {/* 中央消息流 */}
            <section
              className="flex flex-col bg-white"
              style={{ minHeight: 'calc(100vh - 220px)' }}
            >
              {/* 移动端 drawer 触发头条（lg 以下显示） */}
              <div className="border-b border-[#dddfe2] bg-[#f5f6f7] px-3 py-2 lg:hidden">
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-bold text-[#1d2129]">
                    <span>
                      {intentPreset ? `专项 · ${intentPreset.entryLabel}` : '自由结构追问'}
                      {reportId ? <span className="ml-2 font-mono text-[11px] text-[#606770]">报告 {reportId.slice(0, 8)}</span> : null}
                    </span>
                    <span className="text-[12px] font-semibold text-[#3b5998]">展开</span>
                  </summary>
                  <div className="mt-2.5">
                    <ChatSidebar
                      intentKey={intentPreset?.key || ''}
                      intentLabel={intentPreset?.entryLabel || '自由结构追问'}
                      reportId={reportId}
                      eventId={eventId}
                      reportHref={reportHref}
                      eventsHref={eventsHref}
                      scopedIntentLinks={scopedIntentLinks}
                    />
                  </div>
                </details>
              </div>

              {/* 桌面 chat 顶部条（标题 + 当前专项） */}
              <div className="hidden items-center justify-between gap-3 border-b border-[#dddfe2] bg-white px-4 py-2 lg:flex">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white"
                    style={{ background: '#3b5998' }}
                  >
                    <span className="text-[12px] font-bold">W</span>
                  </span>
                  <div>
                    <div className="text-[14px] font-bold text-[#1d2129]">WorldYi 结构追问</div>
                    <div className="text-[11px] text-[#606770]">
                      {intentPreset ? `专项 · ${intentPreset.entryLabel}` : '自由结构追问'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {reportId ? (
                    <span className="rounded-[3px] border border-[#dddfe2] bg-[#f5f6f7] px-2 py-0.5 text-[11px] font-semibold text-[#1d2129]">
                      报告 <span className="font-mono">{reportId.slice(0, 8)}</span>
                    </span>
                  ) : null}
                  {eventId ? (
                    <span className="rounded-[3px] border border-[#dddfe2] bg-[#f5f6f7] px-2 py-0.5 text-[11px] font-semibold text-[#1d2129]">
                      事件 <span className="font-mono">{eventId.slice(0, 8)}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-1 flex-col" id="chat-workbench">
                <AIAssistantChat />
              </div>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

interface ChatSidebarProps {
  intentKey: string;
  intentLabel: string;
  reportId: string;
  eventId: string;
  reportHref: string;
  eventsHref: string;
  scopedIntentLinks: Array<{ key: string; entryLabel: string; href: string }>;
}

function ChatSidebar({
  intentKey,
  intentLabel,
  reportId,
  eventId,
  reportHref,
  eventsHref,
  scopedIntentLinks,
}: ChatSidebarProps) {
  return (
    <div className="flex flex-col gap-3 p-3">
      {/* 上下文档案 */}
      <SidebarSection title="上下文档案">
        <div className="space-y-1.5">
          <Link
            href={reportHref}
            className="block rounded-[3px] border border-[#dddfe2] bg-white px-2.5 py-2 text-[12px] text-[#1d2129] hover:border-[#3b5998]"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#606770]">报告</div>
            <div className="mt-0.5 truncate font-semibold">
              {reportId ? `报告 ${reportId.slice(0, 8)}` : '未绑定，点击查看档案'}
            </div>
          </Link>
          <Link
            href={eventsHref}
            className="block rounded-[3px] border border-[#dddfe2] bg-white px-2.5 py-2 text-[12px] text-[#1d2129] hover:border-[#3b5998]"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#606770]">事件</div>
            <div className="mt-0.5 truncate font-semibold">
              {eventId ? `事件 ${eventId.slice(0, 8)}` : '管理关联事件'}
            </div>
          </Link>
          <Link
            href="/docs/structured-chat"
            className="block rounded-[3px] border border-[#dddfe2] bg-white px-2.5 py-2 text-[12px] font-semibold text-[#1d2129] hover:border-[#3b5998]"
          >
            使用方法
          </Link>
        </div>
      </SidebarSection>

      {/* 推荐追问 / 切换专项 */}
      <SidebarSection title="推荐追问 · 切换专项">
        <div className="space-y-1">
          {scopedIntentLinks.map((item) => {
            const active = item.key === intentKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={
                  active
                    ? 'block rounded-[3px] border border-[#3b5998] bg-[#e7f3ff] px-2.5 py-1.5 text-[12px] font-bold text-[#365899]'
                    : 'block rounded-[3px] border border-transparent px-2.5 py-1.5 text-[12px] font-semibold text-[#1d2129] hover:border-[#dddfe2] hover:bg-white'
                }
              >
                {item.entryLabel}
              </Link>
            );
          })}
        </div>
      </SidebarSection>

      {/* 对话历史 / 后续更新 */}
      <SidebarSection title="后续更新">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-[3px] bg-white border border-[#dddfe2]" />}>
          <UpdatesStatusPanelWithQuery
            compact
            title="后续更新"
            description="查看报告升级、月度提醒和订阅状态。"
          />
        </Suspense>
      </SidebarSection>

      <div className="text-[11px] leading-4 text-[#606770]">
        <div className="font-bold text-[#1d2129]">追问的三个原则</div>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          <li>先钉住卡在结构、阶段还是环境。</li>
          <li>把问题放到一个明确时间段。</li>
          <li>每轮收敛成"先做什么"。</li>
        </ol>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#606770]">{title}</div>
      {children}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-12 animate-pulse rounded-[3px] bg-[#f5f6f7]" />
      <div className="h-80 animate-pulse rounded-[3px] bg-[#f5f6f7]" />
      <div className="h-12 animate-pulse rounded-[3px] bg-[#f5f6f7]" />
    </div>
  );
}
