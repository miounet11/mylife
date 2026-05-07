import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, Compass, MessageSquareText, Sparkles } from 'lucide-react';

import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import UpdatesStatusPanelWithQuery from '@/components/updates-status-panel-with-query';

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Inline } from '@/components/ui/inline';
import { Stack } from '@/components/ui/stack';
import { Tag } from '@/components/ui/tag';

import { listChatIntentPresets, getChatIntentPreset } from '@/lib/chat-intent';
import { buildChatHref } from '@/lib/chat-entry';
import { appendSourceToHref } from '@/lib/source-url';

const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  loading: () => <ChatSkeleton />,
});

const doctrineCards: Array<[string, string]> = [
  ['结构锚点', '先钉住这次问题到底卡在结构、阶段还是环境。'],
  ['阶段窗口', '尽量把问题放到一个明确时间段里再问。'],
  ['动作结论', '每轮追问最后都收敛成先做什么。'],
];

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
  const source = resolvedSearchParams.source?.trim() || '';
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

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="mb-5 md:mb-6">
          <Inline justify="between" align="end" wrap className="gap-4">
            <Stack gap={3}>
              <Eyebrow icon={<MessageSquareText className="h-3 w-3" />}>
                结构追问 · 收敛成动作
              </Eyebrow>
              <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                {intentPreset ? `${intentPreset.entryLabel}` : '直接把当前问题问清楚'}
              </h1>
              <Inline gap={2} wrap>
                {reportId && (
                  <Tag tone="brand" variant="soft" size="sm">
                    报告 <span className="ml-1 font-mono">{reportId.slice(0, 8)}</span>
                  </Tag>
                )}
                {eventId && (
                  <Tag tone="env" variant="soft" size="sm">
                    事件 <span className="ml-1 font-mono">{eventId.slice(0, 8)}</span>
                  </Tag>
                )}
                <Tag tone={intentPreset ? 'signal' : 'default'} variant="soft" size="sm">
                  {intentPreset ? `专项 · ${intentPreset.entryLabel}` : '自由结构追问'}
                </Tag>
              </Inline>
            </Stack>

            <Link
              href={reportHref}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              <ArrowLeft className="h-4 w-4" />
              {reportId ? '返回当前报告' : '查看我的档案'}
            </Link>
          </Inline>
        </section>

        {/* 双栏：聊天主区 + 右侧专项切换 */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)] xl:items-start">
          <Card variant="raised" padding="none" className="overflow-hidden">
            <div id="chat-workbench">
              <AIAssistantChat />
            </div>
          </Card>

          <Stack gap={4} className="xl:sticky xl:top-32">
            {/* 切换专项 */}
            <Card variant="default" padding="md">
              <Eyebrow icon={<Compass className="h-3 w-3" />} className="mb-3">
                切换专项
              </Eyebrow>
              <Stack gap={1}>
                {scopedIntentLinks.map((item) => {
                  const active = item.key === intentPreset?.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={
                        active
                          ? 'block rounded-[var(--radius)] border border-[color:var(--brand)] bg-[color:var(--brand-soft)] px-3 py-2 text-sm font-bold text-[color:var(--brand-strong)]'
                          : 'block rounded-[var(--radius)] px-3 py-2 text-sm font-semibold text-[color:var(--ink-3)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-1)]'
                      }
                    >
                      {item.entryLabel}
                    </Link>
                  );
                })}
              </Stack>
            </Card>

            {/* 辅助入口 */}
            <Card variant="sunken" padding="md">
              <Eyebrow tone="muted" className="mb-3">辅助入口</Eyebrow>
              <Stack gap={2}>
                <Link
                  href={reportHref}
                  className="inline-flex items-center justify-between text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                >
                  {reportId ? '返回当前结果页' : '返回我的档案'}
                  <span className="text-[color:var(--ink-5)]">→</span>
                </Link>
                <Link
                  href={eventsHref}
                  className="inline-flex items-center justify-between text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                >
                  管理关联事件
                  <span className="text-[color:var(--ink-5)]">→</span>
                </Link>
                <Link
                  href="/docs/structured-chat"
                  className="inline-flex items-center justify-between text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                >
                  使用方法
                  <span className="text-[color:var(--ink-5)]">→</span>
                </Link>
              </Stack>
            </Card>

            {/* 后续更新 */}
            <Suspense fallback={<ChatUpdatePanelSkeleton />}>
              <UpdatesStatusPanelWithQuery
                compact
                title="后续更新"
                description="查看报告升级、月度提醒和订阅状态。"
              />
            </Suspense>
          </Stack>
        </div>

        {/* 追问规则（折叠到下方） */}
        <section className="mt-10">
          <Eyebrow tone="muted" icon={<Sparkles className="h-3 w-3" />} className="mb-4">
            追问的三个原则
          </Eyebrow>
          <div className="grid gap-3 md:grid-cols-3">
            {doctrineCards.map(([title, description], index) => (
              <Card key={title} variant="default" padding="md">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs font-bold text-[color:var(--ink-5)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-sm font-bold text-[color:var(--ink-1)]">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">
                  {description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <div className="h-12 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
      <div className="h-80 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
      <div className="h-12 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
    </div>
  );
}

function ChatUpdatePanelSkeleton() {
  return (
    <div className="h-40 animate-pulse rounded-[var(--radius-md)] bg-[color:var(--bg-sunken)]" />
  );
}
