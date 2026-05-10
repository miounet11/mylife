# 文章 → 测算转化漏斗 A 阶段 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 文章页加 inline CTA 卡片 + sticky CTA + scrollDepth 埋点，把文章→测算转化率从 2.4% 拉到 6%+。

**Architecture:** 在 `app/knowledge/[slug]`、`app/cases/[slug]`、`app/insights/[type]/[slug]` 三类文章页挂载三个客户端组件（inline CTA、sticky CTA、scroll tracker）。CTA 文案按 contentType 区分，跳转沿用现有 `/analyze?from=...&surface=...` 路径。新增 4 个埋点事件（`article_scroll_depth`/`article_cta_impressed`/`article_cta_clicked`/`article_session_end`）写入 `analytics_events` 表，无 schema 变更。Feature flag `NEXT_PUBLIC_ARTICLE_CTA_V1` 控制灰度。

**Tech Stack:** Next.js 15 App Router、React 19、TypeScript、IntersectionObserver、SQLite analytics_events 表、现有 `trackClientEvent` 客户端埋点。

**Spec:** `docs/superpowers/specs/2026-05-10-article-to-analyze-funnel-design.md`

---

## File Structure

```
lib/
├── article-cta.ts                  NEW  插入位置算法 + 文案配置 + flag 读取
└── seo/article-funnel.ts           NEW  funnel 反向分析脚本

components/article/
├── article-inline-cta.tsx          NEW  插入卡客户端组件
├── article-sticky-cta.tsx          NEW  sticky 客户端组件
└── article-scroll-tracker.tsx      NEW  滚动深度+session 埋点客户端组件

app/knowledge/[slug]/page.tsx       MOD  挂载 3 组件 + 注入 surfaceKey
app/cases/[slug]/page.tsx           MOD  同上
app/insights/[type]/[slug]/page.tsx MOD  同上

lib/analytics.ts                    MOD  AnalyticsEventName union 加 4 个事件名
.env.example                        MOD  加 NEXT_PUBLIC_ARTICLE_CTA_V1
ecosystem.config.js                 MOD  同上

tests/lib/article-cta.test.ts       NEW
tests/lib/article-funnel.test.ts    NEW

package.json                        MOD  加 npm run seo:article-funnel
```

设计原则：
- 客户端组件在 `components/article/` 集中，便于后续 B 阶段加 personalized CTA 时同目录扩展
- `lib/article-cta.ts` 是纯逻辑（算法 + 配置），不依赖 React，可被组件和 SSR 共用、易测试
- `lib/seo/article-funnel.ts` 沿用 v5-A8 BOT_PRED 隔离机器人

---

## Task 1: AnalyticsEventName 加新事件名

**Files:**
- Modify: `lib/analytics.ts:6-67`

- [ ] **Step 1: 加 4 个新事件名到 AnalyticsEventName union**

修改 `lib/analytics.ts` 中的 `AnalyticsEventName` 联合类型，在 `'report_followup_augmented'` 之后追加 4 个新事件：

```typescript
export type AnalyticsEventName =
  | 'home_page_viewed'
  // ... 其他保持不变 ...
  | 'report_followup_augmented'
  | 'article_scroll_depth'
  | 'article_cta_impressed'
  | 'article_cta_clicked'
  | 'article_session_end';
```

- [ ] **Step 2: 运行 lint 验证**

Run: `npm run lint`
Expected: 0 错误

- [ ] **Step 3: 运行 tsc 验证**

Run: `npx tsc --noEmit lib/analytics.ts 2>&1 | head -3`
Expected: 没有 lib/analytics.ts 自身的错误（已有 jose 类型错误是无关项目错误，可忽略）

- [ ] **Step 4: 提交**

```bash
git add lib/analytics.ts
git commit -m "feat(analytics): 增加文章漏斗 4 个埋点事件名

- article_scroll_depth (25/50/75/100% 里程碑)
- article_cta_impressed (CTA 入视口)
- article_cta_clicked (CTA 被点击)
- article_session_end (页面离开 timeOnPage + maxDepth)"
```

---

## Task 2: 文案配置和插入位置算法

**Files:**
- Create: `lib/article-cta.ts`
- Test: `tests/lib/article-cta.test.ts`

- [ ] **Step 1: 写失败测试**

Create `tests/lib/article-cta.test.ts`:

