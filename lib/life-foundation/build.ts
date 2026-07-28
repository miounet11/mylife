/**
 * 从档案 / 补全 / 工具会话 / 事件 聚合人生数据底座快照
 */

import { fortuneOperations, toolSessionOperations, eventOperations } from '@/lib/database';
import {
  profileDocumentOperations,
  profileSupplementOperations,
  profileChangeLogOperations,
  ensureProfileSettingsSchema,
} from '@/lib/profile-settings-store';
import { PROFILE_SUPPLEMENT_DOMAINS, type SupplementDomain } from '@/lib/profile-settings-types';
import { buildAstroFromBirth } from '@/lib/life-foundation/zodiac';
import { FOUNDATION_LAYER_META, FOUNDATION_SIGNAL_TOOLS, gradeFromOverall } from '@/lib/life-foundation/modules';
import type {
  FoundationAstroSnapshot,
  FoundationItem,
  FoundationItemStatus,
  FoundationLayer,
  FoundationLayerId,
  FoundationNextStep,
  FoundationToolSignal,
  LifeFoundationSnapshot,
} from '@/lib/life-foundation/types';

type FortuneRow = {
  id: string;
  name?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  gender?: string | null;
  intent?: string | null;
  birthAccuracy?: string | null;
  isPrimary?: boolean | number | null;
  relation?: string | null;
  deletedAt?: string | null;
  bazi?: unknown;
};

function filled(v: unknown): boolean {
  return `${v ?? ''}`.trim().length > 0;
}

function itemStatus(score: number, optional = false): FoundationItemStatus {
  if (score >= 100) return 'done';
  if (score > 0) return 'partial';
  return optional ? 'optional' : 'missing';
}

function layerStatus(score: number): FoundationItemStatus {
  if (score >= 90) return 'done';
  if (score >= 40) return 'partial';
  return 'missing';
}

function parseBaziPillars(bazi: unknown): string | null {
  if (!bazi) return null;
  try {
    const raw = typeof bazi === 'string' ? JSON.parse(bazi) : bazi;
    const basic = (raw as { basic?: { pillars?: unknown; dayMaster?: string } })?.basic || raw;
    const pillars = (basic as { pillars?: unknown }).pillars;
    if (Array.isArray(pillars) && pillars.length) {
      return pillars
        .map((p) => {
          if (typeof p === 'string') return p;
          const o = p as { stem?: string; branch?: string; celestialStem?: string; earthlyBranch?: string };
          return `${o.stem || o.celestialStem || ''}${o.branch || o.earthlyBranch || ''}`;
        })
        .filter(Boolean)
        .join(' · ');
    }
    const dm = (basic as { dayMaster?: string }).dayMaster;
    return dm ? `日主 ${dm}` : null;
  } catch {
    return null;
  }
}

function pickActiveFortune(rows: FortuneRow[], fortuneId?: string | null): FortuneRow | null {
  const live = rows.filter((r) => !r.deletedAt);
  if (live.length === 0) return null;
  if (fortuneId) {
    const hit = live.find((r) => r.id === fortuneId);
    if (hit) return hit;
  }
  return (
    live.find((r) => r.isPrimary === true || r.isPrimary === 1) ||
    live.find((r) => r.relation === 'self') ||
    live[0]
  );
}

function listSupplements(userId: string, fortuneId: string | null) {
  ensureProfileSettingsSchema();
  const byFortune = fortuneId ? profileSupplementOperations.listByUser(userId, fortuneId) : [];
  const byAccount = profileSupplementOperations.listByUser(userId, null);
  const map = new Map<string, Record<string, string>>();
  for (const row of [...byAccount, ...byFortune]) {
    const prev = map.get(row.domain) || {};
    map.set(row.domain, { ...prev, ...(row.fields || {}) });
  }
  return map;
}

function scoreDomainFields(fields: Record<string, string> | undefined, domain: SupplementDomain): number {
  const def = PROFILE_SUPPLEMENT_DOMAINS[domain];
  if (!def || def.fields.length === 0) return 0;
  const filledCount = def.fields.filter((f) => filled(fields?.[f.key])).length;
  return Math.round((filledCount / def.fields.length) * 100);
}

function readSessionField(session: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const camel = k;
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    const v = session[camel] ?? session[snake];
    if (v != null && `${v}`.trim()) return `${v}`.trim();
  }
  return '';
}

