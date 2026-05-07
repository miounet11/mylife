import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { Compass, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import UpdatesStatusPanelWithQuery from '@/components/updates-status-panel-with-query';
import { listChatIntentPresets, getChatIntentPreset } from '@/lib/chat-intent';
import { buildChatHref } from '@/lib/chat-entry';
import { appendSourceToHref } from '@/lib/source-url';

const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  loading: () => <ChatSkeleton />,
});

const doctrineCards = [
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
  const reportHref = reportId ? appendSourceToHref(`/result/${encodeURIComponent(reportId)}`, source) : '/profile';
  const eventsHref = reportId
    ? appendSourceToHref(`/events?reportId=${encodeURIComponent(reportId)}`, source)
    : appendSourceToHref('/events', source);
  const intentPreset = getChatIntentPreset(intent);
  const powerLinks = [
    { label: reportId ? '返回当前结果页' : '返回我的档案', href: reportHref },
    { label: '管理关联事件', href: eventsHref },
    { label: '使用方法', href: '/docs/structured-chat' },
  ];
  const scopeTags = [
    reportId ? `已绑定报告 ${reportId.slice(0, 8)}` : '',
    eventId ? `已绑定事件 ${eventId.slice(0, 8)}` : '',
    intentPreset ? `当前专项：${intentPreset.entryLabel}` : '当前模式：自由结构追问',
  ].filter(Boolean);
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

      <main className="page-frame py-4 pb-16 md:py-6 md:pb-20">
        <div className="space-y-5">
          <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                世界易结构追问入口
              </div>
              <h1 className="mt-2 text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
                直接把当前问题问清楚
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {scopeTags.map((item) => (
                  <span key={item} className="signal-pill">{item}</span>
                ))}
              </div>
            </div>
            <Link href={reportHref} className="action-secondary shrink-0">
              {reportId ? '返回当前报告' : '查看我的档案'}
            </Link>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] xl:items-start">
            <div id="chat-workbench" className="glass-panel overflow-hidden rounded-xl">
              <AIAssistantChat />
            </div>

            <div className="space-y-4 xl:sticky xl:top-24">
              <PriorityDisclosure
                label="辅助入口"
                title="回看报告、事件和专项"
                description="追问主工作台优先；这些入口需要时再展开。"
                defaultOpen
              >
                <div className="grid gap-3">
                  {powerLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="action-secondary justify-start">
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-4 border-t border-[color:var(--line)] pt-4">
                  <div className="section-label">
                    <Compass className="h-3.5 w-3.5" />
                    切换专项
                  </div>
                  <div className="mt-3 grid gap-2">
                    {scopedIntentLinks.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`rounded-lg px-3 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] ${
                          item.key === intentPreset?.key
                            ? 'static-card bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                            : 'interactive-card text-[color:var(--ink)]'
                        }`}
                      >
                        {item.entryLabel}
                      </Link>
                    ))}
                  </div>
                </div>
              </PriorityDisclosure>

              <PriorityDisclosure
                label="后续更新"
                title="报告升级和提醒状态"
                description="只在需要管理订阅或更新记录时展开。"
              >
                <Suspense fallback={<ChatUpdatePanelSkeleton />}>
                  <UpdatesStatusPanelWithQuery
                    compact
                    title="后续更新"
                    description="查看报告升级、月度提醒和订阅状态，避免追问脱离当前上下文。"
                  />
                </Suspense>
              </PriorityDisclosure>
            </div>
          </section>

          <ProductSurfaceRolePanel
            surface="chat"
            title="追问页只处理一个关键问题"
            description="这里承接报告、工具和事件上下文，把用户下一轮问题收敛成清晰动作，而不是重新变成泛问答入口。"
            compact
          />

          <PriorityDisclosure
            label="追问规则"
            title="需要说明时再看"
            description="结构锚点、阶段窗口和动作结论已经内化到聊天流程里，不再默认占据首屏。"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {doctrineCards.map(([title, description]) => (
                <div key={title} className="rounded-[1.25rem] bg-white/82 px-4 py-4">
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{title}</div>
                  <div className="mt-2 text-sm text-[color:var(--ink)]">{description}</div>
                </div>
              ))}
            </div>
          </PriorityDisclosure>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-16 animate-pulse rounded-[1.5rem] bg-slate-200" />
      <div className="h-96 animate-pulse rounded-[1.75rem] bg-slate-200" />
      <div className="h-16 animate-pulse rounded-[1.5rem] bg-slate-200" />
    </div>
  );
}

function ChatUpdatePanelSkeleton() {
  return <div className="h-52 animate-pulse rounded-[1.75rem] bg-slate-200" />;
}
