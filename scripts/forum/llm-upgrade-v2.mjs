/**
 * LLM forum upgrader — single-run, auto-select next batch from DB.
 * Usage: API_KEY=sk-xxx node scripts/forum/llm-upgrade.mjs [count]
 */

import Database from "better-sqlite3";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = new URL(".", import.meta.url).pathname;
const ROOT = resolve(__dirname, "..", "..");

const API_BASE = process.env.API_BASE_URL || "https://ttqq.inping.com/v1";
const API_KEY = process.env.API_KEY || "";
const MODEL = "auto";
const COUNT = parseInt(process.argv[2] || "50", 10);
const CONCURRENCY = 6;

const dbPath = resolve(ROOT, "data", "lifekline.db");
const db = new Database(dbPath);

function getPosts(limit) {
  const sql = [
    "SELECT id, slug, title, body, category, industry, tags",
    "FROM forum_questions",
    "WHERE status = 'visible'",
    "AND CAST(metadata AS TEXT) NOT LIKE '%llm-auto-4b%'",
    "AND CAST(metadata AS TEXT) NOT LIKE '%llm-upgraded%'",
    "AND length(body) < 200",
    "ORDER BY published_at DESC",
    "LIMIT ?"
  ].join(" ");
  return db.prepare(sql).all(limit);
}

async function callLlm(sys, usr) {
  const r = await fetch(API_BASE + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + API_KEY },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: usr }], temperature: 0.85, max_tokens: 800, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) { const t = await r.text().catch(() => ""); throw new Error("API " + r.status + ": " + t.slice(0, 120)); }
  const data = await r.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty response");
  try { return JSON.parse(content); } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("JSON parse failed");
  }
}

function buildPrompt(post) {
  return {
    system: "You are rewriting short, low-quality forum posts into Reddit-quality, emotionally engaging, multi-paragraph posts (200-400 chars). Posts are on a Chinese metaphysics forum (八字/风水/紫微斗数/占星). Write in Chinese with occasional English. Add personal details, self-doubt, Edit updates. Output ONLY valid JSON: {\"title\":\"...\", \"body\":\"...\"}",
    user: "Upgrade this template-generated post to Reddit-quality:\n\nTitle: " + post.title + "\nBody: " + post.body + "\nCategory: " + post.category + "\nIndustry: " + post.industry + "\n\nOutput JSON only."
  };
}

function upgradePost(id, title, body) {
  db.prepare("UPDATE forum_questions SET title = ?, body = ?, metadata = json_set(COALESCE(metadata,'{}'), '$.source', 'llm-upgraded', '$.upgraded_at', datetime('now')) WHERE id = ?")
    .run(title.slice(0, 100), body, id);
}

async function processPost(post) {
  const prompt = buildPrompt(post);
  const result = await callLlm(prompt.system, prompt.user);
  if (result.title && result.body && result.body.length >= 150) {
    upgradePost(post.id, result.title, result.body);
    return { ok: true, title: result.title.slice(0, 45), len: result.body.length };
  }
  throw new Error("too short or invalid");
}

async function main() {
  if (!API_KEY) { console.error("No API_KEY"); process.exit(1); }

  const posts = getPosts(COUNT);
  if (!posts.length) { console.log("All posts upgraded!"); db.close(); process.exit(0); }

  console.log("API: " + API_BASE + " | posts: " + posts.length + " | concurrency: " + CONCURRENCY);

  let done = 0, fail = 0, skip = 0;
  for (let i = 0; i < posts.length; i += CONCURRENCY) {
    const batch = posts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(p => processPost(p)));
    for (let j = 0; j < results.length; j++) {
      const r = results[j]; const idx = i + j + 1;
      if (r.status === "fulfilled") {
        done++;
        console.log(idx + "/" + posts.length + " OK " + r.value.title + "... (" + r.value.len + "c)");
      } else {
        const err = (r.reason?.message || String(r.reason)).slice(0, 80);
        if (err.includes("too short")) { skip++; console.log(idx + "/" + posts.length + " ~"); }
        else { fail++; console.log(idx + "/" + posts.length + " FAIL " + err); }
      }
    }
    if (i + CONCURRENCY < posts.length) await new Promise(r => setTimeout(r, 300));
  }

  const remaining = db.prepare("SELECT COUNT(*) as n FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm-auto-4b%' AND CAST(metadata AS TEXT) NOT LIKE '%llm-upgraded%' AND length(body) < 200").get();
  const total = db.prepare("SELECT COUNT(*) as n FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%'").get();
  console.log("DONE: " + done + " ok, " + fail + " fail, " + skip + " skip | upgraded=" + total.n + " | remaining=" + remaining.n);
  db.close();
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