function aggregateToolSignals(sessions: unknown[]): {
  signals: FoundationToolSignal[];
  byItem: Record<string, { count: number; lastAt: string | null; sessionId: string | null }>;
  total: number;
} {
  const byItem: Record<string, { count: number; lastAt: string | null; sessionId: string | null }> = {};
  const slugCount = new Map<string, FoundationToolSignal>();

  for (const raw of sessions) {
    const s = (raw || {}) as Record<string, unknown>;
    const slug = readSessionField(s, 'toolSlug', 'tool_slug');
    if (!slug) continue;
    const def = FOUNDATION_SIGNAL_TOOLS.find((t) => t.slug === slug || t.slug === slug.replace(/_/g, '-'));
    const title = def?.title || slug;
    const href = def?.href || `/tools/${slug}`;
    const id = readSessionField(s, 'id');
    const at =
      readSessionField(s, 'createdAt', 'created_at', 'updatedAt', 'updated_at') || null;

    const prev = slugCount.get(slug);
    if (prev) {
      prev.count += 1;
      if (at && (!prev.lastAt || at > prev.lastAt)) {
        prev.lastAt = at;
        prev.sessionId = id || prev.sessionId;
      }
    } else {
      slugCount.set(slug, {
        toolSlug: slug,
        title,
        lastAt: at,
        sessionId: id || null,
        href,
        count: 1,
      });
    }

    if (def) {
      const cur = byItem[def.itemId] || { count: 0, lastAt: null, sessionId: null };
      cur.count += 1;
      if (at && (!cur.lastAt || at > cur.lastAt)) {
        cur.lastAt = at;
        cur.sessionId = id || null;
      }
      byItem[def.itemId] = cur;
    }
  }

  return {
    signals: Array.from(slugCount.values()).sort((a, b) =>
      (b.lastAt || '').localeCompare(a.lastAt || ''),
    ),
    byItem,
    total: sessions.length,
  };
}

function buildBirthLayer(fortune: FortuneRow | null, pillars: string | null): FoundationLayer {
  const meta = FOUNDATION_LAYER_META.birth;
  const items: FoundationItem[] = [
    {
      id: 'birth_date',
      layerId: 'birth',
      label: '出生日期',
      description: '年月日是八字与星座的共同锚点',
      score: filled(fortune?.birthDate) ? 100 : 0,
      status: filled(fortune?.birthDate) ? 'done' : 'missing',
      href: fortune?.id
        ? `/profile/settings?fortuneId=${encodeURIComponent(fortune.id)}&tab=basic`
        : '/analyze?source=foundation_birth',
      ctaLabel: filled(fortune?.birthDate) ? '核对' : '填写生辰',
      valueSummary: fortune?.birthDate || null,
      weight: 0.28,
      fixed: true,
    },
    {
      id: 'birth_time',
      layerId: 'birth',
      label: '出生时辰',
      description: '时柱影响用神细节与上升推算可信度',
      score: filled(fortune?.birthTime) ? 100 : 0,
      status: filled(fortune?.birthTime) ? 'done' : 'missing',
      href: fortune?.id
        ? `/profile/settings?fortuneId=${encodeURIComponent(fortune.id)}&tab=basic&highlight=birthTime`
        : '/analyze?source=foundation_time',
      ctaLabel: '补时辰',
      valueSummary: fortune?.birthTime || null,
      weight: 0.18,
      fixed: true,
    },
    {
      id: 'birth_place',
      layerId: 'birth',
      label: '出生地点',
      description: '用于真太阳时与地理信号',
      score: filled(fortune?.birthPlace) ? 100 : 0,
      status: filled(fortune?.birthPlace) ? 'done' : 'missing',
      href: fortune?.id
        ? `/profile/settings?fortuneId=${encodeURIComponent(fortune.id)}&tab=basic`
        : '/analyze?source=foundation_place',
      ctaLabel: '补地点',
      valueSummary: fortune?.birthPlace || null,
      weight: 0.12,
    },
    {
      id: 'gender',
      layerId: 'birth',
      label: '性别',
      description: '大运顺逆与部分表达层',
      score: filled(fortune?.gender) ? 100 : 0,
      status: filled(fortune?.gender) ? 'done' : 'missing',
      href: fortune?.id
        ? `/profile/settings?fortuneId=${encodeURIComponent(fortune.id)}&tab=basic`
        : '/analyze?source=foundation_gender',
      ctaLabel: '设置',
      valueSummary: fortune?.gender === 'female' ? '女' : fortune?.gender === 'male' ? '男' : null,
      weight: 0.12,
      fixed: true,
    },
    {
      id: 'accuracy',
      layerId: 'birth',
      label: '时间准确度',
      description: 'exact / range / unknown 决定时柱权重',
      score: filled(fortune?.birthAccuracy) ? 100 : 0,
      status: filled(fortune?.birthAccuracy) ? 'done' : 'partial',
      href: fortune?.id
        ? `/profile/settings?fortuneId=${encodeURIComponent(fortune.id)}&tab=basic`
        : '/profile/settings?tab=basic',
      ctaLabel: '标注准确度',
      valueSummary: fortune?.birthAccuracy || null,
      weight: 0.1,
    },
    {
      id: 'pillars',
      layerId: 'birth',
      label: '四柱八字',
      description: '由生辰推算的年/月/日/时柱',
      score: pillars ? 100 : filled(fortune?.birthDate) ? 40 : 0,
      status: pillars ? 'done' : filled(fortune?.birthDate) ? 'partial' : 'missing',
      href: fortune?.id ? `/result/${fortune.id}` : '/analyze?source=foundation_report',
      ctaLabel: pillars ? '查看报告' : '生成结构报告',
      valueSummary: pillars,
      weight: 0.2,
      fixed: true,
    },
  ];

  const score = Math.round(
    items.reduce((sum, it) => sum + it.score * it.weight, 0) /
      Math.max(0.01, items.reduce((s, it) => s + it.weight, 0)),
  );

  const missing = items.find((i) => i.status === 'missing');
  return {
    id: 'birth',
    title: meta.title,
    subtitle: meta.subtitle,
    weight: meta.weight,
    score,
    status: layerStatus(score),
    items,
    nextHref: missing?.href || items[0].href,
    nextLabel: missing?.ctaLabel || '完善生辰',
  };
}

