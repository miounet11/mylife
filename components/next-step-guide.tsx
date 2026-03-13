'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CalendarClock, CheckCircle2, FolderHeart, Sparkles } from 'lucide-react';

interface NextStepGuideProps {
  reportId?: string;
  hasPendingValidation?: boolean;
  hasDrift?: boolean;
}

export default function NextStepGuide({ reportId = '', hasPendingValidation = false, hasDrift = false }: NextStepGuideProps) {
  const nextActions = [
    {
      title: hasDrift ? '继续纠偏这份结果' : '继续追问这份结果',
      description: hasDrift
        ? '这份报告已经出现偏差样本，最该做的是回到 AI 咨询，把偏差拆成时机、执行和输入问题。'
        : '把报告里最模糊、最关键、最想验证的一条结论，立即带去 AI 咨询深问。',
      href: reportId ? `/chat?reportId=${encodeURIComponent(reportId)}` : '/chat',
      label: hasDrift ? '进入纠偏咨询' : '进入 AI 咨询',
      icon: Bot,
    },
    {
      title: hasPendingValidation ? '回收这份报告的验证结果' : '把窗口期落到事件里',
      description: hasPendingValidation
        ? '当前这份报告已经进入验证期，去事件中心补回结果，后续判断才会越来越准。'
        : '将今年的关键推进期、风险期、关系节点保存到事件日历，形成后续复访。',
      href: reportId ? `/events?reportId=${encodeURIComponent(reportId)}${hasPendingValidation ? '' : '&create=1'}` : '/events',
      label: hasPendingValidation ? '打开验证工作台' : '为这份报告建事件',
      icon: CalendarClock,
    },
    {
      title: '沉淀成长期档案',
      description: '把历史分析、重要事件和阶段趋势放进同一档案页，减少一次性使用。',
      href: '/profile',
      label: '查看我的档案',
      icon: FolderHeart,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-5">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              完成报告后的动作设计
            </div>
            <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
              真正降低流失，
              <span className="font-serif text-[color:var(--accent-strong)]">关键在报告之后。</span>
            </h2>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              用户看完报告时最容易离开，所以这里不再让用户自己想下一步，而是直接给出三条高价值动作路径。
            </p>

            <div className="space-y-3">
              {[
                '先追问一条最关键的判断。',
                '再把重要节点落地到事件。',
                '最终形成持续复访的个人档案。',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--accent)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {nextActions.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.title} className="soft-card rounded-[1.75rem] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Link href={action.href} className="rounded-full border border-[color:var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--muted)]">
                      推荐
                    </Link>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{action.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{action.description}</p>
                  <Link href={action.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
