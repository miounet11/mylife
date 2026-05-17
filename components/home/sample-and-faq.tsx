import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Stack } from '@/components/ui/stack';

// v5-D9 (2026-05-17) 替换首页旧 4-Stat 段：用"示例预览 + FAQ"提高首屏说服力
// Why: 抽象数字（"3 层 / 600+ / 真太阳 / 可补全"）说服力低，访客更想看
//      "我会拿到什么样的页面 + 我担心的问题有没有解释"。
// How:
//  - 左：示例预览，用一份脱敏报告卡片化展示结构 / 阶段 / 动作三层
//  - 右：FAQ accordion 用原生 <details> 实现，无新依赖

const SAMPLE_PREVIEW = {
  eyebrow: '示例预览',
  headline: '一份报告会先给你这三件事',
  blocks: [
    {
      tag: '结构',
      title: '日主 · 格局 · 五行偏向',
      body: '从你的八字推出当前命局结构与日主。会标注五行强弱与喜用方向。',
    },
    {
      tag: '阶段',
      title: '当前 5 年 / 12 个月 / 30 天',
      body: '把大运 + 流年 + 流月 + 节气换算成你能直接看的时间地图。',
    },
    {
      tag: '动作',
      title: '今天该做的、要避开的',
      body: '不只是吉凶判断，会落到具体可验证的动作和验证项上。',
    },
  ],
  ctaHref: '/cases',
  ctaLabel: '看真实案例',
};

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: '我不知道准确的出生时辰怎么办？',
    a: '可以选择"未知时辰"，系统会跳过时柱相关推断，依然能给出年柱/月柱/日柱级别的结构判断；后续若你确认了时辰，可以重新填写一份。',
  },
  {
    q: '真太阳时校正会不会让结果差很多？',
    a: '会，尤其是西部地区或夜半子时附近的出生时间。系统按经纬度 + 节气分钟级修正，避免"时辰差一格"导致的格局误判。',
  },
  {
    q: '这是算命吗？输出能信吗？',
    a: '不是结果占卜，是结构 + 阶段 + 行动建议。判断都给可验证项：你按动作执行后会拿到反馈，下一份报告会基于事件回访做纠偏。',
  },
  {
    q: '我的出生信息会被存吗？谁能看到？',
    a: '默认报告对自己可见。可在档案里设置公开/私有；公开会在 /reports 上显示但不暴露你的真实姓名和地址。删除报告会同步清理事件和邮件订阅。',
  },
];

export default function HomeSampleAndFaq() {
  return (
    <section className="page-frame mt-10 md:mt-14">
      <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
        {/* 左：示例预览 */}
        <Card variant="default" padding="lg" className="bg-[color:var(--bg-elevated)]">
          <Eyebrow tone="brand" className="mb-3">
            {SAMPLE_PREVIEW.eyebrow}
          </Eyebrow>
          <h2 className="mb-4 text-lg font-black leading-snug text-[color:var(--ink-1)] md:text-xl">
            {SAMPLE_PREVIEW.headline}
          </h2>
          <Stack gap={3}>
            {SAMPLE_PREVIEW.blocks.map((block) => (
              <div
                key={block.tag}
                className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4"
              >
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--brand-strong)]">
                  {block.tag}
                </div>
                <div className="mt-2 text-sm font-bold text-[color:var(--ink-1)]">{block.title}</div>
                <p className="mt-1 text-xs leading-6 text-[color:var(--ink-4)]">{block.body}</p>
              </div>
            ))}
          </Stack>
          <Link
            href={SAMPLE_PREVIEW.ctaHref}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--brand-strong)] hover:text-[color:var(--brand-deep)]"
          >
            {SAMPLE_PREVIEW.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>

        {/* 右：FAQ */}
        <Card variant="default" padding="lg">
          <Eyebrow tone="muted" className="mb-3">
            填写前的 4 个问题
          </Eyebrow>
          <h2 className="mb-4 text-lg font-black leading-snug text-[color:var(--ink-1)] md:text-xl">
            常见疑虑先看这里
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-4 py-3 open:border-[color:var(--brand-soft-2)] open:bg-[color:var(--brand-tint)]/50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[color:var(--ink-1)]">
                  <span>{item.q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--ink-5)] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-xs leading-6 text-[color:var(--ink-3)]">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
