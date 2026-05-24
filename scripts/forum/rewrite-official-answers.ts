// v5-D71 历史短官方答 LLM 重写
// 用法: npx tsx scripts/forum/rewrite-official-answers.ts [maxLength] [limit]
// 默认重写所有 length<260 的 forum_answers.is_official=1
// 30 并发，每 call 处理 1 条（个性化质量 > 批量）

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import Database from 'better-sqlite3';
import path from 'path';
import { CATEGORIES } from '@/lib/forum/templates';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';

const MAX_LEN = Number(process.argv[2]) || 260;
const LIMIT = Number(process.argv[3]) || 1000;
const CONCURRENCY = Math.max(1, Math.min(50, Number(process.env.FORUM_LLM_CONCURRENCY) || 50));

const DB_PATH = path.resolve(process.cwd(), 'data', 'lifekline.db');

const SYSTEM_PROMPT = `你是中文命理论坛的资深官方答主。给一个用户提问 + 旧的简短回复，重写为一份高质量回复。
要求：
1. 长度 180-280 字
2. 结构：① 简短确认问题切入点 ② 关键命理判断（玄学概念可虚化，不要装神弄鬼）③ 1-2 条可执行建议 ④ 提醒用户结合完整命盘看
3. 第一人称官方语气，平实、专业、不夸大
4. 不要包含「【世界易学官方】」「点这里免费生成」之类的固定头尾 — 这些由系统自动加
5. 不要 markdown 加粗、不要列表，整段中文行文，可以用「、」「，」「。」分隔
6. 仅输出回复正文，不要 JSON 包裹，不要解释`;

interface Row {
  id: string;
  body: string;
  title: string;
  category: string;
  q_body: string;
}

function categoryLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}

async function rewriteOne(openai: OpenAI, model: string, row: Row): Promise<string | null> {
  const userPrompt = `提问类目：${categoryLabel(row.category)}
提问标题：${row.title}
提问正文：${row.q_body.slice(0, 400)}

旧的简短官方答：${row.body.replace(/^【.*?】\s*/, '').replace(/\n*>.+点这里.+$/g, '').trim()}

请重写为 180-280 字的高质量官方答。`;

  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });
  const raw = (resp.choices?.[0]?.message?.content || '').trim();
  if (raw.length < 100 || raw.length > 600) return null;
  // 去掉可能的 JSON 包裹或代码块
  let clean = raw.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
  // 去掉 LLM 自己加的固定头
  clean = clean.replace(/^【[^】]+】\s*/, '').trim();
  return clean;
}

async function pool<T>(jobs: Array<() => Promise<T>>, concurrency: number): Promise<Array<T | Error>> {
  const results: Array<T | Error> = new Array(jobs.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= jobs.length) return;
      try {
        results[idx] = await jobs[idx]();
      } catch (err) {
        results[idx] = err instanceof Error ? err : new Error(String(err));
      }
    }
  }
  await Promise.all(new Array(Math.min(concurrency, jobs.length)).fill(0).map(() => worker()));
  return results;
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('API_KEY 未配置');
    process.exit(1);
  }
  const model = getModelFallbackChain(undefined, 'content')[0];

  const db = new Database(DB_PATH);
  const rows = db.prepare(`
    SELECT a.id, a.body, q.title, q.category, q.body AS q_body
    FROM forum_answers a
    JOIN forum_questions q ON q.id = a.question_id
    WHERE a.is_official = 1 AND a.status = 'visible' AND length(a.body) < ?
    ORDER BY datetime(a.published_at) DESC
    LIMIT ?
  `).all(MAX_LEN, LIMIT) as Row[];

  console.log(`[rewrite-official] target=${rows.length} model=${model} concurrency=${CONCURRENCY}`);
  if (!rows.length) {
    db.close();
    return;
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
    timeout: 60000,
    maxRetries: 1,
  });

  const updateStmt = db.prepare(`UPDATE forum_answers SET body = ? WHERE id = ?`);

  const t0 = Date.now();
  let success = 0;
  let failed = 0;
  let skipped = 0;

  const jobs = rows.map((row) => async () => {
    const newBody = await rewriteOne(openai, model, row);
    if (!newBody) {
      skipped += 1;
      return;
    }
    const finalBody = `${newBody}\n\n> 想看自己的完整命盘？[点这里免费生成](/analyze)。`;
    updateStmt.run(finalBody, row.id);
    success += 1;
  });

  const results = await pool(jobs, CONCURRENCY);
  results.forEach((r) => {
    if (r instanceof Error) {
      failed += 1;
      console.error('  err:', r.message.slice(0, 120));
    }
  });

  const elapsed = Date.now() - t0;
  console.log(`[rewrite-official] success=${success} skipped=${skipped} failed=${failed} / ${rows.length} in ${(elapsed / 1000).toFixed(1)}s`);

  db.close();
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(99);
});
