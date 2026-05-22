// v5-D67 LLM 批量预生成 forum 标题入池
// 用法: npx tsx scripts/forum/llm-titles.ts [count] [model?]
// 设计：单次 LLM 调用产出 200-300 条标题，写入 forum_title_pool（INSERT OR IGNORE 去重）。
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

const COUNT = Math.max(50, Math.min(500, Number(process.argv[2]) || 220));
const MODEL_OVERRIDE = process.argv[3];

const SYSTEM_PROMPT = `你是中文命理论坛的资深运营，负责拟定真实用户口吻的提问标题。
要求：
1. 每条标题 16-34 个汉字（含标点），口语化、具体、有职业/年龄/事件背景。
2. 必须命中给定 SEO 长尾关键词中的一个（原词出现，不可改写）。
3. 句式多样，禁止全部用同一前缀。可参考：求助式 / 反问式 / 数字式 / 时效式 / 关键词主导。
4. 不要用「八字算命大师」「玄学揭秘」这类营销腔，要像普通人在论坛发问。
5. 输出 JSON array，每条形如 {"category":"bazi","keyword":"八字算命","title":"..."}，不要包裹任何说明文字。`;

function buildUserPrompt(count: number): string {
  const catLines = CATEGORIES.map((c) => {
    const kws = (SEO_KEYWORDS[c.key] || []).join('、');
    return `- ${c.key}（${c.label}）关键词：${kws}`;
  }).join('\n');

  const examples = [
    '{"category":"bazi","keyword":"八字大运","title":"八字大运换柱后总是不顺，做了8年外贸要不要转行？"}',
    '{"category":"fengshui","keyword":"卧室风水","title":"卧室风水床头朝西真的影响睡眠吗？租房客求实测"}',
    '{"category":"taluo","keyword":"塔罗事业","title":"塔罗事业牌连出宝剑3，是该裸辞还是再忍半年？"}',
    '{"category":"xingzuo","keyword":"上升星座","title":"上升星座查出来是天蝎，35岁后会不会变得更内敛？"}',
    '{"category":"zeri","keyword":"结婚择日","title":"求助：2026年5月结婚择日怎么选？双方八字都不会看"}',
  ].join('\n');

  return `请生成 ${count} 条提问标题，覆盖下面所有类目（每个类目至少 ${Math.max(8, Math.floor(count / CATEGORIES.length))} 条）。

类目与 SEO 关键词：
${catLines}

示例（注意句式多样、口语化）：
${examples}

直接返回 JSON array（${count} 条），不要 markdown 代码块。`;
}

function tryParseArray(raw: string): unknown[] {
  // 容错：剥 markdown code fence
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  }
  // 找第一个 [ 和最后一个 ]
  const lo = s.indexOf('[');
  const hi = s.lastIndexOf(']');
  if (lo < 0 || hi < 0 || hi <= lo) return [];
  const slice = s.slice(lo, hi + 1);
  try {
    const arr = JSON.parse(slice);
    return Array.isArray(arr) ? arr : [];
  } catch {
    // 行级容错
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

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[llm-titles] API_KEY 未配置');
    process.exit(1);
  }

  const chain = getModelFallbackChain(undefined, 'content');
  const model = MODEL_OVERRIDE || chain[0];
  if (!model) {
    console.error('[llm-titles] 没有可用的 model');
    process.exit(1);
  }

  console.log(`[llm-titles] 目标 ${COUNT} 条 / model=${model}`);

  const openai = new OpenAI({
    apiKey,
    baseURL: getApiBaseUrl(),
    timeout: 180000,
    maxRetries: 0,
  });

  const t0 = Date.now();
  const resp = await openai.chat.completions.create({
    model,
    temperature: 0.9,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(COUNT) },
    ],
  });
  const elapsed = Date.now() - t0;
  const raw = resp.choices?.[0]?.message?.content || '';
  console.log(`[llm-titles] LLM 返回 ${raw.length} chars / ${elapsed}ms`);

  const parsed = tryParseArray(raw);
  console.log(`[llm-titles] 解析出 ${parsed.length} 条`);

  const validCategoryKeys = new Set(CATEGORIES.map((c) => c.key));
  const items: Array<{ title: string; category: string; keyword: string | null }> = [];
  for (const p of parsed) {
    if (!p || typeof p !== 'object') continue;
    const o = p as { title?: unknown; category?: unknown; keyword?: unknown };
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const category = typeof o.category === 'string' ? o.category.trim() : '';
    const keyword = typeof o.keyword === 'string' ? o.keyword.trim() : '';
    if (!title || title.length < 8 || title.length > 60) continue;
    if (!validCategoryKeys.has(category)) continue;
    items.push({ title, category, keyword: keyword || null });
  }

  console.log(`[llm-titles] 通过校验 ${items.length} 条`);

  if (!items.length) {
    console.error('[llm-titles] 没有有效条目，sample:', raw.slice(0, 500));
    process.exit(2);
  }

  const batchId = `llm-${new Date().toISOString().slice(0, 10)}-${randomUUID().slice(0, 8)}`;
  const { inserted, skipped } = forumTitlePoolOperations.addBatch(items, batchId);
  const fresh = forumTitlePoolOperations.countFresh();

  console.log(`[llm-titles] batch=${batchId} inserted=${inserted} skipped(dup)=${skipped} totalFresh=${fresh}`);
  console.log('[llm-titles] by category:', forumTitlePoolOperations.countByCategory());
}

main().catch((err) => {
  console.error('[llm-titles] FATAL:', err);
  process.exit(99);
});
