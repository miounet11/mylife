/**
 * Real demand signals → people-first satellite queue.
 *
 * LDPlayer model: content follows real user jobs (install issues, character guides),
 * not empty keyword farms. We pull forum heat + map to destiny entities.
 *
 * Local sandbox: database stub returns empty; production reads forum_questions.
 * See docs/ldplayer-ops-and-google-alignment.md
 */

import type { DestinyMatrixSlot, ContentOsLocale, DestinyEntityKind } from '@/lib/content-os/matrix';
import { sanitizeContentSlug } from '@/lib/content-generation';

export type DemandSignal = {
  id: string;
  source: 'forum' | 'analytics' | 'manual';
  title: string;
  score: number;
  keywords: string[];
  category?: string;
  bodySnippet?: string;
  href?: string;
  /** Best-effort entity binding */
  entityKind?: DestinyEntityKind;
  entitySlug?: string;
  entityName?: string;
  ctaHref?: string;
};

type EntityBind = {
  entityKind: DestinyEntityKind;
  entitySlug: string;
  entityName: string;
  ctaHref: string;
  keywords: string[];
};

/** Finite entity map — keywords must be specific enough to avoid false doorway. */
const ENTITY_BINDS: EntityBind[] = [
  {
    entityKind: 'life-question',
    entitySlug: 'should-i-change-job',
    entityName: '该不该换工作',
    ctaHref: '/dimensions/career-industry',
    keywords: ['跳槽', '换工作', '离职', '升职', '裁员', '换岗', '面试'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'when-to-marry',
    entityName: '什么时候适合谈婚论嫁',
    ctaHref: '/dimensions/marriage',
    keywords: ['结婚', '婚恋', '感情', '分手', '复合', '合婚', '桃花'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'invest-or-hold',
    entityName: '今年宜进还是宜守',
    ctaHref: '/dimensions/investment',
    keywords: ['投资', '破财', '理财', '股票', '创业资金', '现金流'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'move-city',
    entityName: '要不要换城市发展',
    ctaHref: '/movement',
    keywords: ['迁城', '搬家', '定居', '出国', '移民', '换城市', '一线'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'name-change',
    entityName: '改名有没有用',
    ctaHref: '/tools/naming',
    keywords: ['改名', '起名', '姓名', '五行名'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'true-solar-time',
    entityName: '真太阳时为什么重要',
    ctaHref: '/docs/solar-time',
    keywords: ['真太阳时', '时辰', '排盘不准', '出生时间'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'benmingnian',
    entityName: '本命年要注意什么',
    ctaHref: '/dimensions/fortune-rhythm',
    keywords: ['本命年', '太岁', '犯太岁'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'read-my-report',
    entityName: '怎么读懂命理报告',
    ctaHref: '/docs/read-first-report',
    keywords: ['报告', '看不懂', '用神', '日主旺衰', '格局'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'start-business',
    entityName: '创业还是打工',
    ctaHref: '/dimensions/career-industry',
    keywords: ['创业', '合伙', '开公司', '副业'],
  },
  {
    entityKind: 'life-question',
    entitySlug: 'study-major',
    entityName: '升学与专业方向',
    ctaHref: '/dimensions/study-career',
    keywords: ['高考', '专业', '升学', '考研', '留学'],
  },
  {
    entityKind: 'dimension',
    entitySlug: 'fortune-rhythm',
    entityName: '运势节奏',
    ctaHref: '/dimensions/fortune-rhythm',
    keywords: ['大运', '流年', '运势节奏', '转折'],
  },
  {
    entityKind: 'tool',
    entitySlug: 'hehun',
    entityName: '合婚双盘',
    ctaHref: '/hehun',
    keywords: ['合婚', '配对', '双盘'],
  },
  {
    entityKind: 'tool',
    entitySlug: 'naming',
    entityName: '起名工坊',
    ctaHref: '/tools/naming',
    keywords: ['起名教程', '宝宝起名', '公司起名'],
  },
  {
    entityKind: 'methodology',
    entitySlug: 'world-yi-six-steps',
    entityName: '世界易六步判断法',
    ctaHref: '/world-yi',
    keywords: ['世界易', '六步', '结构时位'],
  },
];

/** Only clear content hubs — never force-bind 塔罗/六爻 noise into Bazi entities. */
const CATEGORY_DEFAULT_BIND: Record<string, EntityBind> = {
  xingming: ENTITY_BINDS.find((e) => e.entitySlug === 'name-change')!,
  zeri: {
    entityKind: 'tool',
    entitySlug: 'almanac',
    entityName: '黄历择日',
    ctaHref: '/almanac',
    keywords: ['择日'],
  },
  xingzuo: {
    entityKind: 'tool',
    entitySlug: 'astro',
    entityName: '星座体系',
    ctaHref: '/astro',
    keywords: ['星座'],
  },
};

/** Other-system noise: do not hang these on Bazi destiny hubs (doorway / off-topic). */
const OFF_TOPIC_NOISE =
  /塔罗|塔羅|六爻|梅花|奇门|奇門|紫微|斗数|斗數|万物类象|類象|摔破杯子|大牌|牌阵|牌陣/;

function bindEntity(title: string, body: string, category?: string): EntityBind | null {
  const text = `${title}\n${body}`;

  // Skip pure other-system questions unless they also hit a clear name/career keyword
  if (OFF_TOPIC_NOISE.test(text)) {
    const allowedDespiteNoise =
      /起名|改名|跳槽|换工作|结婚|合婚|迁城|搬家|真太阳时|本命年|太岁/.test(text);
    if (!allowedDespiteNoise) return null;
  }

  let best: EntityBind | null = null;
  let bestScore = 0;
  for (const bind of ENTITY_BINDS) {
    let score = 0;
    for (const k of bind.keywords) {
      if (!k || k.length < 2) continue;
      if (text.includes(k)) {
        // Longer keyword matches weigh more (anti false-positive)
        score += Math.min(5, Math.max(2, k.length));
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = bind;
    }
  }
  // Require meaningful keyword weight
  if (best && bestScore >= 3) return best;

  const cat = `${category || ''}`.trim();
  if (cat && CATEGORY_DEFAULT_BIND[cat] && title.length <= 18 && !OFF_TOPIC_NOISE.test(title)) {
    return CATEGORY_DEFAULT_BIND[cat];
  }
  return null;
}

function tryLoadForumSignals(lookbackDays: number, limit: number): DemandSignal[] {
  try {
    // Production database exposes better-sqlite3; local stub prepare().all returns []
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { db } = require('@/lib/database') as {
      db: {
        prepare: (sql: string) => {
          all: (...args: unknown[]) => Array<Record<string, unknown>>;
        };
      };
    };

    const since = new Date(Date.now() - lookbackDays * 86_400_000).toISOString();
    const rows = db
      .prepare(
        `
      SELECT id, slug, title, body, category, tags, view_count, answer_count,
             COALESCE(published_at, created_at) AS ts
      FROM forum_questions
      WHERE status = 'visible'
        AND datetime(COALESCE(published_at, created_at)) >= datetime(?)
      ORDER BY
        COALESCE(view_count, 0) * 2 + COALESCE(answer_count, 0) * 5 DESC,
        datetime(COALESCE(published_at, created_at)) DESC
      LIMIT ?
    `,
      )
      .all(since, limit) as Array<{
      id: string;
      slug?: string;
      title: string;
      body?: string;
      category?: string;
      tags?: string;
      view_count?: number;
      answer_count?: number;
      ts?: string;
    }>;

    if (!Array.isArray(rows) || rows.length === 0) return [];

    return rows
      .map((row) => {
        const title = `${row.title || ''}`.trim();
        if (title.length < 6) return null;
        const body = `${row.body || ''}`.trim().slice(0, 280);
        const views = Number(row.view_count || 0);
        const replies = Number(row.answer_count || 0);
        const score = Math.min(100, views * 2 + replies * 5 + 10);
        const bind = bindEntity(title, body, row.category);
        let tags: string[] = [];
        try {
          const parsed = JSON.parse(row.tags || '[]');
          if (Array.isArray(parsed)) tags = parsed.map(String).slice(0, 8);
        } catch {
          /* ignore */
        }
        return {
          id: `forum_${row.id}`,
          source: 'forum' as const,
          title,
          score,
          keywords: tags,
          category: row.category,
          bodySnippet: body,
          href: row.slug ? `/community/${row.slug}` : undefined,
          entityKind: bind?.entityKind,
          entitySlug: bind?.entitySlug,
          entityName: bind?.entityName,
          ctaHref: bind?.ctaHref,
        };
      })
      .filter(Boolean) as DemandSignal[];
  } catch {
    return [];
  }
}

export function collectDemandSignals(options?: {
  lookbackDays?: number;
  limit?: number;
}): DemandSignal[] {
  const lookbackDays = options?.lookbackDays ?? 14;
  const limit = Math.max(5, Math.min(options?.limit ?? 40, 80));
  const forum = tryLoadForumSignals(lookbackDays, limit);
  // Sort by score descending
  return forum.sort((a, b) => b.score - a.score);
}

/** Boost for catalog slots that match real demand (not inventing pages). */
export function demandBoostForSlot(
  slot: { entityKind: string; entitySlug: string; topic: string; keywords?: string[] },
  signals: DemandSignal[],
): { boost: number; matched: DemandSignal[] } {
  const matched: DemandSignal[] = [];
  for (const s of signals) {
    if (s.entityKind === slot.entityKind && s.entitySlug === slot.entitySlug) {
      matched.push(s);
      continue;
    }
    const hay = `${slot.topic} ${(slot.keywords || []).join(' ')}`.toLowerCase();
    if (s.keywords.some((k) => hay.includes(k.toLowerCase())) || hay.includes(s.title.slice(0, 6))) {
      matched.push(s);
    }
  }
  if (!matched.length) return { boost: 0, matched: [] };
  const top = matched.slice(0, 5);
  const boost = Math.min(
    80,
    top.reduce((n, s) => n + Math.min(20, s.score / 3), 0),
  );
  return { boost, matched: top };
}

/**
 * Turn top forum questions into satellite slots.
 * Each slot's topic = real user title (task-type), angle = unique from body + entity method.
 * Key includes question id → no doorway matrix collision.
 */
export function buildSatelliteSlotsFromDemand(params: {
  signals: DemandSignal[];
  locale?: ContentOsLocale;
  market?: string;
  limit?: number;
}): DestinyMatrixSlot[] {
  const locale = params.locale || 'zh-CN';
  const market = params.market || '中国大陆';
  const limit = Math.max(1, Math.min(params.limit ?? 8, 15));
  const out: DestinyMatrixSlot[] = [];

  for (const signal of params.signals) {
    if (out.length >= limit) break;
    if (!signal.entityKind || !signal.entitySlug || !signal.entityName) continue;
    // Require enough specificity — short spam titles skipped
    if (signal.title.length < 8) continue;

    const uniqueAngle = signal.bodySnippet
      ? `来自社区真实提问「${signal.title.slice(0, 40)}」：结合${signal.entityName}的结构·时位·环境拆解，不给恐吓式结论`
      : `回应社区高频问题「${signal.title.slice(0, 40)}」：给出可验证动作与边界，而非吉凶标签`;

    const slugBase = sanitizeContentSlug(
      `community-${signal.entitySlug}-${signal.id.replace(/[^a-z0-9]+/gi, '').slice(-10)}`,
      'knowledge',
    );

    const hubHref = `/topics/${
      signal.entityKind === 'life-question'
        ? `q-${signal.entitySlug}`
        : signal.entityKind === 'dimension'
          ? `dimension-${signal.entitySlug}`
          : signal.entityKind === 'tool'
            ? `tool-${signal.entitySlug}`
            : `${signal.entityKind}-${signal.entitySlug}`
    }`;

    out.push({
      key: `demand__${signal.id}__${locale}`,
      entityKind: signal.entityKind,
      entitySlug: signal.entitySlug,
      entityName: signal.entityName,
      template: 'how-to',
      contentType: 'knowledge',
      locale,
      market,
      topic: signal.title.slice(0, 80),
      angle: uniqueAngle,
      keywords: [...new Set([...(signal.keywords || []), signal.entityName, '人生K线'])].slice(0, 8),
      audience: '带着真实问题来社区提问的用户',
      pathFamily: 'knowledge',
      priority: 100 + Math.min(40, signal.score),
      refreshDays: 120,
      relatedCta: {
        href: signal.ctaHref || '/analyze',
        label: '去验证',
      },
      searchIntents: [
        signal.title,
        `${signal.entityName}怎么看`,
        ...(signal.keywords || []).slice(0, 2).map((k) => `${k}怎么办`),
      ].slice(0, 5),
      hubHref,
      sourceDemandId: signal.id,
      sourceCommunityHref: signal.href,
      sourceDemandTitle: signal.title,
    });

    void slugBase;
  }

  return out;
}

export function summarizeDemandSignals(signals: DemandSignal[]) {
  const byEntity = new Map<string, number>();
  for (const s of signals) {
    const k = s.entitySlug || s.category || 'unbound';
    byEntity.set(k, (byEntity.get(k) || 0) + 1);
  }
  return {
    total: signals.length,
    byEntity: Object.fromEntries(byEntity),
    top: signals.slice(0, 10).map((s) => ({
      title: s.title,
      score: s.score,
      entity: s.entitySlug,
      source: s.source,
    })),
  };
}
