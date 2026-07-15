/**
 * LLM-powered Reddit-quality forum content generator.
 * Uses ttqq.inping.com/v1 (OpenAI-compatible) auto model (4B).
 *
 * Usage:
 *   node scripts/forum/llm-generate.mjs [count] [category]
 *   pm2 start scripts/forum/llm-generate.mjs --name forum-llm-gen --no-autorestart
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

// ── Config ──
const API_BASE = process.env.API_BASE_URL || "https://ttqq.inping.com/v1";
const API_KEY = process.env.API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || "";
const MODEL = process.env.FORUM_LLM_MODEL || "auto";
const COUNT = parseInt(process.argv[2] || "5", 10);
const CATEGORY = process.argv[2] || null; // optional: 'bazi', 'fengshui', etc.

// ── Categories & industries ──
const CATEGORIES = [
  { key: "bazi", label: "八字命盘", topics: ["日主旺衰", "十神组合", "大运流年", "财官印格局", "配偶宫位"] },
  { key: "ziwei", label: "紫微斗数", topics: ["命宫主星", "夫妻宫", "财帛宫", "事业宫", "化忌冲"] },
  { key: "fengshui", label: "风水堪舆", topics: ["卧室风水", "办公桌朝向", "门口风水", "厨房布局"] },
  { key: "zeri", label: "择日选时", topics: ["结婚择日", "搬家择日", "签约择日", "动土上梁"] },
  { key: "xingming", label: "姓名学", topics: ["宝宝取名", "公司起名", "改名时机", "笔画五行"] },
  { key: "xingzuo", label: "西洋占星", topics: ["行运盘", "合盘", "上升星座", "月亮星座"] },
  { key: "liuyao", label: "六爻预测", topics: ["世应关系", "动爻变爻", "官鬼妻财"] },
];

const INDUSTRIES = [
  "互联网/技术", "金融/投资", "教育/培训", "医疗/健康", "法律/政务",
  "制造业", "电商/零售", "餐饮", "物流/快递", "房产/建筑",
  "媒体/内容", "设计/创意", "销售/市场", "创业", "在校学生",
  "自由职业", "海外华人", "体制内", "游戏", "AI/新时代",
];

const OCCUPATIONS = [
  "前端工程师", "产品经理", "基金经理", "三甲医院医生", "律师",
  "淘宝店主", "咖啡师", "公众号主笔", "跨境电商运营", "HRBP",
  "海外程序员", "PhD在读", "SaaS创业者", "心理咨询师", "AI工程师",
  "网文作者", "独立设计师", "财务顾问", "健身教练", "自由翻译",
];

// ── Prompt templates ──
function buildQuestionPrompt() {
  const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const topic = cat.topics[Math.floor(Math.random() * cat.topics.length)];
  const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
  const occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];

  const styles = [
    "personal crisis narrative",
    "AITA-style moral dilemma",
    "detailed success story with update",
    "emotional family/career conflict",
    "specific event that triggered existential questioning",
    "long-term pattern finally seeking explanation",
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];

  return {
    system: `You are a real person posting on a Chinese metaphysics community forum (like Reddit but for 八字/风水/紫微斗数/占星). Write authentic, personal, emotionally engaging posts that feel 100% human-written.

Rules:
- Write in Chinese (mix in occasional English terms naturally where appropriate)
- Use first-person narrative with real-sounding personal details
- Include specific numbers, dates, locations, emotions
- Posts should be 200-400 Chinese characters
- Add 1-2 "Edit:" updates at the end for realism
- Include a clear question or request for interpretation
- NEVER use templates or formulaic language
- Vary sentence length — mix short emotional sentences with longer explanations
- Include minor contradictions or self-doubt (humans do this)`,
    user: `Write a Reddit-style forum post from a person seeking advice about ${cat.label} (${topic}).

Persona: ${occupation} in ${industry}, posting on a ${cat.label} forum
Style: ${style}

The post should feel like a real person who is genuinely struggling/questioning and decided to post on this forum for help. Include:
1. A compelling title (not clickbait, just specific and intriguing)
2. Personal background (age, job, situation)
3. The specific issue/event that prompted them to post
4. Their emotional state
5. What they've already tried
6. A clear question
7. 1-2 "Edit:" updates

Format as JSON:
{
  "title": "the post title",
  "body": "the full post body with paragraphs",
  "category": "${cat.key}",
  "tags": ["tag1", "tag2", "tag3"]
}`,
    context: { cat, topic, industry, occupation },
  };
}

function buildAnswerPrompt(question) {
  const perspectives = [
    "professional master giving practical advice",
    "sympathetic peer who had similar experience",
    "slightly skeptical but helpful enthusiast",
    "official/organizational voice with structured analysis",
  ];
  const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];

  return {
    system: `You are a community member on a Chinese metaphysics forum responding to someone's question. Write a helpful, authentic, and engaging answer.

Rules:
- Write in Chinese
- Be specific and actionable, not vague
- Reference the OP's details to show you actually read their post
- Include personal anecdote or professional experience
- Answers should be 150-300 characters
- Format with **bold** for key terms
- End with a follow-up question or suggestion
- Never sound like an AI or template`,
    user: `Write a forum reply to this post:

Title: ${question.title}
Post: ${question.body}

Write from the perspective of: ${perspective}

Format as JSON:
{
  "body": "the reply with markdown formatting"
}`,
  };
}

// ── API call ──
async function callLlm(system, user) {
  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.9,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response");

  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(`Failed to parse JSON: ${content.slice(0, 200)}`);
  }
}

// ── Database (direct SQLite, no ts imports needed) ──
import Database from "better-sqlite3";

const dbPath = resolve(ROOT, "data", "lifekline.db");
const db = new Database(dbPath);

function slugify(text) {
  return text
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "")
    .slice(0, 20)
    .toLowerCase();
}

function insertQuestion(q) {
  const id = `llm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const slug = `${slugify(q.title)}-${id.slice(-6)}`;
  const publishedAt = new Date(
    Date.now() - Math.floor(Math.random() * 86400000 * 7)
  ).toISOString();

  const stmt = db.prepare(`
    INSERT INTO forum_questions (id, slug, author_id, title, body, category, industry, tags, privacy_mode, metadata, status, published_at, created_at, view_count, answer_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'visible', ?, ?, ?, ?)
  `);

  const authorId = `u_${Math.floor(Math.random() * 500).toString(36)}`;
  const tags = JSON.stringify((q.tags || []).slice(0, 6));
  const metadata = JSON.stringify({ source: "llm-auto-4b", model: MODEL });

  stmt.run(
    id, slug, authorId, q.title, q.body, q.category || "bazi",
    q.industry || INDUSTRIES[0], tags, "partial-bazi", metadata,
    publishedAt, publishedAt,
    Math.floor(Math.random() * 300) + 20,
    0
  );

  return { id, slug, title: q.title };
}

function insertAnswer(questionId, answerBody) {
  const id = `lla_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const authorId = `u_${Math.floor(Math.random() * 500).toString(36)}`;
  const publishedAt = new Date(
    Date.now() - Math.floor(Math.random() * 3600000)
  ).toISOString();

  db.prepare(`
    INSERT INTO forum_answers (id, question_id, author_id, body, is_official, upvote_count, status, published_at, created_at, response_delay_minutes)
    VALUES (?, ?, ?, ?, ?, ?, 'visible', ?, ?, ?)
  `).run(
    id, questionId, authorId, answerBody,
    Math.random() < 0.3 ? 1 : 0,
    Math.floor(Math.random() * 30),
    publishedAt, publishedAt,
    Math.floor(Math.random() * 180) + 10
  );

  return id;
}

// ── Main ──
async function main() {
  if (!API_KEY) {
    console.error("[llm-gen] No API_KEY set. Set API_KEY or OPENAI_API_KEY env var.");
    process.exit(1);
  }

  console.log(`[llm-gen] API: ${API_BASE} | Model: ${MODEL} | Count: ${COUNT}`);
  let success = 0;
  let fail = 0;

  for (let i = 0; i < COUNT; i++) {
    const { system, user, context } = buildQuestionPrompt();
    process.stdout.write(`[llm-gen] ${i + 1}/${COUNT} ${context.cat.label}·${context.topic} `);

    try {
      // Generate question
      const q = await callLlm(system, user);
      if (!q.title || !q.body || q.body.length < 80) {
        console.log("✗ (too short)");
        fail++;
        continue;
      }

      // Insert question
      const inserted = insertQuestion(q);

      // Generate 1-3 answers
      const answerCount = Math.floor(Math.random() * 3) + 1;
      for (let a = 0; a < answerCount; a++) {
        try {
          const { system: aSys, user: aUsr } = buildAnswerPrompt(q);
          const ans = await callLlm(aSys, aUsr);
          if (ans.body && ans.body.length > 50) {
            insertAnswer(inserted.id, ans.body);
          }
        } catch (e) {
          // Answer generation is best-effort
        }
        // Small delay between API calls
        if (a < answerCount - 1) await new Promise(r => setTimeout(r, 500));
      }

      // Update answer count
      const ac = db.prepare("SELECT COUNT(*) as n FROM forum_answers WHERE question_id = ?").get(inserted.id);
      db.prepare("UPDATE forum_questions SET answer_count = ? WHERE id = ?").run(ac.n, inserted.id);

      console.log(`✓ "${inserted.title.slice(0, 40)}..." (${q.body.length}c, ${ac.n}a)`);
      success++;

      // Delay between questions
      if (i < COUNT - 1) await new Promise(r => setTimeout(r, 1000));

    } catch (e) {
      console.log(`✗ ${e.message.slice(0, 80)}`);
      fail++;
    }
  }

  console.log(`[llm-gen] Done: ${success} generated, ${fail} failed`);

  const total = db.prepare("SELECT COUNT(*) as n FROM forum_questions WHERE json_extract(metadata, '$.source') = 'llm-auto-4b'").get();
  console.log(`[llm-gen] Total LLM questions in DB: ${total.n}`);
  db.close();
}

main().catch((e) => {
  console.error("[llm-gen] Fatal:", e.message);
  process.exit(1);
});
