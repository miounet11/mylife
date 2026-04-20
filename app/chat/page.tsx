import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { Compass, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import UpdatesStatusPanelWithQuery from '@/components/updates-status-panel-with-query';
import { listChatIntentPresets, getChatIntentPreset } from '@/lib/chat-intent';
import { buildChatHref } from '@/lib/chat-entry';

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
  }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reportId = resolvedSearchParams.reportId?.trim() || '';
  const eventId = resolvedSearchParams.eventId?.trim() || '';
  const intent = resolvedSearchParams.intent?.trim() || '';
  const question = resolvedSearchParams.question?.trim() || '';
  const source = resolvedSearchParams.source?.trim() || '';
  const intentPreset = getChatIntentPreset(intent);
  const powerLinks = [
    { label: reportId ? '返回当前结果页' : '返回我的档案', href: reportId ? `/result/${encodeURIComponent(reportId)}` : '/profile' },
    { label: '管理关联事件', href: reportId ? `/events?reportId=${encodeURIComponent(reportId)}` : '/events' },
    { label: '方法论入口', href: '/knowledge/world-yi-methodology' },
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
          prefilledQuestion: question ? 'yes' : 'no',
        }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="重新判断" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <div className="space-y-6">
          <PublicSurfaceHero
            label={(
              <>
                <Sparkles className="h-3.5 w-3.5" />
                世界易结构追问入口
              </>
            )}
            title={(
              <>
                把报告里的关键结论继续问深，
                <span className="font-serif text-[color:var(--accent-strong)]">让下一步动作更清楚。</span>
              </>
            )}
            description="这里不是重新开始一次泛问答，而是围绕你当前的报告、事件和窗口继续追问，让行动结论更清楚。"
            hint="先选一个专项，或者直接追问当前最想推进的问题；如果还没有个人结果，先回到分析入口完成判断。"
            actions={[
              <Link key="chat-workbench" href="#chat-workbench" className="action-primary action-main">
                立即开始追问
              </Link>,
              <Link key="report-or-profile" href={reportId ? `/result/${encodeURIComponent(reportId)}` : '/profile'} className="action-secondary">
                {reportId ? '返回当前报告' : '查看我的档案'}
              </Link>,
            ]}
            highlights={scopeTags.map((item) => ({ body: item }))}
            highlightsColumns="md:grid-cols-3"
          />

          <section className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr] xl:items-start">
            <div id="chat-workbench" className="glass-panel overflow-hidden rounded-[2rem]">
              <AIAssistantChat />
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,226,0.92))] p-5 shadow-[0_18px_36px_rgba(23,32,51,0.06)]">
                <div className="section-label">
                  <Layers3 className="h-3.5 w-3.5" />
                  功能
                </div>
                <div className="mt-4 grid gap-3">
                  {doctrineCards.map(([title, description]) => (
                    <div key={title} className="rounded-[1.25rem] bg-white/82 px-4 py-4">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{title}</div>
                      <div className="mt-2 text-sm text-[color:var(--ink)]">{description}</div>
                    </div>
                  ))}
                </div>
                <div className="action-guide mt-4">辅助入口</div>
                <div className="action-strip mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                  {powerLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="action-secondary">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/78 p-5 shadow-[0_18px_36px_rgba(23,32,51,0.05)]">
                <div className="section-label">
                  <Compass className="h-3.5 w-3.5" />
                  切换专项
                </div>
                <div className="mt-4 grid gap-3">
                  {scopedIntentLinks.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`rounded-[1.35rem] px-4 py-4 transition hover:-translate-y-0.5 ${
                        item.key === intentPreset?.key ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'bg-slate-50 text-[color:var(--ink)]'
                      }`}
                    >
                      <div className="text-sm font-semibold">{item.entryLabel}</div>
                    </Link>
                  ))}
                </div>
              </div>

              <Suspense fallback={<ChatUpdatePanelSkeleton />}>
                <UpdatesStatusPanelWithQuery
                  compact
                  title="后续更新"
                  description="查看报告升级、月度提醒和订阅状态，避免追问脱离当前上下文。"
                />
              </Suspense>
            </div>
          </section>
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
