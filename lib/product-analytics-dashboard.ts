/**
 * 双轨产品漏斗汇总（admin）
 * 依赖生产 analytics_events；本地无表时返回空结构。
 */

import { PRODUCT_ANALYTICS_EXTRA_EVENTS } from '@/lib/product-analytics-events';

export interface ProductFunnelBucket {
  event: string;
  label: string;
  count24h: number;
  count7d: number;
}

export interface ProductFunnelSnapshot {
  generatedAt: string;
  mass: ProductFunnelBucket[];
  expert: ProductFunnelBucket[];
  loop: ProductFunnelBucket[];
  totals: {
    events24h: number;
    events7d: number;
    productEvents24h: number;
    productEvents7d: number;
  };
  topProduct24h: Array<{ event_name: string; c: number }>;
}

const LABELS: Record<string, string> = {
  mass_report_viewed: '大众·看报告',
  mass_decision_copied: '大众·复制决策',
  mass_decision_printed: '大众·打印决策',
  mass_revisit_marked: '大众·标记回访',
  mass_prediction_seed_shown: '大众·种子预测展示',
  mass_prediction_outcome: '大众·预测打分',
  mass_prediction_to_event: '大众·预测入事件',
  mass_need_map_click: '大众·问题地图点击',
  hehun_page_viewed: '合婚·打开',
  hehun_run: '合婚·计算',
  hehun_prefill_used: '合婚·带入本盘',
  events_created: '事件·新建',
  events_feedback: '事件·应验反馈',
  chat_message_sent: '追问·发送',
  chat_anchor_loaded: '追问·锚定报告',
  timing_window_viewed: '择日·90天窗口',
  expert_view_opened: '专业·打开工作台',
  expert_handoff_copied: '专业·复制交付包',
  expert_print_clicked: '专业·打印排盘纸',
  expert_crm_saved: '专业·CRM 保存',
  expert_crm_script_copied: '专业·复制回访稿',
  expert_crm_desk_viewed: '专业·CRM 台',
  expert_dayun_grid_viewed: '专业·大运逐年',
  tool_entry_clicked: '入口·工具点击',
  portal_rail_clicked: '入口·侧栏',
  predictions_page_viewed: '预测页浏览',
  hehun_workspace_viewed: '合婚页浏览',
  expert_crm_page_viewed: 'CRM 页浏览',
};

const MASS = [
  'mass_report_viewed',
  'mass_decision_copied',
  'mass_decision_printed',
  'mass_revisit_marked',
  'mass_prediction_seed_shown',
  'mass_prediction_outcome',
  'mass_prediction_to_event',
  'mass_need_map_click',
];
const EXPERT = [
  'expert_view_opened',
  'expert_handoff_copied',
  'expert_print_clicked',
  'expert_crm_saved',
  'expert_crm_script_copied',
  'expert_crm_desk_viewed',
  'expert_dayun_grid_viewed',
];
const LOOP = [
  'hehun_page_viewed',
  'hehun_run',
  'events_created',
  'events_feedback',
  'chat_message_sent',
  'chat_anchor_loaded',
  'timing_window_viewed',
  'mass_prediction_outcome',
];

function emptySnapshot(): ProductFunnelSnapshot {
  const zero = (events: string[]) =>
    events.map((event) => ({
      event,
      label: LABELS[event] || event,
      count24h: 0,
      count7d: 0,
    }));
  return {
    generatedAt: new Date().toISOString(),
    mass: zero(MASS),
    expert: zero(EXPERT),
    loop: zero(LOOP),
    totals: { events24h: 0, events7d: 0, productEvents24h: 0, productEvents7d: 0 },
    topProduct24h: [],
  };
}

export function getProductFunnelSnapshot(): ProductFunnelSnapshot {
  try {
    // dynamic require so local stub without better-sqlite3 still builds
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { db } = require('@/lib/database') as {
      db: { prepare: (sql: string) => { get: (...a: unknown[]) => any; all: (...a: unknown[]) => any } };
    };

    const count = (event: string, hours: number) => {
      try {
        const row = db
          .prepare(
            `SELECT COUNT(*) AS c FROM analytics_events
             WHERE event_name = ? AND created_at >= datetime('now', ?)`
          )
          .get(event, `-${hours} hours`) as { c?: number };
        return Number(row?.c || 0);
      } catch {
        return 0;
      }
    };

    const totalHours = (hours: number) => {
      try {
        const row = db
          .prepare(
            `SELECT COUNT(*) AS c FROM analytics_events
             WHERE created_at >= datetime('now', ?)`
          )
          .get(`-${hours} hours`) as { c?: number };
        return Number(row?.c || 0);
      } catch {
        return 0;
      }
    };

    const productList = PRODUCT_ANALYTICS_EXTRA_EVENTS as readonly string[];
    const placeholders = productList.map(() => '?').join(',');
    let product24 = 0;
    let product7 = 0;
    try {
      product24 = Number(
        (
          db
            .prepare(
              `SELECT COUNT(*) AS c FROM analytics_events
               WHERE event_name IN (${placeholders})
               AND created_at >= datetime('now', '-24 hours')`
            )
            .get(...productList) as { c?: number }
        )?.c || 0
      );
      product7 = Number(
        (
          db
            .prepare(
              `SELECT COUNT(*) AS c FROM analytics_events
               WHERE event_name IN (${placeholders})
               AND created_at >= datetime('now', '-168 hours')`
            )
            .get(...productList) as { c?: number }
        )?.c || 0
      );
    } catch {
      // ignore
    }

    let topProduct24h: Array<{ event_name: string; c: number }> = [];
    try {
      topProduct24h = (
        db
          .prepare(
            `SELECT event_name, COUNT(*) AS c FROM analytics_events
             WHERE event_name IN (${placeholders})
             AND created_at >= datetime('now', '-24 hours')
             GROUP BY event_name ORDER BY c DESC LIMIT 20`
          )
          .all(...productList) as Array<{ event_name: string; c: number }>
      ).map((r) => ({ event_name: String(r.event_name), c: Number(r.c || 0) }));
    } catch {
      topProduct24h = [];
    }

    const mapGroup = (events: string[]) =>
      events.map((event) => ({
        event,
        label: LABELS[event] || event,
        count24h: count(event, 24),
        count7d: count(event, 168),
      }));

    return {
      generatedAt: new Date().toISOString(),
      mass: mapGroup(MASS),
      expert: mapGroup(EXPERT),
      loop: mapGroup(LOOP),
      totals: {
        events24h: totalHours(24),
        events7d: totalHours(168),
        productEvents24h: product24,
        productEvents7d: product7,
      },
      topProduct24h,
    };
  } catch {
    return emptySnapshot();
  }
}
