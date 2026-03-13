'use client';

import dynamic from 'next/dynamic';
import { Bot, MessageSquareText, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

const AIAssistantChat = dynamic(() => import('@/components/ai-assistant-chat'), {
  loading: () => <ChatSkeleton />,
});

export default function ChatPage() {
  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/analyze" ctaLabel="重新测算" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              看完报告继续问
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              把你最关心的问题继续问清楚，
              <span className="font-serif text-[color:var(--accent-strong)]">不要只停在报告第一页。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              适合继续问事业、关系、财富、时间窗口这些具体问题，也可以顺手把关键提醒记下来。
            </p>

            <div className="grid gap-4">
              {[
                {
                  icon: Bot,
                  title: '围绕你的报告继续问',
                  description: '系统会优先带入最近报告里的重点判断，让回答更贴近你的情况。',
                },
                {
                  icon: MessageSquareText,
                  title: '把提醒顺手记下来',
                  description: '重要时间点、建议动作和现实结果都可以直接记下，后面更方便回看。',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="soft-card rounded-[1.5rem] p-5">
                    <Icon className="h-5 w-5 text-[color:var(--accent-strong)]" />
                    <div className="mt-4 font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className="mt-1 text-sm leading-7 text-[color:var(--muted)]">{item.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel overflow-hidden rounded-[2rem]">
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
    <div className="p-6 space-y-4">
      <div className="h-16 animate-pulse rounded-[1.5rem] bg-slate-200" />
      <div className="h-96 animate-pulse rounded-[1.75rem] bg-slate-200" />
      <div className="h-16 animate-pulse rounded-[1.5rem] bg-slate-200" />
    </div>
  );
}