function buildAstroLayer(
  birthDate: string | null | undefined,
  supFields: Record<string, string> | undefined,
): { layer: FoundationLayer; astro: FoundationAstroSnapshot } {
  const meta = FOUNDATION_LAYER_META.astro;
  const computed = buildAstroFromBirth(birthDate || null);
  const sunSign = supFields?.sunSign || computed.sunSign;
  const chineseZodiac = supFields?.chineseZodiac || computed.chineseZodiac;
  const moonSign = supFields?.moonSign || null;
  const risingSign = supFields?.risingSign || null;

  const hasBirth = filled(birthDate);
  const items: FoundationItem[] = [
    {
      id: 'sun_sign',
      layerId: 'astro',
      label: '太阳星座',
      description: '由公历生日推导的民用太阳星座',
      score: sunSign ? 100 : 0,
      status: sunSign ? 'done' : 'missing',
      href: `/tools/zodiac${birthDate ? `?birthDate=${encodeURIComponent(birthDate)}` : ''}&source=foundation`,
      ctaLabel: sunSign ? '查看解读' : '推算星座',
      valueSummary: sunSign
        ? `${sunSign}${computed.element ? ` · ${computed.element}` : ''}${computed.modality ? ` · ${computed.modality}` : ''}`
        : null,
      weight: 0.35,
      fixed: true,
    },
    {
      id: 'chinese_zodiac',
      layerId: 'astro',
      label: '生肖',
      description: '近立春分界的公历近似；精确以年柱为准',
      score: chineseZodiac ? 100 : 0,
      status: chineseZodiac ? 'done' : 'missing',
      href: `/tools/zodiac?source=foundation_cz`,
      ctaLabel: '查看生肖',
      valueSummary: chineseZodiac ? `${chineseZodiac}年` : null,
      weight: 0.25,
      fixed: true,
    },
    {
      id: 'moon_sign',
      layerId: 'astro',
      label: '月亮星座',
      description: '情绪与潜意识取向；需自填或精确星盘',
      score: moonSign ? 100 : 0,
      status: moonSign ? 'done' : 'optional',
      href: '/tools/zodiac?focus=moon&source=foundation',
      ctaLabel: moonSign ? '修改' : '选填月亮',
      valueSummary: moonSign,
      weight: 0.2,
    },
    {
      id: 'rising_sign',
      layerId: 'astro',
      label: '上升星座',
      description: '呈现给世界的样貌；依赖出生时刻',
      score: risingSign ? 100 : 0,
      status: risingSign ? 'done' : 'optional',
      href: '/tools/zodiac?focus=rising&source=foundation',
      ctaLabel: risingSign ? '修改' : '选填上升',
      valueSummary: risingSign,
      weight: 0.2,
    },
  ];

  // optional items don't drag score as hard if missing
  let wSum = 0;
  let sSum = 0;
  for (const it of items) {
    const w = it.status === 'optional' && it.score === 0 ? it.weight * 0.25 : it.weight;
    wSum += w;
    sSum += it.score * w;
  }
  const score = hasBirth ? Math.round(sSum / Math.max(0.01, wSum)) : 0;

  const astro: FoundationAstroSnapshot = {
    sunSign,
    sunSignEn: computed.sunSignEn,
    chineseZodiac,
    chineseZodiacYear: computed.chineseZodiacYear,
    moonSign,
    risingSign,
    element: computed.element,
    modality: computed.modality,
    source: !hasBirth
      ? 'none'
      : moonSign || risingSign || supFields?.sunSign
        ? 'mixed'
        : 'computed',
  };

  return {
    layer: {
      id: 'astro',
      title: meta.title,
      subtitle: meta.subtitle,
      weight: meta.weight,
      score,
      status: layerStatus(score),
      items,
      nextHref: items.find((i) => i.status === 'missing')?.href || '/tools/zodiac?source=foundation',
      nextLabel: hasBirth ? '完善星盘' : '先填生辰',
    },
    astro,
  };
}

