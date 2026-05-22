// v5-D73 论坛池：引擎事实 + LLM 修饰
// 用法: npx tsx scripts/forum/llm-engine-paired.ts [count] [perCall]
//
// 流程：
//   1) 每条 = 一份引擎算出来的虚拟命盘事实包（VirtualBaziFact）
//   2) 把事实清单注入 LLM prompt
//   3) LLM 只能基于事实清单产出 title/body/officialAnswer，禁止编造其他命理判断
//
// 这条链路替代 D67/D70 的"无事实裸跑 LLM"，把论坛公开内容的命理判断接到引擎。

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { CATEGORIES, SEO_KEYWORDS } from '@/lib/forum/templates';
import { forumTitlePoolOperations } from '@/lib/database';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import { buildVirtualBaziFact, formatFactPackForPrompt, VirtualBaziFact } from '@/lib/forum/virtual-bazi-fact';

const TARGET = Math.max(20, Math.min(500, Number(process.argv[2]) || 100));
const PER_CALL = Math.max(2, Math.min(6, Number(process.argv[3]) || 3));
const CONCURRENCY = Math.max(1, Math.min(30, Number(process.env.FORUM_LLM_CONCURRENCY) || 30));

const SYSTEM_PROMPT = `你是中文命理论坛资深运营 + 官方答主。

【铁律】你只能基于用户提供的"命盘事实清单"做命理判断。命盘四柱、日主、强弱、格局、用神/忌神、大运、流年——这些都已经由引擎算好。
- 你引用这些事实时，必须与清单一致，不允许换字、换格局、换大运。
- 不允许提及清单之外的额外命理判断（如自己编造的"七杀格""丁巳大运""日主乙木"）。
- 用神/忌神的方向解读必须与清单一致（用神是水时，不能写成"忌水"）。

【输出】每条配对 = title + body + officialAnswer：
1. title：16-34 汉字，论坛口语化提问，命中类目的一个 SEO 关键词；不能露真实四柱/格局原文。
2. body：60-180 字，第一人称用户口语化发帖。**严格禁止**：不要在 body 里出现"日主""用神""忌神""喜神""格局""大运""流年""五行""八字""偏旺""偏弱""中和""木火土金水""火气""木气"等命理术语，不要写干支（甲乙丙丁/子丑寅卯任何一个字），不要写命盘事实清单的任何字段。body 只描写：职业、年龄段、生活/工作/情感烦恼、想咨询的方向，结尾一个开放性问题。普通用户不会自报命盘，命盘判断留给官方答。
   反例（不允许）："我日主偏弱属于正印格""用神是木和水""避开不利火气"
   正例："最近工作上压力很大""老想换个城市试试""不知道接下来该稳还是该动"
3. officialAnswer：140-280 字，第一人称官方答主，结构化：
   ① 先确认问题切入点（1 句）
   ② 引用事实清单做命理判断（日主强弱 / 格局 / 用神 / 当前大运/流年互动），可以挑 2-3 项展开，**必须与清单一致**
   ③ 1-2 条可执行建议（结合用神方向：用神是水可以建议"近水/休养""主动倾听"等抽象方向；用神是火可以建议"主动出击""换暖色穿搭"等）
   ④ 提醒结合完整命盘看
   不用 markdown 加粗，不用列表，整段中文，可用「、」「，」「。」分隔。

【输出格式】JSON array，每条形如 {"category":"bazi","keyword":"八字大运","title":"...","body":"...","officialAnswer":"..."}。不要 markdown 代码块。`;

interface PooledItem {
  category: string;
  keyword: string | null;
  title: string;
  body: string;
  officialAnswer: string;
}

function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildUserPrompt(items: Array<{ fact: VirtualBaziFact; categoryKey: string; categoryLabel: string; kws: string[] }>): string {
  const blocks = items.map((it, i) => {
    return `## ${i + 1}) 类目：${it.categoryKey}（${it.categoryLabel}），可选 SEO 关键词：${it.kws.join('、')}
命盘事实清单（必须严格引用）：
${formatFactPackForPrompt(it.fact)}`;
  }).join('\n\n');
  return `请基于以下 ${items.length} 份命盘事实清单，产出 ${items.length} 条配对。每条都必须严格引用对应清单内的事实，不允许写清单外的命理判断。

${blocks}

直接返回 JSON array（${items.length} 条），按上面 1-${items.length} 的顺序。不要 markdown 代码块。`;
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
      try { out.push(JSON.parse(l.replace(/,\s*$/, ''))); } catch { /* skip */ }
    }
    return out;
  }
}

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

