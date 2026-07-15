#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/home/life-kline-next}"
PAGE="$ROOT/app/knowledge/[slug]/page.tsx"

python3 - <<'PY' "$PAGE"
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()

if "EncyclopediaWorldYiSidebar" not in text:
    text = text.replace(
        "import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';\n",
        "import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';\nimport EncyclopediaWorldYiSidebar from '@/components/encyclopedia-world-yi-sidebar';\nimport { getEncyclopediaWorldYiLens } from '@/lib/encyclopedia-world-yi-lens';\n",
    )

if "encyclopediaLens" not in text:
    text = text.replace(
        "  const pageSource = surfaceKey;\n",
        "  const pageSource = surfaceKey;\n  const encyclopediaLens = getEncyclopediaWorldYiLens({\n    slug: article.slug,\n    category: article.category,\n    source: pageSource,\n  });\n",
    )

needle = """            <div className=\"mt-8 space-y-8\">
              {article.sections.map((section, index) => ("""
insert = """            {encyclopediaLens ? (
              <div className=\"mt-8\">
                <EncyclopediaWorldYiSidebar lens={encyclopediaLens} />
              </div>
            ) : null}

            <div className=\"mt-8 space-y-8\">
              {article.sections.map((section, index) => ("""

if "encyclopediaLens ?" not in text:
    if needle not in text:
        raise SystemExit("knowledge article anchor not found")
    text = text.replace(needle, insert, 1)

path.write_text(text)
print("patched knowledge article page")
PY

echo "encyclopedia sidebar patch applied"