function buildBodyLayer(
  byItem: Record<string, { count: number; lastAt: string | null; sessionId: string | null }>,
  fortuneId: string | null,
): FoundationLayer {
  const meta = FOUNDATION_LAYER_META.body;
  const face = byItem.face;
  const palm = byItem.palm;
  const q = fortuneId ? `?fortuneId=${encodeURIComponent(fortuneId)}&source=foundation` : '?source=foundation';

  const items: FoundationItem[] = [
    {
      id: 'face',
      layerId: 'body',
      label: '面相结构',
      description: '三庭五眼 · 五官 · 与用神交叉',
      score: face?.count ? 100 : 0,
      status: face?.count ? 'done' : 'missing',
      href: `/tools/physiognomy${q}`,
      ctaLabel: face?.count ? '复看面相' : '上传面相',
      valueSummary: face?.count ? `已观测 ${face.count} 次` : null,
      weight: 0.55,
    },
    {
      id: 'palm',
      layerId: 'body',
      label: '手相结构',
      description: '手型掌丘 · 主线 · 行动节奏',
      score: palm?.count ? 100 : 0,
      status: palm?.count ? 'done' : 'missing',
      href: `/tools/palmistry${q}`,
      ctaLabel: palm?.count ? '复看手相' : '上传手相',
      valueSummary: palm?.count ? `已观测 ${palm.count} 次` : null,
      weight: 0.45,
    },
  ];

  const score = Math.round(items.reduce((s, it) => s + it.score * it.weight, 0));
  const miss = items.find((i) => i.status === 'missing');
  return {
    id: 'body',
    title: meta.title,
    subtitle: meta.subtitle,
    weight: meta.weight,
    score,
    status: layerStatus(score),
    items,
    nextHref: miss?.href || items[0].href,
    nextLabel: miss?.ctaLabel || '体貌观测',
  };
}

