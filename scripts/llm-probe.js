// LLM 链路诊断工具（v5-A5 引入）
// 用法：API_BASE_URL=... OPENAI_API_KEY=... node scripts/llm-probe.js
// 默认串行 5 次 gpt-5.2 短 prompt + 并行 5 次中等 prompt
// 用来对比直连延迟 vs 生产实际延迟（生产多 5-6s 框架开销）

const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.API_BASE_URL,
  timeout: 30000,
  maxRetries: 0,
});

// 模拟真实报告生成的 prompt 量
const SYSTEM = `你是一个精通子平八字、神煞体系、大运流年的顶级命理学API，需要使用接近"世界易"的判断语言。
世界易的核心原则是：结构、时位、环境、动作、风险五维一体；不强调玄学概念，而强调可决策性。
交付要求：1）说人话不说术语；2）必须给出可执行建议；3）严格 JSON 输出。
请基于用户的四柱八字和当前大运流年，输出 JSON 格式的结构化解读，包含：
- 整体格局判断（200字）
- 当前 5 年关键节点（200字）
- 三条优先级排序的行动建议（每条 100 字）
- 风险提示与回避（150字）
全部使用中文，只输出 JSON。`;

const USER = `年柱：庚午，年神：天乙；月柱：戊寅，月神：将星；日柱：丁卯，日主丁火；时柱：庚子。
五行分布：木 2 / 火 1 / 土 1 / 金 2 / 水 1（弱火格局）。
十神：日主丁火，年柱偏财庚金；月柱伤官戊土；时柱正财庚金。
当前大运：庚辰运第 3 年（2024-2034），流年甲辰（2024）。
神煞：天乙贵人、将星、文昌。
背景：男 35 岁，海外华人在加拿大多伦多，从事互联网产品经理工作。最近 6 个月正在考虑：
1）是否回国发展；2）是否切换创业方向；3）是否现在结婚购房。
请基于八字给出当前 5 年的判断与建议。`;

async function probe(model) {
  const start = Date.now();
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: USER },
      ],
      temperature: 0.4,
      max_tokens: 520,
    });
    const txt = r.choices[0].message.content || '';
    return { model, ms: Date.now()-start, ok: true, len: txt.length, head: txt.slice(0,30) };
  } catch (e) {
    return { model, ms: Date.now()-start, ok: false, err: e.message.slice(0,80) };
  }
}

(async () => {
  console.log('=== 真实报告 prompt 串行 3 次 ===');
  for (const m of ['gpt-5.2','grok-420-fast','auto']) {
    const r = await probe(m);
    console.log(r);
  }
  console.log();
  console.log('=== gpt-5.2 真实 prompt 并行 3 次（模拟 agentic-report）===');
  const all = await Promise.all(Array(3).fill().map(() => probe('gpt-5.2')));
  console.log(all);
})();
