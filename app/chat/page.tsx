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
              结果后的高价值承接页
            </div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              不让用户看完报告就离开，
              <span className="font-serif text-[color:var(--accent-strong)]">而是继续深问。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这个页面现在承担“二次留存”角色。报告看完后的犹豫、追问、验证，都应该在这里被接住。
            </p>

            <div className="grid gap-4">
              {[
                {
                  icon: Bot,
                  title: '连续上下文',
                  description: '历史问答会保留，用户不必反复解释自己的背景。',
                },
                {
                  icon: MessageSquareText,
                  title: '高频问题直达',
                  description: '预置问题帮助用户快速开启第一次对话，降低空白输入焦虑。',
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
