#!/usr/bin/env python3
"""Inject progressive profile lines into production chat route."""
from pathlib import Path

path = Path("app/api/chat/route.ts")
text = path.read_text()

if "buildProfileContextLines" not in text:
    text = text.replace(
        "} from '@/lib/chat-teacher-runtime';",
        "} from '@/lib/chat-teacher-runtime';\n"
        "import { buildProfileContextLines, snapshotFromSupplementList } from '@/lib/progressive-profile';\n"
        "import { profileSupplementOperations } from '@/lib/profile-settings-store';",
        1,
    )

old_bits = """    const teacherBits = {
      teacher: options?.teacherId,
      intent: options?.intent,
      city: options?.city,
      practiceLines: extractPracticeLinesFromChatContext(options?.context),
      geoLines: extractGeoLinesFromChatContext(options?.context, options?.city),
    };"""
new_bits = """    const teacherBits = {
      teacher: options?.teacherId,
      intent: options?.intent,
      city: options?.city,
      practiceLines: extractPracticeLinesFromChatContext(options?.context),
      geoLines: extractGeoLinesFromChatContext(options?.context, options?.city),
      profileLines: options?.profileLines || [],
    };"""
if old_bits in text:
    text = text.replace(old_bits, new_bits, 1)
elif "profileLines: options?.profileLines" not in text:
    raise SystemExit("teacherBits block not found")

if "profileLines?: string[] | null;" not in text:
    text = text.replace(
        "teacherId?: string | null;\n    city?: string | null;\n  }",
        "teacherId?: string | null;\n    city?: string | null;\n    profileLines?: string[] | null;\n  }",
        1,
    )

if "profileLinesForTeacher" not in text:
    anchor = "const { answer, llmUsed, fallbackReason } = await generateAIResponse(question, userHistory, contextSummary, {"
    load = """    let profileLinesForTeacher: string[] = [];
    try {
      const rows = profileSupplementOperations.listByUser(userId, null);
      const snap = snapshotFromSupplementList(rows.map((r: any) => ({ domain: r.domain, fields: r.fields || {} })));
      profileLinesForTeacher = buildProfileContextLines(snap);
    } catch (e) {
      console.warn('[chat] profile lines load failed', e);
    }
    """
    if anchor not in text:
        raise SystemExit("generateAIResponse call not found")
    text = text.replace(anchor, load + anchor, 1)

if "profileLines: profileLinesForTeacher" not in text:
    text = text.replace(
        "teacherId: requestedTeacherId || null,\n      city: requestedCity || null,\n    });",
        "teacherId: requestedTeacherId || null,\n      city: requestedCity || null,\n      profileLines: profileLinesForTeacher || [],\n    });",
        1,
    )

path.write_text(text)
checks = [
    "buildProfileContextLines",
    "profileLinesForTeacher",
    "profileLines: options?.profileLines",
    "profileLines: profileLinesForTeacher",
]
missing = [c for c in checks if c not in path.read_text()]
if missing:
    raise SystemExit(f"missing: {missing}")
print("ok", path)
