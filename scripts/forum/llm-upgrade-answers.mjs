/**
 * LLM answer upgrader — rewrite template-generated answers to natural, Reddit-quality.
 * Focuses on official answers with the fake "【WorldYi编辑组】" format first.
 * Usage: API_KEY=sk-xxx node scripts/forum/llm-upgrade-answers.mjs [count]
 */

import Database from "better-sqlite3";
import { resolve } from "path";
const ROOT = resolve(new URL(".", import.meta.url).pathname, "..", "..");

const API_BASE = process.env.API_BASE_URL || "https://ttqq.inping.com/v1";
const API_KEY = process.env.API_KEY || "";
const COUNT = parseInt(process.argv[2] || "300", 10);
const CONCURRENCY = 30;
const TIMEOUT = 12000;

const db = new Database(resolve(ROOT, "data", "lifekline.db"));

function getAnswers(limit) {
  const sql = [
    "SELECT a.id, a.question_id, a.body, a.is_official, q.title as qtitle, q.body as qbody, q.category",
    "FROM forum_answers a JOIN forum_questions q ON a.question_id = q.id",
    "WHERE a.is_official = 1",
    "AND (CAST(a.metadata AS TEXT) NOT LIKE '%llm-upgraded%' OR a.metadata IS NULL)",
    "AND a.body LIKE '%初步判断%'",
    "ORDER BY a.published_at DESC LIMIT ?"
  ].join(" ");
  return db.prepare(sql).all(limit);
}

function upgrade(id, r.body) {
  db.prepare("UPDATE forum_answers SET body = ? WHERE id = ?")
    .run(body, id);
}

async function callLlm(sys, usr) {
  const r = await fetch(API_BASE + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + API_KEY },
    body: JSON.stringify({ model: "auto", messages: [{ role: "system", content: sys }, { role: "user", content: usr }], temperature: 0.75, max_tokens: 600, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!r.ok) { const t = await r.text().catch(() => ""); throw new Error("API:" + r.status + ":" + t.slice(0, 60)); }
  const data = await r.json();
  const c = data.choices?.[0]?.message?.content;
  if (!c) throw new Error("empty");
  try { return JSON.parse(c); } catch {
    const m = c.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("json");
  }
}

const SYSTEM = `You are rewriting fake-looking AI answers into natural, human-sounding Reddit-style replies. The answers are on a Chinese metaphysics forum.

CRITICAL RULES:
- Write in Chinese (mix occasional English naturally)
- NO markdown headers (no **初步判断**, **建议**, **风险提示**)
- NO structured formatting. Just paragraphs like a real person.
- NO "【WorldYi编辑组】" or any fake org tags
- NO CTA like "点这里免费生成" or "想看完整命盘"
- Write 120-300 characters, conversational tone
- Be specific, reference the question's details
- Sound like someone who knows metaphysics but talks like a real person
- Include a touch of personality — you're a real human answering on a forum

Output ONLY JSON: {"body":"..."}`;

function buildPrompt(ans) {
  return {
    system: SYSTEM,
    user: `Rewrite this fake official answer to sound like a real person:

Question: ${ans.qtitle.slice(0, 120)}
Original fake answer: ${ans.body.slice(0, 200)}

Write a natural, human reply. JSON only.`
  };
}

async function processOne(ans) {
  const { system, user } = buildPrompt(ans);
  const r = await callLlm(system, user);
  if (r.body && r.body.length >= 80) {
    upgrade(ans.id, r.body.replace('$',''));
    return { ok: true, n: r.body.length };
  }
  throw new Error("short:" + (r.body?.length || 0));
}

async function main() {
  if (!API_KEY) { console.error("no key"); process.exit(1); }
  const answers = getAnswers(COUNT);
  if (!answers.length) { console.log("DONE: no more fake official answers"); db.close(); return; }

  console.log("API: " + API_BASE + " | count: " + answers.length + " | conc: " + CONCURRENCY);
  let ok = 0, fail = 0;

  for (let i = 0; i < answers.length; i += CONCURRENCY) {
    const batch = answers.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processOne));
    for (const r of results) { r.status === "fulfilled" ? ok++ : fail++; }
  }

  const r = db.prepare("SELECT COUNT(*) as n FROM forum_answers a WHERE a.is_official=1 AND a.body LIKE '%初步判断%' AND (CAST(a.metadata AS TEXT) NOT LIKE '%llm-upgraded%' OR a.metadata IS NULL)").get();
  console.log("DONE:" + ok + ":" + fail + " remaining_fake:" + r.n);
  db.close();
}

main().catch(e => { console.log("FATAL:" + e.message); process.exit(1); });
