#!/usr/bin/env node
/**
 * topic-gap.js — 基于 GSC 数据反向推导内容策略。
 *
 * 输出四类 buckets，按 ROI 排序：
 *   1. SWEET_SPOT    高 impressions × 好位置 × 但 CTR 低 → 改 title/description 就能多拿点击
 *   2. NEAR_FIRST    位置 11-20 且 impressions 高 → 改内容做强能冲上首页
 *   3. NEW_TOPIC     高 impressions 但我们没匹配 page（query 落地页不是我们） → 内容缺口
 *   4. DEAD_PAGES    我们发布了但 GSC impressions=0 → 谷歌压根没索引/没收录
 *
 * 用法：node scripts/seo/topic-gap.js [--days=28] [--min-impressions=50] [--save]
 */

const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  if (process.argv.includes(`--${name}`)) return true;
  return fallback;
}

const DAYS = Number(arg('days', 28));
const MIN_IMPR = Number(arg('min-impressions', 30));
const SAVE = Boolean(arg('save', false));

const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });

const since = `date('now', '-${DAYS} days')`;

const gscRowCheck = db
  .prepare(`SELECT COUNT(*) AS n FROM gsc_query_daily WHERE date >= ${since}`)
  .get();

if (!gscRowCheck || gscRowCheck.n === 0) {
  console.error(`[topic-gap] gsc_query_daily 近 ${DAYS} 天没有数据。先跑 npm run seo:gsc:fetch`);
  process.exit(2);
}

// 1) SWEET_SPOT: impressions 高、position 好（<10）但 ctr 差
const sweetSpot = db
  .prepare(
    `SELECT query, page,
            SUM(impressions) AS impr, SUM(clicks) AS clicks,
            AVG(position) AS pos, (SUM(clicks)*1.0 / NULLIF(SUM(impressions),0)) AS ctr
       FROM gsc_query_daily
      WHERE date >= ${since}
      GROUP BY query, page
     HAVING impr >= ? AND pos <= 10 AND ctr < 0.02
      ORDER BY impr DESC
      LIMIT 40`
  )
  .all(MIN_IMPR);

// 2) NEAR_FIRST: impressions >= MIN_IMPR, position 11-20
const nearFirst = db
  .prepare(
    `SELECT query, page,
            SUM(impressions) AS impr, SUM(clicks) AS clicks,
            AVG(position) AS pos, (SUM(clicks)*1.0 / NULLIF(SUM(impressions),0)) AS ctr
       FROM gsc_query_daily
      WHERE date >= ${since}
      GROUP BY query, page
     HAVING impr >= ? AND pos > 10 AND pos <= 20
      ORDER BY impr DESC
      LIMIT 40`
  )
  .all(MIN_IMPR);

// 3) NEW_TOPIC: query 的 impressions 高但所有落地 page 都是 / or 跟我们业务无关 (简化：page 是空或 /)
const newTopic = db
  .prepare(
    `SELECT query,
            SUM(impressions) AS impr, SUM(clicks) AS clicks,
            AVG(position) AS pos, COUNT(DISTINCT page) AS pages
       FROM gsc_query_daily
      WHERE date >= ${since}
      GROUP BY query
     HAVING impr >= ? AND MAX(CASE WHEN page NOT IN ('','/','https://www.life-kline.com/') THEN 1 ELSE 0 END) = 0
      ORDER BY impr DESC
      LIMIT 40`
  )
  .all(MIN_IMPR);

// 4) DEAD_PAGES: 已发布但 GSC 近 28 天 impressions 累计为 0
const deadPages = db
  .prepare(
    `WITH published AS (
      SELECT content_type, slug,
             CASE content_type
               WHEN 'knowledge' THEN '/knowledge/' || slug
               WHEN 'case' THEN '/cases/' || slug
               WHEN 'insight' THEN '/insights/' || slug
               ELSE '/' || content_type || '/' || slug
             END AS page
        FROM content_entries WHERE status='published'
    ),
    gsc_page AS (
      SELECT page, SUM(impressions) AS impr FROM gsc_query_daily WHERE date >= ${since} GROUP BY page
    )
    SELECT p.content_type, p.slug, p.page,
           COALESCE(g.impr, 0) AS impr
      FROM published p
      LEFT JOIN gsc_page g ON g.page = p.page
     WHERE COALESCE(g.impr, 0) = 0
     ORDER BY p.content_type, p.slug
     LIMIT 80`
  )
  .all();

const report = {
  generatedAt: new Date().toISOString(),
  windowDays: DAYS,
  minImpressions: MIN_IMPR,
  buckets: {
    sweetSpot: {
      note: '有曝光、有排名但没点击 — 改 title/description 可短期拉起点击',
      rows: sweetSpot,
    },
    nearFirst: {
      note: '排名 11-20 — 优化内容（长尾、结构化、内链）可冲首页',
      rows: nearFirst,
    },
    newTopic: {
      note: '有曝光但我们没专门落地页 — 这是内容缺口，应作为新 SEO 选题',
      rows: newTopic,
    },
    deadPages: {
      note: '已发布但 GSC 近 28 天 impressions 为 0 — 候选下架或合并',
      rows: deadPages,
    },
  },
};

if (SAVE) {
  const outPath = path.join(process.cwd(), 'data', 'runtime', 'gsc-topic-gap.snapshot.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`[topic-gap] snapshot saved: ${outPath}`);
}

console.log('=== SWEET_SPOT — 有曝光有排名但点击率低，最快拿点击 ===');
console.table(
  sweetSpot.slice(0, 20).map((r) => ({
    query: r.query.slice(0, 40),
    page: r.page.slice(0, 60),
    impr: Math.round(r.impr),
    clicks: Math.round(r.clicks),
    pos: r.pos.toFixed(1),
    ctr: (r.ctr * 100).toFixed(2) + '%',
  }))
);

console.log('\n=== NEAR_FIRST — 排名 11-20，内容强化可上首页 ===');
console.table(
  nearFirst.slice(0, 20).map((r) => ({
    query: r.query.slice(0, 40),
    page: r.page.slice(0, 60),
    impr: Math.round(r.impr),
    clicks: Math.round(r.clicks),
    pos: r.pos.toFixed(1),
  }))
);

console.log('\n=== NEW_TOPIC — 内容缺口，直接作为新 SEO 选题 ===');
console.table(
  newTopic.slice(0, 20).map((r) => ({
    query: r.query.slice(0, 50),
    impr: Math.round(r.impr),
    clicks: Math.round(r.clicks),
    pos: r.pos.toFixed(1),
  }))
);

console.log(`\n=== DEAD_PAGES — 已发布但零曝光，共 ${deadPages.length} 条 ===`);
console.table(deadPages.slice(0, 20));

db.close();
