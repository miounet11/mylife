#!/usr/bin/env python3
"""
Patch production lib/tools.ts buildToolRunSummary to prefer GroundTruthPack
engine projection (lib/tool-run-summary.ts) over report.opening rehash.

Safe to re-run. Does not touch other tool definitions.

Usage on production:
  cd /home/life-kline-next
  python3 scripts/patch-tools-engine-summary-production.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "lib" / "tools.ts"

MARKER = "buildEngineToolRunSummary"
IMPORT_LINE = "import { buildEngineToolRunSummary } from '@/lib/tool-run-summary';\n"


def find_function_end(text: str, brace_start: int) -> int:
    depth = 0
    for i, ch in enumerate(text[brace_start:], brace_start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i + 1
    raise RuntimeError("unbalanced braces while scanning buildToolRunSummary")


def main() -> int:
    if not TOOLS.exists():
        print(f"MISSING {TOOLS}", file=sys.stderr)
        return 1

    text = TOOLS.read_text(encoding="utf-8")

    if MARKER in text and "buildToolRunSummaryLegacy" in text:
        # Validate structure; if broken, tell operator to restore
        if text.count("{") != text.count("}"):
            print("BROKEN_PATCH braces mismatch — run: git checkout -- lib/tools.ts", file=sys.stderr)
            return 4
        if text.count("function buildToolRunSummaryLegacy") != 1:
            print("BROKEN_PATCH multiple legacy — run: git checkout -- lib/tools.ts", file=sys.stderr)
            return 5
        print("ALREADY_PATCHED")
        return 0

    if "export function buildToolRunSummary" not in text:
        print("NO_buildToolRunSummary", file=sys.stderr)
        return 2

    # Ensure import once
    if "lib/tool-run-summary" not in text:
        lasts = list(re.finditer(r"^import .+?;\n", text, re.M))
        if lasts:
            insert_at = lasts[-1].end()
            text = text[:insert_at] + IMPORT_LINE + text[insert_at:]
        else:
            text = IMPORT_LINE + text

    m = re.search(r"export function buildToolRunSummary\(", text)
    if not m:
        print("NO_buildToolRunSummary_match", file=sys.stderr)
        return 2

    start = m.start()
    brace_start = text.find("{", m.end() - 1)
    end = find_function_end(text, brace_start)
    original = text[start:end]
    legacy = original.replace(
        "export function buildToolRunSummary(",
        "function buildToolRunSummaryLegacy(",
        1,
    )

    wrapper = """export function buildToolRunSummary(params: {
  tool: ToolDefinition;
  report: FortuneRecord;
  recentSessions?: ToolSessionRecord[];
  note?: string;
}): ToolRunSummary {
  try {
    return buildEngineToolRunSummary({
      tool: {
        slug: params.tool.slug,
        shortTitle: params.tool.shortTitle,
        title: params.tool.title,
        valuePromise: params.tool.valuePromise,
        relatedReportThemes: params.tool.relatedReportThemes,
        chatIntent: params.tool.chatIntent,
        premiumServiceKey: params.tool.premiumServiceKey,
        category: params.tool.category,
      },
      report: params.report as any,
      recentSessions: params.recentSessions as any,
      note: params.note,
    }) as ToolRunSummary;
  } catch (error) {
    console.warn('[tools] engine tool summary failed, using legacy rehash', error);
  }
  return buildToolRunSummaryLegacy(params);
}

"""

    new_text = text[:start] + wrapper + legacy + text[end:]
    if new_text.count("{") != new_text.count("}"):
        print(
            f"BRACE_MISMATCH open={new_text.count('{')} close={new_text.count('}')}",
            file=sys.stderr,
        )
        return 3

    TOOLS.write_text(new_text, encoding="utf-8")
    print("PATCHED", TOOLS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
