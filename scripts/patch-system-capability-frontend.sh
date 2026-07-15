#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/home/life-kline-next}"
cd "$ROOT"

patch_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "missing file: $file" >&2
    exit 1
  fi
}

# ── analyze/page.tsx ──
ANALYZE="app/analyze/page.tsx"
patch_file "$ANALYZE"
python3 - <<'PY' "$ANALYZE"
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
text = text.replace(
    "import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';\n",
    "import { getSystemCapabilityStats } from '@/lib/system-capability-stats';\nimport SystemCapabilityPanel from '@/components/system-capability-panel';\n",
)
text = text.replace(
    "  const worldYiStats = getWorldYiPublicStats();\n",
    "  const capabilityStats = getSystemCapabilityStats();\n",
)
old_block = """            {/* 系统能力 */}
            <Card variant=\"sunken\" padding=\"md\">
              <Eyebrow tone=\"muted\" className=\"mb-3\">系统能力</Eyebrow>
              <Stack gap={2}>
                <Inline justify=\"between\" align=\"baseline\">
                  <span className=\"text-xs text-[color:var(--ink-4)]\">公开案例库</span>
                  <span className=\"font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]\">
                    {worldYiStats.publicCaseCount}
                  </span>
                </Inline>
                <Inline justify=\"between\" align=\"baseline\">
                  <span className=\"text-xs text-[color:var(--ink-4)]\">知识入口</span>
                  <span className=\"font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]\">
                    {worldYiStats.publicKnowledgeCount}
                  </span>
                </Inline>
                <Inline justify=\"between\" align=\"baseline\">
                  <span className=\"text-xs text-[color:var(--ink-4)]\">大师话术库</span>
                  <span className=\"font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]\">
                    600+
                  </span>
                </Inline>
              </Stack>
            </Card>"""
new_block = "            <SystemCapabilityPanel stats={capabilityStats} />"
if old_block not in text:
    raise SystemExit(f"analyze block not found in {path}")
path.write_text(text.replace(old_block, new_block))
PY

# ── dashboard/page.tsx ──
DASHBOARD="app/dashboard/page.tsx"
patch_file "$DASHBOARD"
python3 - <<'PY' "$DASHBOARD"
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
text = text.replace(
    "import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';\n",
    "import { getSystemCapabilityStats } from '@/lib/system-capability-stats';\nimport SystemCapabilityPanel from '@/components/system-capability-panel';\n",
)
text = text.replace(
    "  const worldYiStats = getWorldYiPublicStats();\n",
    "  const capabilityStats = getSystemCapabilityStats();\n",
)
old_block = """            {/* 系统能力 */}
            <Card variant=\"sunken\" padding=\"md\">
              <Eyebrow tone=\"muted\" className=\"mb-3\">系统能力</Eyebrow>
              <Stack gap={2}>
                <Inline justify=\"between\" align=\"baseline\">
                  <span className=\"text-xs text-[color:var(--ink-4)]\">公开案例库</span>
                  <span className=\"font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]\">
                    {worldYiStats.publicCaseCount}
                  </span>
                </Inline>
                <Inline justify=\"between\" align=\"baseline\">
                  <span className=\"text-xs text-[color:var(--ink-4)]\">知识入口</span>
                  <span className=\"font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]\">
                    {worldYiStats.publicKnowledgeCount}
                  </span>
                </Inline>
                <Inline justify=\"between\" align=\"baseline\">
                  <span className=\"text-xs text-[color:var(--ink-4)]\">大师话术库</span>
                  <span className=\"font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]\">
                    600+
                  </span>
                </Inline>
              </Stack>
            </Card>"""
new_block = "            <SystemCapabilityPanel stats={capabilityStats} />"
if old_block not in text:
    raise SystemExit(f"dashboard block not found in {path}")
path.write_text(text.replace(old_block, new_block))
PY

# ── site-footer.tsx ──
FOOTER="components/site-footer.tsx"
patch_file "$FOOTER"
python3 - <<'PY' "$FOOTER"
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
if "SystemCapabilityFooterSignalsClient" not in text:
    text = text.replace(
        "import { getPriorityGrowthToolLinks } from '@/lib/tools';\n",
        "import { getPriorityGrowthToolLinks } from '@/lib/tools';\nimport SystemCapabilityFooterSignalsClient from '@/components/system-capability-footer-signals-client';\n",
    )
text = text.replace(
    "export default async function SiteFooter() {\n",
    "export default function SiteFooter() {\n",
)
text = text.replace(
    "  const capabilityStats = getSystemCapabilityStats();\n",
    "",
)
text = text.replace(
    "import { getSystemCapabilityStats } from '@/lib/system-capability-stats';\nimport { SystemCapabilityFooterSignals } from '@/components/system-capability-panel';\n",
    "",
)
text = text.replace(
    "            <span>真太阳时校正</span>\n            <span>·</span>\n            <span>分钟级节气精度</span>\n            <span>·</span>\n            <span>600+ 大师话术库</span>\n",
    "            <span>真太阳时校正</span>\n            <span>·</span>\n            <span>分钟级节气精度</span>\n            <span>·</span>\n            <SystemCapabilityFooterSignalsClient />\n",
)
text = text.replace(
    "            <span>真太阳时校正</span>\n            <span>·</span>\n            <span>分钟级节气精度</span>\n            <span>·</span>\n            <SystemCapabilityFooterSignals stats={capabilityStats} />\n",
    "            <span>真太阳时校正</span>\n            <span>·</span>\n            <span>分钟级节气精度</span>\n            <span>·</span>\n            <SystemCapabilityFooterSignalsClient />\n",
)
path.write_text(text)
PY

# ── opengraph-image.tsx ──
OG="app/opengraph-image.tsx"
patch_file "$OG"
python3 - <<'PY' "$OG"
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
if "getMasterPhraseCount" not in text:
    text = text.replace(
        "import { ImageResponse } from 'next/og';\n",
        "import { ImageResponse } from 'next/og';\nimport { formatCompactCount } from '@/lib/format-count';\nimport { getMasterPhraseCount } from '@/lib/master-phrase-stats';\n",
    )
if "const capabilitySignals" not in text:
    text = text.replace(
        "const PILLARS = [\n",
        "const capabilitySignals = [\n  '真太阳时',\n  `${formatCompactCount(getMasterPhraseCount())} 话术模板`,\n  '持续补全',\n] as const;\n\nconst PILLARS = [\n",
    )
text = text.replace(
    "            {['真太阳时', '600+ 话术库', '持续补全'].map((label) => (",
    "            {capabilitySignals.map((label) => (",
)
path.write_text(text)
PY

echo "patched system capability frontend files in $ROOT"