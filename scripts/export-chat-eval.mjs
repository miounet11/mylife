#!/usr/bin/env node
/**
 * Export desensitized chat pairs from production SQLite into eval JSON.
 * Usage (on prod):
 *   node scripts/export-chat-eval.mjs
 *   node scripts/export-chat-eval.mjs --out data/eval/chat-cases.json --limit 80
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// better-sqlite3 is available on prod
const Database = require('better-sqlite3');

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return fallback;
}

const root = process.cwd();
const dbPath = arg('--db', path.join(root, 'data/lifekline.db'));
const outPath = arg('--out', path.join(root, 'data/eval/chat-cases.json'));
const limit = Number(arg('--limit', '80')) || 80;

const ENGINE_TERMS = ['日主', '用神', '忌神', '大运', '流年', '格局', '十神'];
const PII = [
  [/\b[\w.+-]+@[\w.-]+\.\w+\b/g, '[email]'],
  [/1[3-9]\d{9}/g, '[phone]'],
  [/[\u4e00-\u9fff]{2,4}(大学|学院|中学|公司|集团)/g, '[org]'],
];

function desensitize(s) {
  let out = String(s || '').trim();
  for (const [re, rep] of PII) out = out.replace(re, rep);
  return out.replace(/\s+/g, ' ').slice(0, 2000);
}

function hitEngine(text) {
  return ENGINE_TERMS.filter((t) => text.includes(t));
}

function bucketOf({ q, a, llmUsed, hasReport, intent }) {
  if (/^\d{4,}$/.test(q) || q.length < 4) return 'noise';
  if (String(intent || '').includes('palm')) return 'palmistry';
  if (!hasReport) return 'unbound';
  if (llmUsed === false || /没有拿到可用|简化回答|未硬编/.test(a)) return 'fallback_template';
  if (hitEngine(a).length >= 1) return 'grounded_ok';
  if (q.length < 15) return 'short_question';
  return 'other';
}

const db = new Database(dbPath, { readonly: true });
const rows = db
  .prepare(
    `SELECT id, user_id, question, category, analysis, created_at
     FROM questions
     WHERE category IN ('chat_user','chat_assistant')
     ORDER BY created_at ASC`,
  )
  .all();

function parseA(raw) {
  if (!raw) return {};
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }
}

const byTurn = new Map();
for (const r of rows) {
  const a = parseA(r.analysis);
  const tid = a.turnId || r.id;
  if (!byTurn.has(tid)) byTurn.set(tid, {});
  byTurn.get(tid)[r.category] = r;
}

const cases = [];
for (const [tid, parts] of byTurn) {
  if (!parts.chat_user || !parts.chat_assistant) continue;
  const u = parts.chat_user;
  const s = parts.chat_assistant;
  const ua = parseA(u.analysis);
  const sa = parseA(s.analysis);
  const q = desensitize(u.question);
  const ans = desensitize(sa.answer || s.question);
  const llmUsed = typeof sa.llmUsed === 'boolean' ? sa.llmUsed : null;
  const hasReport = Boolean(ua.reportId || sa.reportId);
  const intent = ua.intent || sa.intent || null;
  const b = bucketOf({ q, a: ans, llmUsed, hasReport, intent });
  cases.push({
    id: `chat_${tid}`.slice(0, 48),
    bucket: b,
    question: q,
    answer: ans,
    meta: {
      llmUsed,
      fallbackReason: sa.fallbackReason || null,
      hasReportId: hasReport,
      intent,
      questionLen: q.length,
      answerLen: ans.length,
      engineTermsHit: hitEngine(ans),
      createdAt: u.created_at,
      // no user_id in export
    },
    mustIncludeAny:
      b === 'grounded_ok'
        ? ['判断依据', '建议', '风险', '日主', '用神', '大运']
        : b === 'fallback_template'
          ? ['重生成', '未硬编', '简化']
          : undefined,
    mustExclude: ['必然发财', '一定能找到工作', '保证成功'],
  });
}

// Prefer diversity: take up to N per bucket then fill
const byBucket = new Map();
for (const c of cases) {
  if (!byBucket.has(c.bucket)) byBucket.set(c.bucket, []);
  byBucket.get(c.bucket).push(c);
}
const selected = [];
const perBucket = Math.max(5, Math.floor(limit / 6));
for (const [, list] of byBucket) {
  selected.push(...list.slice(0, perBucket));
}
// fill remainder with grounded + fallback first
const rest = cases.filter((c) => !selected.includes(c));
const priority = ['grounded_ok', 'fallback_template', 'short_question', 'other', 'palmistry', 'unbound', 'noise'];
rest.sort((a, b) => priority.indexOf(a.bucket) - priority.indexOf(b.bucket));
for (const c of rest) {
  if (selected.length >= limit) break;
  selected.push(c);
}

const summary = {};
for (const c of selected) {
  summary[c.bucket] = (summary[c.bucket] || 0) + 1;
}

const payload = {
  exportedAt: new Date().toISOString(),
  source: 'questions.chat_*',
  totalPairs: cases.length,
  selected: selected.length,
  summary,
  cases: selected.slice(0, limit),
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(JSON.stringify({ ok: true, outPath, ...summary, totalPairs: cases.length, selected: selected.length }, null, 2));