function buildLifeQaLayer(
  supMap: Map<string, Record<string, string>>,
  fortuneId: string | null,
): FoundationLayer {
  const meta = FOUNDATION_LAYER_META.life_qa;
  const domains: Array<{ domain: SupplementDomain; weight: number }> = [
    { domain: 'goals', weight: 0.22 },
    { domain: 'career', weight: 0.2 },
    { domain: 'relationship', weight: 0.16 },
    { domain: 'wealth', weight: 0.14 },
    { domain: 'health', weight: 0.14 },
    { domain: 'residence', weight: 0.14 },
  ];

  const base = fortuneId
    ? `/profile/settings?fortuneId=${encodeURIComponent(fortuneId)}&tab=supplements`
    : '/profile/settings?tab=supplements';

  const items: FoundationItem[] = domains.map(({ domain, weight }) => {
    const def = PROFILE_SUPPLEMENT_DOMAINS[domain];
    const fields = supMap.get(domain) || {};
    const score = scoreDomainFields(fields, domain);
    const filledKeys = def.fields.filter((f) => filled(fields[f.key])).map((f) => f.label);
    return {
      id: `qa_${domain}`,
      layerId: 'life_qa' as FoundationLayerId,
      label: def.label,
      description: def.description,
      score,
      status: itemStatus(score),
      href: `${base}&highlight=${domain}`,
      ctaLabel: score >= 100 ? '核对' : score > 0 ? '继续补' : '填写',
      valueSummary: filledKeys.length ? filledKeys.slice(0, 3).join(' · ') : null,
      weight,
    };
  });

  // wizard entry as virtual boost path
  items.push({
    id: 'qa_wizard',
    layerId: 'life_qa',
    label: '快速问答向导',
    description: '一次补齐最影响建议的 6–8 个关键问题',
    score: items.filter((i) => i.score >= 50).length >= 4 ? 100 : items.some((i) => i.score > 0) ? 50 : 0,
    status: items.filter((i) => i.score >= 50).length >= 4 ? 'done' : 'partial',
    href: `/profile/foundation?wizard=1${fortuneId ? `&fortuneId=${encodeURIComponent(fortuneId)}` : ''}`,
    ctaLabel: '打开向导',
    valueSummary: null,
    weight: 0.0,
  });

  const scoreable = items.filter((i) => i.weight > 0);
  const score = Math.round(
    scoreable.reduce((s, it) => s + it.score * it.weight, 0) /
      Math.max(0.01, scoreable.reduce((s, it) => s + it.weight, 0)),
  );
  const miss = scoreable.find((i) => i.status !== 'done');
  return {
    id: 'life_qa',
    title: meta.title,
    subtitle: meta.subtitle,
    weight: meta.weight,
    score,
    status: layerStatus(score),
    items,
    nextHref: miss?.href || '/profile/foundation?wizard=1',
    nextLabel: miss?.ctaLabel || '补充问答',
  };
}

function buildInteractLayer(params: {
  eventCount: number;
  documentCount: number;
  chatProgressiveCount: number;
  fortuneId: string | null;
}): FoundationLayer {
  const meta = FOUNDATION_LAYER_META.interact;
  const { eventCount, documentCount, chatProgressiveCount, fortuneId } = params;
  const items: FoundationItem[] = [
    {
      id: 'events',
      layerId: 'interact',
      label: '人生事件',
      description: '换工作、搬家、关系节点 — 用于回测校准',
      score: eventCount >= 3 ? 100 : eventCount >= 1 ? Math.round((eventCount / 3) * 100) : 0,
      status: itemStatus(eventCount >= 3 ? 100 : eventCount >= 1 ? 50 : 0),
      href: '/profile/events',
      ctaLabel: eventCount ? '继续记录' : '记第一条',
      valueSummary: eventCount ? `${eventCount} 条` : null,
      weight: 0.4,
    },
    {
      id: 'chat_progressive',
      layerId: 'interact',
      label: '对话渐进补全',
      description: '和老师对话时自然补上的字段',
      score: chatProgressiveCount >= 3 ? 100 : chatProgressiveCount >= 1 ? 60 : 0,
      status: itemStatus(chatProgressiveCount >= 3 ? 100 : chatProgressiveCount >= 1 ? 60 : 0),
      href: fortuneId
        ? `/chat?reportId=${encodeURIComponent(fortuneId)}&source=foundation_chat`
        : '/chat?source=foundation_chat',
      ctaLabel: '去对话',
      valueSummary: chatProgressiveCount ? `${chatProgressiveCount} 次补全` : null,
      weight: 0.35,
    },
    {
      id: 'documents',
      layerId: 'interact',
      label: '私有文档',
      description: '仅你可见的背景说明，可参与表达层',
      score: documentCount >= 2 ? 100 : documentCount === 1 ? 50 : 0,
      status: itemStatus(documentCount >= 2 ? 100 : documentCount === 1 ? 50 : 0),
      href: fortuneId
        ? `/profile/settings?fortuneId=${encodeURIComponent(fortuneId)}&tab=documents`
        : '/profile/settings?tab=documents',
      ctaLabel: '添加说明',
      valueSummary: documentCount ? `${documentCount} 份` : null,
      weight: 0.25,
    },
  ];
  const score = Math.round(items.reduce((s, it) => s + it.score * it.weight, 0));
  const miss = items.find((i) => i.status !== 'done');
  return {
    id: 'interact',
    title: meta.title,
    subtitle: meta.subtitle,
    weight: meta.weight,
    score,
    status: layerStatus(score),
    items,
    nextHref: miss?.href || items[0].href,
    nextLabel: miss?.ctaLabel || '校准互动',
  };
}

