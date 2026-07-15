/**
 * LLM bulk forum content upgrader.
 * Reads existing template-generated posts and rewrites them to Reddit-quality.
 * Uses ttkk.inping.com auto model (OpenAI-compatible).
 *
 * Usage: API_KEY=sk-xxx node scripts/forum/llm-upgrade.mjs [batchSize] [startOffset]
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = new URL(".", import.meta.url).pathname;
const ROOT = resolve(__dirname, "..", "..");

// ── Config ──
const API_BASE = process.env.API_BASE_URL || "https://ttkk.inping.com/v1";
const API_KEY = process.env.API_KEY || "";
const MODEL = "auto";
const BATCH = parseInt(process.argv[2] || "30", 10);
const OFFSET = parseInt(process.argv[3] || "0", 10);
const CONCURRENCY = 6; // parallel API calls

// ── Database ──
import Database from "better-sqlite3";
const dbPath = resolve(ROOT, "data", "lifekline.db");
const db = new Database(dbPath);

// ── Get template posts to upgrade ──
function getTemplatePosts(limit, offset) {
  if (offset < 0) return db.prepare().all(limit);
  return db.prepare(`
    SELECT id, slug, title, body, category, industry, tags
    FROM forum_questions
    WHERE status = 'visible'
      AND CAST(metadata AS TEXT) NOT LIKE '%llm-auto-4b%'
      AND CAST(metadata AS TEXT) NOT LIKE '%llm-upgraded%'
      AND length(body) < 200
    ORDER BY published_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

// ── API call ──
async function callLlm(system, user) {
  const resp = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.85,
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${t.slice(0, 150)}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response");
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error(`JSON parse failed`);
  }
}

// ── Build prompt ──
function buildUpgradePrompt(post) {
  return {
    system: `You are rewriting short, low-quality forum posts into Reddit-quality, emotionally engaging, multi-paragraph posts (200-400 chars). Posts are on a Chinese metaphysics community forum (八字/风水/紫微斗数/占星).

Rules:
- Write in Chinese with occasional English naturally
- Expand the core topic into a personal, detailed narrative
- Add realistic personal details: age, job, city, specific events, emotions
- Include self-doubt, minor contradictions — human touch
- Add 1-2 "Edit:" updates
- The post should feel like a real person struggling with a real decision
- Keep the original topic/category, but enrich it
- Output ONLY valid JSON: {"title":"...", "body":"..."}`,
    user: `Upgrade this template-generated forum post to Reddit-quality.

Original title: ${post.title}
Original body: ${post.body}
Category: ${post.category}
Industry: ${post.industry}

Rewrite with a compelling title and a 200-400 character narrative body. Make it feel 100% human-written. Output JSON only.`,
  };
}

// ── Update DB ──
function upgradePost(id, newTitle, newBody) {
  db.prepare(`UPDATE forum_questions SET title = ?, body = ?, metadata = json_set(COALESCE(metadata,'{}'), '$.source', 'llm-upgraded', '$.upgraded_at', datetime('now')) WHERE id = ?`)
    .run(newTitle.slice(0, 100), newBody, id);
}

// ── Main ──
async function main() {
  if (!API_KEY) {
    console.error("[upgrade] No API_KEY set");
    process.exit(1);
  }

  console.log(`[upgrade] API: ${API_BASE} | Batch: ${BATCH} | Offset: ${OFFSET} | Concurrency: ${CONCURRENCY}`);

  const posts = getTemplatePosts(BATCH, OFFSET);
  console.log(`[upgrade] Found ${posts.length} template posts to upgrade`);

  let done = 0, fail = 0, skip = 0;

  // Process in concurrent batches
  for (let i = 0; i < posts.length; i += CONCURRENCY) {
    const batch = posts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (post) => {
        const prompt = buildUpgradePrompt(post);
        const result = await callLlm(prompt.system, prompt.user);
        if (result.title && result.body && result.body.length >= 150) {
          upgradePost(post.id, result.title, result.body);
          return { ok: true, title: result.title.slice(0, 50), len: result.body.length };
        }
        throw new Error("Content too short or invalid");
      })
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const idx = i + j + 1;
      if (r.status === "fulfilled") {
        done++;
        console.log(`[upgrade] ${idx}/${posts.length} ✓ ${r.value.title}... (${r.value.len}c)`);
      } else {
        const err = r.reason?.message || String(r.reason);
        // If body is already decent length, skip
        if (err.includes("too short")) {
          skip++;
          console.log(`[upgrade] ${idx}/${posts.length} ~ skipped (already ok)`);
        } else {
          fail++;
          console.log(`[upgrade] ${idx}/${posts.length} ✗ ${err.slice(0, 80)}`);
        }
      }
    }

    // Small delay between batches
    if (i + CONCURRENCY < posts.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const remaining = db.prepare("SELECT COUNT(*) as n FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm-auto-4b%' AND CAST(metadata AS TEXT) NOT LIKE '%llm-upgraded%' AND length(body) < 200").get();
  console.log(`[upgrade] Done: ${done} upgraded, ${fail} failed, ${skip} skipped. Remaining: ${remaining.n}`);
  db.close();
}

main().catch(e => { console.error("[upgrade] Fatal:", e.message); process.exit(1); });