```typescript
import { findInjectionPoint, ARTICLE_CTA_COPY, isArticleCtaEnabled } from '@/lib/article-cta';

describe('findInjectionPoint', () => {
  it('returns 2 (after 3rd section) when sections >= 4 and total chars >= 800', () => {
    const sections = [
      { content: 'a'.repeat(300) },
      { content: 'b'.repeat(300) },
      { content: 'c'.repeat(300) },
      { content: 'd'.repeat(300) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: 2 });
  });

  it('returns -1 when sections < 4', () => {
    const sections = [
      { content: 'a'.repeat(500) },
      { content: 'b'.repeat(500) },
      { content: 'c'.repeat(500) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: -1 });
  });

  it('returns -1 when total chars < 800', () => {
    const sections = [
      { content: 'a'.repeat(50) },
      { content: 'b'.repeat(50) },
      { content: 'c'.repeat(50) },
      { content: 'd'.repeat(50) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: -1 });
  });

  it('returns -1 when any section has meta.inlineCtaSuppressed=true', () => {
    const sections = [
      { content: 'a'.repeat(300) },
      { content: 'b'.repeat(300) },
      { content: 'c'.repeat(300), meta: { inlineCtaSuppressed: true } },
      { content: 'd'.repeat(300) },
    ];
    expect(findInjectionPoint(sections)).toEqual({ injectAfterIndex: -1 });
  });

  it('handles empty sections', () => {
    expect(findInjectionPoint([])).toEqual({ injectAfterIndex: -1 });
  });
});

describe('ARTICLE_CTA_COPY', () => {
  it('has knowledge / case / insight inline+sticky文案', () => {
    for (const k of ['knowledge', 'case', 'insight'] as const) {
      expect(ARTICLE_CTA_COPY[k].inline.headline).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].inline.subline).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].inline.button).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].sticky.headline).toBeTruthy();
      expect(ARTICLE_CTA_COPY[k].sticky.button).toBeTruthy();
    }
  });
});

describe('isArticleCtaEnabled', () => {
  const original = process.env.NEXT_PUBLIC_ARTICLE_CTA_V1;
  afterEach(() => { process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = original; });

  it('returns true when env=1', () => {
    process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = '1';
    expect(isArticleCtaEnabled()).toBe(true);
  });

  it('returns false when env=0 or undefined', () => {
    process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = '0';
    expect(isArticleCtaEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 = undefined;
    expect(isArticleCtaEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx jest tests/lib/article-cta.test.ts -v 2>&1 | tail -20`
Expected: FAIL with `Cannot find module '@/lib/article-cta'`

- [ ] **Step 3: 实现 lib/article-cta.ts**

Create `lib/article-cta.ts`:

```typescript
export type ArticleContentType = 'knowledge' | 'case' | 'insight';

export interface ArticleCtaCopy {
  inline: {
    headline: string;
    subline: string;
    button: string;
  };
  sticky: {
    headline: string;
    button: string;
  };
}

export const ARTICLE_CTA_COPY: Record<ArticleContentType, ArticleCtaCopy> = {
  knowledge: {
    inline: {
      headline: '你是不是也这样？',
      subline: '30 秒拿到属于你的判断',
      button: '现在测一下',
    },
    sticky: { headline: '想知道你自己的版本？', button: '开始测算' },
  },
  case: {
    inline: {
      headline: '你的命局是这种结构吗？',
      subline: '30 秒看你的真实版本',
      button: '看我的判断',
    },
    sticky: { headline: '看你自己的命局判断', button: '现在开始' },
  },
  insight: {
    inline: {
      headline: '这个洞察对你成立吗？',
      subline: '30 秒检验一下你自己',
      button: '验证一下',
    },
    sticky: { headline: '检验是否对你成立', button: '开始测算' },
  },
};

export interface ArticleSection {
  content?: string;
  meta?: { inlineCtaSuppressed?: boolean };
}

export interface InjectionPoint {
  injectAfterIndex: number;
}

const MIN_SECTIONS = 4;
const MIN_TOTAL_CHARS = 800;

export function findInjectionPoint(sections: ArticleSection[] | undefined | null): InjectionPoint {
  if (!sections || sections.length < MIN_SECTIONS) {
    return { injectAfterIndex: -1 };
  }

  if (sections.some((s) => s?.meta?.inlineCtaSuppressed === true)) {
    return { injectAfterIndex: -1 };
  }

  const totalChars = sections.reduce((acc, s) => acc + (s?.content?.length || 0), 0);
  if (totalChars < MIN_TOTAL_CHARS) {
    return { injectAfterIndex: -1 };
  }

  return { injectAfterIndex: 2 };
}

export function isArticleCtaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 === '1';
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx jest tests/lib/article-cta.test.ts -v 2>&1 | tail -15`
Expected: PASS — all 9 tests pass

- [ ] **Step 5: 提交**

```bash
git add lib/article-cta.ts tests/lib/article-cta.test.ts
git commit -m "feat(article-cta): 文案配置和插入位置算法 + flag

- ARTICLE_CTA_COPY: knowledge/case/insight 三套 inline+sticky 文案
- findInjectionPoint: sections<4 / chars<800 / inlineCtaSuppressed 时返回 -1
- isArticleCtaEnabled: 读取 NEXT_PUBLIC_ARTICLE_CTA_V1"
```

---

## Task 3: ArticleScrollTracker 客户端组件

**Files:**
- Create: `components/article/article-scroll-tracker.tsx`

