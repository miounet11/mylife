import Link from 'next/link';
import { ImmersionMediaBand } from '@/components/brand/feature-immersion-hero';

type Props = {
  locale?: string | null;
  ctaLabel?: string;
};

/**
 * Homepage top band — immersion media + value prop + primary CTA into the form.
 * Linear-clean: branded room feel without icon spam.
 */
export function HomeHero({ ctaLabel = '免费开始测算' }: Props) {
  return (
    <section
      className="border-b border-[color:var(--hairline)] bg-[color:var(--paper)]"
      aria-label="产品介绍"
    >
      <div className="page-content-wide py-7 md:py-10">
        <ImmersionMediaBand surfaceKey="home" priority compact={false} className="mb-6" />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            Life K-Line · 人生K线
          </p>
          <h1 className="mt-2.5 text-[26px] font-bold leading-[1.2] tracking-[-0.03em] text-[color:var(--ink-1)] md:text-[34px] md:leading-[1.15]">
            免费看清结构、阶段与下一步
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-[1.65] text-[color:var(--ink-3)] md:text-[15px]">
            输入出生信息，生成人生 K 线与结构判断报告。不必先注册；账号密码 / Google
            可长期登录，邮箱可选绑定订阅。
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="#analyze-workspace"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--ink-1)] px-6 text-[14px] font-semibold text-white no-underline hover:opacity-90 hover:no-underline"
            >
              {ctaLabel}
            </Link>
            <Link
              href="#life-kline-showcase"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--hairline-strong)] bg-white px-5 text-[14px] font-medium text-[color:var(--ink-2)] no-underline hover:border-[color:var(--ink-1)] hover:no-underline"
            >
              先看示例 K 线
            </Link>
            <Link
              href="/login?source=home_hero&next=%2Fprofile"
              className="inline-flex h-11 items-center justify-center px-3 text-[13px] font-medium text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
            >
              登录 / 注册
            </Link>
          </div>

          <ol className="mx-auto mt-7 grid max-w-2xl gap-2 text-left sm:grid-cols-3">
            {[
              { n: '1', t: '填生辰', d: '日期即可，时辰可后补' },
              { n: '2', t: '出报告', d: '日主用神 · 人生K线' },
              { n: '3', t: '行动与分享', d: '下一步 · 邀请朋友测' },
            ].map((s) => (
              <li
                key={s.n}
                className="flex gap-2.5 rounded-[12px] border border-[color:var(--hairline)] bg-white px-3 py-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--bg-sunken)] text-[12px] font-bold text-[color:var(--ink-2)]">
                  {s.n}
                </span>
                <span>
                  <span className="block text-[13px] font-semibold text-[color:var(--ink-1)]">
                    {s.t}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[color:var(--ink-5)]">
                    {s.d}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
