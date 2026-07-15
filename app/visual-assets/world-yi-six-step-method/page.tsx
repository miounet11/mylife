import type { Metadata } from 'next';
import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';

export const metadata: Metadata = {
  title: '世界易六步判断法｜图解',
  description: '结构、时位、环境、动作、风险五步判断框架的可视化导读。',
  alternates: { canonical: '/visual-assets/world-yi-six-step-method' },
};

const STEPS = [
  { n: 1, title: '定问题', body: '先明确你要验证的一件事，而不是笼统问「好不好」。' },
  { n: 2, title: '读结构', body: '日主、格局、用神描述的是结构张力，不是吉凶标签。' },
  { n: 3, title: '看时位', body: '大运流年标记阶段：适合启动、调整、收尾还是恢复。' },
  { n: 4, title: '叠环境', body: '地理、行业、关系角色构成环境层，会放大或压制结构。' },
  { n: 5, title: '落动作', body: '把判断拆成 1–3 个本周可执行动作，并记录验证节点。' },
  { n: 6, title: '标风险', body: '明确可信度边界：时辰未知、阶段交界、信息不足时的保守策略。' },
];

export default function WorldYiSixStepPage() {
  return (
    <AppPage header={{ ctaHref: '/learn/intro', ctaLabel: '入门学习轨' }}>
      <FocusHero
        eyebrow="图解"
        title="世界易六步判断法"
        description="从问题到动作的结构化阅读路径，适合配合第一份报告使用。"
      />
      <section className="fb-card p-4 md:p-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--brand-soft)] to-white p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--brand)] text-sm font-black text-white">
                {step.n}
              </div>
              <h2 className="mt-3 text-[15px] font-bold text-[color:var(--ink-1)]">{step.title}</h2>
              <p className="mt-2 text-[13px] leading-[1.55] text-[color:var(--ink-3)]">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/knowledge/world-yi-methodology" className="fb-btn h-9 px-4 text-sm hover:no-underline">
            阅读完整方法论
          </Link>
          <Link href="/analyze" className="fb-btn fb-btn-primary h-9 px-4 text-sm hover:no-underline">
            生成第一份报告
          </Link>
        </div>
      </section>
    </AppPage>
  );
}