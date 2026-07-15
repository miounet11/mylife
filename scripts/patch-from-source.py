#!/usr/bin/env python3
"""Extract injectable patch blocks from lib/__patches__/ canonical sources."""
from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

START_MARKER = "// @patch-inject-start"
END_MARKER = "// @patch-inject-end"


def extract_patch_block(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    start = text.find(START_MARKER)
    end = text.find(END_MARKER)
    if start < 0 or end < 0 or end <= start:
        raise SystemExit(f"missing patch markers in {path}")
    block = text[start + len(START_MARKER) : end].strip()
    if not block:
        raise SystemExit(f"empty patch block in {path}")
    return block + "\n"


def normalize_patch_block(block: str) -> str:
    lines = [line.rstrip() for line in block.strip().splitlines()]
    return "\n".join(lines)


def patch_fingerprint(block: str) -> str:
    normalized = normalize_patch_block(block)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def extract_database_operations_block(database_text: str, marker: str) -> str:
    if marker == "predictionOperations":
        start_token = "let predictionTableReady"
    elif marker == "lifeProfileOperations":
        start_token = "let lifeProfileTableReady"
    else:
        raise SystemExit(f"unknown database marker: {marker}")

    start = database_text.find(start_token)
    if start < 0:
        raise SystemExit(f"{marker} block start not found")

    export_token = f"export const {marker}"
    export_start = database_text.find(export_token, start)
    if export_start < 0:
        raise SystemExit(f"{marker} export not found")

    depth = 0
    end = -1
    for index in range(export_start, len(database_text)):
        char = database_text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                break
    if end < 0:
        raise SystemExit(f"{marker} block end not found")

    if end < len(database_text) and database_text[end] == ";":
        end += 1
    return database_text[start:end].strip()


def strip_export_function_ts(source: str, export_name: str) -> str:
    pattern = re.compile(
        rf"export function {export_name}\s*\((.*?)\)\s*\{{",
        re.DOTALL,
    )
    match = pattern.search(source)
    if not match:
        raise SystemExit(f"export function {export_name} not found")

    params = match.group(1)
    params = re.sub(r":\s*[^,)=]+", "", params)
    params = re.sub(r"\?\s*", "", params)
    params = re.sub(r"=\s*[^,)=]+", "", params)
    params = params.replace("  ", " ").strip()

    body_start = match.end()
    depth = 1
    index = body_start
    while index < len(source) and depth > 0:
        if source[index] == "{":
            depth += 1
        elif source[index] == "}":
            depth -= 1
        index += 1
    body = source[body_start : index - 1].strip()
    return f"function {export_name}({params}) {{\n{body}\n}}\n"


def apply_database_patch(
    database_path: Path,
    patch_source: Path,
    marker: str,
    before_anchor: str,
) -> str:
    text = database_path.read_text(encoding="utf-8")
    canonical = extract_patch_block(patch_source).strip() + "\n"
    export_token = f"export const {marker}"

    if export_token in text:
        existing = extract_database_operations_block(text, marker)
        if patch_fingerprint(existing) == patch_fingerprint(canonical):
            return f"skip {database_path} ({marker} already in sync)"
        text = text.replace(existing, canonical.strip(), 1)
        database_path.write_text(text, encoding="utf-8")
        return f"synced {database_path} ({marker} updated from {patch_source.name})"

    if before_anchor not in text:
        raise SystemExit(f"anchor missing for {marker}: {before_anchor}")

    database_path.write_text(
        text.replace(before_anchor, canonical + before_anchor, 1),
        encoding="utf-8",
    )
    return f"patched {database_path} ({marker} injected from {patch_source.name})"


def main() -> None:
    if len(sys.argv) < 3:
        print("usage: patch-from-source.py extract <patch-file>", file=sys.stderr)
        print("       patch-from-source.py fingerprint <patch-file>", file=sys.stderr)
        print("       patch-from-source.py fingerprint-db <database.ts> <marker>", file=sys.stderr)
        print("       patch-from-source.py apply <database.ts> <patch-file> <marker> <before-anchor>", file=sys.stderr)
        print("       patch-from-source.py strip-fn <patch-file> <export-name>", file=sys.stderr)
        raise SystemExit(2)

    command = sys.argv[1]
    path = Path(sys.argv[2])

    if command == "extract":
        sys.stdout.write(extract_patch_block(path))
        return

    if command == "fingerprint":
        print(patch_fingerprint(extract_patch_block(path)))
        return

    if command == "fingerprint-db":
        marker = sys.argv[3] if len(sys.argv) > 3 else "predictionOperations"
        database_text = path.read_text(encoding="utf-8")
        print(patch_fingerprint(extract_database_operations_block(database_text, marker)))
        return

    if command == "apply":
        patch_source = Path(sys.argv[3])
        marker = sys.argv[4]
        before_anchor = sys.argv[5]
        print(apply_database_patch(path, patch_source, marker, before_anchor))
        return

    if command == "strip-fn":
        export_name = sys.argv[3]
        sys.stdout.write(strip_export_function_ts(path.read_text(encoding="utf-8"), export_name))
        return

    raise SystemExit(f"unknown command: {command}")


if __name__ == "__main__":
    main()