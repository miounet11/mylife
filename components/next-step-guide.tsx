'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CalendarClock, CheckCircle2, FolderHeart, Sparkles } from 'lucide-react';
import { buildChatHref } from '@/lib/chat-entry';

interface NextStepGuideProps {
  reportId?: string;
  hasPendingValidation?: boolean;
  hasDrift?: boolean;
  canManage?: boolean;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}

export default function NextStepGuide({
  reportId = '',
  hasPendingValidation = false,
  hasDrift = false,
  canManage = false,
  ctaStrategyKey,
  sourceFamily,
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
        ctaStrategyKey,
        sourceFamily,
      }),
      label: hasDrift ? '进入纠偏追问' : '进入结构追问',
      icon: Bot,
      highlight: hasDrift,
    },
    {
      title: hasPendingValidation ? '回收这份报告的验证结果' : '把窗口期落到事件里',
      description: hasPendingValidation
        ? '当前这份报告已经进入验证期，去事件中心补回结果，后续判断才会越来越准。'
        : '将今年的关键推进期、风险期、关系节点保存到事件日历，形成后续复访。',
      href: reportId ? `/events?reportId=${encodeURIComponent(reportId)}${hasPendingValidation ? '' : '&create=1'}` : '/events',
      label: hasPendingValidation ? '打开验证工作台' : '为这份报告建事件',
      icon: CalendarClock,
      highlight: hasPendingValidation,
    },
    {
      title: '沉淀成长期档案',
      description: '把历史分析、重要事件和阶段趋势放进同一档案页，减少一次性使用。',
      href: '/profile',
      label: '查看我的档案',
      icon: FolderHeart,
      highlight: false,
    },
    {
      title: canManage ? '开启月度更新与升级提醒' : '建立你自己的长期节律档案',
      description: canManage
        ? '真正的留存不靠你记得回来，而靠系统在窗口变化、报告升级和内容更新时主动提醒你。'
        : '公开结果只能帮助你理解产品价值，真正适合长期使用的是建立自己的报告、事件和更新体系。',
      href: canManage ? '/updates' : '/analyze',
      label: canManage ? '管理订阅与邮件更新' : '开始我的判断',
      icon: Sparkles,
      highlight: false,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3 w-3" />
              完成报告后的动作设计
            </div>
            <h2 className="text-xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-2xl">
              真正降低流失，<br />
              <span className="text-[color:var(--brand-strong)]">关键在报告之后</span>
            </h2>

            <div className="mt-3 space-y-1.5">
              {[
                '先追问一条最关键的判断',
                '再把重要节点落地到事件',
                '再建立月度回访与升级提醒',
                '最终形成持续复访的个人档案',
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2 text-xs leading-5"
                >
                  <span className="font-mono text-[10px] font-bold text-[color:var(--ink-5)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-[color:var(--brand)]" />
                  <span className="text-[color:var(--ink-2)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {nextActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.title}
                  className={`rounded-[var(--radius)] border p-4 transition ${
                    action.highlight
                      ? 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]'
                      : 'border-[color:var(--hairline)] bg-[color:var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] ${
                        action.highlight
                          ? 'border border-[color:var(--signal)] bg-[color:var(--paper)] text-[color:var(--signal-strong)]'
                          : 'border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {action.highlight ? (
                      <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--paper)] px-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
                        重要
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                    {action.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
                    {action.description}
                  </p>
                  <Link
                    href={action.href}
                    className="mt-3 inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-2.5 text-xs font-bold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3" />
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
