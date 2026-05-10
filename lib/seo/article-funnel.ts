import path from 'node:path';
import process from 'node:process';
import Database from 'better-sqlite3';

interface AnalyticsEventRow {
  event_name: string;
  meta: string | null;
}

interface SurfaceFunnelRow {
  surfaceKey: string;
  slug: string;
  views: number;
  impressed: number;
  clicked: number;
  started: number;
  conversionRate: number;
}

export interface ArticleFunnelResult {
  totals: {
    views: number;
    impressed: number;
    clicked: number;
    started: number;
  };
  conversionRate: number;
  bySurface: SurfaceFunnelRow[];
}

const VIEW_EVENTS = new Set([
  'knowledge_article_viewed',
  'case_article_viewed',
  'insight_article_viewed',
]);

export function computeArticleFunnel(events: AnalyticsEventRow[]): ArticleFunnelResult {
  let views = 0;
  let impressed = 0;
  let clicked = 0;
  let started = 0;
  const bySurface = new Map<string, SurfaceFunnelRow>();

  for (const ev of events) {
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse(ev.meta || '{}');
    } catch {
      // skip malformed meta
    }
    const surfaceKey = (typeof meta.surfaceKey === 'string' ? meta.surfaceKey : '') || '';
    const slug = (typeof meta.slug === 'string' ? meta.slug : '') || '';
    if (!surfaceKey) continue;

    if (!bySurface.has(surfaceKey)) {
      bySurface.set(surfaceKey, {
        surfaceKey,
        slug,
        views: 0,
        impressed: 0,
        clicked: 0,
        started: 0,
        conversionRate: 0,
      });
    }
    const bucket = bySurface.get(surfaceKey)!;

    if (VIEW_EVENTS.has(ev.event_name)) {
      views++;
      bucket.views++;
    } else if (ev.event_name === 'article_cta_impressed') {
      impressed++;
      bucket.impressed++;
    } else if (ev.event_name === 'article_cta_clicked') {
      clicked++;
      bucket.clicked++;
    } else if (ev.event_name === 'content_quick_analyze_started') {
      started++;
      bucket.started++;
    }
  }

  for (const bucket of bySurface.values()) {
    bucket.conversionRate = bucket.views > 0 ? bucket.started / bucket.views : 0;
  }

  return {
    totals: { views, impressed, clicked, started },
    conversionRate: views > 0 ? started / views : 0,
    bySurface: Array.from(bySurface.values()).sort((a, b) => b.views - a.views),
  };
}

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main() {
  const days = Number(arg('days', '14'));
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly: true });

  const BOT_PRED = `(u.role='guest' AND u.birth_date='1990-01-01' AND u.birth_time IN ('12:00','00:00') AND u.birth_place='北京')`;

  const events = db
    .prepare(
      `
    SELECT e.event_name, e.meta
    FROM analytics_events e
    LEFT JOIN users u ON u.id = e.user_id
    WHERE datetime(e.created_at) >= datetime('now', '-${days} days')
      AND e.event_name IN (
        'knowledge_article_viewed','case_article_viewed','insight_article_viewed',
        'article_cta_impressed','article_cta_clicked','content_quick_analyze_started'
      )
      AND NOT ${BOT_PRED}
  `
    )
    .all() as AnalyticsEventRow[];

  console.log(`[article-funnel] 窗口 ${days} 天 / 事件 ${events.length} 条（已去 bot）`);
  const result = computeArticleFunnel(events);

  console.log('\n=== 总漏斗 ===');
  console.table([
    {
      views: result.totals.views,
      impressed: result.totals.impressed,
      clicked: result.totals.clicked,
      started: result.totals.started,
      conversionRate: (result.conversionRate * 100).toFixed(2) + '%',
    },
  ]);

  console.log('\n=== 按 surfaceKey 排序前 15 ===');
  console.table(
    result.bySurface.slice(0, 15).map((r) => ({
      surfaceKey: r.surfaceKey,
      views: r.views,
      impressed: r.impressed,
      clicked: r.clicked,
      started: r.started,
      rate: (r.conversionRate * 100).toFixed(2) + '%',
    }))
  );

  db.close();
}

if (process.argv[1]?.endsWith('article-funnel.ts')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
