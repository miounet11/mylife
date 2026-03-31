import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { Bot, Compass, Layers3, MessageSquareText, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import UpdatesStatusPanelWithQuery from '@/components/updates-status-panel-with-query';
import { listChatIntentPresets, getChatIntentPreset } from '@/lib/chat-intent';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  loading: () => <ChatSkeleton />,
});

const doctrineCards = [
  ['结构追问', '不要泛问运势，先把命局主轴和问题结构钉住。'],
  ['阶段追问', '围绕当下窗口和阶段位置来问，回答会更具体。'],
  ['环境追问', '把城市、关系、合作方和现实压力一并带进来。'],
  ['动作追问', '最后一定收敛到先做什么、先不做什么。'],
];

const workflowCards = [
  {
    icon: Bot,
    title: '围绕你的报告继续追问',
    description: '系统会优先带入最近报告里的结构、阶段和窗口，让回答不再飘在空中。',
  },
  {
    icon: MessageSquareText,
    title: '把判断顺手沉淀成提醒',
    description: '关键窗口、建议动作和现实反馈都可以直接记下，后面才能真正复盘。',
  },
  {
    icon: Compass,
    title: '把泛问题压成结构问题',
    description: '别问“我接下来怎样”，改问“这件事现在该推进、观察还是收手”。',
  },
];

interface ChatPageProps {
  searchParams?: Promise<{
    reportId?: string;
    eventId?: string;
    intent?: string;
  }>;
}

function buildChatHref(params: { reportId?: string; eventId?: string; intent?: string }) {
  const query = new URLSearchParams();
  if (params.reportId) query.set('reportId', params.reportId);
  if (params.eventId) query.set('eventId', params.eventId);
  if (params.intent) query.set('intent', params.intent);
  const serialized = query.toString();
  return serialized ? `/chat?${serialized}` : '/chat';
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const reportId = resolvedSearchParams.reportId?.trim() || '';
  const eventId = resolvedSearchParams.eventId?.trim() || '';
  const intent = resolvedSearchParams.intent?.trim() || '';
  const intentPreset = getChatIntentPreset(intent);
  const worldYiStats = getWorldYiPublicStats();
  const powerLinks = [
    { label: '世界易总入口', href: '/world-yi' },
    { label: '方法论入口', href: '/knowledge/world-yi-methodology' },
    { label: '专题地图', href: '/world-yi/network' },
    { label: reportId ? '返回当前结果页' : '返回我的档案', href: reportId ? `/result/${encodeURIComponent(reportId)}` : '/profile' },
  ];
  const scopeTags = [
    reportId ? `已绑定报告 ${reportId.slice(0, 8)}` : '',
    eventId ? `已绑定事件 ${eventId.slice(0, 8)}` : '',
    intentPreset ? `当前专项：${intentPreset.entryLabel}` : '当前模式：自由结构追问',
  ].filter(Boolean);
  const scaleCards = [
    { label: '当前公开知识', value: `${worldYiStats.publicKnowledgeCount} 篇` },
    { label: '当前公开案例', value: `${worldYiStats.publicCaseCount} 篇` },
    { label: '环境洞察层', value: `${worldYiStats.publicInsightCount} 篇` },
    { label: '公开入口', value: `${worldYiStats.publicRouteCount} 个` },
  ];
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
          surface: 'assistant',
          reportId: reportId || null,
          eventId: eventId || null,
          intent: intentPreset?.key || null,
        }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="重新判断" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="grid gap-6 lg:grid-cols-[0.76fr_1.24fr]">
          <div className="space-y-5">
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
                  <span className="font-serif text-[color:var(--accent-strong)]">不要再回到泛 AI 问答。</span>
                </>
              )}
              description="这里是结果页之后的第二工作台，追问会优先围绕结构、阶段、环境和动作推进。"
              hint="建议先选一个专项，再开始提问，回答会更聚焦。"
              actions={[
                <Link key="chat-workbench" href="#chat-workbench" className="action-primary action-main">
                  立即开始追问
                </Link>,
                <Link key="report-or-profile" href={reportId ? `/result/${encodeURIComponent(reportId)}` : '/profile'} className="action-secondary">
                  {reportId ? '返回当前报告' : '查看我的档案'}
                </Link>,
                <Link key="events" href={reportId ? `/events?reportId=${encodeURIComponent(reportId)}` : '/events'} className="action-secondary">
                  管理关联事件
                </Link>,
              ]}
              highlights={scopeTags.map((item) => ({ body: item }))}
            />

            <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,237,226,0.92))] p-5 shadow-[0_18px_36px_rgba(23,32,51,0.06)]">
              <div className="section-label">
                <Layers3 className="h-3.5 w-3.5" />
                世界易追问协议
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {doctrineCards.map(([title, description]) => (
                  <div key={title} className="rounded-[1.25rem] bg-white/82 px-4 py-4">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{title}</div>
                    <div className="intro-copy mt-2">{description}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {scaleCards.map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] bg-white/82 px-4 py-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="action-guide mt-4">快捷入口</div>
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
                <Sparkles className="h-3.5 w-3.5" />
                四类专项追问
              </div>
              <p className="intro-copy mt-3">不要混着问，直接切到对应专项。</p>
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
                    <div className="intro-copy mt-2">{item.helper}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {workflowCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="soft-card rounded-[1.5rem] p-5">
                    <Icon className="h-5 w-5 text-[color:var(--accent-strong)]" />
                    <div className="mt-4 font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className="intro-copy mt-1">{item.description}</div>
                  </div>
                );
              })}

              <Suspense fallback={<ChatUpdatePanelSkeleton />}>
                <UpdatesStatusPanelWithQuery
                  compact
                  title="继续追问前，先看后续更新"
                  description="这里直接提示增强进度、月度更新和订阅状态。"
                />
              </Suspense>
            </div>
          </div>

          <div id="chat-workbench" className="glass-panel overflow-hidden rounded-[2rem]">
            <AIAssistantChat />
          </div>
        </section>
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