// body 禁词：用户发帖不会自报命盘
const BODY_FORBIDDEN = /日主|用神|忌神|喜神|格局|大运|流年|偏旺|偏弱|过旺|过弱|甲木|乙木|丙火|丁火|戊土|己土|庚金|辛金|壬水|癸水|正印格|偏印格|正官格|七杀格|正财格|偏财格|食神格|伤官格|比肩格|劫财格|专旺格/;

async function callOnce(
  openai: OpenAI,
  model: string,
  items: Array<{ fact: VirtualBaziFact; categoryKey: string; categoryLabel: string; kws: string[] }>,
): Promise<PooledItem[]> {
  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.75,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(items) },
    ],
  });
  const raw = resp.choices?.[0]?.message?.content || '';
  const parsed = tryParseArray(raw);
  const out: PooledItem[] = [];
  parsed.forEach((p, idx) => {
    if (!p || typeof p !== 'object') return;
    const o = p as { title?: unknown; category?: unknown; keyword?: unknown; body?: unknown; officialAnswer?: unknown };
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const body = typeof o.body === 'string' ? o.body.trim() : '';
    const officialAnswer = typeof o.officialAnswer === 'string' ? o.officialAnswer.trim() : '';
    const keyword = typeof o.keyword === 'string' ? o.keyword.trim() : '';
    // category 强制对齐我们指定的（防 LLM 自由换）
    const category = items[idx]?.categoryKey || (typeof o.category === 'string' && CATEGORY_KEYS.includes(o.category) ? o.category : 'bazi');

    if (title.length < 8 || title.length > 60) return;
    if (body.length < 30 || body.length > 400) return;
    if (BODY_FORBIDDEN.test(body)) return; // body 不允许命理术语
    if (officialAnswer.length < 80 || officialAnswer.length > 600) return;
    out.push({ category, keyword: keyword || null, title, body, officialAnswer });
  });
  return out;
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
  if (!apiKey) { console.error('[engine-paired] API_KEY 未配置'); process.exit(1); }
  const model = getModelFallbackChain(undefined, 'content')[0];
  if (!model) { console.error('[engine-paired] 无可用 model'); process.exit(1); }

  // 准备 TARGET 份事实包
  const baseSeed = Date.now();
  const facts: VirtualBaziFact[] = [];
  let attempts = 0;
  while (facts.length < TARGET && attempts < TARGET * 3) {
    const f = buildVirtualBaziFact(makeRng(baseSeed + attempts * 7919));
    if (f) facts.push(f);
    attempts += 1;
  }
  console.log(`[engine-paired] facts=${facts.length} (attempts=${attempts}) target=${TARGET} model=${model} concurrency=${CONCURRENCY} perCall=${PER_CALL}`);
  if (!facts.length) { console.error('[engine-paired] 没产出任何事实包'); process.exit(2); }

  // 类目均匀分布
  const items = facts.map((f, i) => {
    const cat = CATEGORIES[i % CATEGORIES.length];
    return {
      fact: f,
      categoryKey: cat.key,
      categoryLabel: cat.label,
      kws: SEO_KEYWORDS[cat.key] || [],
    };
  });

  // 切批
  const batches: typeof items[] = [];
  for (let i = 0; i < items.length; i += PER_CALL) {
    batches.push(items.slice(i, i + PER_CALL));
  }
  console.log(`[engine-paired] calls=${batches.length}`);

  const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl(), timeout: 60000, maxRetries: 1 });

  const t0 = Date.now();
  const jobs = batches.map((b) => () => callOnce(openai, model, b));
  const results = await pool(jobs, CONCURRENCY);
  const elapsed = Date.now() - t0;

  let ok = 0, fail = 0;
  const all: PooledItem[] = [];
  results.forEach((r) => {
    if (r instanceof Error) { fail += 1; console.error('  call err:', r.message.slice(0, 200)); }
    else { ok += 1; all.push(...r); }
  });

  console.log(`[engine-paired] calls ok=${ok} fail=${fail} / ${batches.length} in ${(elapsed / 1000).toFixed(1)}s; got ${all.length} valid items`);
  if (!all.length) { console.error('[engine-paired] 0 有效'); process.exit(3); }

  const batchId = `engine-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
  const { inserted, skipped } = forumTitlePoolOperations.addBatch(all, batchId);
  const fresh = forumTitlePoolOperations.countFresh();
  console.log(`[engine-paired] batch=${batchId} inserted=${inserted} skipped(dup)=${skipped} totalFresh=${fresh}`);
  console.log('[engine-paired] by category:', forumTitlePoolOperations.countByCategory());
}

main().catch((err) => { console.error('[engine-paired] FATAL:', err); process.exit(99); });
