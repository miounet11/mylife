/**
 * HIGH-SPEED LLM forum upgrader.
 * Question upgrade only (no answers). 20 concurrent, fast timeout.
 * Usage: node scripts/forum/llm-upgrade-fast.mjs [count]
 */

import Database from "better-sqlite3";
import { resolve } from "path";
const ROOT = resolve(new URL(".", import.meta.url).pathname, "..", "..");

const API_BASE = process.env.API_BASE_URL || "https://ttqq.inping.com/v1";
const API_KEY = process.env.API_KEY || "";
const COUNT = parseInt(process.argv[2] || "200", 10);
const CONCURRENCY = 30;
const TIMEOUT = 12000;

const db = new Database(resolve(ROOT, "data", "lifekline.db"));

const getPosts = (limit) => db.prepare(
  "SELECT id, slug, title, body, category, industry FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200 ORDER BY published_at DESC LIMIT ?"
).all(limit);

const upgradePost = (id, title, body) => db.prepare(
  "UPDATE forum_questions SET title=?, body=?, metadata=json_set(COALESCE(metadata,'{}'),'$'||'.source','llm-upgraded','$'||'.upgraded_at',datetime('now')) WHERE id=?"
).run(title.slice(0, 100), body, id);

async function callLlm(sys, usr) {
  const r = await fetch(API_BASE + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + API_KEY },
    body: JSON.stringify({ model: "auto", messages: [{ role: "system", content: sys }, { role: "user", content: usr }], temperature: 0.7, max_tokens: 500, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!r.ok) { const t = await r.text().catch(() => ""); throw new Error(t.slice(0, 80)); }
  const data = await r.json();
  const c = data.choices?.[0]?.message?.content;
  if (!c) throw new Error("empty");
  try { return JSON.parse(c); } catch { const m = c.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); throw new Error("json"); }
}

const SYSTEM = "Rewrite a short template forum post into a real person's post. Chinese metaphysics forum. 150-300 chars. Personal, emotional, details. JSON: {\"title\":\"...\",\"body\":\"...\"}";

function buildPrompt(post) {
  return { system: SYSTEM, user: "Fix: T:" + post.title + "\nB:" + post.body + "\nCat:" + post.category + "\nInd:" + post.industry };
}

async function processOne(post) {
  const { system, user } = buildPrompt(post);
  const r = await callLlm(system, user);
  if (r.title && r.body && r.body.length >= 100) {
    upgradePost(post.id, r.title, r.body);
    return { ok: true, n: r.body.length };
  }
  throw new Error("short");
}

async function main() {
  if (!API_KEY) { console.error("no key"); process.exit(1); }
  const posts = getPosts(COUNT);
  if (!posts.length) { console.log("DONE:0"); db.close(); return; }

  let ok = 0, fail = 0;
  for (let i = 0; i < posts.length; i += CONCURRENCY) {
    const batch = posts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processOne));
    for (const r of results) { r.status === "fulfilled" ? ok++ : fail++; }
  }

  const rem = db.prepare("SELECT COUNT(*) as n FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) NOT LIKE '%llm%' AND length(body) < 200").get();
  const total = db.prepare("SELECT COUNT(*) as n FROM forum_questions WHERE status='visible' AND CAST(metadata AS TEXT) LIKE '%llm%'").get();
  console.log("DONE:" + ok + ":" + fail + ":" + total.n + ":" + rem.n);
  db.close();
}

main().catch(e => { console.log("FATAL:" + e.message); process.exit(1); });
