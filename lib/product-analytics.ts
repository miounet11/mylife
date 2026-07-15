/**
 * 双轨产品分析埋点（大众 Pro / 专业 Expert）
 *
 * 目标 KPI：
 * - 大众：报告 → 决策一页通 → 行动 → 预测/事件回访 → 再追问
 * - 专业：进入专家台 → 排盘/交付/CRM → 回访
 *
 * 双写：
 * 1) /api/funnel — 轻量 funnel 日志（始终可写）
 * 2) /api/analytics/track — 入 analytics_events（生产白名单）
 * 3) localStorage ring buffer — 本机调试
 */

export type ProductSurface = 'mass' | 'expert' | 'loop' | 'entry' | 'system';

/** 双轨核心事件（与 funnel / analytics 白名单对齐） */
export type ProductEventName =
  // mass
  | 'mass_report_viewed'
  | 'mass_decision_copied'
  | 'mass_decision_printed'
  | 'mass_revisit_marked'
  | 'mass_prediction_seed_shown'
  | 'mass_prediction_outcome'
  | 'mass_prediction_to_event'
  | 'mass_need_map_click'
  | 'mass_action_bar_viewed'
  | 'mass_learn_path_click'
  | 'mass_teacher_open'
  | 'teachers_page_viewed'
  | 'mass_profile_field_saved'
  | 'mass_profile_field_skipped'
  // loop tools
  | 'hehun_page_viewed'
  | 'hehun_run'
  | 'hehun_prefill_used'
  | 'events_page_viewed'
  | 'events_created'
  | 'events_feedback'
  | 'chat_page_viewed'
  | 'chat_message_sent'
  | 'chat_anchor_loaded'
  | 'timing_window_viewed'
  // expert
  | 'expert_view_opened'
  | 'expert_handoff_copied'
  | 'expert_print_clicked'
  | 'expert_crm_saved'
  | 'expert_crm_script_copied'
  | 'expert_crm_desk_viewed'
  | 'expert_dayun_grid_viewed'
  // entry
  | 'tool_entry_clicked'
  | 'portal_rail_clicked';

export type ProductEventDetail = Record<string, string | number | boolean | null | undefined>;

const LOCAL_KEY = 'lk_product_analytics_v1';
const RING = 80;

function cleanDetail(detail: ProductEventDetail = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(detail)) {
    if (v == null) continue;
    const key = k.slice(0, 48);
    out[key] = String(v).slice(0, 200);
  }
  return out;
}

function surfaceOf(event: ProductEventName): ProductSurface {
  if (event.startsWith('mass_')) return 'mass';
  if (event.startsWith('expert_')) return 'expert';
  if (
    event.startsWith('hehun_') ||
    event.startsWith('events_') ||
    event.startsWith('chat_') ||
    event.startsWith('timing_')
  ) {
    return 'loop';
  }
  if (event.startsWith('tool_') || event.startsWith('portal_')) return 'entry';
  return 'system';
}

function pushLocal(payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as unknown[];
    const next = [...(Array.isArray(prev) ? prev : []).slice(-(RING - 1)), payload];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function postBeacon(url: string, body: object) {
  if (typeof window === 'undefined') return;
  const json = JSON.stringify(body);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([json], { type: 'application/json' }));
      return;
    }
  } catch {
    // fall through
  }
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
    keepalive: true,
  }).catch(() => {});
}

/**
 * 打产品点（浏览器端）
 */
export function trackProductEvent(
  event: ProductEventName,
  detail: ProductEventDetail = {}
) {
  if (typeof window === 'undefined') return;

  const cleaned = cleanDetail(detail);
  const surface = surfaceOf(event);
  const path = window.location.pathname;
  const search = window.location.search;
  const ts = new Date().toISOString();

  const base = {
    event,
    surface,
    detail: cleaned,
    path,
    search,
    referrer: document.referrer || '',
    ts,
  };

  pushLocal(base);

  // 1) funnel 双轨事件
  postBeacon('/api/funnel', {
    event,
    detail: { ...cleaned, surface, channel: 'product' },
    path,
    search,
    referrer: document.referrer || '',
    ts,
  });

  // 2) 主 analytics 表（生产白名单；本地/未放行则忽略）
  postBeacon('/api/analytics/track', {
    eventName: event,
    page: path,
    meta: {
      ...cleaned,
      surface,
      product: 'dual_track',
      search,
    },
  });
}

/** 读取本机最近埋点（调试 / 本机漏斗） */
export function readLocalProductEvents(limit = 40): Array<Record<string, unknown>> {
  if (typeof window === 'undefined') return [];
  try {
    const prev = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as unknown[];
    if (!Array.isArray(prev)) return [];
    return prev.slice(-limit).reverse() as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}

/** 页面浏览：带 surface 的便捷封装 */
export function trackProductPageView(
  event: ProductEventName,
  detail: ProductEventDetail = {}
) {
  trackProductEvent(event, { ...detail, kind: 'page_view' });
}
