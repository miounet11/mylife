#!/usr/bin/env bash
# Inject teacher runtime into production app/api/chat/route.ts
# Requires: SSHPASS, teachers + chat-teacher-runtime already on server.
set -euo pipefail

PROD_HOST="${PROD_HOST:-root@167.160.188.70}"
REMOTE_DIR="${REMOTE_DIR:-/home/life-kline-next}"

if [[ -z "${SSHPASS:-}" ]]; then
  echo "ERROR: Set SSHPASS" >&2
  exit 1
fi

SSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no)

"${SSH[@]}" "$PROD_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
ROUTE="app/api/chat/route.ts"
if [[ ! -f "$ROUTE" ]]; then
  echo "ERROR: $ROUTE missing" >&2
  exit 1
fi
if [[ ! -f lib/teachers.ts ]] || [[ ! -f lib/chat-teacher-runtime.ts ]]; then
  echo "ERROR: teachers runtime missing on server" >&2
  exit 1
fi

# already patched?
if grep -q "appendTeacherToSystemPrompt" "$ROUTE"; then
  echo "chat teacher patch already present"
  exit 0
fi

cp "$ROUTE" "${ROUTE}.bak-teacher-$(date +%Y%m%d%H%M%S)"

python3 - <<'PY'
from pathlib import Path
path = Path("app/api/chat/route.ts")
text = path.read_text()

import_block = """import { normalizeAttributionSource } from '@/lib/chat-entry';
import {
  appendTeacherToSystemPrompt,
  extractGeoLinesFromChatContext,
  extractPracticeLinesFromChatContext,
  resolveChatTeacher,
} from '@/lib/chat-teacher-runtime';
"""

if "from '@/lib/chat-teacher-runtime'" not in text:
    if "import { normalizeAttributionSource } from '@/lib/chat-entry';" in text:
        text = text.replace(
            "import { normalizeAttributionSource } from '@/lib/chat-entry';",
            import_block.strip(),
            1,
        )
    else:
        # fallback: after chat-intent import
        needle = "from '@/lib/chat-intent';"
        idx = text.find(needle)
        if idx < 0:
            raise SystemExit('cannot find import anchor')
        end = idx + len(needle)
        text = text[:end] + "\n" + import_block.strip() + text[end:]

# extend generateAIResponse options type
old_opts = """  options?: {
    intent?: ChatIntent;
    context?: ChatExperienceContext;
    materials?: SanitizedChatMaterial[];
    materialSummary?: string;
  }"""
new_opts = """  options?: {
    intent?: ChatIntent;
    context?: ChatExperienceContext;
    materials?: SanitizedChatMaterial[];
    materialSummary?: string;
    teacherId?: string | null;
    city?: string | null;
  }"""
if old_opts in text:
    text = text.replace(old_opts, new_opts, 1)
elif "teacherId?: string" not in text:
    print('WARN: options type block not found exactly; trying loose insert')

# after systemContent is fully assigned, append teacher block before baseMessages
marker = "const baseMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: ChatCompletionContent }> = ["
if marker not in text:
    raise SystemExit('baseMessages marker not found')
if "appendTeacherToSystemPrompt" not in text.split(marker)[0][-800:]:
    inject = """
  // 老师人设 + 地理/实践（对标 GPTs × Project 上下文）
  {
    const teacherBits = {
      teacher: options?.teacherId,
      intent: options?.intent,
      city: options?.city,
      practiceLines: extractPracticeLinesFromChatContext(options?.context),
      geoLines: extractGeoLinesFromChatContext(options?.context, options?.city),
    };
    const withTeacher = appendTeacherToSystemPrompt(systemContent, teacherBits);
    systemContent = withTeacher.systemContent;
  }

"""
    text = text.replace(marker, inject + marker, 1)

# POST body: parse teacher + city and pass into generateAIResponse
# Find generateAIResponse(question, userHistory, contextSummary, {
call = "const { answer, llmUsed, fallbackReason } = await generateAIResponse(question, userHistory, contextSummary, {"
if call not in text:
    # try multiline variants
    call = "await generateAIResponse(question, userHistory, contextSummary, {"
if call not in text:
    raise SystemExit('generateAIResponse call not found')

# ensure teacher vars after requestedIntent
if "requestedTeacherId" not in text:
    anchor = "requestedSourceFamily = resolveRequestedSourceFamily"
    # simpler: after data parse requestedIntent line
    line = "requestedIntent = resolveRequestedIntent(request, typeof data?.intent === 'string' ? data.intent : undefined);"
    if line in text:
        text = text.replace(
            line,
            line
            + "\n    const requestedTeacherId = typeof data?.teacher === 'string' ? data.teacher.trim() : (typeof data?.teacherId === 'string' ? data.teacherId.trim() : '');\n    const requestedCity = typeof data?.city === 'string' ? data.city.trim() : '';",
            1,
        )
    else:
        raise SystemExit('requestedIntent line not found')

# inject into generateAIResponse options object
old_call_opts = """    const { answer, llmUsed, fallbackReason } = await generateAIResponse(question, userHistory, contextSummary, {
      intent: requestedIntent,
      context,
      materials,
      materialSummary,
    });"""
new_call_opts = """    const { answer, llmUsed, fallbackReason } = await generateAIResponse(question, userHistory, contextSummary, {
      intent: requestedIntent,
      context,
      materials,
      materialSummary,
      teacherId: requestedTeacherId || null,
      city: requestedCity || null,
    });"""
if old_call_opts in text:
    text = text.replace(old_call_opts, new_call_opts, 1)
elif "teacherId: requestedTeacherId" not in text:
    # loose: after materialSummary, in first generateAIResponse options
    text = text.replace(
        """      materialSummary,
    });""",
        """      materialSummary,
      teacherId: typeof requestedTeacherId !== 'undefined' ? requestedTeacherId || null : null,
      city: typeof requestedCity !== 'undefined' ? requestedCity || null : null,
    });""",
        1,
    )

path.write_text(text)
print('patched', path)
# syntax check
import subprocess
r = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
if r.returncode != 0:
    print(r.stderr)
    raise SystemExit('node --check failed')
print('node --check ok')
PY

echo "patch-chat-teacher done"
REMOTE