- [ ] **Step 1: 实现组件**

Create `components/article/article-scroll-tracker.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';

interface ArticleScrollTrackerProps {
  surfaceKey: string;
  slug: string;
  contentType: 'knowledge' | 'case' | 'insight';
}

const DEPTH_MILESTONES = [25, 50, 75, 100];

export default function ArticleScrollTracker({ surfaceKey, slug, contentType }: ArticleScrollTrackerProps) {
  const sentDepths = useRef<Set<number>>(new Set());
  const startedAt = useRef<number>(performance.now());
  const maxDepth = useRef<number>(0);
  const ctaImpressed = useRef<boolean>(false);
  const ctaClicked = useRef<boolean>(false);

  useEffect(() => {
    const onCtaImpressed = () => { ctaImpressed.current = true; };
    const onCtaClicked = () => { ctaClicked.current = true; };
    window.addEventListener('article-cta-impressed', onCtaImpressed);
    window.addEventListener('article-cta-clicked', onCtaClicked);

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const computeDepth = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollable = docHeight - viewportHeight;
      if (scrollable <= 0) return 100;
      return Math.min(100, Math.round(((scrollTop + viewportHeight) / docHeight) * 100));
    };

    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        const depth = computeDepth();
        if (depth > maxDepth.current) maxDepth.current = depth;

        for (const milestone of DEPTH_MILESTONES) {
          if (depth >= milestone && !sentDepths.current.has(milestone)) {
            sentDepths.current.add(milestone);
            trackClientEvent({
              eventName: 'article_scroll_depth',
              page: window.location.pathname,
              meta: { surfaceKey, slug, contentType, depth: milestone },
            });
          }
        }
      }, 200);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const reportSessionEnd = () => {
      const timeOnPage_ms = Math.round(performance.now() - startedAt.current);
      trackClientEvent({
        eventName: 'article_session_end',
        page: window.location.pathname,
        meta: {
          surfaceKey,
          slug,
          contentType,
          timeOnPage_ms,
          maxDepth: maxDepth.current,
          ctaImpressed: ctaImpressed.current,
          ctaClicked: ctaClicked.current,
        },
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') reportSessionEnd();
    };

    window.addEventListener('beforeunload', reportSessionEnd);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('article-cta-impressed', onCtaImpressed);
      window.removeEventListener('article-cta-clicked', onCtaClicked);
      window.removeEventListener('beforeunload', reportSessionEnd);
      document.removeEventListener('visibilitychange', onVisibility);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [surfaceKey, slug, contentType]);

  return null;
}
```

- [ ] **Step 2: 运行 lint**

Run: `npm run lint`
Expected: 0 错误

- [ ] **Step 3: 提交**

```bash
git add components/article/article-scroll-tracker.tsx
git commit -m "feat(article-cta): ArticleScrollTracker 滚动深度+session 埋点

- 25/50/75/100% 里程碑去重上报
- beforeunload + visibilitychange 双路径上报 article_session_end
- 通过 window 事件感知 cta_impressed / cta_clicked"
```

---

## Task 4: ArticleInlineCTA 客户端组件

**Files:**
- Create: `components/article/article-inline-cta.tsx`

- [ ] **Step 1: 实现组件**

Create `components/article/article-inline-cta.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ARTICLE_CTA_COPY, type ArticleContentType } from '@/lib/article-cta';

interface ArticleInlineCTAProps {
  surfaceKey: string;
  slug: string;
  contentType: ArticleContentType;
}

export default function ArticleInlineCTA({ surfaceKey, slug, contentType }: ArticleInlineCTAProps) {
  const ref = useRef<HTMLDivElement>(null);
  const impressed = useRef<boolean>(false);
  const copy = ARTICLE_CTA_COPY[contentType];

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressed.current) {
            impressed.current = true;
            trackClientEvent({
              eventName: 'article_cta_impressed',
              page: window.location.pathname,
              meta: { surfaceKey, slug, contentType, position: 'inline' },
            });
            window.dispatchEvent(new CustomEvent('article-cta-impressed', {
              detail: { surfaceKey, position: 'inline' },
            }));
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [surfaceKey, slug, contentType]);

  const handleClick = () => {
    trackClientEvent({
      eventName: 'article_cta_clicked',
      page: window.location.pathname,
      meta: { surfaceKey, slug, contentType, position: 'inline' },
    });
    trackClientEvent({
      eventName: 'content_quick_analyze_started',
      page: window.location.pathname,
      meta: {
        surfaceKey,
        sourceKey: surfaceKey,
        sourceLabel: '文章页内联快速分析',
        contentType,
        slug,
        position: 'inline',
      },
    });
    window.dispatchEvent(new CustomEvent('article-cta-clicked', {
      detail: { surfaceKey, position: 'inline' },
    }));
  };

  const href = `/analyze?from=${encodeURIComponent(surfaceKey)}&surface=inline-card`;

  return (
    <div
      ref={ref}
      data-article-inline-cta
      className="my-8 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-tint)] p-5 md:p-6"
    >
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <Sparkles className="h-3 w-3" />
        亲身验证
      </div>
      <h3 className="mt-2 text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
        {copy.inline.headline}
      </h3>
      <p className="mt-1 text-sm text-[color:var(--ink-2)]">{copy.inline.subline}</p>
      <Link
        href={href}
        onClick={handleClick}
        className="mt-4 inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-strong)] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      >
        {copy.inline.button}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: 运行 lint**

Run: `npm run lint`
Expected: 0 错误

- [ ] **Step 3: 提交**

```bash
git add components/article/article-inline-cta.tsx
git commit -m "feat(article-cta): ArticleInlineCTA 文中插入卡组件