function buildToolsLayer(
  byItem: Record<string, { count: number; lastAt: string | null }>,
  fortuneId: string | null,
): FoundationLayer {
  const meta = FOUNDATION_LAYER_META.tools;
  const q = fortuneId ? `?fortuneId=${encodeURIComponent(fortuneId)}&source=foundation` : '?source=foundation';
  const defs: Array<{ id: string; label: string; desc: string; href: string; key: string; weight: number }> = [
    {
      id: 'naming',
      label: '起名 / 改名',
      desc: '用神与姓名五行对齐',
      href: `/tools/naming${q}`,
      key: 'naming',
      weight: 0.3,
    },
    {
      id: 'space',
      label: '空间场',
      desc: '人宅合参 · 户型与方位',
      href: `/tools/fengshui-space${q}`,
      key: 'space',
      weight: 0.25,
    },
    {
      id: 'hehun',
      label: '合婚双盘',
      desc: '关系对照的第二盘',
      href: fortuneId ? `/hehun?fortuneId=${encodeURIComponent(fortuneId)}&source=foundation` : '/hehun?source=foundation',
      key: 'hehun',
      weight: 0.2,
    },
    {
      id: 'dimensions',
      label: '十维度研判',
      desc: '事业 / 财 / 婚 / 健康等专项',
      href: '/dimensions?source=foundation',
      key: 'dimensions',
      weight: 0.25,
    },
  ];

  // dimensions: count any tool slug containing dimension or dimension sessions
  const items: FoundationItem[] = defs.map((d) => {
    const hit = byItem[d.key];
    const score = hit?.count ? 100 : 0;
    return {
      id: d.id,
      layerId: 'tools' as const,
      label: d.label,
      description: d.desc,
      score,
      status: score ? ('done' as const) : ('optional' as const),
      href: d.href,
      ctaLabel: score ? '复看' : '试用',
      valueSummary: hit?.count ? `${hit.count} 次` : null,
      weight: d.weight,
    };
  });

  // optional: don't punish hard
  let wSum = 0;
  let sSum = 0;
  for (const it of items) {
    const w = it.score === 0 ? it.weight * 0.35 : it.weight;
    wSum += w;
    sSum += it.score * w;
  }
  const score = Math.round(sSum / Math.max(0.01, wSum));
  const miss = items.find((i) => i.score === 0);
  return {
    id: 'tools',
    title: meta.title,
    subtitle: meta.subtitle,
    weight: meta.weight,
    score,
    status: layerStatus(score),
    items,
    nextHref: miss?.href || items[0].href,
    nextLabel: miss?.ctaLabel || '使用工具',
  };
}

function buildNextSteps(layers: FoundationLayer[]): FoundationNextStep[] {
  const steps: FoundationNextStep[] = [];
  for (const layer of layers) {
    for (const item of layer.items) {
      if (item.status === 'done' || item.status === 'optional') continue;
      if (item.id === 'qa_wizard') continue;
      const priority =
        layer.id === 'birth'
          ? 10 + (100 - item.score) / 10
          : layer.id === 'life_qa'
            ? 20 + (100 - item.score) / 10
            : layer.id === 'body'
              ? 30 + (100 - item.score) / 10
              : layer.id === 'astro'
                ? 35 + (100 - item.score) / 10
                : layer.id === 'interact'
                  ? 40 + (100 - item.score) / 10
                  : 50 + (100 - item.score) / 10;
      steps.push({
        priority,
        layerId: layer.id,
        title: item.label,
        reason: item.description,
        href: item.href,
        ctaLabel: item.ctaLabel,
        itemId: item.id,
      });
    }
  }
  // always suggest wizard if life_qa < 70
  const qa = layers.find((l) => l.id === 'life_qa');
  if (qa && qa.score < 70) {
    steps.push({
      priority: 18,
      layerId: 'life_qa',
      title: '快速问答向导',
      reason: '一次补齐对建议影响最大的生活参数',
      href: qa.nextHref || '/profile/foundation?wizard=1',
      ctaLabel: '开始问答',
      itemId: 'qa_wizard',
    });
  }
  return steps.sort((a, b) => a.priority - b.priority).slice(0, 8);
}

