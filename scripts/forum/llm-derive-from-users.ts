// v5-D72 用户真实 Q&A 派生 → 入 forum_title_pool
// 用法: npx tsx scripts/forum/llm-derive-from-users.ts [count] [seedsPerCall]
//
// 思路：368 对真实 chat_user/chat_assistant 是金矿。但绝不可直接落库（含真实 bazi/姓名）。
// 步骤：
//   1) 抽 N 个种子（user 问 + assistant 回的"主题轮廓"，前 80/120 字脱敏）
//   2) 30 并发，每 call 给 LLM 5 个种子 → 改写为虚拟提问者论坛 Q&A 配对
//   3) 入 forum_title_pool（body+officialAnswer），daemon tick 自然消费
//
// LLM 用量：368 / 5 = ~74 calls，30 并发 ~30s 跑完。一次运行够论坛吃几天。

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import path from 'path';
import { CATEGORIES } from '@/lib/forum/templates';
import { forumTitlePoolOperations } from '@/lib/database';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';

const TARGET = Math.max(20, Math.min(500, Number(process.argv[2]) || 200));
const SEEDS_PER_CALL = Math.max(3, Math.min(8, Number(process.argv[3]) || 5));
const CONCURRENCY = Math.max(1, Math.min(30, Number(process.env.FORUM_LLM_CONCURRENCY) || 30));

const DB_PATH = path.resolve(process.cwd(), 'data', 'lifekline.db');

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);
const CATEGORY_LIST = CATEGORIES.map((c) => `${c.key}（${c.label}）`).join('、');

const SYSTEM_PROMPT = `你是中文命理论坛运营。给你一组真实用户向 AI 命理助手提问的"主题轮廓"，请把它们改写为虚拟提问者的论坛配对（题 + 帖子正文 + 官方答主回复）。

**核心要求**：
1. 严格脱敏：原文里出现的具体日柱/年柱/姓氏/城市/年龄/确切年份（如 2027.04），必须替换成模糊表达（"近两年""某月初""近期"），或换成不同的虚拟设定。不要原文照抄。
2. 类目从这 12 个里选一个最贴近的：${CATEGORY_LIST}
3. title：16-34 个汉字，论坛口语，可以是求助/反问/数字/时效式，避免营销腔。
4. body：60-180 字，第一人称，描述一个虚拟背景（职业/生活阶段/具体烦恼），结尾带一个开放性问题。不要塞八字干支。
5. officialAnswer：120-260 字，结构化：① 简短确认问题切入点 ② 关键命理判断（玄学概念可虚化）③ 1-2 条可执行建议 ④ 提醒结合完整命盘看。第一人称官方语气，平实专业。
6. 输出 JSON array，每条 {"category":"bazi","keyword":null,"title":"...","body":"...","officialAnswer":"..."}。N 条种子产 N 条配对。不要 markdown 包裹。`;

interface SeedRow {
  user_q: string;
  assistant_a: string;
}

interface PooledItem {
  category: string;
  keyword: string | null;
  title: string;
  body: string;
  officialAnswer: string;
}

function buildUserPrompt(seeds: SeedRow[]): string {
  const lines = seeds.map((s, i) => {
    const q = s.user_q.replace(/\s+/g, ' ').slice(0, 80);
    const a = s.assistant_a.replace(/\s+/g, ' ').slice(0, 140);
    return `${i + 1}) 用户问: ${q}\n   AI 回答轮廓: ${a}`;
  }).join('\n');
  return `请根据以下 ${seeds.length} 个真实问答的主题方向，改写为 ${seeds.length} 条虚拟用户论坛配对（脱敏 + 转写）：

${lines}

直接返回 JSON array（${seeds.length} 条），不要 markdown。`;
}

function tryParseArray(raw: string): unknown[] {
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  }
  const lo = s.indexOf('[');
  const hi = s.lastIndexOf(']');
  if (lo < 0 || hi < 0 || hi <= lo) return [];
  const slice = s.slice(lo, hi + 1);
  try {
    const arr = JSON.parse(slice);
    return Array.isArray(arr) ? arr : [];
  } catch {
    const lines = slice.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{'));
    const out: unknown[] = [];
    for (const l of lines) {
      const cleaned = l.replace(/,\s*$/, '');
      try {
        out.push(JSON.parse(cleaned));
      } catch {
        /* skip */
      }
    }
    return out;
  }
}

