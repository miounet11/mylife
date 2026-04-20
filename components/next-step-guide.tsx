'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CalendarClock, CheckCircle2, FolderHeart, Sparkles } from 'lucide-react';
import { buildChatHref } from '@/lib/chat-entry';

interface NextStepGuideProps {
  reportId?: string;
  hasPendingValidation?: boolean;
  hasDrift?: boolean;
  canManage?: boolean;
}

export default function NextStepGuide({
  reportId = '',
  hasPendingValidation = false,
  hasDrift = false,
  canManage = false,
}: NextStepGuideProps) {
  const followupQuestion = hasDrift
    ? '这份报告已经出现偏差样本，请按结构、阶段、环境、动作四层帮我复盘：这次偏差更像时机问题、执行问题、环境问题，还是输入判断失真？'
    : '请围绕我这份报告里最关键的一条结论继续深问，按结构、阶段、环境、动作四层拆开：我现在最该先做什么，为什么，最需要防什么误判？';
  const nextActions = [
    {
      title: hasDrift ? '继续纠偏这份结果' : '继续追问这份结果',
      description: hasDrift
        ? '这份报告已经出现偏差样本，最该做的是回到结构追问，把偏差拆成时机、执行和输入问题。'
        : '把报告里最模糊、最关键、最想验证的一条结论，立即带去结构追问深问。',
      href: buildChatHref({
        reportId: reportId || undefined,
        question: followupQuestion,
        source: 'next_step_guide',
      }),
      label: hasDrift ? '进入纠偏追问' : '进入结构追问',
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
    {
      title: canManage ? '开启月度更新与升级提醒' : '建立你自己的长期节律档案',
      description: canManage
        ? '真正的留存不靠你记得回来，而靠系统在窗口变化、报告升级和内容更新时主动提醒你。'
        : '公开结果只能帮助你理解产品价值，真正适合长期使用的是建立自己的报告、事件和更新体系。',
      href: canManage ? '/updates' : '/analyze',
      label: canManage ? '管理订阅与邮件更新' : '开始我的判断',
      icon: Sparkles,
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

            <div className="space-y-3">
              {[
                '先追问一条最关键的判断。',
                '再把重要节点落地到事件。',
                '再建立月度回访与升级提醒。',
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
                    <Link href={action.href} className="product-chip">
                      推荐
                    </Link>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{action.title}</h3>
                  <Link href={action.href} className="action-secondary mt-5">
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