/**
 * 构建用户人生数据底座快照
 */
export function buildLifeFoundation(
  userId: string,
  fortuneId?: string | null,
): LifeFoundationSnapshot {
  ensureProfileSettingsSchema();

  const fortunes = (
    (fortuneOperations as { getByUserId?: (id: string) => FortuneRow[]; listByUser?: (id: string) => FortuneRow[] })
      .getByUserId?.(userId) ||
    (fortuneOperations as { listByUser?: (id: string) => FortuneRow[] }).listByUser?.(userId) ||
    []
  ) as FortuneRow[];

  const fortune = pickActiveFortune(fortunes, fortuneId);
  const activeId = fortune?.id || null;
  const pillars = parseBaziPillars(fortune?.bazi);

  const supMap = listSupplements(userId, activeId);
  const documents = activeId
    ? profileDocumentOperations.listByUser(userId, activeId)
    : profileDocumentOperations.listByUser(userId, null);

  let events: unknown[] = [];
  try {
    events = (eventOperations.listByUser?.(userId) as unknown[]) || [];
  } catch {
    events = [];
  }

  let sessions: unknown[] = [];
  try {
    sessions = (toolSessionOperations.listByUser?.(userId, 80) as unknown[]) || [];
  } catch {
    sessions = [];
  }

  const { signals, byItem, total: toolRunCount } = aggregateToolSignals(sessions);

  // map dimension tool runs loosely
  for (const raw of sessions) {
    const s = (raw || {}) as Record<string, unknown>;
    const slug = readSessionField(s, 'toolSlug', 'tool_slug');
    if (slug.includes('dimension') || slug.startsWith('dim-')) {
      const cur = byItem.dimensions || { count: 0, lastAt: null, sessionId: null };
      cur.count += 1;
      byItem.dimensions = cur;
    }
  }

  let chatProgressiveCount = 0;
  try {
    const log = profileChangeLogOperations.listRecent(userId, 40);
    chatProgressiveCount = log.filter(
      (c) => c.changeType === 'chat_progressive' || /对话/.test(c.summary || ''),
    ).length;
  } catch {
    chatProgressiveCount = 0;
  }

  const birthLayer = buildBirthLayer(fortune, pillars);
  const { layer: astroLayer, astro } = buildAstroLayer(fortune?.birthDate, supMap.get('astro'));
  const bodyLayer = buildBodyLayer(byItem, activeId);
  const lifeQaLayer = buildLifeQaLayer(supMap, activeId);
  const interactLayer = buildInteractLayer({
    eventCount: Array.isArray(events) ? events.length : 0,
    documentCount: documents.length,
    chatProgressiveCount,
    fortuneId: activeId,
  });
  const toolsLayer = buildToolsLayer(byItem, activeId);

  const layers = [birthLayer, astroLayer, bodyLayer, lifeQaLayer, interactLayer, toolsLayer];
  const overall = Math.round(layers.reduce((s, l) => s + l.score * l.weight, 0));
  const { grade, gradeLabel } = gradeFromOverall(overall);

  const coreItems = layers.flatMap((l) => l.items.filter((i) => i.status !== 'optional' && i.weight > 0));
  const filledItems = coreItems.filter((i) => i.status === 'done' || i.score >= 80).length;

  return {
    version: 1,
    overall,
    grade,
    gradeLabel,
    fortuneId: activeId,
    fortuneName: fortune?.name || null,
    hasReport: Boolean(pillars || activeId),
    layers,
    nextSteps: buildNextSteps(layers),
    astro,
    toolSignals: signals.slice(0, 12),
    stats: {
      filledItems,
      totalCoreItems: coreItems.length,
      eventCount: Array.isArray(events) ? events.length : 0,
      toolRunCount,
      documentCount: documents.length,
      chatProgressiveCount,
    },
    updatedAt: new Date().toISOString(),
  };
}
