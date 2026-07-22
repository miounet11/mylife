import Link from 'next/link';
import { AppPage } from '@/components/layout/app-page';
import { FocusHero } from '@/components/layout/focus-hero';

export default function NotFound() {
  return (
    <AppPage header={{ ctaHref: '/analyze', ctaLabel: '开始分析', compact: true }}>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 pb-20 md:py-14">
        <FocusHero
          eyebrow="404"
          title="页面未找到"
          description="链接可能已失效、地址写错，或内容已迁移。你可以从下面入口回到主流程。"
          actions={
            <>
              <Link
                href="/"
                className="rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-medium text-white"
              >
                返回首页
              </Link>
              <Link
                href="/analyze"
                className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm text-[color:var(--ink-1)]"
              >
                免费八字分析
              </Link>
              <Link
                href="/tools"
                className="text-sm text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                工具中心
              </Link>
              <Link
                href="/knowledge"
                className="text-sm text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                知识库
              </Link>
            </>
          }
        />
        <div className="fb-card space-y-3 p-5 text-sm text-[color:var(--ink-2)]">
          <p className="font-medium text-[color:var(--ink-1)]">常见去向</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              旧版「免费八字 / 排盘」入口已合并到{' '}
              <Link href="/analyze" className="underline underline-offset-2">
                /analyze
              </Link>
            </li>
            <li>
              流年 / 年度窗口见{' '}
              <Link href="/tools/timing-yearly-window" className="underline underline-offset-2">
                2026 流年工具
              </Link>
            </li>
            <li>
              会员与完整报告见{' '}
              <Link href="/membership" className="underline underline-offset-2">
                /membership
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </AppPage>
  );
}
