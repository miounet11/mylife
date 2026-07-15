import Link from 'next/link';

const STEPS = [
  {
    href: '/dimensions?source=journey_strip',
    match: '/dimensions',
    label: '十维度',
    activeKey: 'dimensions' as const,
  },
  {
    href: '/analyze?source=journey_strip',
    match: '/analyze',
    label: '完整报告',
    activeKey: 'analyze' as const,
  },
  {
    href: '/predictions?source=journey_strip',
    match: '/predictions',
    label: '预测回访',
    activeKey: 'predictions' as const,
  },
  {
    href: '/tools?source=journey_strip',
    match: '/tools',
    label: '工具',
    activeKey: 'tools' as const,
  },
  {
    href: '/knowledge?source=journey_strip',
    match: '/knowledge',
    label: '知识库',
    activeKey: 'content' as const,
  },
] as const;

/** Compact product path as text links — no numbered icon cells. */
export default function JourneyStrip({
  active = 'dimensions',
}: {
  active?: 'dimensions' | 'analyze' | 'predictions' | 'tools' | 'content';
}) {
  return (
    <nav
      aria-label="产品路径"
      className="mb-5 flex flex-wrap gap-x-4 gap-y-1 border-b border-[color:var(--hairline)] pb-3 text-[13px]"
    >
      {STEPS.map((step) => {
        const isActive = active === step.activeKey;
        return (
          <Link
            key={step.match}
            href={step.href}
            className={
              isActive
                ? 'font-medium text-[color:var(--ink-1)] no-underline'
                : 'text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline'
            }
            aria-current={isActive ? 'page' : undefined}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
