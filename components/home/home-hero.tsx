import Link from 'next/link';
import { PrestigeBanner } from '@/components/brand/prestige-banner';

type Props = {
  locale?: string | null;
  eyebrow?: string;
  title?: string;
  description?: string;
  seal?: string;
  ctaLabel?: string;
};

/**
 * Ceremonial gold-on-black plate above the natal form.
 * Form keeps the page H1 — this band is brand chrome, not a second headline.
 */
export function HomeHero({
  locale,
  eyebrow,
  title,
  description,
  seal,
  ctaLabel = '免费开始测算',
}: Props) {
  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  return (
    <section
      className="border-b border-[color:var(--hairline)] bg-[color:var(--paper)]"
      aria-label={en ? 'Brand' : '品牌'}
    >
      <div className="page-content-wide py-4 md:py-5">
        <PrestigeBanner
          compact
          headingAs="p"
          priority
          eyebrow={eyebrow ?? (en ? 'Life K-Line' : 'Life K-Line · 人生K线')}
          title={title ?? (en ? 'Structure, stage, and the next move' : '结构判断 · 阶段与下一步')}
          description={
            description ??
            (en
              ? 'Decision research for overseas Chinese. Enter birth details — verifiable, not a fate guarantee.'
              : '海外华人决策研究。填出生信息即可生成人生K线；结论可回访，不是命运保证。')
          }
          seal={seal ?? (en ? 'Verifiable judgment' : '可回访验证')}
          actions={
            <>
              <Link href="#analyze-workspace">{ctaLabel}</Link>
              <Link href="#life-kline-showcase">{en ? 'See a sample curve' : '先看示例 K 线'}</Link>
            </>
          }
        />
      </div>
    </section>
  );
}
