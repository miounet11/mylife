/**
 * LLM answer upgrader — clean standalone .mjs, no metadata in answers table.
 * Rewrites fake official answers (with "初步判断" template) to natural Reddit quality.
 */
import Database from "better-sqlite3";
const db = new Database("data/lifekline.db");

const API_BASE = process.env.API_BASE_URL || "https://ttqq.inping.com/v1";
const API_KEY = process.env.API_KEY || "";
const COUNT = parseInt(process.argv[2] || "300", 10);
const CONCURRENCY = 30;
const TIMEOUT = 12000;

const SYSTEM = [
  "Rewrite this fake AI-generated answer into a real person's reply on a Chinese metaphysics forum.",
  "Rules: NO markdown headers (no **粗体**), NO 【tags】, NO CTAs (no 点这里/免费生成/完整命盘).",
  "Write 120-300 chars in Chinese. Natural paragraphs. Be specific, reference the question.",
  "Show personality — you are a real human with real opinions.",
  "Output ONLY valid JSON: {\"body\":\"...\"}"
].join(" ");

const answers = db.prepare(
  "SELECT a.id, a.question_id, a.body, a.is_official, q.title as qtitle, q.body as qbody, q.category " +
  "FROM forum_answers a JOIN forum_questions q ON a.question_id=q.id " +
  "WHERE a.is_official=1 AND a.body LIKE '%初步判断%' " +
  "ORDER BY a.published_at DESC LIMIT ?"
).all(COUNT);

if (!answers.length) { console.log("ALL_DONE"); db.close(); process.exit(0); }

let ok = 0, fail = 0;

async function processOne(a) {
  const r = await fetch(API_BASE + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + API_KEY },
    body: JSON.stringify({
      model: "auto",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: "Rewrite: Q=" + a.qtitle.slice(0, 100) + " | Old=" + a.body.slice(0, 250) }
      ],
      temperature: 0.75, max_tokens: 500,
      response_format: { type: "json_object" }
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!r.ok) { const t = await r.text().catch(() => ""); throw new Error("http:" + r.status + ":" + t.slice(0, 40)); }
  const d = await r.json();
  const c = d.choices?.[0]?.message?.content;
  if (!c) throw new Error("empty");
  let j;
  try { j = JSON.parse(c); } catch {
    const m = c.match(/\{[\s\S]*\}/);
    if (m) j = JSON.parse(m[0]);
    else throw new Error("json");
  }
  if (!j.body || j.body.length < 80) throw new Error("short:" + (j.body?.length || 0));
  db.prepare("UPDATE forum_answers SET body=? WHERE id=?").run(j.body, a.id);
  return j.body.length;
}

async function main() {
  if (!API_KEY) { console.error("no key"); process.exit(1); }
  console.log("API:" + API_BASE + " count:" + answers.length + " conc:" + CONCURRENCY);

  for (let i = 0; i < answers.length; i += CONCURRENCY) {
    const batch = answers.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processOne));
    for (const r of results) { r.status === "fulfilled" ? ok++ : fail++; }
  }

  const rem = db.prepare("SELECT COUNT(*) as n FROM forum_answers WHERE is_official=1 AND body LIKE '%初步判断%'").get();
  console.log("DONE:" + ok + ":" + fail + ":" + rem.n);
  db.close();
}

main().catch(e => { console.log("FATAL:" + (e.message||"")); process.exit(1); });
