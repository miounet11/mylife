#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/home/life-kline-next}"
cd "$ROOT"

# knowledge/topics: add learning map CTA after hero description
python3 - <<'PY'
from pathlib import Path
path = Path("app/knowledge/topics/page.tsx")
text = path.read_text()
if "/learn" not in text:
    needle = """            <div className="flex flex-wrap gap-2 mt-3">
              <ContentCardLink
                href="/analyze\""""
    insert = """            <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-3 py-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">深度学习地图</div>
              <p className="mt-1 text-xs leading-5 text-[color:var(--ink-3)]">
                按九轨路径系统学习：入门、六域、应用与典籍。比自动专题地图更适合连续深读。
              </p>
              <a href="/learn" className="mt-2 inline-flex h-8 items-center rounded-[var(--radius-sm)] bg-[color:var(--brand)] px-3 text-xs font-bold text-white hover:no-underline">
                进入九轨学习地图
              </a>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <ContentCardLink
                href="/analyze\""""
    if needle not in text:
        raise SystemExit("knowledge/topics anchor not found")
    path.write_text(text.replace(needle, insert, 1))
    print("patched knowledge/topics")
else:
    print("knowledge/topics already patched")
PY

# result page: add ContinueLearningPanel before RelatedContent
python3 - <<'PY'
from pathlib import Path
path = Path("app/result/[id]/page.tsx")
text = path.read_text()
if "ContinueLearningPanel" not in text:
    text = text.replace(
        "import RelatedContent from '@/components/related-content';\n",
        "import RelatedContent from '@/components/related-content';\nimport ContinueLearningPanel from '@/components/continue-learning-panel';\n",
    )

old = """              <div id=\"related-content\" className=\"scroll-mt-header\">
                <ResultDeferredSection
                  title=\"延伸内容\"
                  description=\"把相关知识、案例和后续阅读接到这份报告后面，方便你继续补全判断上下文。\"
                  delayMs={760}
                >
                  <RelatedContent"""
new = """              <div id=\"continue-learning\" className=\"scroll-mt-header\">
                <ResultDeferredSection
                  title=\"继续学习\"
                  description=\"按你的问题类型进入对应学习轨道，把单次报告变成可持续深读路径。\"
                  delayMs={700}
                >
                  <ContinueLearningPanel
                    source={entrySource || `result_report:${id}`}
                    category={primaryToolRoute?.category || null}
                    themes={['career', 'wealth', 'relationship', 'health', 'timing', 'kline']}
                  />
                </ResultDeferredSection>
              </div>

              <div id=\"related-content\" className=\"scroll-mt-header\">
                <ResultDeferredSection
                  title=\"延伸内容\"
                  description=\"把相关知识、案例和后续阅读接到这份报告后面，方便你继续补全判断上下文。\"
                  delayMs={760}
                >
                  <RelatedContent"""
if "ContinueLearningPanel" in text and old not in text:
    print("result page already has ContinueLearningPanel block or anchor changed")
elif old in text:
    text = text.replace(old, new, 1)
    path.write_text(text)
    print("patched result page")
else:
    raise SystemExit("result page anchor not found")
PY

# site header nav: add learn link if product links exist in footer only - skip for now

echo "learning system frontend patches applied"