import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// v5-D9 (2026-05-17) 替换首页旧 4-Stat 段：用"示例预览 + FAQ"提高首屏说服力
// v5-D60 (2026-05-21) 适配 FB 风三栏布局：放在中流卡片中，不再用 page-frame；
//   取消左右双列，改为单列（中流宽度 540 不够双列），每张内卡用 FB 硬边 + 3px 圆角。
// v5-D65 (2026-05-22) FAQ 拍平：去掉 details/summary 折叠，全部默认展开 —
//   SEO 抓取更稳（不再依赖 open 属性可见性），用户少一次点击直达答案。

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
    <div className="flex flex-col gap-2" id="sample-faq">
      {/* 示例预览卡 */}
      <section className="fb-card overflow-hidden">
        <div className="border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
          <div className="fb-section-title">{SAMPLE_PREVIEW.eyebrow}</div>
        </div>
        <div className="px-4 py-3">
          <h2 className="mb-3 text-[16px] font-bold leading-snug text-[color:var(--fb-ink-1)]">
            {SAMPLE_PREVIEW.headline}
          </h2>
          <div className="flex flex-col gap-2">
            {SAMPLE_PREVIEW.blocks.map((block) => (
              <div
                key={block.tag}
                className="rounded-[3px] border border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2"
              >
                <div className="inline-flex items-center rounded-[2px] bg-[color:var(--fb-blue)] px-1.5 py-0.5 text-xs font-bold text-white">
                  {block.tag}
                </div>
                <div className="mt-1.5 text-[13px] font-bold text-[color:var(--fb-ink-1)]">
                  {block.title}
                </div>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-[color:var(--fb-ink-3)]">
                  {block.body}
                </p>
              </div>
            ))}
          </div>
          <Link
            href={SAMPLE_PREVIEW.ctaHref}
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
          >
            {SAMPLE_PREVIEW.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* FAQ 卡 */}
      <section className="fb-card overflow-hidden">
        <div className="border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
          <div className="fb-section-title">填写前的 4 个问题</div>
        </div>
        <div className="px-4 py-3">
          <h2 className="mb-3 text-[16px] font-bold leading-snug text-[color:var(--fb-ink-1)]">
            常见疑虑先看这里
          </h2>
          <div className="flex flex-col gap-1.5">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.q}
                className="rounded-[3px] border border-[color:var(--fb-border)] bg-white px-3 py-2"
              >
                <div className="text-[13px] font-bold text-[color:var(--fb-ink-1)]">
                  {item.q}
                </div>
                <p className="mt-1 text-[12px] leading-[1.6] text-[color:var(--fb-ink-2)]">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
