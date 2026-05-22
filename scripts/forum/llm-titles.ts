// v5-D67/D70 LLM 批量预生成 forum 标题+正文+官方答配对入池
// 用法: npx tsx scripts/forum/llm-titles.ts [count] [model?]
// 设计：30 并发 × 每 call 10 条 = 单次 ~300 条配对。
// daemon tick 优先消费池里的 fresh，池空回退 v5-D66 模板拼接。
//
// 成本目标：每天 1 次（或低水位触发）→ 全年极少 LLM 调用。

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { CATEGORIES, SEO_KEYWORDS } from '@/lib/forum/templates';
import { forumTitlePoolOperations } from '@/lib/database';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';

const TARGET = Math.max(50, Math.min(900, Number(process.argv[2]) || 300));
const MODEL_OVERRIDE = process.argv[3];

const CONCURRENCY = Math.max(1, Math.min(30, Number(process.env.FORUM_LLM_CONCURRENCY) || 30));
const ITEMS_PER_CALL = Math.max(5, Math.min(20, Number(process.env.FORUM_LLM_ITEMS_PER_CALL) || 10));

const SYSTEM_PROMPT = `你是中文命理论坛的资深运营。每次生产 N 条「真实用户提问 + 官方答主回复」配对。
要求：
1. title：16-34 个汉字，必须命中 SEO_KEYWORDS 里的一个原词；句式多样（求助 / 反问 / 数字 / 时效 / 关键词主导），不要营销腔。
2. body：60-180 字，第一人称，描述背景（职业/年龄段/具体事件），可以隐藏部分八字（如"农历XX年生""出生时辰不便透露"），结尾带一个开放性问题。
3. officialAnswer：120-260 字，结构化：① 简短确认问题切入点 ② 关键命理判断（玄学概念可虚化）③ 1-2 条可执行建议 ④ 提醒用户结合完整命盘看，不要鼓吹消费迷信。
4. 输出格式：JSON array，每条形如 {"category":"bazi","keyword":"八字大运","title":"...","body":"...","officialAnswer":"..."}。不要 markdown 包裹。`;

function buildUserPrompt(categoryKey: string, label: string, count: number): string {
  const kws = (SEO_KEYWORDS[categoryKey] || []).join('、');
  return `请为类目 "${categoryKey}（${label}）" 生成 ${count} 条配对。SEO 关键词池：${kws}

要求每条都要命中其中一个关键词，且 ${count} 条标题句式各异。

直接返回 JSON array（${count} 条），不要 markdown 代码块。`;
}

interface PooledItem {
  category: string;
  keyword: string | null;
  title: string;
  body: string;
  officialAnswer: string;
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
  categoryKey: string,
  label: string,
  count: number,
): Promise<PooledItem[]> {
  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.9,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(categoryKey, label, count) },
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
    if (title.length < 8 || title.length > 60) continue;
    if (body.length < 30 || body.length > 400) continue;
    if (officialAnswer.length < 60 || officialAnswer.length > 600) continue;
    items.push({
      category: categoryKey,
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

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[llm-titles] API_KEY 未配置');
    process.exit(1);
  }
  const chain = getModelFallbackChain(undefined, 'content');
  const model = MODEL_OVERRIDE || chain[0];
  if (!model) {
    console.error('[llm-titles] 没有可用 model');
    process.exit(1);
  }

  // 分配每个类目的 call 次数：均分 + 余数前补
  const calls = Math.max(1, Math.ceil(TARGET / ITEMS_PER_CALL));
  const perCat: Array<{ category: string; label: string; count: number }> = [];
  const totalCats = CATEGORIES.length;
  for (let i = 0; i < calls; i++) {
    const c = CATEGORIES[i % totalCats];
    perCat.push({ category: c.key, label: c.label, count: ITEMS_PER_CALL });
  }

  console.log(`[llm-titles] TARGET=${TARGET} model=${model} calls=${calls} concurrency=${CONCURRENCY} itemsPerCall=${ITEMS_PER_CALL}`);

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
    timeout: 60000,
    maxRetries: 1,
  });

  const t0 = Date.now();
  const jobs = perCat.map((spec) => () => callOnce(openai, model, spec.category, spec.label, spec.count));
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

  console.log(`[llm-titles] calls ok=${ok} fail=${fail} / ${calls} in ${elapsed}ms; got ${all.length} valid items`);

  if (!all.length) {
    console.error('[llm-titles] 没有有效条目');
    process.exit(2);
  }

  const batchId = `llm-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
  const { inserted, skipped } = forumTitlePoolOperations.addBatch(all, batchId);
  const fresh = forumTitlePoolOperations.countFresh();
  console.log(`[llm-titles] batch=${batchId} inserted=${inserted} skipped(dup)=${skipped} totalFresh=${fresh}`);
  console.log('[llm-titles] by category:', forumTitlePoolOperations.countByCategory());
}

main().catch((err) => {
  console.error('[llm-titles] FATAL:', err);
  process.exit(99);
});