async function callOnce(
  openai: OpenAI,
  model: string,
  seeds: SeedRow[],
): Promise<PooledItem[]> {
  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.85,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(seeds) },
    ],
  });
  const raw = resp.choices?.[0]?.message?.content || '';
  const parsed = tryParseArray(raw);
  const items: PooledItem[] = [];
  for (const p of parsed) {
    if (!p || typeof p !== 'object') continue;
    const o = p as { title?: unknown; category?: unknown; keyword?: unknown; body?: unknown; officialAnswer?: unknown };
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const body = typeof o.body === 'string' ? o.body.trim() : '';
    const officialAnswer = typeof o.officialAnswer === 'string' ? o.officialAnswer.trim() : '';
    const keyword = typeof o.keyword === 'string' ? o.keyword.trim() : '';
    let category = typeof o.category === 'string' ? o.category.trim() : '';
    if (!CATEGORY_KEYS.includes(category)) category = 'bazi'; // 兜底
    if (title.length < 8 || title.length > 60) continue;
    if (body.length < 30 || body.length > 400) continue;
    if (officialAnswer.length < 60 || officialAnswer.length > 600) continue;
    items.push({
      category,
      keyword: keyword || null,
      title,
      body,
      officialAnswer,
    });
  }
  return items;
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

function fetchSeeds(limit: number): SeedRow[] {
  const db = new Database(DB_PATH, { readonly: true });
  // 配对：每个 chat_user 找它之后 10 分钟内同 user_id 的 chat_assistant
  const rows = db.prepare(`
    SELECT u.question AS user_q,
           (SELECT a.question FROM questions a
            WHERE a.user_id = u.user_id
              AND a.category = 'chat_assistant'
              AND datetime(a.created_at) >= datetime(u.created_at)
              AND datetime(a.created_at) <= datetime(u.created_at, '+10 minutes')
            ORDER BY datetime(a.created_at) ASC LIMIT 1) AS assistant_a
    FROM questions u
    WHERE u.category = 'chat_user'
      AND length(u.question) >= 6
    ORDER BY RANDOM()
    LIMIT ?
  `).all(limit) as SeedRow[];
  db.close();
  return rows.filter((r) => r.user_q && r.assistant_a && r.assistant_a.length >= 30);
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[derive] API_KEY 未配置');
    process.exit(1);
  }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) {
    console.error('[derive] 没有可用 model');
    process.exit(1);
  }

  const seeds = fetchSeeds(TARGET);
  console.log(`[derive] seeds=${seeds.length} target=${TARGET} model=${model} concurrency=${CONCURRENCY} seedsPerCall=${SEEDS_PER_CALL}`);
  if (!seeds.length) {
    console.error('[derive] 没有可用种子');
    process.exit(2);
  }

  // 切片
  const batches: SeedRow[][] = [];
  for (let i = 0; i < seeds.length; i += SEEDS_PER_CALL) {
    batches.push(seeds.slice(i, i + SEEDS_PER_CALL));
  }
  console.log(`[derive] calls=${batches.length}`);

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
    timeout: 60000,
    maxRetries: 1,
  });

  const t0 = Date.now();
  const jobs = batches.map((b) => () => callOnce(openai, model, b));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0;
  let fail = 0;
  const all: PooledItem[] = [];
  results.forEach((r) => {
    if (r instanceof Error) {
      fail += 1;
      console.error('  call err:', r.message.slice(0, 200));
    } else {
      ok += 1;
      all.push(...r);
    }
  });

  console.log(`[derive] calls ok=${ok} fail=${fail} / ${batches.length} in ${(elapsed / 1000).toFixed(1)}s; got ${all.length} valid items`);

  if (!all.length) {
    console.error('[derive] 没有有效条目');
    process.exit(3);
  }

  const batchId = `derive-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
  const { inserted, skipped } = forumTitlePoolOperations.addBatch(all, batchId);
  const fresh = forumTitlePoolOperations.countFresh();
  console.log(`[derive] batch=${batchId} inserted=${inserted} skipped(dup)=${skipped} totalFresh=${fresh}`);
  console.log('[derive] by category:', forumTitlePoolOperations.countByCategory());
}

main().catch((err) => {
  console.error('[derive] FATAL:', err);
  process.exit(99);
});