- IntersectionObserver 检测 50% 入视口，去重发 article_cta_impressed
- 点击同时发 article_cta_clicked + content_quick_analyze_started
- window CustomEvent 通知 sticky/tracker 兄弟组件"
```

---

## Task 5: ArticleStickyCTA 客户端组件

**Files:**
- Create: `components/article/article-sticky-cta.tsx`

- [ ] **Step 1: 实现组件**

Create `components/article/article-sticky-cta.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ARTICLE_CTA_COPY, type ArticleContentType } from '@/lib/article-cta';

interface ArticleStickyCTAProps {
  surfaceKey: string;
  slug: string;
  contentType: ArticleContentType;
}

const DISMISSED_KEY_PREFIX = 'article-sticky-dismissed:';
const SHOW_AFTER_SCROLL_PX = 200;

export default function ArticleStickyCTA({ surfaceKey, slug, contentType }: ArticleStickyCTAProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const impressed = useRef<boolean>(false);
  const copy = ARTICLE_CTA_COPY[contentType];

  useEffect(() => {
    const dismissedKey = `${DISMISSED_KEY_PREFIX}${slug}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dismissedKey) === '1') {
      setDismissed(true);
      return;
    }

    const onScroll = () => {
      if (window.scrollY >= SHOW_AFTER_SCROLL_PX && !visible) {
        setVisible(true);
        if (!impressed.current) {
          impressed.current = true;
          trackClientEvent({
            eventName: 'article_cta_impressed',
            page: window.location.pathname,
            meta: { surfaceKey, slug, contentType, position: 'sticky' },
          });
        }
      }
    };

    const onInlineImpressed = () => setFadingOut(true);
    const onScrollToBottom = () => {
      const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (remaining < 100) setFadingOut(false);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScrollToBottom, { passive: true });
    window.addEventListener('article-cta-impressed', onInlineImpressed);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScrollToBottom);
      window.removeEventListener('article-cta-impressed', onInlineImpressed);
    };
  }, [surfaceKey, slug, contentType, visible]);

  if (dismissed || !visible) return null;

  const handleClick = () => {
    trackClientEvent({
      eventName: 'article_cta_clicked',
      page: window.location.pathname,
      meta: { surfaceKey, slug, contentType, position: 'sticky' },
    });
    trackClientEvent({
      eventName: 'content_quick_analyze_started',
      page: window.location.pathname,
      meta: {
        surfaceKey,
        sourceKey: surfaceKey,
        sourceLabel: '文章页 Sticky 快速分析',
        contentType,
        slug,
        position: 'sticky',
      },
    });
    window.dispatchEvent(new CustomEvent('article-cta-clicked', {
      detail: { surfaceKey, position: 'sticky' },
    }));
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`${DISMISSED_KEY_PREFIX}${slug}`, '1');
    }
  };

  const href = `/analyze?from=${encodeURIComponent(surfaceKey)}&surface=sticky`;

  return (
    <div
      className={`fixed z-40 transition-opacity duration-200 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto md:w-[260px]`}
    >
      <div className="relative bg-[color:var(--paper)] border-t border-[color:var(--brand-soft-2)] md:rounded-[var(--radius-md)] md:border md:shadow-lg p-3 md:p-4 flex md:flex-col items-center md:items-start gap-3 md:gap-2">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="关闭"
          className="absolute top-1 right-1 md:top-2 md:right-2 p-1 text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="flex-1 md:flex-initial text-sm md:text-base font-bold text-[color:var(--ink-1)] pr-6 md:pr-0">
          {copy.sticky.headline}
        </p>
        <Link
          href={href}
          onClick={handleClick}
          className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-strong)] px-4 py-2 text-sm font-bold text-white whitespace-nowrap"
        >
          {copy.sticky.button}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 运行 lint**

Run: `npm run lint`
Expected: 0 错误

- [ ] **Step 3: 提交**

```bash
git add components/article/article-sticky-cta.tsx
git commit -m "feat(article-cta): ArticleStickyCTA 状态机 + 关闭按钮

- hidden→visible (滚>200px) → fading-out (inline 入视口) → visible (滚到底)
- sessionStorage 记忆关闭，本会话不再出现
- 移动底部 fixed bar / 桌面右下 floating card"
```

---

## Task 6: 挂载到 knowledge 文章页

**Files:**
- Modify: `app/knowledge/[slug]/page.tsx`

- [ ] **Step 1: 在 page.tsx 顶部加导入**

找到现有 import 区，在 `import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';` 之后加入：

```tsx
import ArticleInlineCTA from '@/components/article/article-inline-cta';
import ArticleStickyCTA from '@/components/article/article-sticky-cta';
import ArticleScrollTracker from '@/components/article/article-scroll-tracker';
import { findInjectionPoint, isArticleCtaEnabled } from '@/lib/article-cta';
```

- [ ] **Step 2: 在 default export 函数体内组装变量**

在已有 `entry`/`article` 解构之后（具体行号取决于现有代码，搜索 `const article =` 或 `if (!article)`），加入：

```tsx
const ctaEnabled = isArticleCtaEnabled();
const surfaceKey = `knowledge_article:${article.slug}`;
const inlineCtaPoint = ctaEnabled ? findInjectionPoint(article.sections) : { injectAfterIndex: -1 };
```

- [ ] **Step 3: 在 sections 渲染循环里插入 inline CTA**

找到 sections 渲染处（搜 `article.sections.map(`）。把循环结构改成：

```tsx
{article.sections.map((section, index) => (
  <Fragment key={section.id || index}>
    <SectionRenderer section={section} />
    {ctaEnabled && index === inlineCtaPoint.injectAfterIndex && (
      <ArticleInlineCTA surfaceKey={surfaceKey} slug={article.slug} contentType="knowledge" />
    )}
  </Fragment>
))}
```

注意：现有代码可能用 `<></>` 直接渲染或用 div 包裹。**保留现有 SectionRenderer 调用方式不变**，只把外层包成 Fragment 加条件 inline CTA。如果现有循环已用 `<Fragment>`，就在 SectionRenderer 之后补条件渲染即可。

- [ ] **Step 4: 在 page 末尾挂 sticky 和 tracker（在 SiteFooter 之前）**

```tsx
{ctaEnabled && (
  <>
    <ArticleScrollTracker surfaceKey={surfaceKey} slug={article.slug} contentType="knowledge" />
    <ArticleStickyCTA surfaceKey={surfaceKey} slug={article.slug} contentType="knowledge" />
  </>
)}
<SiteFooter />
```

- [ ] **Step 5: 运行 lint + build**

Run: `npm run lint && npm run build 2>&1 | tail -10`
Expected: lint 0 错误，build 成功

- [ ] **Step 6: 提交**

```bash
git add app/knowledge/[slug]/page.tsx
git commit -m "feat(article-cta): knowledge 文章页挂载 inline+sticky+tracker

flag-gated by NEXT_PUBLIC_ARTICLE_CTA_V1，默认关闭"
```

---

## Task 7: 挂载到 cases 文章页

**Files:**
- Modify: `app/cases/[slug]/page.tsx`

- [ ] **Step 1: 同 Task 6 步骤 1，但 surfaceKey 前缀改成 case_article**

```tsx
import ArticleInlineCTA from '@/components/article/article-inline-cta';
import ArticleStickyCTA from '@/components/article/article-sticky-cta';
import ArticleScrollTracker from '@/components/article/article-scroll-tracker';
import { findInjectionPoint, isArticleCtaEnabled } from '@/lib/article-cta';
```

- [ ] **Step 2: 组装变量（contentType 改成 case）**

```tsx
const ctaEnabled = isArticleCtaEnabled();
const surfaceKey = `case_article:${article.slug}`;
const inlineCtaPoint = ctaEnabled ? findInjectionPoint(article.sections) : { injectAfterIndex: -1 };
```

- [ ] **Step 3: 在 sections 循环中插入 inline，传 contentType="case"**

```tsx
{ctaEnabled && index === inlineCtaPoint.injectAfterIndex && (
  <ArticleInlineCTA surfaceKey={surfaceKey} slug={article.slug} contentType="case" />
)}
```

- [ ] **Step 4: 末尾挂 sticky + tracker，contentType="case"**

```tsx
{ctaEnabled && (
  <>
    <ArticleScrollTracker surfaceKey={surfaceKey} slug={article.slug} contentType="case" />
    <ArticleStickyCTA surfaceKey={surfaceKey} slug={article.slug} contentType="case" />
  </>
)}
```

- [ ] **Step 5: lint + build**

Run: `npm run lint && npm run build 2>&1 | tail -5`
Expected: 通过

- [ ] **Step 6: 提交**

```bash
git add app/cases/[slug]/page.tsx
git commit -m "feat(article-cta): cases 文章页挂载 inline+sticky+tracker"
```

---

## Task 8: 挂载到 insights 文章页

**Files:**
- Modify: `app/insights/[type]/[slug]/page.tsx`

- [ ] **Step 1: 加导入**

```tsx
import ArticleInlineCTA from '@/components/article/article-inline-cta';
import ArticleStickyCTA from '@/components/article/article-sticky-cta';
import ArticleScrollTracker from '@/components/article/article-scroll-tracker';
import { findInjectionPoint, isArticleCtaEnabled } from '@/lib/article-cta';
```

- [ ] **Step 2: 组装变量**

```tsx
const ctaEnabled = isArticleCtaEnabled();
const surfaceKey = `insight_article:${article.slug}`;
const inlineCtaPoint = ctaEnabled ? findInjectionPoint(article.sections) : { injectAfterIndex: -1 };
```

- [ ] **Step 3: 插入 inline，contentType="insight"**

```tsx
{ctaEnabled && index === inlineCtaPoint.injectAfterIndex && (
  <ArticleInlineCTA surfaceKey={surfaceKey} slug={article.slug} contentType="insight" />
)}
```

- [ ] **Step 4: 末尾挂 sticky + tracker，contentType="insight"**

```tsx
{ctaEnabled && (
  <>
    <ArticleScrollTracker surfaceKey={surfaceKey} slug={article.slug} contentType="insight" />
    <ArticleStickyCTA surfaceKey={surfaceKey} slug={article.slug} contentType="insight" />
  </>
)}
```

- [ ] **Step 5: lint + build**

Run: `npm run lint && npm run build 2>&1 | tail -5`
Expected: 通过

- [ ] **Step 6: 提交**

```bash
git add app/insights/[type]/[slug]/page.tsx
git commit -m "feat(article-cta): insights 文章页挂载 inline+sticky+tracker"
```

---

## Task 9: 加 feature flag 到 env 配置

**Files:**
- Modify: `.env.example`
- Modify: `ecosystem.config.js`

- [ ] **Step 1: 在 .env.example 末尾加变量**

在文件末尾追加：

```
# 文章漏斗 v1（A 阶段）灰度开关
# 0 = 关闭，1 = 启用 inline CTA + sticky + scrollDepth 埋点
NEXT_PUBLIC_ARTICLE_CTA_V1=0
```

- [ ] **Step 2: 在 ecosystem.config.js 的 env 块加同样变量**

找到 `nextApp.env` 块（约 22 行起），在 `OPEN_AGENT_RUNTIME_ENABLED` 之后加：

```javascript
NEXT_PUBLIC_ARTICLE_CTA_V1: process.env.NEXT_PUBLIC_ARTICLE_CTA_V1 || '0',
```

- [ ] **Step 3: 提交**

```bash
git add .env.example ecosystem.config.js
git commit -m "feat(env): 加 NEXT_PUBLIC_ARTICLE_CTA_V1 灰度 flag

默认 0；A 阶段验收通过 14 天后改默认 1"
```

---

## Task 10: 漏斗反向分析脚本

**Files:**
- Create: `lib/seo/article-funnel.ts`
- Create: `tests/lib/article-funnel.test.ts`
- Modify: `package.json`

- [ ] **Step 1: 写失败测试**

Create `tests/lib/article-funnel.test.ts`:

```typescript
import { computeArticleFunnel } from '@/lib/seo/article-funnel';

describe('computeArticleFunnel', () => {
  it('computes view→impressed→clicked→started conversion correctly', () => {
    const events = [
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
      { event_name: 'article_cta_impressed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a","position":"inline"}' },
      { event_name: 'article_cta_clicked', meta: '{"surfaceKey":"knowledge_article:a","slug":"a","position":"inline"}' },
      { event_name: 'content_quick_analyze_started', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
    ];

    const result = computeArticleFunnel(events);
    expect(result.totals.views).toBe(2);
    expect(result.totals.impressed).toBe(1);
    expect(result.totals.clicked).toBe(1);
    expect(result.totals.started).toBe(1);
    expect(result.conversionRate).toBeCloseTo(0.5, 2);
  });

  it('handles 0 views without divide-by-zero', () => {
    const result = computeArticleFunnel([]);
    expect(result.totals.views).toBe(0);
    expect(result.conversionRate).toBe(0);
  });

  it('groups by surfaceKey for top articles', () => {
    const events = [
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
      { event_name: 'knowledge_article_viewed', meta: '{"surfaceKey":"knowledge_article:b","slug":"b"}' },
      { event_name: 'content_quick_analyze_started', meta: '{"surfaceKey":"knowledge_article:a","slug":"a"}' },
    ];
    const result = computeArticleFunnel(events);
    const topA = result.bySurface.find((s) => s.surfaceKey === 'knowledge_article:a');
    expect(topA?.views).toBe(1);
    expect(topA?.started).toBe(1);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npx jest tests/lib/article-funnel.test.ts -v 2>&1 | tail -10`
Expected: FAIL — module not found

- [ ] **Step 3: 实现 lib/seo/article-funnel.ts**

Create `lib/seo/article-funnel.ts`:

```typescript
import path from 'node:path';
import process from 'node:process';
import Database from 'better-sqlite3';

interface AnalyticsEventRow {
  event_name: string;
  meta: string | null;
}

interface SurfaceFunnelRow {
  surfaceKey: string;
  slug: string;
  views: number;
  impressed: number;
  clicked: number;
  started: number;
  conversionRate: number;
}

export interface ArticleFunnelResult {
  totals: {
    views: number;
    impressed: number;
    clicked: number;
    started: number;
  };
  conversionRate: number;
  bySurface: SurfaceFunnelRow[];
}

const VIEW_EVENTS = new Set([
  'knowledge_article_viewed',
  'case_article_viewed',
  'insight_article_viewed',
]);

export function computeArticleFunnel(events: AnalyticsEventRow[]): ArticleFunnelResult {
  let views = 0;
  let impressed = 0;
  let clicked = 0;
  let started = 0;
  const bySurface = new Map<string, SurfaceFunnelRow>();

  for (const ev of events) {
    let meta: Record<string, unknown> = {};
    try { meta = JSON.parse(ev.meta || '{}'); } catch {}
    const surfaceKey = (typeof meta.surfaceKey === 'string' ? meta.surfaceKey : '') || '';
    const slug = (typeof meta.slug === 'string' ? meta.slug : '') || '';
    if (!surfaceKey) continue;

    if (!bySurface.has(surfaceKey)) {
      bySurface.set(surfaceKey, { surfaceKey, slug, views: 0, impressed: 0, clicked: 0, started: 0, conversionRate: 0 });
    }
    const bucket = bySurface.get(surfaceKey)!;

    if (VIEW_EVENTS.has(ev.event_name)) { views++; bucket.views++; }
    else if (ev.event_name === 'article_cta_impressed') { impressed++; bucket.impressed++; }
    else if (ev.event_name === 'article_cta_clicked') { clicked++; bucket.clicked++; }
    else if (ev.event_name === 'content_quick_analyze_started') { started++; bucket.started++; }
  }

  for (const bucket of bySurface.values()) {
    bucket.conversionRate = bucket.views > 0 ? bucket.started / bucket.views : 0;
  }

  return {
    totals: { views, impressed, clicked, started },
    conversionRate: views > 0 ? started / views : 0,
    bySurface: Array.from(bySurface.values()).sort((a, b) => b.views - a.views),
  };
}

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const days = Number(arg('days', '14'));
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });

  const BOT_PRED = `(u.role='guest' AND u.birth_date='1990-01-01' AND u.birth_time IN ('12:00','00:00') AND u.birth_place='北京')`;

  const events = db.prepare(`
    SELECT e.event_name, e.meta
    FROM analytics_events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE datetime(e.created_at) >= datetime('now', '-${days} days')
      AND e.event_name IN (
        'knowledge_article_viewed','case_article_viewed','insight_article_viewed',
        'article_cta_impressed','article_cta_clicked','content_quick_analyze_started'
      )
      AND NOT ${BOT_PRED}
  `).all() as AnalyticsEventRow[];

  console.log(`[article-funnel] 窗口 ${days} 天 / 事件 ${events.length} 条（已去 bot）`);
  const result = computeArticleFunnel(events);

  console.log('\n=== 总漏斗 ===');
  console.table([{
    views: result.totals.views,
    impressed: result.totals.impressed,
    clicked: result.totals.clicked,
    started: result.totals.started,
    conversionRate: (result.conversionRate * 100).toFixed(2) + '%',
  }]);

  console.log('\n=== 按 surfaceKey 排序前 15 ===');
  console.table(result.bySurface.slice(0, 15).map((r) => ({
    surfaceKey: r.surfaceKey,
    views: r.views,
    impressed: r.impressed,
    clicked: r.clicked,
    started: r.started,
    rate: (r.conversionRate * 100).toFixed(2) + '%',
  })));

  db.close();
}

if (process.argv[1]?.endsWith('article-funnel.ts')) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npx jest tests/lib/article-funnel.test.ts -v 2>&1 | tail -10`
Expected: PASS — 3 tests pass

- [ ] **Step 5: 加 npm script**

修改 `package.json`，在 `seo:topic-gap` 后追加一行：

```json
"seo:article-funnel": "node --import tsx lib/seo/article-funnel.ts",
```

- [ ] **Step 6: 验证脚本能运行（即使没数据）**

Run: `npm run seo:article-funnel 2>&1 | tail -10`
Expected: 输出"窗口 14 天 / 事件 0 条" 和空表（或现有 view 事件数据）

- [ ] **Step 7: 提交**

```bash
git add lib/seo/article-funnel.ts tests/lib/article-funnel.test.ts package.json
git commit -m "feat(seo): 漏斗反向分析脚本 article-funnel

- computeArticleFunnel: 纯函数，事件数组→ funnel 数据
- BOT_PRED 过滤默认表单 guest
- npm run seo:article-funnel [--days=14]"
```

---

## Task 11: 灰度开启 + 端到端验证

**Files:** 无代码改动，只是部署 + 手工测试

- [ ] **Step 1: 在生产 .env.local 开启 flag**

```bash
# .env.local 编辑
echo "NEXT_PUBLIC_ARTICLE_CTA_V1=1" >> .env.local
```

- [ ] **Step 2: 同步 ecosystem.config.js（仅打开默认）**

修改 `ecosystem.config.js` 中 `NEXT_PUBLIC_ARTICLE_CTA_V1` 的默认从 `'0'` 改成 `'1'`。

注意：如果已经在 .env.local 配了 1，可以暂不改 ecosystem。两个都开是双保险。

- [ ] **Step 3: 重启**

```bash
npm run build
pm2 reload life-kline-next --update-env
sleep 15
curl -sf http://127.0.0.1:3000/ -o /dev/null -w "Home %{http_code} %{time_total}s\n"
```

- [ ] **Step 4: 手工 E2E 验证（mobile + desktop）**

打开 `https://www.life-kline.com/knowledge/world-yi-methodology`：

**桌面**：
- [ ] 滚动到第 3 个 section 后能看到 inline CTA 卡片
- [ ] inline 卡片入视口后右下角 sticky 卡片淡出
- [ ] 滚到底后 sticky 重新出现
- [ ] 点击 inline 卡跳到 `/analyze?from=knowledge_article:world-yi-methodology&surface=inline-card`
- [ ] 关闭按钮点击后 sticky 不再出现，刷新页面也不出现（sessionStorage）
- [ ] 关 tab 重新打开同 URL，sticky 又出现（不持久化）

**移动**：
- [ ] 底部 sticky bar 不遮挡正文
- [ ] inline 卡片在视口内时 sticky 淡出
- [ ] 点击 sticky 跳 `/analyze?from=knowledge_article:world-yi-methodology&surface=sticky`

- [ ] **Step 5: 验证埋点真到位**

```bash
# 触发完整流程后查看 sqlite
node -e "
const Database = require('better-sqlite3');
const db = new Database('data/lifekline.db', { readonly: true });
const rows = db.prepare(\\\`
  SELECT event_name, json_extract(meta,'\$.surfaceKey') AS surfaceKey,
         json_extract(meta,'\$.position') AS position,
         json_extract(meta,'\$.depth') AS depth,
         created_at
  FROM analytics_events
  WHERE event_name IN ('knowledge_article_viewed','article_scroll_depth','article_cta_impressed','article_cta_clicked','content_quick_analyze_started','article_session_end')
    AND datetime(created_at) >= datetime('now','-10 minutes')
  ORDER BY created_at DESC LIMIT 30
\\\`).all();
console.table(rows);
"
```

应该看到完整 6 个事件。

- [ ] **Step 6: 跑 funnel 脚本看初始数据**

```bash
npm run seo:article-funnel
```

A 阶段刚开 14 天内数据少属正常，主要看脚本本身能输出。

- [ ] **Step 7: 验证回滚生效**

```bash
# 临时关
sed -i 's/NEXT_PUBLIC_ARTICLE_CTA_V1=1/NEXT_PUBLIC_ARTICLE_CTA_V1=0/' .env.local
pm2 reload life-kline-next --update-env
sleep 10
curl -s https://www.life-kline.com/knowledge/world-yi-methodology | grep -c "data-article-inline-cta"
```

Expected: 0

恢复：

```bash
sed -i 's/NEXT_PUBLIC_ARTICLE_CTA_V1=0/NEXT_PUBLIC_ARTICLE_CTA_V1=1/' .env.local
pm2 reload life-kline-next --update-env
```

- [ ] **Step 8: 提交（如果改了 ecosystem 默认）**

```bash
git add ecosystem.config.js
git commit -m "feat(env): 文章 CTA flag 默认开启（A 阶段灰度上线）

A 阶段灰度上线 + 14 天数据观察，转化率达标 6%+ 后 B 阶段启动"
```

---

## 完成标准

A 阶段开发完成 = 满足以下全部：

1. [ ] 11 个 Task 全部 commit
2. [ ] `npm run lint && npm run test && npm run build` 通过
3. [ ] 生产 reload 后手工 E2E（Task 11 Step 4）通过
4. [ ] 6 个埋点事件在 analytics_events 表能查到（Task 11 Step 5）
5. [ ] flag 关闭时页面无新组件（Task 11 Step 7）
6. [ ] `docs/superpowers/specs/2026-05-10-article-to-analyze-funnel-design.md` 中"成功标准"第 1 条 14 天后达标 ≥ 6%（验收期，不阻塞代码完成）
