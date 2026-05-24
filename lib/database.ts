// 数据库配置 - SQLite
import Database from 'better-sqlite3';
import { resolveCtaSourceFamilyFromMeta, type CtaStrategyBreakdownRow } from '@/lib/cta-strategy';
import { getReportUpgradeLockMinutes } from '@/lib/env';
import path from 'path';
import { normalizeAttributionSource } from '@/lib/source-attribution';
import type {
  UserRecord,
  FortuneRecord,
  EventRecord,
  QuestionRecord,
  AnalyticsEventRecord,
  ReportJourneyEventRecord,
  ContentSignalRecord,
  ContentRadarRunRecord,
  ContentSchedulerRunRecord,
  ContentGenerationJobRecord,
  ReportUpgradeJobRecord,
  ReportMonthlyDigestRunRecord,
  UserLifecycleEmailRunRecord,
  EmailDeliveryJobRecord,
  PremiumServiceRequestRecord,
  ToolSessionRecord,
} from './user-types';
import { normalizeEventTransportRecord } from './event-view';
import { buildReportJourneyAnalyticsSnapshot } from '@/lib/report-journey-analytics';

interface RawFortuneRow {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place?: string | null;
  timezone: number;
  gender: 'male' | 'female';
  bazi: string;
  five_elements: string;
  ten_gods: string;
  pattern: string;
  fortune: string;
  advice: string;
  evidence: string;
  analysis?: string | null;
  kline_data?: string | null;
  dayun?: string | null;
  shen_sha?: string | null;
  report_version?: string | null;
  is_public: number;
  created_at?: string;
  updated_at?: string;
  /** v5-D39 多档案：可选关系字段；老档案为 NULL，等价 self */
  relation?: string | null;
  relation_label?: string | null;
}

interface RawAnalyticsEventRow {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  event_name: string;
  page?: string | null;
  meta?: string | null;
  created_at?: string;
}

interface RawReportJourneyEventRow {
  id: string;
  user_id: string;
  report_id: string;
  workflow_id: string;
  layer_key: string;
  action_target: string;
  category?: string | null;
  tool_slug?: string | null;
  source?: string | null;
  href?: string | null;
  meta?: string | null;
  created_at?: string;
}

interface RawContentSignalRow {
  id: string;
  source_id: string;
  source_label: string;
  platform: string;
  title: string;
  url: string;
  author?: string | null;
  summary?: string | null;
  published_at?: string | null;
  matched_keywords?: string | null;
  score?: number | null;
  meta?: string | null;
  created_at?: string;
}

interface RawContentRadarRunRow {
  id: string;
  source_id: string;
  source_label: string;
  platform: string;
  status: 'success' | 'error';
  fetched_count?: number | null;
  saved_count?: number | null;
  error?: string | null;
  meta?: string | null;
  created_at?: string;
}

interface RawContentSchedulerRunRow {
  id: string;
  trigger: 'cron' | 'manual';
  status: 'success' | 'skipped' | 'error';
  reason?: string | null;
  generated_count?: number | null;
  published_count?: number | null;
  meta?: string | null;
  created_at?: string;
}

interface RawContentGenerationJobRow {
  id: string;
  user_id: string;
  status: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
  request_payload?: string | null;
  result_payload?: string | null;
  generated_count?: number | null;
  llm_succeeded_count?: number | null;
  fallback_count?: number | null;
  attempts?: number | null;
  max_attempts?: number | null;
  next_run_at?: string | null;
  locked_at?: string | null;
  last_error?: string | null;
  meta?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawSystemLockRow {
  key: string;
  owner: string;
  locked_at: string;
  expires_at: string;
  meta?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawReportUpgradeJobRow {
  id: string;
  report_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
  target_score?: number | null;
  attempts?: number | null;
  max_attempts?: number | null;
  last_score?: number | null;
  best_score?: number | null;
  best_grade?: 'S' | 'A' | 'B' | 'C' | null;
  next_run_at?: string | null;
  locked_at?: string | null;
  last_error?: string | null;
  meta?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawReportMonthlyDigestRunRow {
  id: string;
  cycle_key: string;
  email: string;
  user_id?: string | null;
  report_id?: string | null;
  status: 'sent' | 'skipped' | 'error';
  reason?: string | null;
  meta?: string | null;
  created_at?: string;
}

interface RawUserLifecycleEmailRunRow {
  id: string;
  stage_key: string;
  email: string;
  user_id?: string | null;
  report_id?: string | null;
  status: 'sent' | 'skipped' | 'error';
  reason?: string | null;
  meta?: string | null;
  created_at?: string;
}

interface RawEmailDeliveryJobRow {
  id: string;
  kind: 'premium_service_request_receipt' | 'premium_service_admin_alert' | 'premium_service_status_update' | 'report_ready' | 'user_lifecycle';
  status: 'pending' | 'running' | 'sent' | 'failed' | 'cancelled';
  recipient_list?: string | null;
  payload?: string | null;
  attempts?: number | null;
  max_attempts?: number | null;
  next_run_at?: string | null;
  locked_at?: string | null;
  last_error?: string | null;
  meta?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawEventRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  date: string;
  time?: string | null;
  description?: string | null;
  impact: 'positive' | 'negative' | 'neutral';
  fortune_analysis?: string | null;
  user_feedback?: string | null;
  follow_up_advice?: string | null;
  reminder_enabled: number;
  reminder_advance_days?: number | null;
  reminder_method?: string | null;
}

interface RawQuestionRow {
  id: string;
  user_id: string;
  question: string;
  category: string;
  analysis?: string | null;
  created_at?: string;
}

interface RawPremiumServiceRequestRow {
  id: string;
  user_id: string;
  report_id?: string | null;
  service_key: 'event-simulation' | 'event-verdict' | 'event-review' | 'meihua-enhancement';
  status: 'new' | 'contacted' | 'in_progress' | 'delivered' | 'closed' | 'cancelled';
  priority?: 'normal' | 'high' | 'urgent' | null;
  contact_name?: string | null;
  contact_value?: string | null;
  intake?: string | null;
  meta?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawToolSessionRow {
  id: string;
  user_id: string;
  report_id?: string | null;
  tool_slug: string;
  status: 'completed' | 'locked';
  input?: string | null;
  result?: string | null;
  meta?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawVisualAssetRow {
  id: string;
  asset_type: string;
  module: string;
  batch_id?: string | null;
  slug: string;
  title: string;
  description?: string | null;
  prompt: string;
  negative_prompt?: string | null;
  model: string;
  size: string;
  ratio: string;
  quality: string;
  source_image_ids?: string | null;
  brand_reference_ids?: string | null;
  output_path?: string | null;
  public_url?: string | null;
  alt_text?: string | null;
  overlay_copy_simplified?: string | null;
  overlay_copy_traditional?: string | null;
  overlay_copy_english?: string | null;
  narrative_title?: string | null;
  narrative_excerpt?: string | null;
  narrative_sections?: string | null;
  target_routes?: string | null;
  related_content_slugs?: string | null;
  related_tool_slugs?: string | null;
  related_report_themes?: string | null;
  status: string;
  qa_status: string;
  qa_score?: number | null;
  qa_notes?: string | null;
  correction_count?: number | null;
  latest_error_code?: string | null;
  version?: number | null;
  meta?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawVisualAssetBatchRow {
  id: string;
  name: string;
  library_key: string;
  module?: string | null;
  target_count: number;
  status: string;
  model: string;
  brand_pack_id?: string | null;
  manifest_path?: string | null;
  generated_count?: number | null;
  approved_count?: number | null;
  rejected_count?: number | null;
  correction_count?: number | null;
  meta?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RawVisualAssetReviewRow {
  id: string;
  asset_id: string;
  review_type: string;
  status: string;
  score?: number | null;
  error_codes?: string | null;
  notes?: string | null;
  reviewer?: string | null;
  created_at?: string;
}

interface RawVisualAssetCorrectionRow {
  id: string;
  asset_id: string;
  correction_round: number;
  error_codes: string;
  original_prompt: string;
  corrected_prompt: string;
  original_output_path?: string | null;
  corrected_output_path?: string | null;
  status: string;
  created_by?: string | null;
  created_at?: string;
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type DriftReasonKey =
  | 'timing_window'
  | 'execution_gap'
  | 'birth_time_uncertainty'
  | 'expectation_scope'
  | 'external_change'
  | 'information_missing'
  | 'uncategorized';

const DRIFT_REASON_RULES: Array<{ key: DriftReasonKey; label: string; patterns: RegExp[] }> = [
  {
    key: 'timing_window',
    label: '时机 / 窗口偏差',
    patterns: [/(时机|窗口|偏早|偏晚|太早|太晚|提前|延后|节奏|节点|排期|窗口判断|时点)/i],
  },
  {
    key: 'execution_gap',
    label: '执行 / 推进偏差',
    patterns: [/(执行|推进|落地|行动|跟进|力度|资源不足|没做到|没有执行|推进失败|谈判失败|卡住)/i],
  },
  {
    key: 'birth_time_uncertainty',
    label: '时辰 / 输入待复核',
    patterns: [/(时辰|出生时间|生时|时柱|钟点|分娩时间)/i],
  },
  {
    key: 'expectation_scope',
    label: '判断范围 / 预期偏差',
    patterns: [/(范围|预期|整体|局部|理解偏差|误判|过度解读|目标变化|不一致)/i],
  },
  {
    key: 'external_change',
    label: '外部环境变化',
    patterns: [/(外部|市场|政策|环境|公司变化|对方|家庭变化|突发|黑天鹅|不可控|客观原因)/i],
  },
  {
    key: 'information_missing',
    label: '信息不足 / 证据缺口',
    patterns: [/(信息不足|信息缺口|证据|样本|未记录|沟通不足|认知偏差|数据不足|不了解)/i],
  },
];

function classifyDriftReason(input: { reason?: string; notes?: string; title?: string; type?: string }) {
  const text = [input.reason, input.notes, input.title, input.type].filter(Boolean).join(' ');
  const matched = DRIFT_REASON_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(text)));

  return matched || {
    key: 'uncategorized' as DriftReasonKey,
    label: '待进一步标注',
  };
}

function mapRouteHealthLabel(key: string) {
  if (key === 'analyze') return '测算主流程';
  if (key === 'chat:ask') return '聊天提问';
  if (key === 'chat:regenerate') return '聊天重生成';
  if (key === 'chat:edit') return '聊天编辑重提';
  if (key === 'chat:delete') return '聊天删除';
  if (key === 'chat:load') return '聊天上下文加载';
  return key;
}

const REPORT_UPGRADE_STALE_LOCK_MINUTES = getReportUpgradeLockMinutes();
const REPORT_UPGRADE_KNOWN_TEST_NAMES = [
  '测试A',
  '验证B',
  '测试用户',
  '测试用户2',
  '案例1',
  '案例2',
  '甲',
  '乙',
  '丙',
  '哈哈',
  '即时局',
  'x',
] as const;
const REPORT_UPGRADE_KNOWN_TEST_NAMES_SQL = REPORT_UPGRADE_KNOWN_TEST_NAMES
  .map((name) => `'${name.replace(/'/g, "''")}'`)
  .join(', ');
const REPORT_UPGRADE_PRIORITY_SQL = `
CASE
  WHEN EXISTS (
    SELECT 1
    FROM fortunes AS f
    WHERE f.id = report_upgrade_jobs.report_id
      AND trim(COALESCE(f.name, '')) <> ''
      AND trim(COALESCE(f.name, '')) NOT IN (${REPORT_UPGRADE_KNOWN_TEST_NAMES_SQL})
      AND trim(COALESCE(f.name, '')) NOT LIKE '测试%'
      AND trim(COALESCE(f.name, '')) NOT GLOB '案例[0-9]*'
      AND trim(COALESCE(f.name, '')) NOT IN ('A', 'B', 'C', '丁')
      AND NOT (
        trim(COALESCE(f.name, '')) GLOB '[0-9]*'
        AND trim(COALESCE(f.name, '')) NOT GLOB '*[^0-9]*'
      )
      AND NOT (
        length(trim(COALESCE(f.name, ''))) BETWEEN 2 AND 3
        AND lower(trim(COALESCE(f.name, ''))) GLOB '[a-z]*'
        AND lower(trim(COALESCE(f.name, ''))) NOT GLOB '*[^a-z]*'
      )
      AND NOT (
        length(trim(COALESCE(f.name, ''))) = 1
        AND trim(COALESCE(f.name, '')) GLOB '[A-Za-z]'
      )
  ) THEN 0
  ELSE 1
END
`;

const PRODUCT_ANALYTICS_EXCLUDED_EVENTS = [
  'llm_model_attempt',
  'llm_model_circuit_changed',
  'email_delivery_succeeded',
  'email_delivery_failed',
  'report_feedback_synced',
  'report_monthly_digest_sent',
  'auth_code_requested',
  'auth_verified',
  'newsletter_subscribed',
] as const;
const PRODUCT_ANALYTICS_EXCLUDED_EVENT_SET = new Set<string>(PRODUCT_ANALYTICS_EXCLUDED_EVENTS);
const PRODUCT_ANALYTICS_EXCLUDED_EVENTS_SQL = PRODUCT_ANALYTICS_EXCLUDED_EVENTS
  .map((eventName) => `'${eventName.replace(/'/g, "''")}'`)
  .join(', ');
const PRODUCT_ANALYTICS_FILTER_SQL = `
      AND event_name NOT IN (${PRODUCT_ANALYTICS_EXCLUDED_EVENTS_SQL})
      AND COALESCE(page, '') NOT LIKE '%127.0.0.1%'
      AND COALESCE(page, '') NOT LIKE '%localhost%'
`;
const RECENT_BEHAVIOR_TRACKED_EVENTS = [
  'home_page_viewed',
  'analyze_page_viewed',
  'analyze_submitted',
  'analyze_completed',
  'report_generated',
  'report_viewed',
  'chat_page_viewed',
  'chat_context_loaded',
  'chat_completed',
  'chat_message_sent',
  'report_event_saved_from_result',
  'report_past_event_saved_from_result',
  'event_created',
  'tool_detail_viewed',
  'tool_run_started',
  'knowledge_article_viewed',
  'case_article_viewed',
  'result_cta_clicked',
  'chat_followup_clicked',
  'auth_code_requested',
  'auth_verified',
  'profile_page_viewed',
  'events_page_viewed',
] as const;
const RECENT_BEHAVIOR_TRACKED_EVENTS_SQL = RECENT_BEHAVIOR_TRACKED_EVENTS
  .map((eventName) => `('${eventName.replace(/'/g, "''")}')`)
  .join(', ');
const DEVICE_TYPES = ['mobile', 'desktop', 'tablet', 'bot', 'unknown'] as const;

type DeviceType = typeof DEVICE_TYPES[number];

type DeviceWindowMetricAccumulator = {
  productEvents: number;
  productSessions: Set<string>;
  reportViews: number;
  reportSessions: Set<string>;
  chatCompletedCount: number;
  chatCompletedSessions: Set<string>;
  reportEventSessions: Set<string>;
  toolDetailSessions: Set<string>;
  toolRuns: number;
  toolRunSessions: Set<string>;
  authRequestSessions: Set<string>;
  authVerifiedCount: number;
  authVerifiedSessions: Set<string>;
};

type DeviceWindowMetricRow = {
  deviceType: DeviceType;
  productEvents: number;
  sessions: number;
  reportViews: number;
  reportSessions: number;
  chatCompleted: number;
  reportToChatSessions: number;
  reportToChatRate: number;
  reportToEventSessions: number;
  reportToEventRate: number;
  toolDetailSessions: number;
  toolRuns: number;
  toolToRunSessions: number;
  toolToRunRate: number;
  authRequestSessions: number;
  authVerified: number;
  authVerifiedSessions: number;
  authVerifyRate: number;
  sampleVolume: number;
  sampleState: 'enough' | 'low' | 'sparse';
};

type DeviceCoverageSnapshot = {
  totalEvents: number;
  knownDeviceEvents: number;
  unknownDeviceEvents: number;
  coverageRate: number;
  sessions: number;
  knownDeviceSessions: number;
  unknownDeviceSessions: number;
  sessionCoverageRate: number;
};

type SourceFunnelAccumulator = {
  source: string;
  analyzeSessions: Set<string>;
  reportIds: Set<string>;
  reportViewSessions: Set<string>;
  chatSessions: Set<string>;
  toolRunSessions: Set<string>;
  latestAt?: string | null;
};

type SourceDeviceFunnelAccumulator = {
  source: string;
  deviceType: DeviceType;
  analyzeSessions: Set<string>;
  reportIds: Set<string>;
  reportViewSessions: Set<string>;
  chatSessions: Set<string>;
  toolRunSessions: Set<string>;
  latestAt?: string | null;
};

type SourceFunnelRow = {
  source: string;
  analyzeSessions: number;
  reportsGenerated: number;
  reportViewSessions: number;
  chatSessions: number;
  toolRunSessions: number;
  analyzeToReportRate: number;
  reportToViewRate: number;
  viewToChatRate: number;
  viewToToolRunRate: number;
  latestAt?: string | null;
};

type SourceDeviceFunnelRow = SourceFunnelRow & {
  deviceType: DeviceType;
};

type SourceTrendAccumulator = {
  source: string;
  weekStart: string;
  weekLabel: string;
  analyzeSessions: Set<string>;
  reportIds: Set<string>;
  reportViewSessions: Set<string>;
  chatSessions: Set<string>;
  toolRunSessions: Set<string>;
  latestAt?: string | null;
};

type SourceTrendRow = SourceFunnelRow & {
  weekStart: string;
  weekLabel: string;
};

type SourceShiftRow = {
  source: string;
  current: SourceFunnelRow;
  previous: SourceFunnelRow;
  analyzeSessionsDelta: number;
  reportViewSessionsDelta: number;
  viewToChatRateDelta: number;
  viewToToolRunRateDelta: number;
  deltaMagnitude: number;
  direction: 'up' | 'down' | 'flat';
  sampleState: 'enough' | 'low' | 'sparse';
};

type CtaStrategyBreakdownAccumulator = Omit<CtaStrategyBreakdownRow, 'clickToChatRate' | 'chatCompletionRate'>;

type SourceResolvedAnalyticsRow = {
  row: RawAnalyticsEventRow;
  meta: Record<string, unknown>;
  source: string;
  sessionId: string;
  reportId: string;
  deviceType: DeviceType;
};

function toRoundedDecimal(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(digits));
}

function normalizeDeviceType(value: unknown): DeviceType {
  if (value === 'mobile' || value === 'desktop' || value === 'tablet' || value === 'bot') {
    return value;
  }
  return 'unknown';
}

function extractDeviceTypeFromMeta(meta?: string | null): DeviceType {
  const parsed = parseJson<Record<string, unknown>>(meta, {});
  return normalizeDeviceType(parsed.deviceType);
}

function isLocalAnalyticsPage(page?: string | null) {
  const normalized = `${page || ''}`.toLowerCase();
  return normalized.includes('127.0.0.1') || normalized.includes('localhost');
}

function isProductAnalyticsRow(row: Pick<RawAnalyticsEventRow, 'event_name' | 'page'>) {
  return !PRODUCT_ANALYTICS_EXCLUDED_EVENT_SET.has(row.event_name) && !isLocalAnalyticsPage(row.page);
}

function createEmptyDeviceWindowMetricAccumulator(): DeviceWindowMetricAccumulator {
  return {
    productEvents: 0,
    productSessions: new Set<string>(),
    reportViews: 0,
    reportSessions: new Set<string>(),
    chatCompletedCount: 0,
    chatCompletedSessions: new Set<string>(),
    reportEventSessions: new Set<string>(),
    toolDetailSessions: new Set<string>(),
    toolRuns: 0,
    toolRunSessions: new Set<string>(),
    authRequestSessions: new Set<string>(),
    authVerifiedCount: 0,
    authVerifiedSessions: new Set<string>(),
  };
}

function createDeviceWindowAccumulatorMap() {
  const buckets = {} as Record<DeviceType, DeviceWindowMetricAccumulator>;
  for (const deviceType of DEVICE_TYPES) {
    buckets[deviceType] = createEmptyDeviceWindowMetricAccumulator();
  }
  return buckets;
}

function resolveSessionDeviceTypeMap(rows: Array<Pick<RawAnalyticsEventRow, 'session_id' | 'meta'>>) {
  const map = new Map<string, DeviceType>();

  for (const row of rows) {
    const sessionId = `${row.session_id || ''}`.trim();
    if (!sessionId) {
      continue;
    }

    const current = map.get(sessionId);
    const next = extractDeviceTypeFromMeta(row.meta);
    if (!current || current === 'unknown' || next !== 'unknown') {
      map.set(sessionId, next);
    }
  }

  return map;
}

function resolveAnalyticsRowDeviceType(
  row: Pick<RawAnalyticsEventRow, 'session_id' | 'meta'>,
  sessionDeviceMap: Map<string, DeviceType>
) {
  const sessionId = `${row.session_id || ''}`.trim();
  if (sessionId) {
    return sessionDeviceMap.get(sessionId) || extractDeviceTypeFromMeta(row.meta);
  }

  return extractDeviceTypeFromMeta(row.meta);
}

function countSharedSessions(left: Set<string>, right: Set<string>) {
  const [smaller, larger] = left.size <= right.size ? [left, right] : [right, left];
  let count = 0;
  for (const sessionId of smaller) {
    if (larger.has(sessionId)) {
      count += 1;
    }
  }
  return count;
}

function calculatePercentRate(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function mapDeviceTypeLabelForSummary(deviceType: DeviceType) {
  if (deviceType === 'mobile') return '移动端';
  if (deviceType === 'desktop') return '桌面端';
  if (deviceType === 'tablet') return '平板';
  if (deviceType === 'bot') return '机器人';
  return '未知设备';
}

function deriveDeviceSampleState(params: {
  productEvents: number;
  reportSessions: number;
  toolDetailSessions: number;
  authRequestSessions: number;
  authVerified: number;
}) {
  const sampleVolume =
    params.productEvents
    + params.reportSessions
    + params.toolDetailSessions
    + params.authRequestSessions
    + params.authVerified;

  if (
    sampleVolume >= 30
    || params.reportSessions >= 8
    || params.toolDetailSessions >= 8
    || params.authRequestSessions >= 6
  ) {
    return 'enough' as const;
  }

  if (
    sampleVolume >= 10
    || params.reportSessions >= 3
    || params.toolDetailSessions >= 3
    || params.authRequestSessions >= 2
  ) {
    return 'low' as const;
  }

  return 'sparse' as const;
}

function buildDeviceWindowMetrics(rows: RawAnalyticsEventRow[]): DeviceWindowMetricRow[] {
  const sessionDeviceMap = resolveSessionDeviceTypeMap(rows);
  const buckets = createDeviceWindowAccumulatorMap();

  for (const row of rows) {
    const deviceType = resolveAnalyticsRowDeviceType(row, sessionDeviceMap);
    const sessionId = `${row.session_id || ''}`.trim();
    const bucket = buckets[deviceType];

    if (isProductAnalyticsRow(row)) {
      bucket.productEvents += 1;
      if (sessionId) {
        bucket.productSessions.add(sessionId);
      }
    }

    if (row.event_name === 'report_viewed') {
      bucket.reportViews += 1;
      if (sessionId) {
        bucket.reportSessions.add(sessionId);
      }
      continue;
    }

    if (row.event_name === 'chat_completed') {
      bucket.chatCompletedCount += 1;
      if (sessionId) {
        bucket.chatCompletedSessions.add(sessionId);
      }
      continue;
    }

    if (
      row.event_name === 'chat_event_saved'
      || row.event_name === 'event_created'
      || row.event_name === 'report_event_saved_from_result'
      || row.event_name === 'report_past_event_saved_from_result'
    ) {
      if (sessionId) {
        bucket.reportEventSessions.add(sessionId);
      }
      continue;
    }

    if (row.event_name === 'tool_detail_viewed') {
      if (sessionId) {
        bucket.toolDetailSessions.add(sessionId);
      }
      continue;
    }

    if (row.event_name === 'tool_run_started') {
      bucket.toolRuns += 1;
      if (sessionId) {
        bucket.toolRunSessions.add(sessionId);
      }
      continue;
    }

    if (row.event_name === 'auth_code_requested') {
      if (sessionId) {
        bucket.authRequestSessions.add(sessionId);
      }
      continue;
    }

    if (row.event_name === 'auth_verified') {
      bucket.authVerifiedCount += 1;
      if (sessionId) {
        bucket.authVerifiedSessions.add(sessionId);
      }
    }
  }

  return DEVICE_TYPES.map((deviceType) => {
    const bucket = buckets[deviceType];
    const reportSessions = bucket.reportSessions.size;
    const toolDetailSessions = bucket.toolDetailSessions.size;
    const authRequestSessions = bucket.authRequestSessions.size;
    const reportToChatSessions = countSharedSessions(bucket.reportSessions, bucket.chatCompletedSessions);
    const reportToEventSessions = countSharedSessions(bucket.reportSessions, bucket.reportEventSessions);
    const toolToRunSessions = countSharedSessions(bucket.toolDetailSessions, bucket.toolRunSessions);
    const authVerifiedSessions = countSharedSessions(bucket.authRequestSessions, bucket.authVerifiedSessions);
    const sampleState = deriveDeviceSampleState({
      productEvents: bucket.productEvents,
      reportSessions,
      toolDetailSessions,
      authRequestSessions,
      authVerified: bucket.authVerifiedCount,
    });
    const sampleVolume =
      bucket.productEvents
      + reportSessions
      + toolDetailSessions
      + authRequestSessions
      + bucket.authVerifiedCount;

    return {
      deviceType,
      productEvents: bucket.productEvents,
      sessions: bucket.productSessions.size,
      reportViews: bucket.reportViews,
      reportSessions,
      chatCompleted: bucket.chatCompletedCount,
      reportToChatSessions,
      reportToChatRate: calculatePercentRate(reportToChatSessions, reportSessions),
      reportToEventSessions,
      reportToEventRate: calculatePercentRate(reportToEventSessions, reportSessions),
      toolDetailSessions,
      toolRuns: bucket.toolRuns,
      toolToRunSessions,
      toolToRunRate: calculatePercentRate(toolToRunSessions, toolDetailSessions),
      authRequestSessions,
      authVerified: bucket.authVerifiedCount,
      authVerifiedSessions,
      authVerifyRate: calculatePercentRate(authVerifiedSessions, authRequestSessions),
      sampleVolume,
      sampleState,
    };
  });
}

function createSourceFunnelAccumulator(source: string): SourceFunnelAccumulator {
  return {
    source,
    analyzeSessions: new Set<string>(),
    reportIds: new Set<string>(),
    reportViewSessions: new Set<string>(),
    chatSessions: new Set<string>(),
    toolRunSessions: new Set<string>(),
    latestAt: null,
  };
}

function createSourceDeviceFunnelAccumulator(source: string, deviceType: DeviceType): SourceDeviceFunnelAccumulator {
  return {
    source,
    deviceType,
    analyzeSessions: new Set<string>(),
    reportIds: new Set<string>(),
    reportViewSessions: new Set<string>(),
    chatSessions: new Set<string>(),
    toolRunSessions: new Set<string>(),
    latestAt: null,
  };
}

function resolveSourceAnalyticsRows(rows: RawAnalyticsEventRow[]): SourceResolvedAnalyticsRow[] {
  const sessionDeviceMap = resolveSessionDeviceTypeMap(rows);
  const reportSourceMap = new Map<string, string>();
  const sessionSourceMap = new Map<string, string>();

  const rememberSessionSource = (sessionId: string, source: string) => {
    const current = sessionSourceMap.get(sessionId);
    if (!current || current === 'direct' || current === 'unknown') {
      sessionSourceMap.set(sessionId, source);
    }
  };

  for (const row of rows) {
    const meta = parseJson<Record<string, unknown>>(row.meta, {});
    const rawSource = typeof meta.source === 'string' ? meta.source.trim() : '';
    if (!rawSource) {
      continue;
    }

    const source = normalizeAttributionSource(rawSource);
    const sessionId = `${row.session_id || ''}`.trim();
    const reportId = typeof meta.reportId === 'string' ? meta.reportId.trim() : '';

    if (reportId) {
      reportSourceMap.set(reportId, source);
    }
    if (sessionId) {
      rememberSessionSource(sessionId, source);
    }
  }

  return rows.map((row) => {
    const meta = parseJson<Record<string, unknown>>(row.meta, {});
    const rawSource = typeof meta.source === 'string' ? meta.source : '';
    const sessionId = `${row.session_id || ''}`.trim();
    const reportId = typeof meta.reportId === 'string' ? meta.reportId.trim() : '';
    const source = normalizeAttributionSource(
      rawSource
      || (reportId ? reportSourceMap.get(reportId) : '')
      || (sessionId ? sessionSourceMap.get(sessionId) : '')
      || ''
    );

    if (reportId && rawSource) {
      reportSourceMap.set(reportId, source);
    }
    if (sessionId) {
      rememberSessionSource(sessionId, source);
    }

    return {
      row,
      meta,
      source,
      sessionId,
      reportId,
      deviceType: resolveAnalyticsRowDeviceType(row, sessionDeviceMap),
    };
  });
}

function populateSourceFunnelAccumulators(
  rows: SourceResolvedAnalyticsRow[],
  options?: {
    sourceBuckets?: Record<string, SourceFunnelAccumulator>;
    sourceDeviceBuckets?: Record<string, SourceDeviceFunnelAccumulator>;
  }
) {
  const sourceBuckets = options?.sourceBuckets || {};
  const sourceDeviceBuckets = options?.sourceDeviceBuckets || {};

  const ensureSourceBucket = (source: string) => {
    if (!sourceBuckets[source]) {
      sourceBuckets[source] = createSourceFunnelAccumulator(source);
    }
    return sourceBuckets[source];
  };

  const ensureSourceDeviceBucket = (source: string, deviceType: DeviceType) => {
    const key = `${source}::${deviceType}`;
    if (!sourceDeviceBuckets[key]) {
      sourceDeviceBuckets[key] = createSourceDeviceFunnelAccumulator(source, deviceType);
    }
    return sourceDeviceBuckets[key];
  };

  for (const resolved of rows) {
    const { row, source, sessionId, reportId, deviceType } = resolved;
    const bucket = ensureSourceBucket(source);
    const deviceBucket = ensureSourceDeviceBucket(source, deviceType);

    if (row.event_name === 'analyze_submitted' && sessionId) {
      bucket.analyzeSessions.add(sessionId);
      deviceBucket.analyzeSessions.add(sessionId);
    }

    if (row.event_name === 'report_generated' && reportId) {
      bucket.reportIds.add(reportId);
      deviceBucket.reportIds.add(reportId);
    }

    if (row.event_name === 'report_viewed' && sessionId) {
      bucket.reportViewSessions.add(sessionId);
      deviceBucket.reportViewSessions.add(sessionId);
    }

    if ((row.event_name === 'chat_completed' || row.event_name === 'chat_message_sent') && sessionId) {
      bucket.chatSessions.add(sessionId);
      deviceBucket.chatSessions.add(sessionId);
    }

    if (row.event_name === 'tool_run_started' && sessionId) {
      bucket.toolRunSessions.add(sessionId);
      deviceBucket.toolRunSessions.add(sessionId);
    }

    bucket.latestAt = row.created_at || bucket.latestAt;
    deviceBucket.latestAt = row.created_at || deviceBucket.latestAt;
  }

  return { sourceBuckets, sourceDeviceBuckets };
}

function sourceFunnelAccumulatorToRow(bucket: SourceFunnelAccumulator): SourceFunnelRow {
  const analyzeSessions = bucket.analyzeSessions.size;
  const reportsGenerated = bucket.reportIds.size;
  const reportViewSessions = bucket.reportViewSessions.size;
  const chatSessions = bucket.chatSessions.size;
  const toolRunSessions = bucket.toolRunSessions.size;

  return {
    source: bucket.source,
    analyzeSessions,
    reportsGenerated,
    reportViewSessions,
    chatSessions,
    toolRunSessions,
    analyzeToReportRate: calculatePercentRate(reportsGenerated, analyzeSessions),
    reportToViewRate: calculatePercentRate(reportViewSessions, reportsGenerated),
    viewToChatRate: calculatePercentRate(chatSessions, reportViewSessions),
    viewToToolRunRate: calculatePercentRate(toolRunSessions, reportViewSessions),
    latestAt: bucket.latestAt || null,
  };
}

function buildSourceFunnelRows(rows: RawAnalyticsEventRow[]) {
  const { sourceBuckets, sourceDeviceBuckets } = populateSourceFunnelAccumulators(resolveSourceAnalyticsRows(rows));

  const sourceFunnel = Object.values(sourceBuckets)
    .map((bucket) => sourceFunnelAccumulatorToRow(bucket))
    .filter((item) => item.analyzeSessions > 0 || item.reportsGenerated > 0 || item.reportViewSessions > 0)
    .sort((left, right) => right.analyzeSessions - left.analyzeSessions || right.reportViewSessions - left.reportViewSessions)
    .slice(0, 12);

  const sourceDeviceFunnel = Object.values(sourceDeviceBuckets)
    .map((bucket) => {
      const base = sourceFunnelAccumulatorToRow(bucket);
      return {
        ...base,
        deviceType: bucket.deviceType,
      };
    })
    .filter((item) => item.analyzeSessions > 0 || item.reportsGenerated > 0 || item.reportViewSessions > 0)
    .sort((left, right) => right.analyzeSessions - left.analyzeSessions || right.reportViewSessions - left.reportViewSessions)
    .slice(0, 20);

  return { sourceFunnel, sourceDeviceFunnel };
}

function getWeekStartValue(value?: string | null) {
  const normalized = `${value || ''}`.slice(0, 10);
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const day = parsed.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  parsed.setUTCDate(parsed.getUTCDate() - daysSinceMonday);
  return parsed.toISOString().slice(0, 10);
}

function formatWeekLabel(weekStart: string) {
  const parsed = new Date(`${weekStart}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return weekStart;
  }

  const yearStart = new Date(Date.UTC(parsed.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((parsed.getTime() - yearStart.getTime()) / 86400000) + 1;
  const weekNumber = Math.ceil((dayOfYear + ((yearStart.getUTCDay() + 6) % 7)) / 7);
  return `${parsed.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function buildSourceWeeklyTrendRows(rows: RawAnalyticsEventRow[]) {
  const resolvedRows = resolveSourceAnalyticsRows(rows);
  const { sourceFunnel } = buildSourceFunnelRows(rows);
  const topSourceSet = new Set(
    sourceFunnel
      .filter((item) => item.analyzeSessions > 0 || item.reportViewSessions > 0)
      .slice(0, 8)
      .map((item) => item.source)
  );
  const buckets: Record<string, SourceTrendAccumulator> = {};

  const ensureBucket = (source: string, weekStart: string) => {
    const key = `${weekStart}::${source}`;
    if (!buckets[key]) {
      buckets[key] = {
        source,
        weekStart,
        weekLabel: formatWeekLabel(weekStart),
        analyzeSessions: new Set<string>(),
        reportIds: new Set<string>(),
        reportViewSessions: new Set<string>(),
        chatSessions: new Set<string>(),
        toolRunSessions: new Set<string>(),
        latestAt: null,
      };
    }
    return buckets[key];
  };

  for (const resolved of resolvedRows) {
    const { row, source: resolvedSource, sessionId, reportId } = resolved;
    const weekStart = getWeekStartValue(row.created_at);
    if (!weekStart) {
      continue;
    }
    const source = topSourceSet.size === 0 || topSourceSet.has(resolvedSource) ? resolvedSource : 'other';
    const bucket = ensureBucket(source, weekStart);

    if (row.event_name === 'analyze_submitted' && sessionId) {
      bucket.analyzeSessions.add(sessionId);
    }
    if (row.event_name === 'report_generated' && reportId) {
      bucket.reportIds.add(reportId);
    }
    if (row.event_name === 'report_viewed' && sessionId) {
      bucket.reportViewSessions.add(sessionId);
    }
    if ((row.event_name === 'chat_completed' || row.event_name === 'chat_message_sent') && sessionId) {
      bucket.chatSessions.add(sessionId);
    }
    if (row.event_name === 'tool_run_started' && sessionId) {
      bucket.toolRunSessions.add(sessionId);
    }

    bucket.latestAt = row.created_at || bucket.latestAt;
  }

  return Object.values(buckets)
    .map((bucket) => ({
      ...sourceFunnelAccumulatorToRow(bucket),
      weekStart: bucket.weekStart,
      weekLabel: bucket.weekLabel,
    }))
    .filter((item) => item.analyzeSessions > 0 || item.reportsGenerated > 0 || item.reportViewSessions > 0 || item.chatSessions > 0 || item.toolRunSessions > 0)
    .sort((left, right) => right.weekStart.localeCompare(left.weekStart) || right.analyzeSessions - left.analyzeSessions || right.reportViewSessions - left.reportViewSessions)
    .slice(0, 56);
}

function deriveSourceShiftSampleState(current: SourceFunnelRow, previous: SourceFunnelRow) {
  const sampleVolume =
    current.analyzeSessions
    + current.reportViewSessions
    + current.chatSessions
    + current.toolRunSessions
    + previous.analyzeSessions
    + previous.reportViewSessions
    + previous.chatSessions
    + previous.toolRunSessions;

  if (sampleVolume >= 20 || current.reportViewSessions + previous.reportViewSessions >= 8) {
    return 'enough' as const;
  }
  if (sampleVolume >= 8 || current.reportViewSessions + previous.reportViewSessions >= 3) {
    return 'low' as const;
  }
  return 'sparse' as const;
}

function buildRecentSourceShiftRows(currentRows: RawAnalyticsEventRow[], previousRows: RawAnalyticsEventRow[]) {
  const current = buildSourceFunnelRows(currentRows).sourceFunnel;
  const previous = buildSourceFunnelRows(previousRows).sourceFunnel;
  const sourceSet = new Set<string>([
    ...current.map((item) => item.source),
    ...previous.map((item) => item.source),
  ]);
  const currentMap = new Map(current.map((item) => [item.source, item]));
  const previousMap = new Map(previous.map((item) => [item.source, item]));

  const emptyRow = (source: string): SourceFunnelRow => ({
    source,
    analyzeSessions: 0,
    reportsGenerated: 0,
    reportViewSessions: 0,
    chatSessions: 0,
    toolRunSessions: 0,
    analyzeToReportRate: 0,
    reportToViewRate: 0,
    viewToChatRate: 0,
    viewToToolRunRate: 0,
    latestAt: null,
  });

  return Array.from(sourceSet)
    .map((source) => {
      const currentRow = currentMap.get(source) || emptyRow(source);
      const previousRow = previousMap.get(source) || emptyRow(source);
      const analyzeSessionsDelta = currentRow.analyzeSessions - previousRow.analyzeSessions;
      const reportViewSessionsDelta = currentRow.reportViewSessions - previousRow.reportViewSessions;
      const viewToChatRateDelta = currentRow.viewToChatRate - previousRow.viewToChatRate;
      const viewToToolRunRateDelta = currentRow.viewToToolRunRate - previousRow.viewToToolRunRate;
      const deltaMagnitude =
        Math.abs(analyzeSessionsDelta)
        + Math.abs(reportViewSessionsDelta)
        + Math.abs(viewToChatRateDelta)
        + Math.abs(viewToToolRunRateDelta);
      const direction = analyzeSessionsDelta > 0 || reportViewSessionsDelta > 0 || viewToChatRateDelta > 0 || viewToToolRunRateDelta > 0
        ? 'up'
        : analyzeSessionsDelta < 0 || reportViewSessionsDelta < 0 || viewToChatRateDelta < 0 || viewToToolRunRateDelta < 0
          ? 'down'
          : 'flat';

      return {
        source,
        current: currentRow,
        previous: previousRow,
        analyzeSessionsDelta,
        reportViewSessionsDelta,
        viewToChatRateDelta,
        viewToToolRunRateDelta,
        deltaMagnitude,
        direction,
        sampleState: deriveSourceShiftSampleState(currentRow, previousRow),
      } satisfies SourceShiftRow;
    })
    .filter((item) => item.current.analyzeSessions > 0 || item.current.reportViewSessions > 0 || item.previous.analyzeSessions > 0 || item.previous.reportViewSessions > 0)
    .sort((left, right) => right.deltaMagnitude - left.deltaMagnitude || right.current.analyzeSessions - left.current.analyzeSessions)
    .slice(0, 12);
}

function mapFortuneRow(row: RawFortuneRow): FortuneRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    birthDate: row.birth_date,
    birthTime: row.birth_time,
    birthPlace: row.birth_place || undefined,
    timezone: row.timezone,
    gender: row.gender,
    bazi: parseJson(row.bazi, {}),
    fiveElements: parseJson(row.five_elements, {}),
    tenGods: parseJson(row.ten_gods, {}),
    pattern: parseJson(row.pattern, {}),
    fortune: parseJson(row.fortune, {}),
    advice: parseJson(row.advice, {}),
    evidence: parseJson(row.evidence, {}),
    analysis: parseJson(row.analysis, null) || undefined,
    klineData: parseJson(row.kline_data, null) || undefined,
    dayun: parseJson(row.dayun, null) || undefined,
    shenSha: parseJson(row.shen_sha, null) || undefined,
    reportVersion: row.report_version || undefined,
    isPublic: row.is_public !== 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    relation: row.relation || undefined,
    relationLabel: row.relation_label || undefined,
  } as FortuneRecord;
}

function mapAnalyticsEventRow(row: RawAnalyticsEventRow): AnalyticsEventRecord {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    sessionId: row.session_id || undefined,
    eventName: row.event_name,
    page: row.page || undefined,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

function mapReportJourneyEventRow(row: RawReportJourneyEventRow): ReportJourneyEventRecord {
  return {
    id: row.id,
    userId: row.user_id,
    reportId: row.report_id,
    workflowId: row.workflow_id,
    layerKey: row.layer_key,
    actionTarget: row.action_target,
    category: row.category || undefined,
    toolSlug: row.tool_slug || undefined,
    source: row.source || undefined,
    href: row.href || undefined,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

function mapContentSignalRow(row: RawContentSignalRow): ContentSignalRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceLabel: row.source_label,
    platform: row.platform,
    title: row.title,
    url: row.url,
    author: row.author || undefined,
    summary: row.summary || undefined,
    publishedAt: row.published_at || undefined,
    matchedKeywords: parseJson(row.matched_keywords, []),
    score: row.score || 0,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

function mapContentRadarRunRow(row: RawContentRadarRunRow): ContentRadarRunRecord {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceLabel: row.source_label,
    platform: row.platform,
    status: row.status,
    fetchedCount: row.fetched_count || 0,
    savedCount: row.saved_count || 0,
    error: row.error || undefined,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

function mapContentSchedulerRunRow(row: RawContentSchedulerRunRow): ContentSchedulerRunRecord {
  return {
    id: row.id,
    trigger: row.trigger,
    status: row.status,
    reason: row.reason || undefined,
    generatedCount: row.generated_count || 0,
    publishedCount: row.published_count || 0,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

function mapContentGenerationJobRow(row: RawContentGenerationJobRow): ContentGenerationJobRecord {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    request: parseJson(row.request_payload, {}),
    result: parseJson(row.result_payload, {}),
    generatedCount: row.generated_count || 0,
    llmSucceededCount: row.llm_succeeded_count || 0,
    fallbackCount: row.fallback_count || 0,
    attempts: row.attempts || 0,
    maxAttempts: row.max_attempts || 0,
    nextRunAt: row.next_run_at || undefined,
    lockedAt: row.locked_at || undefined,
    lastError: row.last_error || undefined,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEmailDeliveryJobRow(row: RawEmailDeliveryJobRow): EmailDeliveryJobRecord {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    to: parseJson(row.recipient_list, []),
    payload: parseJson(row.payload, {}),
    attempts: row.attempts || 0,
    maxAttempts: row.max_attempts || 0,
    nextRunAt: row.next_run_at || undefined,
    lockedAt: row.locked_at || undefined,
    lastError: row.last_error || undefined,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPremiumServiceRequestRow(row: RawPremiumServiceRequestRow): PremiumServiceRequestRecord {
  return {
    id: row.id,
    userId: row.user_id,
    reportId: row.report_id || undefined,
    serviceKey: row.service_key,
    status: row.status,
    priority: row.priority || undefined,
    contactName: row.contact_name || undefined,
    contactValue: row.contact_value || undefined,
    intake: parseJson(row.intake, {}),
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapToolSessionRow(row: RawToolSessionRow): ToolSessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    reportId: row.report_id || undefined,
    toolSlug: row.tool_slug,
    status: row.status,
    input: parseJson(row.input, {}),
    result: parseJson(row.result, {}),
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReportUpgradeJobRow(row: RawReportUpgradeJobRow): ReportUpgradeJobRecord {
  return {
    id: row.id,
    reportId: row.report_id,
    userId: row.user_id,
    status: row.status,
    targetScore: row.target_score || 0,
    attempts: row.attempts || 0,
    maxAttempts: row.max_attempts || 0,
    lastScore: row.last_score || 0,
    bestScore: row.best_score || 0,
    bestGrade: row.best_grade || undefined,
    nextRunAt: row.next_run_at || undefined,
    lockedAt: row.locked_at || undefined,
    lastError: row.last_error || undefined,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReportMonthlyDigestRunRow(row: RawReportMonthlyDigestRunRow): ReportMonthlyDigestRunRecord {
  return {
    id: row.id,
    cycleKey: row.cycle_key,
    email: row.email,
    userId: row.user_id || undefined,
    reportId: row.report_id || undefined,
    status: row.status,
    reason: row.reason || undefined,
    meta: row.meta ? JSON.parse(row.meta) : {},
    createdAt: row.created_at,
  };
}

function mapUserLifecycleEmailRunRow(row: RawUserLifecycleEmailRunRow): UserLifecycleEmailRunRecord {
  return {
    id: row.id,
    stageKey: row.stage_key,
    email: row.email,
    userId: row.user_id || undefined,
    reportId: row.report_id || undefined,
    status: row.status,
    reason: row.reason || undefined,
    meta: parseJson(row.meta, {}),
    createdAt: row.created_at,
  };
}

function mapEventRow(row: RawEventRow): EventRecord {
  return {
    ...normalizeEventTransportRecord({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      date: row.date,
      time: row.time || undefined,
      description: row.description || undefined,
      impact: row.impact,
      fortune_analysis: parseJson(row.fortune_analysis, {}),
      user_feedback: parseJson(row.user_feedback, {}),
      follow_up_advice: parseJson(row.follow_up_advice, {}),
      reminder_enabled: row.reminder_enabled === 1,
      reminder_advance_days: row.reminder_advance_days || undefined,
      reminder_method: row.reminder_method || undefined,
    }),
    userId: row.user_id,
  };
}

function mapQuestionRow(row: RawQuestionRow): QuestionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    question: row.question,
    category: row.category,
    analysis: parseJson(row.analysis, {}),
    createdAt: row.created_at,
  };
}

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'data', 'lifekline.db');

// 创建数据库实例
export const db = new Database(dbPath);

// v5-D84 (2026-05-24): SQLite PRAGMA 全栈调优
// - WAL：并发读写不互锁（已启用）
// - synchronous=NORMAL：WAL 模式下 fsync 改为按 checkpoint 批量；崩溃最多丢最后未 checkpoint 的 WAL，可接受
// - cache_size=-65536：64MB 页缓存（之前 16MB），909k 行 analytics 索引扫描受益最大
// - mmap_size=256MB：让 SQLite 用 mmap 直读 db 文件，绕过 page cache 拷贝
// - temp_store=MEMORY：临时表/排序走内存（之前走磁盘）
// - busy_timeout=10000：高并发写阻塞时多等 5s 再报 SQLITE_BUSY
// - wal_autocheckpoint=2000：WAL 满 8MB 才 checkpoint（之前 4MB），减少 fsync 抖动
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -65536');
db.pragma('mmap_size = 268435456');
db.pragma('temp_store = MEMORY');
db.pragma('busy_timeout = 10000');
db.pragma('wal_autocheckpoint = 2000');

// 初始化数据库
export function initializeDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT DEFAULT 'guest',
      email_verified INTEGER DEFAULT 0,
      gender TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL,
      birth_place TEXT,
      timezone INTEGER DEFAULT 8,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'guest'`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  try {
    db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  // 命理数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS fortunes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL,
      birth_place TEXT,
      timezone INTEGER DEFAULT 8,
      gender TEXT NOT NULL,
      bazi JSON NOT NULL,
      five_elements JSON NOT NULL,
      ten_gods JSON NOT NULL,
      pattern JSON NOT NULL,
      fortune JSON NOT NULL,
      advice JSON NOT NULL,
      evidence JSON NOT NULL,
      analysis JSON,
      kline_data JSON,
      dayun JSON,
      shen_sha JSON,
      report_version TEXT DEFAULT 'v1',
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 迁移：为已存在的表添加 kline_data 字段
  try {
    db.exec(`ALTER TABLE fortunes ADD COLUMN kline_data JSON`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e; // 非预期错误，重新抛出
    }
  }

  try {
    db.exec(`ALTER TABLE fortunes ADD COLUMN is_public INTEGER DEFAULT 1`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  try {
    db.exec(`ALTER TABLE fortunes ADD COLUMN dayun JSON`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  try {
    db.exec(`ALTER TABLE fortunes ADD COLUMN shen_sha JSON`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  try {
    db.exec(`ALTER TABLE fortunes ADD COLUMN report_version TEXT DEFAULT 'v1'`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  // v5-D39 多档案：relation 自由枚举（self / spouse / child / parent / friend / colleague / other）
  // relation_label 用户自定义昵称（"老婆""大宝"），可空。老档案 NULL = 视作 self。
  try {
    db.exec(`ALTER TABLE fortunes ADD COLUMN relation TEXT`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  try {
    db.exec(`ALTER TABLE fortunes ADD COLUMN relation_label TEXT`);
  } catch (e) {
    if (e instanceof Error && !e.message.includes('duplicate column')) {
      throw e;
    }
  }

  // 重要事件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      description TEXT,
      impact TEXT NOT NULL,
      fortune_analysis JSON,
      user_feedback JSON,
      follow_up_advice JSON,
      reminder_enabled INTEGER DEFAULT 0,
      reminder_advance_days INTEGER DEFAULT 0,
      reminder_method TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 用户问题表
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question TEXT NOT NULL,
      category TEXT NOT NULL,
      analysis JSON,
      user_feedback JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 用户偏好表
  db.exec(`
    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      notification_enabled INTEGER DEFAULT 1,
      detail_level TEXT DEFAULT 'detailed',
      language TEXT DEFAULT 'zh-CN',
      theme TEXT DEFAULT 'light',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 增运记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS enhancements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      effectiveness INTEGER,
      start_date TEXT,
      end_date TEXT,
      specific_advice JSON,
      usage JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      last_active TEXT NOT NULL,
      context JSON,
      messages JSON,
      tags JSON,
      created_at TEXT DEFAULT (datetime('now')),

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS email_subscriptions (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      source TEXT DEFAULT 'site',
      tags JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT DEFAULT 'login',
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS content_entries (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      subtype TEXT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      name TEXT,
      excerpt TEXT NOT NULL,
      category TEXT,
      read_time TEXT,
      tags JSON,
      featured INTEGER DEFAULT 0,
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      sections JSON NOT NULL,
      status TEXT DEFAULT 'published',
      source TEXT DEFAULT 'cms',
      meta JSON,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const contentEntryColumns = db.prepare(`PRAGMA table_info(content_entries)`).all() as Array<{ name: string }>;
  if (!contentEntryColumns.some((column) => column.name === 'meta')) {
    db.exec(`ALTER TABLE content_entries ADD COLUMN meta JSON`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      session_id TEXT,
      event_name TEXT NOT NULL,
      page TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS report_journey_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_id TEXT NOT NULL,
      workflow_id TEXT NOT NULL,
      layer_key TEXT NOT NULL,
      action_target TEXT NOT NULL,
      category TEXT,
      tool_slug TEXT,
      source TEXT,
      href TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES fortunes(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS content_signals (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      source_label TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      author TEXT,
      summary TEXT,
      published_at TEXT,
      matched_keywords JSON,
      score INTEGER DEFAULT 0,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(source_id, url)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS content_radar_runs (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      source_label TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL,
      fetched_count INTEGER DEFAULT 0,
      saved_count INTEGER DEFAULT 0,
      error TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS content_scheduler_runs (
      id TEXT PRIMARY KEY,
      trigger TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      generated_count INTEGER DEFAULT 0,
      published_count INTEGER DEFAULT 0,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS content_generation_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      request_payload JSON NOT NULL,
      result_payload JSON,
      generated_count INTEGER DEFAULT 0,
      llm_succeeded_count INTEGER DEFAULT 0,
      fallback_count INTEGER DEFAULT 0,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      next_run_at TEXT,
      locked_at TEXT,
      last_error TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS llm_provider_configs (
      id TEXT PRIMARY KEY,
      purpose TEXT NOT NULL,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      model TEXT NOT NULL,
      api_key TEXT,
      priority INTEGER DEFAULT 100,
      enabled INTEGER DEFAULT 1,
      timeout_ms INTEGER,
      max_retries INTEGER DEFAULT 0,
      meta JSON,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS system_locks (
      key TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      locked_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS report_upgrade_jobs (
      id TEXT PRIMARY KEY,
      report_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      target_score INTEGER DEFAULT 95,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 6,
      last_score INTEGER DEFAULT 0,
      best_score INTEGER DEFAULT 0,
      best_grade TEXT,
      next_run_at TEXT,
      locked_at TEXT,
      last_error TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS report_monthly_digest_runs (
      id TEXT PRIMARY KEY,
      cycle_key TEXT NOT NULL,
      email TEXT NOT NULL,
      user_id TEXT,
      report_id TEXT,
      status TEXT NOT NULL,
      reason TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(cycle_key, email)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_lifecycle_email_runs (
      id TEXT PRIMARY KEY,
      stage_key TEXT NOT NULL,
      email TEXT NOT NULL,
      user_id TEXT,
      report_id TEXT,
      status TEXT NOT NULL,
      reason TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(stage_key, email)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS email_delivery_jobs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      recipient_list JSON NOT NULL,
      payload JSON,
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 4,
      next_run_at TEXT,
      locked_at TEXT,
      last_error TEXT,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS premium_service_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_id TEXT,
      service_key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      priority TEXT DEFAULT 'normal',
      contact_name TEXT,
      contact_value TEXT,
      intake JSON,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tool_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_id TEXT,
      tool_slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      input JSON,
      result JSON,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (report_id) REFERENCES fortunes(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS visual_asset_batches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      library_key TEXT NOT NULL,
      module TEXT,
      target_count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      model TEXT NOT NULL DEFAULT 'gpt-image-2',
      brand_pack_id TEXT,
      manifest_path TEXT,
      generated_count INTEGER DEFAULT 0,
      approved_count INTEGER DEFAULT 0,
      rejected_count INTEGER DEFAULT 0,
      correction_count INTEGER DEFAULT 0,
      meta JSON,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS visual_assets (
      id TEXT PRIMARY KEY,
      asset_type TEXT NOT NULL,
      module TEXT NOT NULL,
      batch_id TEXT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      prompt TEXT NOT NULL,
      negative_prompt TEXT,
      model TEXT NOT NULL DEFAULT 'gpt-image-2',
      size TEXT NOT NULL,
      ratio TEXT NOT NULL,
      quality TEXT NOT NULL DEFAULT 'medium',
      source_image_ids JSON,
      brand_reference_ids JSON,
      output_path TEXT,
      public_url TEXT,
      alt_text TEXT,
      overlay_copy_simplified TEXT,
      overlay_copy_traditional TEXT,
      overlay_copy_english TEXT,
      narrative_title TEXT,
      narrative_excerpt TEXT,
      narrative_sections JSON,
      target_routes JSON,
      related_content_slugs JSON,
      related_tool_slugs JSON,
      related_report_themes JSON,
      status TEXT NOT NULL DEFAULT 'planned',
      qa_status TEXT NOT NULL DEFAULT 'pending',
      qa_score INTEGER DEFAULT 0,
      qa_notes JSON,
      correction_count INTEGER DEFAULT 0,
      latest_error_code TEXT,
      version INTEGER DEFAULT 1,
      meta JSON,
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (batch_id) REFERENCES visual_asset_batches(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS visual_asset_reviews (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      review_type TEXT NOT NULL,
      status TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      error_codes JSON,
      notes JSON,
      reviewer TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(asset_id) REFERENCES visual_assets(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS visual_asset_corrections (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      correction_round INTEGER NOT NULL,
      error_codes JSON NOT NULL,
      original_prompt TEXT NOT NULL,
      corrected_prompt TEXT NOT NULL,
      original_output_path TEXT,
      corrected_output_path TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(asset_id) REFERENCES visual_assets(id) ON DELETE CASCADE
    )
  `);

  // 索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_fortunes_user_id ON fortunes(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_enhancements_user_id ON enhancements(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
    CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes(email);
    CREATE INDEX IF NOT EXISTS idx_content_entries_type_status ON content_entries(content_type, status);
    CREATE INDEX IF NOT EXISTS idx_content_entries_slug ON content_entries(slug);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_report_journey_events_report_id ON report_journey_events(report_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_report_journey_events_user_id ON report_journey_events(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_report_journey_events_layer ON report_journey_events(layer_key, created_at);
    CREATE INDEX IF NOT EXISTS idx_report_journey_events_category ON report_journey_events(category, created_at);
    CREATE INDEX IF NOT EXISTS idx_content_signals_source_id ON content_signals(source_id);
    CREATE INDEX IF NOT EXISTS idx_content_signals_created_at ON content_signals(created_at);
    CREATE INDEX IF NOT EXISTS idx_content_radar_runs_source_id ON content_radar_runs(source_id);
    CREATE INDEX IF NOT EXISTS idx_content_radar_runs_created_at ON content_radar_runs(created_at);
    CREATE INDEX IF NOT EXISTS idx_content_scheduler_runs_created_at ON content_scheduler_runs(created_at);
    CREATE INDEX IF NOT EXISTS idx_content_generation_jobs_status_next_run ON content_generation_jobs(status, next_run_at);
    CREATE INDEX IF NOT EXISTS idx_content_generation_jobs_user_created_at ON content_generation_jobs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_llm_provider_configs_purpose_enabled ON llm_provider_configs(purpose, enabled, priority);
    CREATE INDEX IF NOT EXISTS idx_system_locks_expires_at ON system_locks(expires_at);
    CREATE INDEX IF NOT EXISTS idx_report_upgrade_jobs_status_next_run ON report_upgrade_jobs(status, next_run_at);
    CREATE INDEX IF NOT EXISTS idx_report_upgrade_jobs_report_id ON report_upgrade_jobs(report_id);
    CREATE INDEX IF NOT EXISTS idx_report_monthly_digest_runs_cycle ON report_monthly_digest_runs(cycle_key, status);
    CREATE INDEX IF NOT EXISTS idx_user_lifecycle_email_runs_stage ON user_lifecycle_email_runs(stage_key, created_at);
    CREATE INDEX IF NOT EXISTS idx_user_lifecycle_email_runs_email ON user_lifecycle_email_runs(email, created_at);
    CREATE INDEX IF NOT EXISTS idx_email_delivery_jobs_status_next_run ON email_delivery_jobs(status, next_run_at);
    CREATE INDEX IF NOT EXISTS idx_email_delivery_jobs_kind_created_at ON email_delivery_jobs(kind, created_at);
    CREATE INDEX IF NOT EXISTS idx_premium_service_requests_user_id ON premium_service_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_premium_service_requests_report_id ON premium_service_requests(report_id);
    CREATE INDEX IF NOT EXISTS idx_premium_service_requests_status_created_at ON premium_service_requests(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_tool_sessions_user_id ON tool_sessions(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tool_sessions_tool_slug ON tool_sessions(tool_slug, created_at);
    CREATE INDEX IF NOT EXISTS idx_tool_sessions_report_id ON tool_sessions(report_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_visual_assets_batch_id ON visual_assets(batch_id);
    CREATE INDEX IF NOT EXISTS idx_visual_assets_module_status ON visual_assets(module, status);
    CREATE INDEX IF NOT EXISTS idx_visual_assets_status_qa ON visual_assets(status, qa_status);
    CREATE INDEX IF NOT EXISTS idx_visual_assets_slug ON visual_assets(slug);
    CREATE INDEX IF NOT EXISTS idx_visual_asset_batches_status ON visual_asset_batches(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_visual_asset_reviews_asset_id ON visual_asset_reviews(asset_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_visual_asset_corrections_asset_id ON visual_asset_corrections(asset_id, created_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS gsc_query_daily (
      site TEXT NOT NULL,
      date TEXT NOT NULL,
      query TEXT NOT NULL,
      page TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT '',
      clicks REAL NOT NULL DEFAULT 0,
      impressions REAL NOT NULL DEFAULT 0,
      ctr REAL NOT NULL DEFAULT 0,
      position REAL NOT NULL DEFAULT 0,
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (site, date, query, page, country, device)
    );
    CREATE INDEX IF NOT EXISTS idx_gsc_query_daily_query ON gsc_query_daily(query, date);
    CREATE INDEX IF NOT EXISTS idx_gsc_query_daily_page ON gsc_query_daily(page, date);
    CREATE INDEX IF NOT EXISTS idx_gsc_query_daily_date ON gsc_query_daily(date, impressions DESC);
  `);

  // Sub-Spec B1 (2026-05-10): 命理时点档案缓存
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_timing_profiles (
      user_id TEXT PRIMARY KEY,
      report_id TEXT,
      birth_signature TEXT NOT NULL,
      bazi_pillars TEXT NOT NULL,
      computed_for_year TEXT NOT NULL,
      past_validations TEXT NOT NULL,
      next_30_days TEXT NOT NULL,
      next_12_months TEXT NOT NULL,
      next_5_years TEXT NOT NULL,
      narrator_status TEXT NOT NULL DEFAULT 'pending',
      narrator_completed_at TEXT,
      computed_at TEXT NOT NULL DEFAULT (datetime('now')),
      schema_version INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_timing_profiles_report ON user_timing_profiles(report_id);
    CREATE INDEX IF NOT EXISTS idx_user_timing_profiles_narrator ON user_timing_profiles(narrator_status);
  `);

  // Sub-Spec C (2026-05-10): 邮件发送去重 + 召回追踪
  db.exec(`
    CREATE TABLE IF NOT EXISTS timing_email_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      category TEXT NOT NULL,
      campaign TEXT NOT NULL,
      report_id TEXT,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'sent',
      meta TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_timing_email_log_dedupe
      ON timing_email_log(email, category, campaign);
    CREATE INDEX IF NOT EXISTS idx_timing_email_log_sent ON timing_email_log(sent_at);

    CREATE TABLE IF NOT EXISTS timing_email_recall_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT,
      email_log_id TEXT,
      action TEXT NOT NULL,
      landed_at TEXT,
      landed_point_id TEXT,
      session_duration_ms INTEGER,
      pages_viewed INTEGER,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_timing_email_recall_log_email ON timing_email_recall_log(email);
    CREATE INDEX IF NOT EXISTS idx_timing_email_recall_log_campaign ON timing_email_recall_log(utm_campaign);
    CREATE INDEX IF NOT EXISTS idx_timing_email_recall_log_action ON timing_email_recall_log(action, recorded_at);
  `);

  // v5-D61 论坛 Q&A 平台
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_users (
      id TEXT PRIMARY KEY,
      handle TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT,
      province TEXT,
      occupation TEXT,
      industry TEXT,
      interests JSON,
      role TEXT NOT NULL,
      bio TEXT,
      avatar_seed TEXT,
      joined_at TEXT NOT NULL,
      reputation INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_forum_users_role ON forum_users(role);
    CREATE INDEX IF NOT EXISTS idx_forum_users_industry ON forum_users(industry);

    CREATE TABLE IF NOT EXISTS forum_questions (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      industry TEXT,
      tags JSON,
      privacy_mode TEXT NOT NULL,
      metadata JSON,
      status TEXT NOT NULL DEFAULT 'pending',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      view_count INTEGER DEFAULT 0,
      answer_count INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_forum_questions_status_pub ON forum_questions(status, published_at);
    CREATE INDEX IF NOT EXISTS idx_forum_questions_category ON forum_questions(category);
    CREATE INDEX IF NOT EXISTS idx_forum_questions_industry ON forum_questions(industry);
    CREATE INDEX IF NOT EXISTS idx_forum_questions_slug ON forum_questions(slug);

    CREATE TABLE IF NOT EXISTS forum_answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      body TEXT NOT NULL,
      is_official INTEGER NOT NULL DEFAULT 0,
      upvote_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      response_delay_minutes INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_forum_answers_question ON forum_answers(question_id, status);
    CREATE INDEX IF NOT EXISTS idx_forum_answers_status_pub ON forum_answers(status, published_at);

    -- v5-D67 LLM 预生成标题池：一次请求出 100-300 条，daemon tick 时消费
    CREATE TABLE IF NOT EXISTS forum_title_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      keyword TEXT,
      status TEXT NOT NULL DEFAULT 'fresh',  -- fresh | consumed
      consumed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      batch_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_forum_title_pool_status ON forum_title_pool(status, category);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_title_pool_title ON forum_title_pool(title);
  `);

  // v5-D70 兼容：旧表加 body / official_answer 字段
  try {
    const cols = (db.prepare(`PRAGMA table_info(forum_title_pool)`).all() as Array<{ name: string }>).map((c) => c.name);
    if (!cols.includes('body')) {
      db.exec(`ALTER TABLE forum_title_pool ADD COLUMN body TEXT`);
    }
    if (!cols.includes('official_answer')) {
      db.exec(`ALTER TABLE forum_title_pool ADD COLUMN official_answer TEXT`);
    }
  } catch (err) {
    console.warn('[db] forum_title_pool migrate failed:', err);
  }

  // 兼容已有库 — 如果旧表没有这两列，加上
  try {
    const cols = (db.prepare(`PRAGMA table_info(user_timing_profiles)`).all() as Array<{ name: string }>).map((c) => c.name);
    if (!cols.includes('narrator_status')) {
      db.exec(`ALTER TABLE user_timing_profiles ADD COLUMN narrator_status TEXT NOT NULL DEFAULT 'pending'`);
    }
    if (!cols.includes('narrator_completed_at')) {
      db.exec(`ALTER TABLE user_timing_profiles ADD COLUMN narrator_completed_at TEXT`);
    }
  } catch {
    // ignore
  }
}

// 用户操作
export const userOperations = {
  create: (user: UserRecord) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, role, email_verified, gender, birth_date, birth_time, birth_place, timezone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      user.id,
      user.name,
      user.email ? user.email.trim().toLowerCase() : null,
      user.role || 'guest',
      user.emailVerified ? 1 : 0,
      user.gender,
      user.birthDate,
      user.birthTime,
      user.birthPlace,
      user.timezone
    );
  },

  getById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  getByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email.trim().toLowerCase());
  },

  listWithEmail: (limit = 500) => {
    return db.prepare(`
      SELECT * FROM users
      WHERE email IS NOT NULL AND email != ''
      ORDER BY datetime(updated_at) DESC
      LIMIT ?
    `).all(limit);
  },

  update: (id: string, updates: Partial<Omit<UserRecord, 'id'>>) => {
    const COLUMN_MAP: Record<string, string> = {
      birthDate: 'birth_date',
      birthTime: 'birth_time',
      birthPlace: 'birth_place',
      emailVerified: 'email_verified',
    };
    const setClause = Object.keys(updates).map((key) => `${COLUMN_MAP[key] || key} = ?`).join(', ');
    const values = Object.entries(updates).map(([key, value]) => {
      if (key === 'email') return typeof value === 'string' ? value.trim().toLowerCase() : value;
      if (key === 'emailVerified') return value ? 1 : 0;
      return value;
    });
    values.push(new Date().toISOString());

    const stmt = db.prepare(`
      UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?
    `);
    return stmt.run(...values, id);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  },
};

// 命理数据操作
export const fortuneOperations = {
  create: (fortune: FortuneRecord) => {
    const stmt = db.prepare(`
      INSERT INTO fortunes (id, user_id, name, birth_date, birth_time, birth_place, timezone, gender, bazi, five_elements, ten_gods, pattern, fortune, advice, evidence, analysis, kline_data, dayun, shen_sha, report_version, is_public, relation, relation_label)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      fortune.id,
      fortune.userId,
      fortune.name,
      fortune.birthDate,
      fortune.birthTime,
      fortune.birthPlace,
      fortune.timezone,
      fortune.gender,
      JSON.stringify(fortune.bazi),
      JSON.stringify(fortune.fiveElements),
      JSON.stringify(fortune.tenGods),
      JSON.stringify(fortune.pattern),
      JSON.stringify(fortune.fortune),
      JSON.stringify(fortune.advice),
      JSON.stringify(fortune.evidence),
      JSON.stringify(fortune.analysis),
      JSON.stringify(fortune.klineData || null),
      JSON.stringify(fortune.dayun || null),
      JSON.stringify(fortune.shenSha || null),
      fortune.reportVersion || 'v1',
      fortune.isPublic === false ? 0 : 1,
      fortune.relation || null,
      fortune.relationLabel || null
    );
  },

  getById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM fortunes WHERE id = ?');
    const row = stmt.get(id) as RawFortuneRow | undefined;
    if (row) {
      return mapFortuneRow(row);
    }
    return null;
  },

  getByUserId: (userId: string) => {
    // v5-D39 多档案排序：self 永远第一（NULL 也视作 self），其它按 created_at desc
    const stmt = db.prepare(
      `SELECT * FROM fortunes WHERE user_id = ?
       ORDER BY (CASE WHEN relation IS NULL OR relation = '' OR relation = 'self' THEN 0 ELSE 1 END),
                datetime(created_at) DESC`
    );
    const rows = stmt.all(userId) as RawFortuneRow[];
    return rows.map(mapFortuneRow);
  },

  listRecent: (limit = 100) => {
    const stmt = db.prepare('SELECT * FROM fortunes ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC LIMIT ?');
    const rows = stmt.all(limit) as RawFortuneRow[];
    return rows.map(mapFortuneRow);
  },

  listPublicPaged: (limit: number, offset: number) => {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const safeOffset = Math.max(0, Math.floor(offset));
    const stmt = db.prepare(
      'SELECT * FROM fortunes WHERE is_public = 1 ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC LIMIT ? OFFSET ?'
    );
    const rows = stmt.all(safeLimit, safeOffset) as RawFortuneRow[];
    return rows.map(mapFortuneRow);
  },

  countPublic: () => {
    const row = db.prepare('SELECT COUNT(*) as c FROM fortunes WHERE is_public = 1').get() as { c: number };
    return row.c;
  },

  update: (id: string, updates: Partial<Omit<FortuneRecord, 'id' | 'userId'>>) => {
    const JSON_FIELDS = ['bazi', 'fiveElements', 'tenGods', 'pattern', 'fortune', 'advice', 'evidence', 'analysis', 'klineData', 'dayun', 'shenSha'] as const;
    const COLUMN_MAP: Record<string, string> = {
      fiveElements: 'five_elements',
      tenGods: 'ten_gods',
      klineData: 'kline_data',
      dayun: 'dayun',
      shenSha: 'shen_sha',
      isPublic: 'is_public',
      birthDate: 'birth_date',
      birthTime: 'birth_time',
      birthPlace: 'birth_place',
      userId: 'user_id',
      reportVersion: 'report_version',
    };
    const setClause = Object.keys(updates)
      .map((key) => `${COLUMN_MAP[key] || key} = ?`)
      .join(', ');
    const values = Object.entries(updates).map(([key, value]) => {
      if (JSON_FIELDS.includes(key as typeof JSON_FIELDS[number])) return JSON.stringify(value);
      // better-sqlite3 不接受 boolean 绑定；isPublic 等布尔列要转成 0/1。
      // v5-D34e：修 22:02 起 /api/fortune/[id] 切公开状态报 "SQLite3 can only bind ..." 的 bug。
      if (typeof value === 'boolean') return value ? 1 : 0;
      if (value === undefined) return null;
      return value;
    });
    values.push(new Date().toISOString());
    values.push(id);
    const stmt = db.prepare(`UPDATE fortunes SET ${setClause}, updated_at = ? WHERE id = ?`);
    return stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM fortunes WHERE id = ?');
    return stmt.run(id);
  },
};

export const analyticsOperations = {
  create: (event: AnalyticsEventRecord) => {
    const stmt = db.prepare(`
      INSERT INTO analytics_events (id, user_id, session_id, event_name, page, meta)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      event.id,
      event.userId || null,
      event.sessionId || null,
      event.eventName,
      event.page || null,
      JSON.stringify(event.meta || {})
    );
  },

  listRecent: (limit = 50) => {
    const stmt = db.prepare(`
      SELECT * FROM analytics_events
      ORDER BY created_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit) as RawAnalyticsEventRow[];
    return rows.map(mapAnalyticsEventRow);
  },

  countByEventNameSinceDays: (days: number) => {
    const stmt = db.prepare(`
      SELECT event_name, COUNT(*) as count
      FROM analytics_events
      WHERE datetime(created_at) >= datetime('now', ?)
      GROUP BY event_name
      ORDER BY count DESC
    `);
    return stmt.all(`-${days} days`) as Array<{ event_name: string; count: number }>;
  },

  rawQuery: (sql: string, params: Array<string | number | null> = []) => {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  getSystemHealthSummary: (options?: { modelWindowMinutes?: number }) => {
    const modelWindowMinutes = Math.max(1, Math.min(24 * 60, Math.round(options?.modelWindowMinutes || 24 * 60)));
    const modelWindowLabel = modelWindowMinutes === 24 * 60
      ? '近 24 小时'
      : `近 ${modelWindowMinutes} 分钟`;
    const totals = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM fortunes) as total_analyses,
        (SELECT COUNT(*) FROM fortunes WHERE is_public = 1) as public_reports,
        (SELECT COUNT(*) FROM fortunes f LEFT JOIN users u ON u.id=f.user_id
           WHERE NOT (u.role='guest'
             AND u.birth_date='1990-01-01'
             AND u.birth_time IN ('12:00','00:00')
             AND u.birth_place='北京')
        ) as valid_analyses,
        (SELECT COUNT(*) FROM fortunes f LEFT JOIN users u ON u.id=f.user_id
           WHERE f.is_public = 1
             AND NOT (u.role='guest'
               AND u.birth_date='1990-01-01'
               AND u.birth_time IN ('12:00','00:00')
               AND u.birth_place='北京')
        ) as valid_public_reports,
        (SELECT COUNT(*) FROM fortunes f LEFT JOIN users u ON u.id=f.user_id
           WHERE datetime(f.created_at) >= datetime('now','-7 days')
             AND NOT (u.role='guest'
               AND u.birth_date='1990-01-01'
               AND u.birth_time IN ('12:00','00:00')
               AND u.birth_place='北京')
        ) as valid_analyses_last_7d,
        (SELECT COUNT(*) FROM questions WHERE category = 'chat_user') as chat_messages,
        (SELECT COUNT(*) FROM email_subscriptions WHERE status = 'active') as active_subscribers,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM analytics_events) as total_tracked_events,
        (SELECT COUNT(*) FROM fortunes WHERE datetime(created_at) >= datetime('now', '-7 days')) as analyses_last_7d,
        (SELECT COUNT(*) FROM analytics_events WHERE datetime(created_at) >= datetime('now', '-7 days')) as tracked_events_last_7d,
        (SELECT COUNT(*) FROM events WHERE user_feedback IS NOT NULL AND json_extract(user_feedback, '$.wasAccurate') = 1) as validation_accurate,
        (SELECT COUNT(*) FROM events WHERE user_feedback IS NOT NULL AND json_extract(user_feedback, '$.wasAccurate') = 0) as validation_drift,
        (SELECT COUNT(*) FROM events WHERE user_feedback IS NULL OR json_extract(user_feedback, '$.wasAccurate') IS NULL) as validation_pending,
        (SELECT COUNT(*) FROM events WHERE json_extract(fortune_analysis, '$.reportId') IS NOT NULL) as result_report_linked_events,
        (SELECT COUNT(*) FROM events WHERE json_extract(fortune_analysis, '$.source') = 'chat_message') as chat_sourced_events
    `).get() as {
      total_analyses: number;
      public_reports: number;
      valid_analyses: number;
      valid_public_reports: number;
      valid_analyses_last_7d: number;
      chat_messages: number;
      active_subscribers: number;
      total_events: number;
      total_tracked_events: number;
      analyses_last_7d: number;
      tracked_events_last_7d: number;
      validation_accurate: number;
      validation_drift: number;
      validation_pending: number;
      result_report_linked_events: number;
      chat_sourced_events: number;
    };
    const latestEvent = db.prepare(`
      SELECT created_at FROM analytics_events
      ORDER BY created_at DESC
      LIMIT 1
    `).get() as { created_at?: string } | undefined;
    const recentLlmRows = db.prepare(`
      SELECT event_name, meta, created_at
      FROM analytics_events
      WHERE event_name IN ('llm_model_attempt', 'llm_model_circuit_changed')
        AND datetime(created_at) >= datetime('now', ?)
      ORDER BY created_at DESC
      LIMIT 200
    `).all(`-${modelWindowMinutes} minutes`) as Array<Pick<RawAnalyticsEventRow, 'event_name' | 'meta' | 'created_at'>>;
    const recentRouteRows = db.prepare(`
      SELECT event_name, meta, created_at
      FROM analytics_events
      WHERE event_name IN ('analyze_completed', 'analyze_failed', 'chat_completed', 'chat_failed')
        AND datetime(created_at) >= datetime('now', ?)
      ORDER BY created_at DESC
      LIMIT 200
    `).all(`-${modelWindowMinutes} minutes`) as Array<Pick<RawAnalyticsEventRow, 'event_name' | 'meta' | 'created_at'>>;
    const funnelRows = db.prepare(`
      SELECT event_name, COUNT(*) as count
      FROM analytics_events
      WHERE event_name IN (
        'analyze_submitted',
        'report_generated',
        'report_viewed',
        'chat_message_sent',
        'premium_service_requested',
        'auth_code_requested',
        'auth_verified'
      )
      GROUP BY event_name
    `).all() as Array<{ event_name: string; count: number }>;
    const emailRetryQueue = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM email_delivery_jobs
      WHERE status IN ('pending', 'running', 'failed')
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    const funnelCounts = funnelRows.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.event_name] = item.count;
      return accumulator;
    }, {});
    const emailCounts = emailRetryQueue.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.status] = item.count;
      return accumulator;
    }, {});
    let recentLlmAttempts = 0;
    let recentLlmSuccesses = 0;
    let recentLlmFailures = 0;
    let openModelCount = 0;
    let halfOpenModelCount = 0;
    let overdueCircuitCount = 0;
    const modelStates: Record<string, { state: string; reopenAt?: string }> = {};
    const routeHealthBuckets: Record<string, { label: string; success: number; failed: number; totalDurationMs: number }> = {};
    const nowTime = Date.now();

    for (const row of recentLlmRows) {
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      if (row.event_name === 'llm_model_attempt') {
        recentLlmAttempts += 1;
        if (meta.success === true) {
          recentLlmSuccesses += 1;
        } else {
          recentLlmFailures += 1;
        }
      }
      if (row.event_name === 'llm_model_circuit_changed') {
        const model = typeof meta.model === 'string' ? meta.model : '';
        const state = typeof meta.state === 'string' ? meta.state : '';
        if (model && !modelStates[model]) {
          modelStates[model] = {
            state,
            reopenAt: typeof meta.reopenAt === 'string' ? meta.reopenAt : undefined,
          };
        }
      }
    }

    for (const item of Object.values(modelStates)) {
      if (item.state === 'open') {
        openModelCount += 1;
        const reopenAtMs = item.reopenAt ? new Date(item.reopenAt).getTime() : Number.NaN;
        if (Number.isFinite(reopenAtMs) && reopenAtMs <= nowTime) {
          overdueCircuitCount += 1;
        }
      } else if (item.state === 'half-open') {
        halfOpenModelCount += 1;
      }
    }

    for (const row of recentRouteRows) {
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      const action = typeof meta.action === 'string' ? meta.action : 'ask';
      const key = row.event_name.startsWith('analyze_') ? 'analyze' : `chat:${action}`;
      if (!routeHealthBuckets[key]) {
        routeHealthBuckets[key] = {
          label: mapRouteHealthLabel(key),
          success: 0,
          failed: 0,
          totalDurationMs: 0,
        };
      }
      routeHealthBuckets[key].totalDurationMs += typeof meta.durationMs === 'number' ? meta.durationMs : 0;
      if (row.event_name.endsWith('_failed')) {
        routeHealthBuckets[key].failed += 1;
      } else {
        routeHealthBuckets[key].success += 1;
      }
    }

    const funnelDiagnostics = [
      {
        label: '提交测算 -> 成功出报告',
        from: funnelCounts.analyze_submitted || 0,
        to: funnelCounts.report_generated || 0,
      },
      {
        label: '报告生成 -> 打开结果页',
        from: funnelCounts.report_generated || 0,
        to: funnelCounts.report_viewed || 0,
      },
      {
        label: '结果页查看 -> 继续聊天',
        from: funnelCounts.report_viewed || 0,
        to: funnelCounts.chat_message_sent || 0,
      },
      {
        label: '请求验证码 -> 完成验证',
        from: funnelCounts.auth_code_requested || 0,
        to: funnelCounts.auth_verified || 0,
      },
      {
        label: '结果页查看 -> 提交专项需求',
        from: funnelCounts.report_viewed || 0,
        to: funnelCounts.premium_service_requested || 0,
      },
    ].map((item) => ({
      ...item,
      conversionRate: item.from > 0 ? Math.round((item.to / item.from) * 100) : 0,
      dropOff: Math.max(0, item.from - item.to),
    }));
    const routeHealthBreakdown = Object.values(routeHealthBuckets)
      .map((item) => {
        const total = item.success + item.failed;
        return {
          ...item,
          total,
          successRate: total > 0 ? Math.round((item.success / total) * 100) : 0,
          avgDurationMs: total > 0 ? Math.round(item.totalDurationMs / total) : 0,
        };
      })
      .sort((left, right) => left.successRate - right.successRate || right.failed - left.failed);
    const recentLlmSuccessRate = recentLlmAttempts > 0 ? Math.round((recentLlmSuccesses / recentLlmAttempts) * 100) : 0;
    const pendingEmailQueue = (emailCounts.pending || 0) + (emailCounts.running || 0);
    const failedEmailQueue = emailCounts.failed || 0;
    const feedbackBacklog = totals.validation_pending + totals.validation_drift;
    const worstFunnel = funnelDiagnostics
      .filter((item) => item.from > 0)
      .sort((left, right) => left.conversionRate - right.conversionRate)[0];
    const weakestRoute = routeHealthBreakdown.find((item) => item.total > 0);
    const primaryBlockers: string[] = [];
    const healthySignals: string[] = [];

    if (recentLlmAttempts > 0 && recentLlmSuccessRate < 20) {
      primaryBlockers.push(`${modelWindowLabel}模型成功率仅 ${recentLlmSuccessRate}%，当前主要故障集中在模型供应链。`);
    } else if (openModelCount > 0 || halfOpenModelCount > 0) {
      primaryBlockers.push(`当前仍有 ${openModelCount} 个模型熔断、${halfOpenModelCount} 个模型处于半开探测。`);
    } else {
      healthySignals.push('模型链路目前没有明显的熔断阻塞。');
    }

    if (worstFunnel && worstFunnel.conversionRate < 35) {
      primaryBlockers.push(`${worstFunnel.label} 转化仅 ${worstFunnel.conversionRate}% ，存在明显用户流失。`);
    } else if (worstFunnel) {
      healthySignals.push(`当前最弱漏斗是“${worstFunnel.label}”，转化 ${worstFunnel.conversionRate}%。`);
    }

    if (weakestRoute && weakestRoute.successRate < 85) {
      primaryBlockers.push(`${weakestRoute.label} 成功率仅 ${weakestRoute.successRate}% ，平均耗时 ${weakestRoute.avgDurationMs}ms。`);
    } else if (weakestRoute) {
      healthySignals.push(`${weakestRoute.label} 当前成功率 ${weakestRoute.successRate}% 。`);
    }

    if (feedbackBacklog > 0) {
      primaryBlockers.push(`还有 ${feedbackBacklog} 条验证/纠偏待处理，真实反馈闭环还不够快。`);
    } else {
      healthySignals.push('验证闭环队列当前可控。');
    }

    if (failedEmailQueue > 0 || pendingEmailQueue > 3) {
      primaryBlockers.push(`邮件重试队列仍有 ${pendingEmailQueue} 条待处理，另有 ${failedEmailQueue} 条最终失败。`);
    } else {
      healthySignals.push('邮件投递链路当前没有明显积压。');
    }

    const systemHealthSeverity = primaryBlockers.length === 0
      ? 'healthy'
      : (recentLlmAttempts > 0 && recentLlmSuccessRate < 20)
          || overdueCircuitCount > 0
          || (worstFunnel ? worstFunnel.conversionRate < 20 : false)
        ? 'critical'
        : 'warning';

    return {
      totals,
      systemHealth: {
        severity: systemHealthSeverity,
        title: systemHealthSeverity === 'critical'
          ? '当前系统存在明确阻塞，优先看模型链路与核心漏斗'
          : systemHealthSeverity === 'warning'
            ? '当前系统可运行，但有若干卡点正在拖慢体验与转化'
            : '当前系统整体健康，主要链路可闭环运行',
        summary: systemHealthSeverity === 'critical'
          ? '页面本身不是主问题，最可能影响用户体感的是模型请求失败、熔断恢复不及时，以及关键漏斗转化偏低。'
          : systemHealthSeverity === 'warning'
            ? '系统可继续跑，但已经出现局部故障或明显流失，需要针对性压降失败率和回收反馈。'
            : '模型、邮件、反馈和转化链路目前都没有明显硬阻塞，可以继续观察用户行为细节。',
        updatedAt: latestEvent?.created_at || null,
        blockers: primaryBlockers.slice(0, 4),
        healthySignals: healthySignals.slice(0, 4),
        cards: [],
        llmSnapshot: {
          windowMinutes: modelWindowMinutes,
          attempts: recentLlmAttempts,
          successRate: recentLlmSuccessRate,
          attempts24h: recentLlmAttempts,
          successRate24h: recentLlmSuccessRate,
          openModelCount,
          halfOpenModelCount,
          overdueCircuitCount,
        },
      },
    };
  },

  getOverview: () => {
    const totals = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM fortunes) as total_analyses,
        (SELECT COUNT(*) FROM fortunes WHERE is_public = 1) as public_reports,
        (SELECT COUNT(*) FROM fortunes f LEFT JOIN users u ON u.id=f.user_id
           WHERE NOT (u.role='guest'
             AND u.birth_date='1990-01-01'
             AND u.birth_time IN ('12:00','00:00')
             AND u.birth_place='北京')
        ) as valid_analyses,
        (SELECT COUNT(*) FROM fortunes f LEFT JOIN users u ON u.id=f.user_id
           WHERE f.is_public = 1
             AND NOT (u.role='guest'
               AND u.birth_date='1990-01-01'
               AND u.birth_time IN ('12:00','00:00')
               AND u.birth_place='北京')
        ) as valid_public_reports,
        (SELECT COUNT(*) FROM fortunes f LEFT JOIN users u ON u.id=f.user_id
           WHERE datetime(f.created_at) >= datetime('now','-7 days')
             AND NOT (u.role='guest'
               AND u.birth_date='1990-01-01'
               AND u.birth_time IN ('12:00','00:00')
               AND u.birth_place='北京')
        ) as valid_analyses_last_7d,
        (SELECT COUNT(*) FROM questions WHERE category = 'chat_user') as chat_messages,
        (SELECT COUNT(*) FROM email_subscriptions WHERE status = 'active') as active_subscribers,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM analytics_events) as total_tracked_events,
        (SELECT COUNT(*) FROM fortunes WHERE datetime(created_at) >= datetime('now', '-7 days')) as analyses_last_7d,
        (SELECT COUNT(*) FROM analytics_events WHERE datetime(created_at) >= datetime('now', '-7 days')) as tracked_events_last_7d
    `).get() as {
      total_analyses: number;
      public_reports: number;
      valid_analyses: number;
      valid_public_reports: number;
      valid_analyses_last_7d: number;
      chat_messages: number;
      active_subscribers: number;
      total_events: number;
      total_tracked_events: number;
      analyses_last_7d: number;
      tracked_events_last_7d: number;
    };
    const analyticsRows = db.prepare(`
      SELECT * FROM analytics_events
      ORDER BY created_at DESC
    `).all() as RawAnalyticsEventRow[];

    const eventRows = db.prepare(`
      SELECT id, type, title, date, time, fortune_analysis, user_feedback
      FROM events
    `).all() as Array<{
      id: string;
      type: string;
      title: string;
      date: string;
      time?: string | null;
      fortune_analysis?: string | null;
      user_feedback?: string | null;
    }>;
    const reportVersionRows = db.prepare(`
      SELECT COALESCE(report_version, 'v1') as report_version, COUNT(*) as count
      FROM fortunes
      GROUP BY COALESCE(report_version, 'v1')
      ORDER BY count DESC
    `).all() as Array<{ report_version: string; count: number }>;

    let validationAccurate = 0;
    let validationDrift = 0;
    let validationPending = 0;
    let resultReportLinked = 0;
    let chatSourcedEvents = 0;
    const nowTime = Date.now();
    const sourceBuckets: Record<string, { source: string; total: number; accurate: number; drift: number; pending: number }> = {};
    const driftReasonBuckets: Record<string, { key: DriftReasonKey; label: string; count: number; examples: string[] }> = {};
    const pageViewBuckets: Record<string, { page: string; count: number }> = {};
    const ctaBuckets: Record<string, { key: string; label: string; count: number }> = {};
    const chatActionBuckets: Record<string, { action: string; label: string; count: number }> = {};
    const analyzeOptionBuckets: Record<string, { key: string; label: string; count: number }> = {
      useSolarTime: { key: 'useSolarTime', label: '启用真太阳时', count: 0 },
      useDaylightSaving: { key: 'useDaylightSaving', label: '启用夏令时修正', count: 0 },
      useSeparateZiHour: { key: 'useSeparateZiHour', label: '启用子时分日', count: 0 },
      defaultClock: { key: 'defaultClock', label: '默认钟表时入口', count: 0 },
    };
    const reasoningModeBuckets: Record<string, { mode: string; count: number }> = {};
    const llmModelBuckets: Record<string, {
      model: string;
      attempts: number;
      successes: number;
      failures: number;
      totalLatencyMs: number;
      currentState: string;
      reopenAt?: string;
      lastStateChangedAt?: string;
      scopes: Record<string, number>;
    }> = {};
    const llmFailureHotspots: Record<string, {
      key: string;
      label: string;
      model: string;
      scope: string;
      count: number;
      totalLatencyMs: number;
      avgLatencyMs: number;
      lastSeenAt?: string;
    }> = {};
    const routeHealthBuckets: Record<string, {
      key: string;
      label: string;
      success: number;
      failed: number;
      fallbacks: number;
      totalDurationMs: number;
      maxDurationMs: number;
      lastSeenAt?: string;
    }> = {};
    const requestFailureHotspots: Record<string, {
      key: string;
      label: string;
      route: string;
      action: string;
      count: number;
      lastSeenAt?: string;
    }> = {};
    const ctaStrategyBuckets: Record<string, CtaStrategyBreakdownAccumulator> = {};
    const journeyCounts: Record<string, { key: string; label: string; count: number }> = {
      home_page_viewed: { key: 'home_page_viewed', label: '首页访问', count: 0 },
      analyze_page_viewed: { key: 'analyze_page_viewed', label: '分析页访问', count: 0 },
      analyze_submitted: { key: 'analyze_submitted', label: '提交测算', count: 0 },
      report_generated: { key: 'report_generated', label: '生成报告', count: 0 },
      report_viewed: { key: 'report_viewed', label: '打开结果页', count: 0 },
      chat_page_viewed: { key: 'chat_page_viewed', label: '聊天页访问', count: 0 },
      chat_message_sent: { key: 'chat_message_sent', label: '发送聊天消息', count: 0 },
      report_event_saved_from_result: { key: 'report_event_saved_from_result', label: '结果页沉淀事件', count: 0 },
      report_past_event_saved_from_result: { key: 'report_past_event_saved_from_result', label: '结果页确认过去事件', count: 0 },
      event_feedback_recorded: { key: 'event_feedback_recorded', label: '回填验证结果', count: 0 },
      newsletter_subscribed: { key: 'newsletter_subscribed', label: '邮件订阅', count: 0 },
      auth_code_requested: { key: 'auth_code_requested', label: '请求验证码', count: 0 },
      auth_verified: { key: 'auth_verified', label: '完成邮箱验证', count: 0 },
    };
    const pendingValidationBuckets = {
      overdue: 0,
      upcoming: 0,
      driftNeedsNotes: 0,
      driftReadyForCorrection: 0,
    };
    const followupQueue: Array<{
      id: string;
      title: string;
      date: string;
      status: 'pending' | 'drift';
      source: string;
      action: string;
      reason: string;
      reportId?: string;
      priorityScore: number;
    }> = [];
    const recentLlmWindowMs = 24 * 60 * 60 * 1000;
    const ctaStrategyWindowMs = 30 * 24 * 60 * 60 * 1000;
    let recentLlmAttempts = 0;
    let recentLlmSuccesses = 0;
    let recentLlmFailures = 0;

    for (const row of eventRows) {
      const feedback = parseJson(row.user_feedback, {}) as { wasAccurate?: boolean; userNotes?: string };
      const analysis = parseJson(row.fortune_analysis, {}) as { source?: string; reportId?: string; reason?: string };
      const sourceKey = analysis.source || 'manual';
      const eventTime = new Date(`${row.date}T${row.time || '00:00:00'}`).getTime();
      if (!sourceBuckets[sourceKey]) {
        sourceBuckets[sourceKey] = { source: sourceKey, total: 0, accurate: 0, drift: 0, pending: 0 };
      }
      sourceBuckets[sourceKey].total += 1;

      if (feedback.wasAccurate === true) {
        validationAccurate += 1;
        sourceBuckets[sourceKey].accurate += 1;
      } else if (feedback.wasAccurate === false) {
        validationDrift += 1;
        sourceBuckets[sourceKey].drift += 1;
        if (feedback.userNotes) {
          pendingValidationBuckets.driftReadyForCorrection += 1;
        } else {
          pendingValidationBuckets.driftNeedsNotes += 1;
        }
        const driftReason = classifyDriftReason({
          reason: analysis.reason,
          notes: feedback.userNotes,
          title: row.title,
          type: row.type,
        });
        if (!driftReasonBuckets[driftReason.key]) {
          driftReasonBuckets[driftReason.key] = {
            key: driftReason.key,
            label: driftReason.label,
            count: 0,
            examples: [],
          };
        }
        driftReasonBuckets[driftReason.key].count += 1;
        if (row.title && !driftReasonBuckets[driftReason.key].examples.includes(row.title) && driftReasonBuckets[driftReason.key].examples.length < 3) {
          driftReasonBuckets[driftReason.key].examples.push(row.title);
        }
        followupQueue.push({
          id: row.id,
          title: row.title,
          date: row.date,
          status: 'drift',
          source: sourceKey,
          action: feedback.userNotes ? '进入纠偏分析' : '补充偏差备注',
          reason: feedback.userNotes || analysis.reason || driftReason.label,
          reportId: analysis.reportId,
          priorityScore: feedback.userNotes ? 100 : 90,
        });
      } else {
        validationPending += 1;
        sourceBuckets[sourceKey].pending += 1;
        if (eventTime < nowTime) {
          pendingValidationBuckets.overdue += 1;
          followupQueue.push({
            id: row.id,
            title: row.title,
            date: row.date,
            status: 'pending',
            source: sourceKey,
            action: '回收验证结果',
            reason: '事件日期已过，应该追收用户反馈，判断这次预测是否命中。',
            reportId: analysis.reportId,
            priorityScore: 70,
          });
        } else {
          pendingValidationBuckets.upcoming += 1;
        }
      }

      if (analysis.reportId) {
        resultReportLinked += 1;
      }
      if (analysis.source === 'chat_message') {
        chatSourcedEvents += 1;
      }
    }

    for (const row of analyticsRows) {
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      const eventName = row.event_name;
      const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : Number.NaN;

      if (journeyCounts[eventName]) {
        journeyCounts[eventName].count += 1;
      }

      if (eventName.endsWith('_page_viewed') || eventName === 'report_viewed') {
        const pageKey = row.page || eventName;
        if (!pageViewBuckets[pageKey]) {
          pageViewBuckets[pageKey] = {
            page: pageKey,
            count: 0,
          };
        }
        pageViewBuckets[pageKey].count += 1;
      }

      if (eventName === 'result_cta_clicked' || eventName === 'chat_followup_clicked' || eventName === 'report_upgrade_requested') {
        const rawTarget = typeof meta.target === 'string' ? meta.target : eventName === 'chat_followup_clicked' ? 'chat_followup' : eventName;
        // v5-D2 (2026-05-08): 解码 namespaced targets 形如 'result_premium_teaser:offerKey'
        let label: string;
        if (rawTarget.startsWith('result_premium_teaser:')) {
          const offerKey = rawTarget.slice('result_premium_teaser:'.length);
          const offerLabelMap: Record<string, string> = {
            'event-simulation': '专项 · 事件推演',
            'event-verdict': '专项 · 断事',
            'event-review': '专项 · 事件剖析',
            'meihua-enhancement': '专项 · 卦象增强',
          };
          label = offerLabelMap[offerKey] || `专项 · ${offerKey}`;
        } else if (rawTarget.startsWith('result_chapter_ask:')) {
          const chapter = rawTarget.slice('result_chapter_ask:'.length);
          const chapterLabelMap: Record<string, string> = {
            rhythm: '章节追问 · 12 月节奏',
            blueprint: '章节追问 · 命局结构',
            'current-state': '章节追问 · 当前阶段',
            scenario: '章节追问 · 场景剧本',
            'action-validation': '章节追问 · 动作+验证',
          };
          label = chapterLabelMap[chapter] || `章节追问 · ${chapter}`;
        } else if (rawTarget === 'result_cockpit_followup_suggestion') {
          label = '驾驶舱追问 chips';
        } else if (rawTarget.startsWith('resume_bar:')) {
          const kind = rawTarget.slice('resume_bar:'.length);
          const kindLabelMap: Record<string, string> = {
            continue_chat: '继续上次 · 聊天',
            validate_event: '继续上次 · 验证事件',
            continue_report: '继续上次 · 报告',
          };
          label = kindLabelMap[kind] || `继续上次 · ${kind}`;
        } else if (rawTarget === 'chat') {
          label = '结果页进入聊天';
        } else if (rawTarget === 'events') {
          label = '结果页进入事件中心';
        } else if (rawTarget === 'chat_followup') {
          label = '聊天追问按钮';
        } else {
          label = '报告升级重算';
        }
        if (!ctaBuckets[rawTarget]) {
          ctaBuckets[rawTarget] = {
            key: rawTarget,
            label,
            count: 0,
          };
        }
        ctaBuckets[rawTarget].count += 1;
      }

      if (
        Number.isFinite(createdAtMs)
        && nowTime - createdAtMs <= ctaStrategyWindowMs
        && (
          eventName === 'result_cta_clicked'
          || eventName === 'chat_page_viewed'
          || eventName === 'chat_completed'
          || eventName === 'tool_card_clicked'
          || eventName === 'content_card_clicked'
        )
      ) {
        const strategyKey = typeof meta.ctaStrategyKey === 'string' ? meta.ctaStrategyKey.trim() : '';
        if (strategyKey) {
          const sourceFamily = resolveCtaSourceFamilyFromMeta(meta);
          const key = `${strategyKey}:${sourceFamily}`;
          if (!ctaStrategyBuckets[key]) {
            ctaStrategyBuckets[key] = {
              key,
              strategyKey,
              sourceFamily,
              clicks: 0,
              chatPageViews: 0,
              chatCompleted: 0,
              toolCardClicks: 0,
              contentCardClicks: 0,
              latestAt: row.created_at || null,
            };
          }

          if (eventName === 'result_cta_clicked') {
            ctaStrategyBuckets[key].clicks += 1;
          }
          if (eventName === 'chat_page_viewed') {
            ctaStrategyBuckets[key].chatPageViews += 1;
          }
          if (eventName === 'chat_completed') {
            ctaStrategyBuckets[key].chatCompleted += 1;
          }
          if (eventName === 'tool_card_clicked') {
            ctaStrategyBuckets[key].toolCardClicks += 1;
          }
          if (eventName === 'content_card_clicked') {
            ctaStrategyBuckets[key].contentCardClicks += 1;
          }
          ctaStrategyBuckets[key].latestAt = row.created_at || ctaStrategyBuckets[key].latestAt;
        }
      }

      if (eventName === 'chat_message_sent') {
        const action = typeof meta.action === 'string' ? meta.action : 'ask';
        const label = action === 'edit'
          ? '编辑后重提'
          : action === 'regenerate'
            ? '重生成回答'
            : action === 'delete'
              ? '删除消息'
              : '直接提问';
        if (!chatActionBuckets[action]) {
          chatActionBuckets[action] = {
            action,
            label,
            count: 0,
          };
        }
        chatActionBuckets[action].count += 1;
      }

      if (eventName === 'analyze_submitted') {
        const useSolarTime = meta.useSolarTime === true;
        const useDaylightSaving = meta.useDaylightSaving === true;
        const useSeparateZiHour = meta.useSeparateZiHour === true;
        if (useSolarTime) {
          analyzeOptionBuckets.useSolarTime.count += 1;
        } else {
          analyzeOptionBuckets.defaultClock.count += 1;
        }
        if (useDaylightSaving) {
          analyzeOptionBuckets.useDaylightSaving.count += 1;
        }
        if (useSeparateZiHour) {
          analyzeOptionBuckets.useSeparateZiHour.count += 1;
        }
      }

      if (eventName === 'report_generated' || eventName === 'report_viewed' || eventName === 'report_upgrade_requested') {
        const mode = typeof meta.reasoningMode === 'string' ? meta.reasoningMode : '';
        if (mode) {
          if (!reasoningModeBuckets[mode]) {
            reasoningModeBuckets[mode] = {
              mode,
              count: 0,
            };
          }
          reasoningModeBuckets[mode].count += 1;
        }
      }

      if (eventName === 'llm_model_attempt') {
        const model = typeof meta.model === 'string' ? meta.model : '';
        const scope = typeof meta.scope === 'string' ? meta.scope : 'unknown';
        if (model) {
          if (!llmModelBuckets[model]) {
            llmModelBuckets[model] = {
              model,
              attempts: 0,
              successes: 0,
              failures: 0,
              totalLatencyMs: 0,
              currentState: 'closed',
              scopes: {},
            };
          }
          llmModelBuckets[model].attempts += 1;
          llmModelBuckets[model].totalLatencyMs += typeof meta.latencyMs === 'number' ? meta.latencyMs : 0;
          llmModelBuckets[model].scopes[scope] = (llmModelBuckets[model].scopes[scope] || 0) + 1;
          if (meta.success === true) {
            llmModelBuckets[model].successes += 1;
            if (Number.isFinite(createdAtMs) && nowTime - createdAtMs <= recentLlmWindowMs) {
              recentLlmAttempts += 1;
              recentLlmSuccesses += 1;
            }
          } else {
            llmModelBuckets[model].failures += 1;
            if (Number.isFinite(createdAtMs) && nowTime - createdAtMs <= recentLlmWindowMs) {
              recentLlmAttempts += 1;
              recentLlmFailures += 1;
            }
            const traceLabel = typeof meta.traceLabel === 'string' ? meta.traceLabel : `${scope}:${model}`;
            if (!llmFailureHotspots[traceLabel]) {
              llmFailureHotspots[traceLabel] = {
                key: traceLabel,
                label: traceLabel,
                model,
                scope,
                count: 0,
                totalLatencyMs: 0,
                avgLatencyMs: 0,
              };
            }
            llmFailureHotspots[traceLabel].count += 1;
            llmFailureHotspots[traceLabel].totalLatencyMs += typeof meta.latencyMs === 'number' ? meta.latencyMs : 0;
            llmFailureHotspots[traceLabel].avgLatencyMs = Math.round(
              llmFailureHotspots[traceLabel].totalLatencyMs / llmFailureHotspots[traceLabel].count
            );
            llmFailureHotspots[traceLabel].lastSeenAt = row.created_at || llmFailureHotspots[traceLabel].lastSeenAt;
          }
        }
      }

      if (eventName === 'llm_model_circuit_changed') {
        const model = typeof meta.model === 'string' ? meta.model : '';
        if (model) {
          if (!llmModelBuckets[model]) {
            llmModelBuckets[model] = {
              model,
              attempts: 0,
              successes: 0,
              failures: 0,
              totalLatencyMs: 0,
              currentState: 'closed',
              scopes: {},
            };
          }
          llmModelBuckets[model].currentState = typeof meta.state === 'string' ? meta.state : llmModelBuckets[model].currentState;
          llmModelBuckets[model].reopenAt = typeof meta.reopenAt === 'string' ? meta.reopenAt : llmModelBuckets[model].reopenAt;
          llmModelBuckets[model].lastStateChangedAt = row.created_at || llmModelBuckets[model].lastStateChangedAt;
        }
      }

      if (eventName === 'analyze_completed' || eventName === 'analyze_failed') {
        const key = 'analyze';
        if (!routeHealthBuckets[key]) {
          routeHealthBuckets[key] = {
            key,
            label: '测算主流程',
            success: 0,
            failed: 0,
            fallbacks: 0,
            totalDurationMs: 0,
            maxDurationMs: 0,
          };
        }
        const durationMs = typeof meta.durationMs === 'number' ? meta.durationMs : 0;
        if (eventName === 'analyze_completed') {
          routeHealthBuckets[key].success += 1;
          if (meta.fallbackToEngine === true) {
            routeHealthBuckets[key].fallbacks += 1;
          }
        } else {
          routeHealthBuckets[key].failed += 1;
          const stage = typeof meta.stage === 'string' ? meta.stage : 'unknown';
          const error = typeof meta.error === 'string' ? meta.error : 'unknown';
          const hotspotKey = `analyze:${stage}:${error}`;
          if (!requestFailureHotspots[hotspotKey]) {
            requestFailureHotspots[hotspotKey] = {
              key: hotspotKey,
              label: `测算失败 · ${stage}`,
              route: 'analyze',
              action: stage,
              count: 0,
            };
          }
          requestFailureHotspots[hotspotKey].count += 1;
          requestFailureHotspots[hotspotKey].lastSeenAt = row.created_at || requestFailureHotspots[hotspotKey].lastSeenAt;
        }
        routeHealthBuckets[key].totalDurationMs += durationMs;
        routeHealthBuckets[key].maxDurationMs = Math.max(routeHealthBuckets[key].maxDurationMs, durationMs);
        routeHealthBuckets[key].lastSeenAt = row.created_at || routeHealthBuckets[key].lastSeenAt;
      }

      if (eventName === 'chat_completed' || eventName === 'chat_failed') {
        const action = typeof meta.action === 'string' ? meta.action : 'ask';
        const routeKey = `chat:${action}`;
        if (!routeHealthBuckets[routeKey]) {
          routeHealthBuckets[routeKey] = {
            key: routeKey,
            label: mapRouteHealthLabel(routeKey),
            success: 0,
            failed: 0,
            fallbacks: 0,
            totalDurationMs: 0,
            maxDurationMs: 0,
          };
        }
        const durationMs = typeof meta.durationMs === 'number' ? meta.durationMs : 0;
        if (eventName === 'chat_completed') {
          routeHealthBuckets[routeKey].success += 1;
          if (meta.llmUsed === false) {
            routeHealthBuckets[routeKey].fallbacks += 1;
          }
        } else {
          routeHealthBuckets[routeKey].failed += 1;
          const error = typeof meta.error === 'string' ? meta.error : 'unknown';
          const hotspotKey = `${routeKey}:${error}`;
          if (!requestFailureHotspots[hotspotKey]) {
            requestFailureHotspots[hotspotKey] = {
              key: hotspotKey,
              label: `${mapRouteHealthLabel(routeKey)}失败`,
              route: 'chat',
              action,
              count: 0,
            };
          }
          requestFailureHotspots[hotspotKey].count += 1;
          requestFailureHotspots[hotspotKey].lastSeenAt = row.created_at || requestFailureHotspots[hotspotKey].lastSeenAt;
        }
        routeHealthBuckets[routeKey].totalDurationMs += durationMs;
        routeHealthBuckets[routeKey].maxDurationMs = Math.max(routeHealthBuckets[routeKey].maxDurationMs, durationMs);
        routeHealthBuckets[routeKey].lastSeenAt = row.created_at || routeHealthBuckets[routeKey].lastSeenAt;
      }
    }

    const eventsLast7d = analyticsOperations.countByEventNameSinceDays(7).map((item) => ({
      eventName: item.event_name,
      count: item.count,
    }));
    const userRegistrationSummary = db.prepare(`
      SELECT
        COUNT(*) AS totalUsers,
        SUM(CASE WHEN email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS usersWithEmail,
        SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS verifiedUsers,
        MIN(created_at) AS firstUserAt,
        MAX(created_at) AS latestUserAt
      FROM users
    `).get() as {
      totalUsers: number;
      usersWithEmail: number;
      verifiedUsers: number;
      firstUserAt?: string | null;
      latestUserAt?: string | null;
    };
    const weeklyUserGrowth = db.prepare(`
      WITH RECURSIVE weeks(week_start) AS (
        SELECT date('now', '-6 days', 'weekday 1', '-42 days')
        UNION ALL
        SELECT date(week_start, '+7 days')
        FROM weeks
        WHERE week_start < date('now', '-6 days', 'weekday 1')
      ),
      user_weekly AS (
        SELECT
          date(created_at, '-6 days', 'weekday 1') AS week_start,
          COUNT(*) AS new_users,
          SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS verified_new_users,
          SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 0 ELSE 1 END) AS guest_new_users
        FROM users
        WHERE datetime(created_at) >= datetime('now', '-49 days')
        GROUP BY date(created_at, '-6 days', 'weekday 1')
      )
      SELECT
        weeks.week_start AS weekStart,
        strftime('%Y-W%W', weeks.week_start) AS weekLabel,
        COALESCE(user_weekly.new_users, 0) AS newUsers,
        COALESCE(user_weekly.guest_new_users, 0) AS guestNewUsers,
        COALESCE(user_weekly.verified_new_users, 0) AS verifiedNewUsers
      FROM weeks
      LEFT JOIN user_weekly ON user_weekly.week_start = weeks.week_start
      ORDER BY weeks.week_start DESC
    `).all() as Array<{
      weekStart: string;
      weekLabel: string;
      newUsers: number;
      guestNewUsers: number;
      verifiedNewUsers: number;
    }>;
    const weeklyProductUsage = db.prepare(`
      WITH RECURSIVE weeks(week_start) AS (
        SELECT date('now', '-6 days', 'weekday 1', '-42 days')
        UNION ALL
        SELECT date(week_start, '+7 days')
        FROM weeks
        WHERE week_start < date('now', '-6 days', 'weekday 1')
      ),
      usage_weekly AS (
        SELECT
          date(created_at, '-6 days', 'weekday 1') AS week_start,
          COUNT(*) AS product_events,
          COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND trim(user_id) <> '' THEN user_id END) AS active_keys,
          COUNT(DISTINCT CASE WHEN session_id IS NOT NULL AND trim(session_id) <> '' THEN session_id END) AS sessions,
          SUM(CASE WHEN event_name = 'analyze_completed' THEN 1 ELSE 0 END) AS analyze_completed,
          SUM(CASE WHEN event_name = 'report_viewed' THEN 1 ELSE 0 END) AS report_views,
          SUM(CASE WHEN event_name = 'chat_message_sent' THEN 1 ELSE 0 END) AS chat_messages,
          SUM(CASE WHEN event_name IN ('event_created', 'report_event_saved_from_result', 'report_past_event_saved_from_result', 'chat_event_saved') THEN 1 ELSE 0 END) AS events_created
        FROM analytics_events
        WHERE datetime(created_at) >= datetime('now', '-49 days')
${PRODUCT_ANALYTICS_FILTER_SQL}
        GROUP BY date(created_at, '-6 days', 'weekday 1')
      )
      SELECT
        weeks.week_start AS weekStart,
        strftime('%Y-W%W', weeks.week_start) AS weekLabel,
        COALESCE(usage_weekly.product_events, 0) AS productEvents,
        COALESCE(usage_weekly.active_keys, 0) AS activeKeys,
        COALESCE(usage_weekly.sessions, 0) AS sessions,
        COALESCE(usage_weekly.analyze_completed, 0) AS analyzeCompleted,
        COALESCE(usage_weekly.report_views, 0) AS reportViews,
        COALESCE(usage_weekly.chat_messages, 0) AS chatMessages,
        COALESCE(usage_weekly.events_created, 0) AS eventsCreated
      FROM weeks
      LEFT JOIN usage_weekly ON usage_weekly.week_start = weeks.week_start
      ORDER BY weeks.week_start DESC
    `).all() as Array<{
      weekStart: string;
      weekLabel: string;
      productEvents: number;
      activeKeys: number;
      sessions: number;
      analyzeCompleted: number;
      reportViews: number;
      chatMessages: number;
      eventsCreated: number;
    }>;
    const weeklyDeviceMix = db.prepare(`
      WITH RECURSIVE weeks(week_start) AS (
        SELECT date('now', '-6 days', 'weekday 1', '-42 days')
        UNION ALL
        SELECT date(week_start, '+7 days')
        FROM weeks
        WHERE week_start < date('now', '-6 days', 'weekday 1')
      ),
      product_usage AS (
        SELECT
          date(created_at, '-6 days', 'weekday 1') AS week_start,
          COALESCE(NULLIF(trim(json_extract(meta, '$.deviceType')), ''), 'unknown') AS device_type,
          COUNT(*) AS product_events,
          COUNT(DISTINCT CASE WHEN session_id IS NOT NULL AND trim(session_id) <> '' THEN session_id END) AS sessions
        FROM analytics_events
        WHERE datetime(created_at) >= datetime('now', '-49 days')
${PRODUCT_ANALYTICS_FILTER_SQL}
        GROUP BY date(created_at, '-6 days', 'weekday 1'), COALESCE(NULLIF(trim(json_extract(meta, '$.deviceType')), ''), 'unknown')
      ),
      registrations AS (
        SELECT
          date(a.created_at, '-6 days', 'weekday 1') AS week_start,
          COALESCE(NULLIF(trim(json_extract(a.meta, '$.deviceType')), ''), 'unknown') AS device_type,
          COUNT(*) AS auth_verified_count
        FROM analytics_events a
        WHERE a.event_name = 'auth_verified'
          AND datetime(a.created_at) >= datetime('now', '-49 days')
        GROUP BY date(a.created_at, '-6 days', 'weekday 1'), COALESCE(NULLIF(trim(json_extract(a.meta, '$.deviceType')), ''), 'unknown')
      )
      SELECT
        weeks.week_start AS weekStart,
        strftime('%Y-W%W', weeks.week_start) AS weekLabel,
        device.device_type AS deviceType,
        COALESCE(product_usage.product_events, 0) AS productEvents,
        COALESCE(product_usage.sessions, 0) AS sessions,
        COALESCE(registrations.auth_verified_count, 0) AS verifiedUsers
      FROM weeks
      CROSS JOIN (
        SELECT 'mobile' AS device_type
        UNION ALL SELECT 'desktop'
        UNION ALL SELECT 'tablet'
        UNION ALL SELECT 'bot'
        UNION ALL SELECT 'unknown'
      ) AS device
      LEFT JOIN product_usage
        ON product_usage.week_start = weeks.week_start
       AND product_usage.device_type = device.device_type
      LEFT JOIN registrations
        ON registrations.week_start = weeks.week_start
       AND registrations.device_type = device.device_type
      ORDER BY weeks.week_start DESC,
        CASE device.device_type
          WHEN 'mobile' THEN 0
          WHEN 'desktop' THEN 1
          WHEN 'tablet' THEN 2
          WHEN 'bot' THEN 3
          ELSE 4
        END ASC
    `).all() as Array<{
      weekStart: string;
      weekLabel: string;
      deviceType: string;
      productEvents: number;
      sessions: number;
      verifiedUsers: number;
    }>;
    const recentBehaviorShiftWindow = {
      currentStart: db.prepare(`SELECT date('now', '-3 days') AS value`).get() as { value: string },
      currentEnd: db.prepare(`SELECT date('now') AS value`).get() as { value: string },
      previousStart: db.prepare(`SELECT date('now', '-6 days') AS value`).get() as { value: string },
      previousEnd: db.prepare(`SELECT date('now', '-3 days') AS value`).get() as { value: string },
    };
    const recentDeviceWindowRows = db.prepare(`
      SELECT event_name, page, meta, session_id, created_at
      FROM analytics_events
      WHERE date(created_at) >= date('now', '-6 days')
        AND date(created_at) < date('now')
        AND (
          event_name IN (
            'report_viewed',
            'chat_completed',
            'chat_event_saved',
            'event_created',
            'report_event_saved_from_result',
            'report_past_event_saved_from_result',
            'tool_detail_viewed',
            'tool_run_started',
            'auth_code_requested',
            'auth_verified'
          )
          OR (
            event_name NOT IN (${PRODUCT_ANALYTICS_EXCLUDED_EVENTS_SQL})
            AND COALESCE(page, '') NOT LIKE '%127.0.0.1%'
            AND COALESCE(page, '') NOT LIKE '%localhost%'
          )
        )
    `).all() as RawAnalyticsEventRow[];
    const currentDeviceWindowRows = recentDeviceWindowRows.filter((row) => {
      const createdAt = `${row.created_at || ''}`;
      return createdAt >= recentBehaviorShiftWindow.currentStart.value && createdAt < recentBehaviorShiftWindow.currentEnd.value;
    });
    const previousDeviceWindowRows = recentDeviceWindowRows.filter((row) => {
      const createdAt = `${row.created_at || ''}`;
      return createdAt >= recentBehaviorShiftWindow.previousStart.value && createdAt < recentBehaviorShiftWindow.previousEnd.value;
    });
    const currentDeviceWindowMetrics = buildDeviceWindowMetrics(currentDeviceWindowRows);
    const previousDeviceWindowMetrics = buildDeviceWindowMetrics(previousDeviceWindowRows);
    const currentDeviceMetricMap = new Map(currentDeviceWindowMetrics.map((item) => [item.deviceType, item]));
    const previousDeviceMetricMap = new Map(previousDeviceWindowMetrics.map((item) => [item.deviceType, item]));
    const emptyDeviceMetricMap = new Map(buildDeviceWindowMetrics([]).map((item) => [item.deviceType, item]));
    const currentDeviceCoverage = currentDeviceWindowRows.reduce<DeviceCoverageSnapshot>((accumulator, row) => {
      const deviceType = extractDeviceTypeFromMeta(row.meta);
      accumulator.totalEvents += 1;
      if (deviceType === 'unknown') {
        accumulator.unknownDeviceEvents += 1;
      } else {
        accumulator.knownDeviceEvents += 1;
      }
      return accumulator;
    }, {
      totalEvents: 0,
      knownDeviceEvents: 0,
      unknownDeviceEvents: 0,
      coverageRate: 0,
      sessions: 0,
      knownDeviceSessions: 0,
      unknownDeviceSessions: 0,
      sessionCoverageRate: 0,
    });
    const currentDeviceSessionMap = resolveSessionDeviceTypeMap(currentDeviceWindowRows);
    currentDeviceCoverage.sessions = currentDeviceSessionMap.size;
    currentDeviceCoverage.knownDeviceSessions = Array.from(currentDeviceSessionMap.values())
      .filter((deviceType) => deviceType !== 'unknown')
      .length;
    currentDeviceCoverage.unknownDeviceSessions = currentDeviceCoverage.sessions - currentDeviceCoverage.knownDeviceSessions;
    currentDeviceCoverage.coverageRate = calculatePercentRate(
      currentDeviceCoverage.knownDeviceEvents,
      currentDeviceCoverage.totalEvents
    );
    currentDeviceCoverage.sessionCoverageRate = calculatePercentRate(
      currentDeviceCoverage.knownDeviceSessions,
      currentDeviceCoverage.sessions
    );
    const recentBehaviorShiftByDevice = DEVICE_TYPES.map((deviceType) => {
      const current = currentDeviceMetricMap.get(deviceType) || emptyDeviceMetricMap.get(deviceType)!;
      const previous = previousDeviceMetricMap.get(deviceType) || emptyDeviceMetricMap.get(deviceType)!;
      const productEventsDelta = current.productEvents - previous.productEvents;
      const reportToChatRateDelta = current.reportToChatRate - previous.reportToChatRate;
      const toolToRunRateDelta = current.toolToRunRate - previous.toolToRunRate;
      const authVerifyRateDelta = current.authVerifyRate - previous.authVerifyRate;
      const deltaMagnitude = Math.abs(productEventsDelta) + Math.abs(reportToChatRateDelta) + Math.abs(toolToRunRateDelta) + Math.abs(authVerifyRateDelta);
      const direction = productEventsDelta > 0
        ? 'up'
        : productEventsDelta < 0
          ? 'down'
          : reportToChatRateDelta > 0 || toolToRunRateDelta > 0 || authVerifyRateDelta > 0
            ? 'up'
            : reportToChatRateDelta < 0 || toolToRunRateDelta < 0 || authVerifyRateDelta < 0
              ? 'down'
              : 'flat';

      return {
        deviceType,
        current,
        previous,
        productEventsDelta,
        reportToChatRateDelta,
        toolToRunRateDelta,
        authVerifyRateDelta,
        deltaMagnitude,
        direction,
        sampleState: current.sampleState === 'enough' || previous.sampleState === 'enough'
          ? 'enough'
          : current.sampleState === 'low' || previous.sampleState === 'low'
            ? 'low'
            : 'sparse',
      };
    })
      .filter((item) => item.current.sampleVolume > 0 || item.previous.sampleVolume > 0)
      .sort((left, right) => right.deltaMagnitude - left.deltaMagnitude);
    const deviceFunnelBreakdown = currentDeviceWindowMetrics
      .map((item) => ({
        ...item,
        qualityNote:
          item.sampleState === 'enough'
            ? '设备样本已够，可直接判断这条链路。'
            : item.sampleState === 'low'
              ? '设备样本偏低，先看方向，再继续累积样本。'
              : '当前设备样本太少，先不要据此做大结论。',
      }))
      .filter((item) => item.sampleVolume > 0)
      .sort((left, right) => right.sampleVolume - left.sampleVolume);
    const sourceTrendRows = db.prepare(`
      SELECT event_name, page, meta, session_id, created_at
      FROM analytics_events
      WHERE datetime(created_at) >= datetime('now', '-49 days')
        AND event_name IN (
          'analyze_submitted',
          'report_generated',
          'report_viewed',
          'chat_message_sent',
          'chat_completed',
          'tool_run_started'
        )
        AND COALESCE(page, '') NOT LIKE '%127.0.0.1%'
        AND COALESCE(page, '') NOT LIKE '%localhost%'
      ORDER BY datetime(created_at) ASC
      LIMIT 10000
    `).all() as RawAnalyticsEventRow[];
    const weeklySourceTrend = buildSourceWeeklyTrendRows(sourceTrendRows);
    const recentSourceShift = buildRecentSourceShiftRows(currentDeviceWindowRows, previousDeviceWindowRows);
    const weeklyDeviceEngagement = weeklyDeviceMix.reduce<Record<string, {
      deviceType: string;
      weeksWithData: number;
      productEvents: number;
      sessions: number;
      verifiedUsers: number;
    }>>((accumulator, row) => {
      const deviceType = normalizeDeviceType(row.deviceType);
      if (!accumulator[deviceType]) {
        accumulator[deviceType] = {
          deviceType,
          weeksWithData: 0,
          productEvents: 0,
          sessions: 0,
          verifiedUsers: 0,
        };
      }

      if (row.productEvents > 0 || row.sessions > 0 || row.verifiedUsers > 0) {
        accumulator[deviceType].weeksWithData += 1;
      }
      accumulator[deviceType].productEvents += row.productEvents;
      accumulator[deviceType].sessions += row.sessions;
      accumulator[deviceType].verifiedUsers += row.verifiedUsers;
      return accumulator;
    }, {});
    const deviceMeasurementSummary = {
      currentWindow: currentDeviceCoverage,
      weeklyCoverage: DEVICE_TYPES.map((deviceType) => {
        const item = weeklyDeviceEngagement[deviceType] || {
          deviceType,
          weeksWithData: 0,
          productEvents: 0,
          sessions: 0,
          verifiedUsers: 0,
        };
        return {
          ...item,
          sampleState: item.weeksWithData >= 3 || item.sessions >= 15
            ? 'enough'
            : item.weeksWithData >= 1 || item.sessions >= 5
              ? 'low'
              : 'sparse',
        };
      }),
      note: currentDeviceCoverage.coverageRate >= 60
        ? '最近 3 天设备埋点覆盖已进入可用区间，可以开始判断移动端、桌面端和注册链路差异。'
        : '最近 3 天设备埋点覆盖仍偏低，先把它当成前瞻性监测，不要过度解读历史对比。',
    };
    const dailyProductUsage = db.prepare(`
      WITH RECURSIVE days(day) AS (
        SELECT date('now')
        UNION ALL
        SELECT date(day, '-1 day')
        FROM days
        WHERE day > date('now', '-13 days')
      ),
      usage_daily AS (
        SELECT
          date(created_at) AS day,
          COUNT(*) AS product_events,
          COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND trim(user_id) <> '' THEN user_id END) AS active_keys,
          COUNT(DISTINCT CASE WHEN session_id IS NOT NULL AND trim(session_id) <> '' THEN session_id END) AS sessions,
          SUM(CASE WHEN event_name = 'analyze_completed' THEN 1 ELSE 0 END) AS analyze_completed,
          SUM(CASE WHEN event_name = 'report_viewed' THEN 1 ELSE 0 END) AS report_views,
          SUM(CASE WHEN event_name = 'chat_message_sent' THEN 1 ELSE 0 END) AS chat_messages,
          SUM(CASE WHEN event_name IN ('event_created', 'report_event_saved_from_result', 'report_past_event_saved_from_result', 'chat_event_saved') THEN 1 ELSE 0 END) AS events_created,
          SUM(CASE WHEN event_name = 'auth_code_requested' THEN 1 ELSE 0 END) AS auth_code_requested
        FROM analytics_events
        WHERE datetime(created_at) >= datetime('now', '-14 days')
${PRODUCT_ANALYTICS_FILTER_SQL}
        GROUP BY date(created_at)
      ),
      user_daily AS (
        SELECT
          date(created_at) AS day,
          COUNT(*) AS new_users,
          SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS verified_new_users,
          SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 0 ELSE 1 END) AS guest_new_users
        FROM users
        WHERE datetime(created_at) >= datetime('now', '-14 days')
        GROUP BY date(created_at)
      ),
      auth_daily AS (
        SELECT
          date(created_at) AS day,
          COUNT(*) AS auth_code_requests,
          SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) AS auth_code_used,
          COUNT(DISTINCT email) AS distinct_emails
        FROM auth_codes
        WHERE datetime(created_at) >= datetime('now', '-14 days')
        GROUP BY date(created_at)
      )
      SELECT
        days.day AS day,
        COALESCE(usage_daily.product_events, 0) AS productEvents,
        COALESCE(usage_daily.active_keys, 0) AS activeKeys,
        COALESCE(usage_daily.sessions, 0) AS sessions,
        COALESCE(usage_daily.analyze_completed, 0) AS analyzeCompleted,
        COALESCE(usage_daily.report_views, 0) AS reportViews,
        COALESCE(usage_daily.chat_messages, 0) AS chatMessages,
        COALESCE(usage_daily.events_created, 0) AS eventsCreated,
        COALESCE(usage_daily.auth_code_requested, 0) AS authCodeRequested,
        COALESCE(user_daily.new_users, 0) AS newUsers,
        COALESCE(user_daily.guest_new_users, 0) AS guestNewUsers,
        COALESCE(user_daily.verified_new_users, 0) AS verifiedNewUsers,
        COALESCE(auth_daily.auth_code_requests, 0) AS authCodeRequests,
        COALESCE(auth_daily.auth_code_used, 0) AS authCodeUsed,
        COALESCE(auth_daily.distinct_emails, 0) AS distinctEmails
      FROM days
      LEFT JOIN usage_daily ON usage_daily.day = days.day
      LEFT JOIN user_daily ON user_daily.day = days.day
      LEFT JOIN auth_daily ON auth_daily.day = days.day
      ORDER BY days.day DESC
    `).all() as Array<{
      day: string;
      productEvents: number;
      activeKeys: number;
      sessions: number;
      analyzeCompleted: number;
      reportViews: number;
      chatMessages: number;
      eventsCreated: number;
      authCodeRequested: number;
      newUsers: number;
      guestNewUsers: number;
      verifiedNewUsers: number;
      authCodeRequests: number;
      authCodeUsed: number;
      distinctEmails: number;
    }>;
    const sessionStrengthRaw = db.prepare(`
      SELECT
        COUNT(*) AS core_events,
        COUNT(DISTINCT session_id) AS sessions,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND trim(user_id) <> '' THEN user_id END) AS active_keys
      FROM analytics_events
      WHERE datetime(created_at) >= datetime('now', '-30 days')
${PRODUCT_ANALYTICS_FILTER_SQL}
        AND session_id IS NOT NULL
        AND trim(session_id) <> ''
    `).get() as {
      core_events: number;
      sessions: number;
      active_keys: number;
    };
    const sessionsTableCountRow = db.prepare(`
      SELECT COUNT(*) AS count
      FROM sessions
    `).get() as { count: number };
    const sessionStrength30d = {
      coreEvents: sessionStrengthRaw.core_events,
      sessions: sessionStrengthRaw.sessions,
      activeKeys: sessionStrengthRaw.active_keys,
      eventsPerSession: sessionStrengthRaw.sessions > 0
        ? toRoundedDecimal(sessionStrengthRaw.core_events / sessionStrengthRaw.sessions)
        : 0,
      eventsPerActiveKey: sessionStrengthRaw.active_keys > 0
        ? toRoundedDecimal(sessionStrengthRaw.core_events / sessionStrengthRaw.active_keys)
        : 0,
      sessionTableCount: sessionsTableCountRow.count,
      usingSessionProxy: sessionsTableCountRow.count === 0,
    };
    const recentBehaviorShiftSummary = db.prepare(`
      WITH usage_current AS (
        SELECT
          COUNT(*) AS product_events,
          COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND trim(user_id) <> '' THEN user_id END) AS active_keys,
          COUNT(DISTINCT CASE WHEN session_id IS NOT NULL AND trim(session_id) <> '' THEN session_id END) AS sessions,
          SUM(CASE WHEN event_name = 'analyze_completed' THEN 1 ELSE 0 END) AS analyze_completed,
          SUM(CASE WHEN event_name = 'report_viewed' THEN 1 ELSE 0 END) AS report_views,
          SUM(CASE WHEN event_name = 'chat_message_sent' THEN 1 ELSE 0 END) AS chat_messages,
          SUM(CASE WHEN event_name IN ('event_created', 'report_event_saved_from_result', 'report_past_event_saved_from_result', 'chat_event_saved') THEN 1 ELSE 0 END) AS events_created,
          SUM(CASE WHEN event_name = 'tool_detail_viewed' THEN 1 ELSE 0 END) AS tool_detail_views,
          SUM(CASE WHEN event_name = 'knowledge_article_viewed' THEN 1 ELSE 0 END) AS knowledge_views,
          SUM(CASE WHEN event_name = 'case_article_viewed' THEN 1 ELSE 0 END) AS case_views,
          SUM(CASE WHEN event_name = 'home_page_viewed' THEN 1 ELSE 0 END) AS home_views,
          SUM(CASE WHEN event_name = 'analyze_page_viewed' THEN 1 ELSE 0 END) AS analyze_page_views,
          SUM(CASE WHEN event_name = 'chat_page_viewed' THEN 1 ELSE 0 END) AS chat_page_views,
          SUM(CASE WHEN event_name = 'chat_completed' THEN 1 ELSE 0 END) AS chat_completed,
          SUM(CASE WHEN event_name = 'chat_context_loaded' THEN 1 ELSE 0 END) AS chat_context_loaded,
          SUM(CASE WHEN event_name = 'result_cta_clicked' THEN 1 ELSE 0 END) AS result_cta_clicked,
          SUM(CASE WHEN event_name = 'chat_followup_clicked' THEN 1 ELSE 0 END) AS chat_followup_clicked
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-3 days')
          AND date(created_at) < date('now')
${PRODUCT_ANALYTICS_FILTER_SQL}
      ),
      usage_previous AS (
        SELECT
          COUNT(*) AS product_events,
          COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND trim(user_id) <> '' THEN user_id END) AS active_keys,
          COUNT(DISTINCT CASE WHEN session_id IS NOT NULL AND trim(session_id) <> '' THEN session_id END) AS sessions,
          SUM(CASE WHEN event_name = 'analyze_completed' THEN 1 ELSE 0 END) AS analyze_completed,
          SUM(CASE WHEN event_name = 'report_viewed' THEN 1 ELSE 0 END) AS report_views,
          SUM(CASE WHEN event_name = 'chat_message_sent' THEN 1 ELSE 0 END) AS chat_messages,
          SUM(CASE WHEN event_name IN ('event_created', 'report_event_saved_from_result', 'report_past_event_saved_from_result', 'chat_event_saved') THEN 1 ELSE 0 END) AS events_created,
          SUM(CASE WHEN event_name = 'tool_detail_viewed' THEN 1 ELSE 0 END) AS tool_detail_views,
          SUM(CASE WHEN event_name = 'knowledge_article_viewed' THEN 1 ELSE 0 END) AS knowledge_views,
          SUM(CASE WHEN event_name = 'case_article_viewed' THEN 1 ELSE 0 END) AS case_views,
          SUM(CASE WHEN event_name = 'home_page_viewed' THEN 1 ELSE 0 END) AS home_views,
          SUM(CASE WHEN event_name = 'analyze_page_viewed' THEN 1 ELSE 0 END) AS analyze_page_views,
          SUM(CASE WHEN event_name = 'chat_page_viewed' THEN 1 ELSE 0 END) AS chat_page_views,
          SUM(CASE WHEN event_name = 'chat_completed' THEN 1 ELSE 0 END) AS chat_completed,
          SUM(CASE WHEN event_name = 'chat_context_loaded' THEN 1 ELSE 0 END) AS chat_context_loaded,
          SUM(CASE WHEN event_name = 'result_cta_clicked' THEN 1 ELSE 0 END) AS result_cta_clicked,
          SUM(CASE WHEN event_name = 'chat_followup_clicked' THEN 1 ELSE 0 END) AS chat_followup_clicked
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-6 days')
          AND date(created_at) < date('now', '-3 days')
${PRODUCT_ANALYTICS_FILTER_SQL}
      ),
      users_current AS (
        SELECT
          COUNT(*) AS new_users,
          SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS verified_new_users
        FROM users
        WHERE date(created_at) >= date('now', '-3 days')
          AND date(created_at) < date('now')
      ),
      users_previous AS (
        SELECT
          COUNT(*) AS new_users,
          SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS verified_new_users
        FROM users
        WHERE date(created_at) >= date('now', '-6 days')
          AND date(created_at) < date('now', '-3 days')
      ),
      auth_current AS (
        SELECT
          COUNT(*) AS auth_code_requests,
          SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) AS auth_code_used
        FROM auth_codes
        WHERE date(created_at) >= date('now', '-3 days')
          AND date(created_at) < date('now')
      ),
      auth_previous AS (
        SELECT
          COUNT(*) AS auth_code_requests,
          SUM(CASE WHEN used_at IS NOT NULL THEN 1 ELSE 0 END) AS auth_code_used
        FROM auth_codes
        WHERE date(created_at) >= date('now', '-6 days')
          AND date(created_at) < date('now', '-3 days')
      )
      SELECT
        usage_current.product_events AS currentProductEvents,
        usage_previous.product_events AS previousProductEvents,
        usage_current.active_keys AS currentActiveKeys,
        usage_previous.active_keys AS previousActiveKeys,
        usage_current.sessions AS currentSessions,
        usage_previous.sessions AS previousSessions,
        usage_current.analyze_completed AS currentAnalyzeCompleted,
        usage_previous.analyze_completed AS previousAnalyzeCompleted,
        usage_current.report_views AS currentReportViews,
        usage_previous.report_views AS previousReportViews,
        usage_current.chat_messages AS currentChatMessages,
        usage_previous.chat_messages AS previousChatMessages,
        usage_current.events_created AS currentEventsCreated,
        usage_previous.events_created AS previousEventsCreated,
        usage_current.tool_detail_views AS currentToolDetailViews,
        usage_previous.tool_detail_views AS previousToolDetailViews,
        usage_current.knowledge_views AS currentKnowledgeViews,
        usage_previous.knowledge_views AS previousKnowledgeViews,
        usage_current.case_views AS currentCaseViews,
        usage_previous.case_views AS previousCaseViews,
        usage_current.home_views AS currentHomeViews,
        usage_previous.home_views AS previousHomeViews,
        usage_current.analyze_page_views AS currentAnalyzePageViews,
        usage_previous.analyze_page_views AS previousAnalyzePageViews,
        usage_current.chat_page_views AS currentChatPageViews,
        usage_previous.chat_page_views AS previousChatPageViews,
        usage_current.chat_completed AS currentChatCompleted,
        usage_previous.chat_completed AS previousChatCompleted,
        usage_current.chat_context_loaded AS currentChatContextLoaded,
        usage_previous.chat_context_loaded AS previousChatContextLoaded,
        usage_current.result_cta_clicked AS currentResultCtaClicked,
        usage_previous.result_cta_clicked AS previousResultCtaClicked,
        usage_current.chat_followup_clicked AS currentChatFollowupClicked,
        usage_previous.chat_followup_clicked AS previousChatFollowupClicked,
        users_current.new_users AS currentNewUsers,
        users_previous.new_users AS previousNewUsers,
        users_current.verified_new_users AS currentVerifiedNewUsers,
        users_previous.verified_new_users AS previousVerifiedNewUsers,
        auth_current.auth_code_requests AS currentAuthCodeRequests,
        auth_previous.auth_code_requests AS previousAuthCodeRequests,
        auth_current.auth_code_used AS currentAuthCodeUsed,
        auth_previous.auth_code_used AS previousAuthCodeUsed
      FROM usage_current, usage_previous, users_current, users_previous, auth_current, auth_previous
    `).get() as Record<string, number>;
    const recentBehaviorShiftEvents = db.prepare(`
      WITH current AS (
        SELECT event_name, COUNT(*) AS count
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-3 days')
          AND date(created_at) < date('now')
          AND event_name IN (SELECT column1 FROM (VALUES ${RECENT_BEHAVIOR_TRACKED_EVENTS_SQL}))
        GROUP BY event_name
      ),
      previous AS (
        SELECT event_name, COUNT(*) AS count
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-6 days')
          AND date(created_at) < date('now', '-3 days')
          AND event_name IN (SELECT column1 FROM (VALUES ${RECENT_BEHAVIOR_TRACKED_EVENTS_SQL}))
        GROUP BY event_name
      ),
      tracked(event_name) AS (
        VALUES ${RECENT_BEHAVIOR_TRACKED_EVENTS_SQL}
      )
      SELECT
        tracked.event_name AS eventName,
        COALESCE(current.count, 0) AS currentCount,
        COALESCE(previous.count, 0) AS previousCount
      FROM tracked
      LEFT JOIN current ON current.event_name = tracked.event_name
      LEFT JOIN previous ON previous.event_name = tracked.event_name
      ORDER BY ABS(COALESCE(current.count, 0) - COALESCE(previous.count, 0)) DESC, COALESCE(current.count, 0) DESC
    `).all() as Array<{
      eventName: string;
      currentCount: number;
      previousCount: number;
    }>;
    const recentBehaviorShiftFunnelRaw = db.prepare(`
      WITH current_report_sessions AS (
        SELECT COUNT(DISTINCT session_id) AS report_sessions
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-3 days')
          AND date(created_at) < date('now')
          AND event_name = 'report_viewed'
          AND session_id IS NOT NULL
          AND trim(session_id) <> ''
      ),
      previous_report_sessions AS (
        SELECT COUNT(DISTINCT session_id) AS report_sessions
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-6 days')
          AND date(created_at) < date('now', '-3 days')
          AND event_name = 'report_viewed'
          AND session_id IS NOT NULL
          AND trim(session_id) <> ''
      ),
      current_tool_sessions AS (
        SELECT COUNT(DISTINCT session_id) AS tool_sessions
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-3 days')
          AND date(created_at) < date('now')
          AND event_name = 'tool_detail_viewed'
          AND session_id IS NOT NULL
          AND trim(session_id) <> ''
      ),
      previous_tool_sessions AS (
        SELECT COUNT(DISTINCT session_id) AS tool_sessions
        FROM analytics_events
        WHERE date(created_at) >= date('now', '-6 days')
          AND date(created_at) < date('now', '-3 days')
          AND event_name = 'tool_detail_viewed'
          AND session_id IS NOT NULL
          AND trim(session_id) <> ''
      ),
      current_report_to_chat AS (
        SELECT COUNT(DISTINCT ae.session_id) AS session_count
        FROM analytics_events ae
        WHERE date(ae.created_at) >= date('now', '-3 days')
          AND date(ae.created_at) < date('now')
          AND ae.event_name = 'chat_message_sent'
          AND ae.session_id IN (
            SELECT DISTINCT session_id
            FROM analytics_events
            WHERE date(created_at) >= date('now', '-3 days')
              AND date(created_at) < date('now')
              AND event_name = 'report_viewed'
              AND session_id IS NOT NULL
              AND trim(session_id) <> ''
          )
      ),
      previous_report_to_chat AS (
        SELECT COUNT(DISTINCT ae.session_id) AS session_count
        FROM analytics_events ae
        WHERE date(ae.created_at) >= date('now', '-6 days')
          AND date(ae.created_at) < date('now', '-3 days')
          AND ae.event_name = 'chat_message_sent'
          AND ae.session_id IN (
            SELECT DISTINCT session_id
            FROM analytics_events
            WHERE date(created_at) >= date('now', '-6 days')
              AND date(created_at) < date('now', '-3 days')
              AND event_name = 'report_viewed'
              AND session_id IS NOT NULL
              AND trim(session_id) <> ''
          )
      ),
      current_report_to_event AS (
        SELECT COUNT(DISTINCT ae.session_id) AS session_count
        FROM analytics_events ae
        WHERE date(ae.created_at) >= date('now', '-3 days')
          AND date(ae.created_at) < date('now')
          AND ae.event_name IN ('report_event_saved_from_result', 'report_past_event_saved_from_result', 'event_created')
          AND ae.session_id IN (
            SELECT DISTINCT session_id
            FROM analytics_events
            WHERE date(created_at) >= date('now', '-3 days')
              AND date(created_at) < date('now')
              AND event_name = 'report_viewed'
              AND session_id IS NOT NULL
              AND trim(session_id) <> ''
          )
      ),
      previous_report_to_event AS (
        SELECT COUNT(DISTINCT ae.session_id) AS session_count
        FROM analytics_events ae
        WHERE date(ae.created_at) >= date('now', '-6 days')
          AND date(ae.created_at) < date('now', '-3 days')
          AND ae.event_name IN ('report_event_saved_from_result', 'report_past_event_saved_from_result', 'event_created')
          AND ae.session_id IN (
            SELECT DISTINCT session_id
            FROM analytics_events
            WHERE date(created_at) >= date('now', '-6 days')
              AND date(created_at) < date('now', '-3 days')
              AND event_name = 'report_viewed'
              AND session_id IS NOT NULL
              AND trim(session_id) <> ''
          )
      ),
      current_tool_to_run AS (
        SELECT COUNT(DISTINCT ae.session_id) AS session_count
        FROM analytics_events ae
        WHERE date(ae.created_at) >= date('now', '-3 days')
          AND date(ae.created_at) < date('now')
          AND ae.event_name = 'tool_run_started'
          AND ae.session_id IN (
            SELECT DISTINCT session_id
            FROM analytics_events
            WHERE date(created_at) >= date('now', '-3 days')
              AND date(created_at) < date('now')
              AND event_name = 'tool_detail_viewed'
              AND session_id IS NOT NULL
              AND trim(session_id) <> ''
          )
      ),
      previous_tool_to_run AS (
        SELECT COUNT(DISTINCT ae.session_id) AS session_count
        FROM analytics_events ae
        WHERE date(ae.created_at) >= date('now', '-6 days')
          AND date(ae.created_at) < date('now', '-3 days')
          AND ae.event_name = 'tool_run_started'
          AND ae.session_id IN (
            SELECT DISTINCT session_id
            FROM analytics_events
            WHERE date(created_at) >= date('now', '-6 days')
              AND date(created_at) < date('now', '-3 days')
              AND event_name = 'tool_detail_viewed'
              AND session_id IS NOT NULL
              AND trim(session_id) <> ''
          )
      )
      SELECT
        current_report_sessions.report_sessions AS currentReportSessions,
        previous_report_sessions.report_sessions AS previousReportSessions,
        current_tool_sessions.tool_sessions AS currentToolDetailSessions,
        previous_tool_sessions.tool_sessions AS previousToolDetailSessions,
        current_report_to_chat.session_count AS currentReportToChatSessions,
        previous_report_to_chat.session_count AS previousReportToChatSessions,
        current_report_to_event.session_count AS currentReportToEventSessions,
        previous_report_to_event.session_count AS previousReportToEventSessions,
        current_tool_to_run.session_count AS currentToolToRunSessions,
        previous_tool_to_run.session_count AS previousToolToRunSessions
      FROM current_report_sessions, previous_report_sessions, current_tool_sessions, previous_tool_sessions,
        current_report_to_chat, previous_report_to_chat, current_report_to_event, previous_report_to_event,
        current_tool_to_run, previous_tool_to_run
    `).get() as Record<string, number>;
    const recentBehaviorShiftKeyMetrics = [
      {
        key: 'product_events',
        label: '产品事件',
        currentValue: recentBehaviorShiftSummary.currentProductEvents || 0,
        previousValue: recentBehaviorShiftSummary.previousProductEvents || 0,
      },
      {
        key: 'active_keys',
        label: '活跃键',
        currentValue: recentBehaviorShiftSummary.currentActiveKeys || 0,
        previousValue: recentBehaviorShiftSummary.previousActiveKeys || 0,
      },
      {
        key: 'sessions',
        label: '会话',
        currentValue: recentBehaviorShiftSummary.currentSessions || 0,
        previousValue: recentBehaviorShiftSummary.previousSessions || 0,
      },
      {
        key: 'analyze_completed',
        label: '完成分析',
        currentValue: recentBehaviorShiftSummary.currentAnalyzeCompleted || 0,
        previousValue: recentBehaviorShiftSummary.previousAnalyzeCompleted || 0,
      },
      {
        key: 'report_views',
        label: '结果页查看',
        currentValue: recentBehaviorShiftSummary.currentReportViews || 0,
        previousValue: recentBehaviorShiftSummary.previousReportViews || 0,
      },
      {
        key: 'chat_messages',
        label: '聊天提问',
        currentValue: recentBehaviorShiftSummary.currentChatMessages || 0,
        previousValue: recentBehaviorShiftSummary.previousChatMessages || 0,
      },
      {
        key: 'events_created',
        label: '事件沉淀',
        currentValue: recentBehaviorShiftSummary.currentEventsCreated || 0,
        previousValue: recentBehaviorShiftSummary.previousEventsCreated || 0,
      },
      {
        key: 'tool_detail_views',
        label: '工具详情查看',
        currentValue: recentBehaviorShiftSummary.currentToolDetailViews || 0,
        previousValue: recentBehaviorShiftSummary.previousToolDetailViews || 0,
      },
      {
        key: 'new_users',
        label: '新增用户',
        currentValue: recentBehaviorShiftSummary.currentNewUsers || 0,
        previousValue: recentBehaviorShiftSummary.previousNewUsers || 0,
      },
      {
        key: 'verified_new_users',
        label: '新增已验证用户',
        currentValue: recentBehaviorShiftSummary.currentVerifiedNewUsers || 0,
        previousValue: recentBehaviorShiftSummary.previousVerifiedNewUsers || 0,
      },
      {
        key: 'auth_code_used',
        label: '验证码完成',
        currentValue: recentBehaviorShiftSummary.currentAuthCodeUsed || 0,
        previousValue: recentBehaviorShiftSummary.previousAuthCodeUsed || 0,
      },
    ].map((item) => {
      const delta = item.currentValue - item.previousValue;
      return {
        ...item,
        delta,
        pctChange: item.previousValue > 0 ? toRoundedDecimal((delta * 100) / item.previousValue, 1) : null,
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      };
    });
    const recentBehaviorShiftEventBreakdown = recentBehaviorShiftEvents
      .map((item) => {
        const delta = item.currentCount - item.previousCount;
        return {
          ...item,
          delta,
          pctChange: item.previousCount > 0 ? toRoundedDecimal((delta * 100) / item.previousCount, 1) : null,
          direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
          label: item.eventName,
        };
      });
    const recentBehaviorShiftTopChanges = recentBehaviorShiftEventBreakdown
      .filter((item) => item.delta !== 0)
      .slice(0, 8);
    const recentBehaviorShiftFunnel = [
      {
        key: 'report_to_chat',
        label: '结果页会话 -> 聊天提问',
        currentValue: recentBehaviorShiftFunnelRaw.currentReportToChatSessions || 0,
        previousValue: recentBehaviorShiftFunnelRaw.previousReportToChatSessions || 0,
        currentBase: recentBehaviorShiftFunnelRaw.currentReportSessions || 0,
        previousBase: recentBehaviorShiftFunnelRaw.previousReportSessions || 0,
      },
      {
        key: 'report_to_event',
        label: '结果页会话 -> 事件沉淀',
        currentValue: recentBehaviorShiftFunnelRaw.currentReportToEventSessions || 0,
        previousValue: recentBehaviorShiftFunnelRaw.previousReportToEventSessions || 0,
        currentBase: recentBehaviorShiftFunnelRaw.currentReportSessions || 0,
        previousBase: recentBehaviorShiftFunnelRaw.previousReportSessions || 0,
      },
      {
        key: 'tool_to_run',
        label: '工具详情会话 -> 工具开跑',
        currentValue: recentBehaviorShiftFunnelRaw.currentToolToRunSessions || 0,
        previousValue: recentBehaviorShiftFunnelRaw.previousToolToRunSessions || 0,
        currentBase: recentBehaviorShiftFunnelRaw.currentToolDetailSessions || 0,
        previousBase: recentBehaviorShiftFunnelRaw.previousToolDetailSessions || 0,
      },
    ].map((item) => {
      const currentRate = item.currentBase > 0 ? Math.round((item.currentValue / item.currentBase) * 100) : 0;
      const previousRate = item.previousBase > 0 ? Math.round((item.previousValue / item.previousBase) * 100) : 0;
      return {
        ...item,
        currentRate,
        previousRate,
        rateDelta: currentRate - previousRate,
        direction: currentRate > previousRate ? 'up' : currentRate < previousRate ? 'down' : 'flat',
      };
    });
    const recentBehaviorShiftSignals: string[] = [];
    const recentBehaviorShiftWarnings: string[] = [];

    const productEventsDelta = (recentBehaviorShiftSummary.currentProductEvents || 0) - (recentBehaviorShiftSummary.previousProductEvents || 0);
    if (productEventsDelta < 0) {
      recentBehaviorShiftWarnings.push(`最近 3 个完整自然日产品事件比前 3 天少了 ${Math.abs(productEventsDelta)}，整体活跃在回落。`);
    } else if (productEventsDelta > 0) {
      recentBehaviorShiftSignals.push(`最近 3 个完整自然日产品事件增加了 ${productEventsDelta}，整体使用在回升。`);
    }

    const reportViewsDelta = (recentBehaviorShiftSummary.currentReportViews || 0) - (recentBehaviorShiftSummary.previousReportViews || 0);
    if (reportViewsDelta < 0) {
      recentBehaviorShiftWarnings.push(`结果页查看减少 ${Math.abs(reportViewsDelta)}，核心报告链路在降温。`);
    }

    const chatMessagesDelta = (recentBehaviorShiftSummary.currentChatMessages || 0) - (recentBehaviorShiftSummary.previousChatMessages || 0);
    if (chatMessagesDelta < 0) {
      recentBehaviorShiftWarnings.push(`聊天提问减少 ${Math.abs(chatMessagesDelta)}，报告后的继续提问意愿明显变弱。`);
    }

    const toolDetailDelta = (recentBehaviorShiftSummary.currentToolDetailViews || 0) - (recentBehaviorShiftSummary.previousToolDetailViews || 0);
    if (toolDetailDelta > 0) {
      recentBehaviorShiftSignals.push(`工具详情查看增加 ${toolDetailDelta}，用户对工具探索意愿在上升。`);
    }

    const caseViewsDelta = (recentBehaviorShiftSummary.currentCaseViews || 0) - (recentBehaviorShiftSummary.previousCaseViews || 0);
    if (caseViewsDelta > 0) {
      recentBehaviorShiftSignals.push(`案例内容查看增加 ${caseViewsDelta}，说明案例素材最近更能承接用户注意力。`);
    }

    const verificationDelta = (recentBehaviorShiftSummary.currentVerifiedNewUsers || 0) - (recentBehaviorShiftSummary.previousVerifiedNewUsers || 0);
    if (verificationDelta < 0) {
      recentBehaviorShiftWarnings.push(`新增已验证用户减少 ${Math.abs(verificationDelta)}，注册质量没有跟上新增量。`);
    }

    const reportToChatDelta = recentBehaviorShiftFunnel.find((item) => item.key === 'report_to_chat')?.rateDelta || 0;
    if (reportToChatDelta < 0) {
      recentBehaviorShiftWarnings.push(`结果页到聊天的会话转化下降 ${Math.abs(reportToChatDelta)} 个点，报告页后续动作承接变弱。`);
    }
    const strongestDeviceShift = recentBehaviorShiftByDevice[0];
    if (strongestDeviceShift && strongestDeviceShift.sampleState !== 'sparse') {
      if (strongestDeviceShift.productEventsDelta < 0) {
        recentBehaviorShiftWarnings.push(
          `${mapDeviceTypeLabelForSummary(strongestDeviceShift.deviceType)}近 3 天产品事件减少 ${Math.abs(strongestDeviceShift.productEventsDelta)}，这是最近设备层最明显的回落点。`
        );
      }
      if (strongestDeviceShift.productEventsDelta > 0) {
        recentBehaviorShiftSignals.push(
          `${mapDeviceTypeLabelForSummary(strongestDeviceShift.deviceType)}近 3 天产品事件增加 ${strongestDeviceShift.productEventsDelta}，最近增量主要集中在这端。`
        );
      }
    }

    const recentBehaviorShift = {
      window: {
        currentStart: recentBehaviorShiftWindow.currentStart.value,
        currentEnd: recentBehaviorShiftWindow.currentEnd.value,
        previousStart: recentBehaviorShiftWindow.previousStart.value,
        previousEnd: recentBehaviorShiftWindow.previousEnd.value,
        compareLabel: '最近 3 个完整自然日 vs 前 3 个完整自然日',
      },
      keyMetrics: recentBehaviorShiftKeyMetrics,
      topChanges: recentBehaviorShiftTopChanges,
      funnel: recentBehaviorShiftFunnel,
      byDevice: recentBehaviorShiftByDevice,
      signals: recentBehaviorShiftSignals.slice(0, 4),
      warnings: recentBehaviorShiftWarnings.slice(0, 4),
    };
    const identityContinuityRaw = db.prepare(`
      WITH auth_mappings AS (
        SELECT
          session_id AS guest_session_id,
          user_id AS verified_user_id,
          MIN(created_at) AS first_auth_at
        FROM analytics_events
        WHERE event_name = 'auth_verified'
          AND session_id LIKE 'guest_%'
          AND user_id LIKE 'user_%'
        GROUP BY session_id, user_id
      )
      SELECT
        (SELECT COUNT(*) FROM analytics_events WHERE user_id LIKE 'guest_%') AS guestAnalyticsEvents,
        (SELECT COUNT(*) FROM analytics_events ae LEFT JOIN users u ON ae.user_id = u.id WHERE ae.user_id LIKE 'guest_%' AND u.id IS NULL) AS orphanGuestAnalyticsEvents,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id LIKE 'guest_%' AND EXISTS (
          SELECT 1 FROM auth_mappings am WHERE am.guest_session_id = ae.user_id
        )) AS recoverableGuestAnalyticsEvents,
        (SELECT COUNT(*) FROM auth_mappings) AS authGuestMappings,
        (SELECT COUNT(*) FROM tool_sessions ts LEFT JOIN users u ON ts.user_id = u.id WHERE ts.user_id LIKE 'guest_%' AND u.id IS NULL) AS orphanGuestToolSessions,
        (SELECT COUNT(*) FROM sessions s LEFT JOIN users u ON s.user_id = u.id WHERE s.user_id LIKE 'guest_%' AND u.id IS NULL) AS orphanGuestSessions,
        (SELECT COUNT(*) FROM premium_service_requests r LEFT JOIN users u ON r.user_id = u.id WHERE r.user_id LIKE 'guest_%' AND u.id IS NULL) AS orphanGuestPremiumRequests,
        (SELECT COUNT(*) FROM report_upgrade_jobs r LEFT JOIN users u ON r.user_id = u.id WHERE r.user_id LIKE 'guest_%' AND u.id IS NULL) AS orphanGuestUpgradeJobs
    `).get() as {
      guestAnalyticsEvents: number;
      orphanGuestAnalyticsEvents: number;
      recoverableGuestAnalyticsEvents: number;
      authGuestMappings: number;
      orphanGuestToolSessions: number;
      orphanGuestSessions: number;
      orphanGuestPremiumRequests: number;
      orphanGuestUpgradeJobs: number;
    };
    const identityContinuity = {
      guestAnalyticsEvents: identityContinuityRaw.guestAnalyticsEvents || 0,
      orphanGuestAnalyticsEvents: identityContinuityRaw.orphanGuestAnalyticsEvents || 0,
      recoverableGuestAnalyticsEvents: identityContinuityRaw.recoverableGuestAnalyticsEvents || 0,
      authGuestMappings: identityContinuityRaw.authGuestMappings || 0,
      orphanGuestToolSessions: identityContinuityRaw.orphanGuestToolSessions || 0,
      orphanGuestSessions: identityContinuityRaw.orphanGuestSessions || 0,
      orphanGuestPremiumRequests: identityContinuityRaw.orphanGuestPremiumRequests || 0,
      orphanGuestUpgradeJobs: identityContinuityRaw.orphanGuestUpgradeJobs || 0,
      recoverableRate: (identityContinuityRaw.guestAnalyticsEvents || 0) > 0
        ? Math.round(((identityContinuityRaw.recoverableGuestAnalyticsEvents || 0) / (identityContinuityRaw.guestAnalyticsEvents || 1)) * 100)
        : 0,
    };
    const lifecycleRecallRows = db.prepare(`
      SELECT
        stage_key,
        status,
        report_id,
        meta,
        created_at
      FROM user_lifecycle_email_runs
      WHERE datetime(created_at) >= datetime('now', '-30 days')
      ORDER BY datetime(created_at) DESC
      LIMIT 500
    `).all() as Array<{
      stage_key?: string | null;
      status?: string | null;
      report_id?: string | null;
      meta?: string | null;
      created_at?: string | null;
    }>;
    const lifecycleRecallRowsByStage = lifecycleRecallRows.reduce<Record<string, Array<{
      stage_key?: string | null;
      status?: string | null;
      report_id?: string | null;
      meta?: string | null;
      created_at?: string | null;
    }>>>((accumulator, row) => {
      const stageKey = `${row.stage_key || ''}`.trim();
      if (!stageKey) {
        return accumulator;
      }

      if (!accumulator[stageKey]) {
        accumulator[stageKey] = [];
      }
      accumulator[stageKey].push(row);
      return accumulator;
    }, {});
    const lifecycleReportFollowupRuns = Object.entries(lifecycleRecallRowsByStage)
      .filter(([stageKey]) => stageKey.startsWith('report_day2_no_followup'))
      .flatMap(([, rows]) => rows);
    const lifecycleToolInterestRuns = Object.entries(lifecycleRecallRowsByStage)
      .filter(([stageKey]) => stageKey.startsWith('tool_interest_day1_no_run'))
      .flatMap(([, rows]) => rows);
    const lifecycleReportFollowupReportIds = Array.from(new Set(
      lifecycleReportFollowupRuns
        .map((row) => `${row.report_id || ''}`.trim())
        .filter(Boolean)
    ));
    const lifecycleToolInterestSlugs = Array.from(new Set(
      lifecycleToolInterestRuns
        .map((row) => {
          const stageKey = `${row.stage_key || ''}`.trim();
          const stageMatch = stageKey.match(/^tool_interest_day1_no_run:(.+)$/);
          if (stageMatch?.[1]) {
            return stageMatch[1].trim();
          }
          const meta = parseJson<Record<string, unknown>>(row.meta, {});
          return typeof meta.toolSlug === 'string' ? meta.toolSlug.trim() : '';
        })
        .filter(Boolean)
    ));
    const lifecycleReportChatRows = lifecycleReportFollowupReportIds.length > 0
      ? db.prepare(`
          SELECT event_name, meta, created_at
          FROM analytics_events
          WHERE datetime(created_at) >= datetime('now', '-30 days')
            AND event_name IN ('chat_page_viewed', 'chat_completed', 'chat_event_saved')
            AND json_extract(meta, '$.reportId') IN (${lifecycleReportFollowupReportIds.map(() => '?').join(', ')})
          ORDER BY datetime(created_at) DESC
          LIMIT 1000
        `).all(...lifecycleReportFollowupReportIds) as Array<{
          event_name: string;
          meta?: string | null;
          created_at?: string | null;
        }>
      : [];
    const lifecycleToolRunRows = lifecycleToolInterestSlugs.length > 0
      ? db.prepare(`
          SELECT event_name, meta, created_at
          FROM analytics_events
          WHERE datetime(created_at) >= datetime('now', '-30 days')
            AND event_name IN ('tool_detail_viewed', 'tool_run_started', 'tool_result_viewed')
            AND json_extract(meta, '$.toolSlug') IN (${lifecycleToolInterestSlugs.map(() => '?').join(', ')})
          ORDER BY datetime(created_at) DESC
          LIMIT 1000
        `).all(...lifecycleToolInterestSlugs) as Array<{
          event_name: string;
          meta?: string | null;
          created_at?: string | null;
        }>
      : [];
    const lifecycleReportFollowupBreakdown = lifecycleReportFollowupRuns.reduce<Record<string, {
      key: string;
      reportId: string;
      sent: number;
      errors: number;
      chatPageViews: number;
      chatCompleted: number;
      chatEventsSaved: number;
      latestAt?: string | null;
    }>>((accumulator, row) => {
      const reportId = `${row.report_id || ''}`.trim();
      if (!reportId) {
        return accumulator;
      }

      if (!accumulator[reportId]) {
        accumulator[reportId] = {
          key: reportId,
          reportId,
          sent: 0,
          errors: 0,
          chatPageViews: 0,
          chatCompleted: 0,
          chatEventsSaved: 0,
          latestAt: row.created_at || null,
        };
      }

      if (row.status === 'sent') {
        accumulator[reportId].sent += 1;
      }
      if (row.status === 'error') {
        accumulator[reportId].errors += 1;
      }
      accumulator[reportId].latestAt = row.created_at || accumulator[reportId].latestAt;
      return accumulator;
    }, {});
    const lifecycleReportFollowupSourceBreakdown: Record<string, {
      key: string;
      source: string;
      sent: number;
      errors: number;
      chatPageViews: number;
      chatCompleted: number;
      chatEventsSaved: number;
      latestAt?: string | null;
    }> = {};
    const lifecycleReportFollowupDeviceBreakdown: Record<string, {
      key: string;
      deviceType: string;
      sent: number;
      errors: number;
      chatPageViews: number;
      chatCompleted: number;
      chatEventsSaved: number;
      latestAt?: string | null;
    }> = {};
    for (const row of lifecycleReportFollowupRuns) {
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      const source = typeof meta.lastSource === 'string' && meta.lastSource.trim()
        ? meta.lastSource.trim()
        : 'unknown';
      const deviceType = typeof meta.lastDeviceType === 'string' && meta.lastDeviceType.trim()
        ? meta.lastDeviceType.trim()
        : 'unknown';

      if (!lifecycleReportFollowupSourceBreakdown[source]) {
        lifecycleReportFollowupSourceBreakdown[source] = {
          key: source,
          source,
          sent: 0,
          errors: 0,
          chatPageViews: 0,
          chatCompleted: 0,
          chatEventsSaved: 0,
          latestAt: row.created_at || null,
        };
      }
      if (!lifecycleReportFollowupDeviceBreakdown[deviceType]) {
        lifecycleReportFollowupDeviceBreakdown[deviceType] = {
          key: deviceType,
          deviceType,
          sent: 0,
          errors: 0,
          chatPageViews: 0,
          chatCompleted: 0,
          chatEventsSaved: 0,
          latestAt: row.created_at || null,
        };
      }

      if (row.status === 'sent') {
        lifecycleReportFollowupSourceBreakdown[source].sent += 1;
        lifecycleReportFollowupDeviceBreakdown[deviceType].sent += 1;
      }
      if (row.status === 'error') {
        lifecycleReportFollowupSourceBreakdown[source].errors += 1;
        lifecycleReportFollowupDeviceBreakdown[deviceType].errors += 1;
      }
      lifecycleReportFollowupSourceBreakdown[source].latestAt = row.created_at || lifecycleReportFollowupSourceBreakdown[source].latestAt;
      lifecycleReportFollowupDeviceBreakdown[deviceType].latestAt = row.created_at || lifecycleReportFollowupDeviceBreakdown[deviceType].latestAt;
    }
    for (const row of lifecycleReportChatRows) {
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      const source = typeof meta.source === 'string' ? meta.source : '';
      const reportId = typeof meta.reportId === 'string' ? meta.reportId.trim() : '';
      if (!reportId || !source.startsWith('lifecycle_report_followup')) {
        continue;
      }
      const lifecycleSource = source.replace(/^lifecycle_report_followup:?/, '').trim() || 'unknown';
      const deviceType = typeof meta.deviceType === 'string' && meta.deviceType.trim()
        ? meta.deviceType.trim()
        : 'unknown';
      if (!lifecycleReportFollowupBreakdown[reportId]) {
        lifecycleReportFollowupBreakdown[reportId] = {
          key: reportId,
          reportId,
          sent: 0,
          errors: 0,
          chatPageViews: 0,
          chatCompleted: 0,
          chatEventsSaved: 0,
          latestAt: row.created_at || null,
        };
      }
      if (!lifecycleReportFollowupSourceBreakdown[lifecycleSource]) {
        lifecycleReportFollowupSourceBreakdown[lifecycleSource] = {
          key: lifecycleSource,
          source: lifecycleSource,
          sent: 0,
          errors: 0,
          chatPageViews: 0,
          chatCompleted: 0,
          chatEventsSaved: 0,
          latestAt: row.created_at || null,
        };
      }
      if (!lifecycleReportFollowupDeviceBreakdown[deviceType]) {
        lifecycleReportFollowupDeviceBreakdown[deviceType] = {
          key: deviceType,
          deviceType,
          sent: 0,
          errors: 0,
          chatPageViews: 0,
          chatCompleted: 0,
          chatEventsSaved: 0,
          latestAt: row.created_at || null,
        };
      }

      if (row.event_name === 'chat_page_viewed') {
        lifecycleReportFollowupBreakdown[reportId].chatPageViews += 1;
        lifecycleReportFollowupSourceBreakdown[lifecycleSource].chatPageViews += 1;
        lifecycleReportFollowupDeviceBreakdown[deviceType].chatPageViews += 1;
      }
      if (row.event_name === 'chat_completed') {
        lifecycleReportFollowupBreakdown[reportId].chatCompleted += 1;
        lifecycleReportFollowupSourceBreakdown[lifecycleSource].chatCompleted += 1;
        lifecycleReportFollowupDeviceBreakdown[deviceType].chatCompleted += 1;
      }
      if (row.event_name === 'chat_event_saved') {
        lifecycleReportFollowupBreakdown[reportId].chatEventsSaved += 1;
        lifecycleReportFollowupSourceBreakdown[lifecycleSource].chatEventsSaved += 1;
        lifecycleReportFollowupDeviceBreakdown[deviceType].chatEventsSaved += 1;
      }
      lifecycleReportFollowupBreakdown[reportId].latestAt = row.created_at || lifecycleReportFollowupBreakdown[reportId].latestAt;
      lifecycleReportFollowupSourceBreakdown[lifecycleSource].latestAt = row.created_at || lifecycleReportFollowupSourceBreakdown[lifecycleSource].latestAt;
      lifecycleReportFollowupDeviceBreakdown[deviceType].latestAt = row.created_at || lifecycleReportFollowupDeviceBreakdown[deviceType].latestAt;
    }
    const lifecycleToolInterestBreakdown = lifecycleToolInterestRuns.reduce<Record<string, {
      key: string;
      toolSlug: string;
      sent: number;
      errors: number;
      detailViews: number;
      runStarts: number;
      resultViews: number;
      latestAt?: string | null;
    }>>((accumulator, row) => {
      const stageKey = `${row.stage_key || ''}`.trim();
      const stageMatch = stageKey.match(/^tool_interest_day1_no_run:(.+)$/);
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      const toolSlug = `${stageMatch?.[1] || (typeof meta.toolSlug === 'string' ? meta.toolSlug : '')}`.trim();
      if (!toolSlug) {
        return accumulator;
      }

      if (!accumulator[toolSlug]) {
        accumulator[toolSlug] = {
          key: toolSlug,
          toolSlug,
          sent: 0,
          errors: 0,
          detailViews: 0,
          runStarts: 0,
          resultViews: 0,
          latestAt: row.created_at || null,
        };
      }

      if (row.status === 'sent') {
        accumulator[toolSlug].sent += 1;
      }
      if (row.status === 'error') {
        accumulator[toolSlug].errors += 1;
      }
      accumulator[toolSlug].latestAt = row.created_at || accumulator[toolSlug].latestAt;
      return accumulator;
    }, {});
    const lifecycleToolInterestSourceBreakdown: Record<string, {
      key: string;
      source: string;
      sent: number;
      errors: number;
      detailViews: number;
      runStarts: number;
      resultViews: number;
      latestAt?: string | null;
    }> = {};
    const lifecycleToolInterestDeviceBreakdown: Record<string, {
      key: string;
      deviceType: string;
      sent: number;
      errors: number;
      detailViews: number;
      runStarts: number;
      resultViews: number;
      latestAt?: string | null;
    }> = {};
    for (const row of lifecycleToolInterestRuns) {
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      const source = typeof meta.lastSource === 'string' && meta.lastSource.trim()
        ? meta.lastSource.trim()
        : 'unknown';
      const deviceType = typeof meta.lastDeviceType === 'string' && meta.lastDeviceType.trim()
        ? meta.lastDeviceType.trim()
        : 'unknown';

      if (!lifecycleToolInterestSourceBreakdown[source]) {
        lifecycleToolInterestSourceBreakdown[source] = {
          key: source,
          source,
          sent: 0,
          errors: 0,
          detailViews: 0,
          runStarts: 0,
          resultViews: 0,
          latestAt: row.created_at || null,
        };
      }
      if (!lifecycleToolInterestDeviceBreakdown[deviceType]) {
        lifecycleToolInterestDeviceBreakdown[deviceType] = {
          key: deviceType,
          deviceType,
          sent: 0,
          errors: 0,
          detailViews: 0,
          runStarts: 0,
          resultViews: 0,
          latestAt: row.created_at || null,
        };
      }

      if (row.status === 'sent') {
        lifecycleToolInterestSourceBreakdown[source].sent += 1;
        lifecycleToolInterestDeviceBreakdown[deviceType].sent += 1;
      }
      if (row.status === 'error') {
        lifecycleToolInterestSourceBreakdown[source].errors += 1;
        lifecycleToolInterestDeviceBreakdown[deviceType].errors += 1;
      }
      lifecycleToolInterestSourceBreakdown[source].latestAt = row.created_at || lifecycleToolInterestSourceBreakdown[source].latestAt;
      lifecycleToolInterestDeviceBreakdown[deviceType].latestAt = row.created_at || lifecycleToolInterestDeviceBreakdown[deviceType].latestAt;
    }
    for (const row of lifecycleToolRunRows) {
      const meta = parseJson<Record<string, unknown>>(row.meta, {});
      const toolSlug = typeof meta.toolSlug === 'string' ? meta.toolSlug.trim() : '';
      const attribution = meta.attribution && typeof meta.attribution === 'object' ? meta.attribution as Record<string, unknown> : {};
      const source = typeof meta.source === 'string'
        ? meta.source
        : typeof attribution.source === 'string'
          ? attribution.source
          : '';
      if (!toolSlug || !source.startsWith('lifecycle_tool_interest')) {
        continue;
      }
      const lifecycleSource = source.replace(/^lifecycle_tool_interest:?/, '').trim() || 'unknown';
      const deviceType = typeof meta.deviceType === 'string' && meta.deviceType.trim()
        ? meta.deviceType.trim()
        : 'unknown';
      if (!lifecycleToolInterestBreakdown[toolSlug]) {
        lifecycleToolInterestBreakdown[toolSlug] = {
          key: toolSlug,
          toolSlug,
          sent: 0,
          errors: 0,
          detailViews: 0,
          runStarts: 0,
          resultViews: 0,
          latestAt: row.created_at || null,
        };
      }
      if (!lifecycleToolInterestSourceBreakdown[lifecycleSource]) {
        lifecycleToolInterestSourceBreakdown[lifecycleSource] = {
          key: lifecycleSource,
          source: lifecycleSource,
          sent: 0,
          errors: 0,
          detailViews: 0,
          runStarts: 0,
          resultViews: 0,
          latestAt: row.created_at || null,
        };
      }
      if (!lifecycleToolInterestDeviceBreakdown[deviceType]) {
        lifecycleToolInterestDeviceBreakdown[deviceType] = {
          key: deviceType,
          deviceType,
          sent: 0,
          errors: 0,
          detailViews: 0,
          runStarts: 0,
          resultViews: 0,
          latestAt: row.created_at || null,
        };
      }

      if (row.event_name === 'tool_detail_viewed') {
        lifecycleToolInterestBreakdown[toolSlug].detailViews += 1;
        lifecycleToolInterestSourceBreakdown[lifecycleSource].detailViews += 1;
        lifecycleToolInterestDeviceBreakdown[deviceType].detailViews += 1;
      }
      if (row.event_name === 'tool_run_started') {
        lifecycleToolInterestBreakdown[toolSlug].runStarts += 1;
        lifecycleToolInterestSourceBreakdown[lifecycleSource].runStarts += 1;
        lifecycleToolInterestDeviceBreakdown[deviceType].runStarts += 1;
      }
      if (row.event_name === 'tool_result_viewed') {
        lifecycleToolInterestBreakdown[toolSlug].resultViews += 1;
        lifecycleToolInterestSourceBreakdown[lifecycleSource].resultViews += 1;
        lifecycleToolInterestDeviceBreakdown[deviceType].resultViews += 1;
      }
      lifecycleToolInterestBreakdown[toolSlug].latestAt = row.created_at || lifecycleToolInterestBreakdown[toolSlug].latestAt;
      lifecycleToolInterestSourceBreakdown[lifecycleSource].latestAt = row.created_at || lifecycleToolInterestSourceBreakdown[lifecycleSource].latestAt;
      lifecycleToolInterestDeviceBreakdown[deviceType].latestAt = row.created_at || lifecycleToolInterestDeviceBreakdown[deviceType].latestAt;
    }
    const lifecycleRecall = {
      reportFollowup: Object.values(lifecycleReportFollowupBreakdown)
        .map((item) => ({
          ...item,
          chatPageViewRate: item.sent > 0 ? Math.round((item.chatPageViews / item.sent) * 100) : 0,
          chatCompletionRate: item.chatPageViews > 0 ? Math.round((item.chatCompleted / item.chatPageViews) * 100) : 0,
          chatToEventRate: item.chatCompleted > 0 ? Math.round((item.chatEventsSaved / item.chatCompleted) * 100) : 0,
        }))
        .sort((left, right) => right.chatCompleted - left.chatCompleted || right.sent - left.sent)
        .slice(0, 10),
      toolInterest: Object.values(lifecycleToolInterestBreakdown)
        .map((item) => ({
          ...item,
          detailToRunRate: item.detailViews > 0 ? Math.round((item.runStarts / item.detailViews) * 100) : 0,
          sentToRunRate: item.sent > 0 ? Math.round((item.runStarts / item.sent) * 100) : 0,
          runToResultRate: item.runStarts > 0 ? Math.round((item.resultViews / item.runStarts) * 100) : 0,
        }))
        .sort((left, right) => right.runStarts - left.runStarts || right.sent - left.sent)
        .slice(0, 10),
      reportFollowupBySource: Object.values(lifecycleReportFollowupSourceBreakdown)
        .map((item) => ({
          ...item,
          chatPageViewRate: item.sent > 0 ? Math.round((item.chatPageViews / item.sent) * 100) : 0,
          chatCompletionRate: item.chatPageViews > 0 ? Math.round((item.chatCompleted / item.chatPageViews) * 100) : 0,
          chatToEventRate: item.chatCompleted > 0 ? Math.round((item.chatEventsSaved / item.chatCompleted) * 100) : 0,
        }))
        .sort((left, right) => right.chatCompleted - left.chatCompleted || right.sent - left.sent)
        .slice(0, 10),
      reportFollowupByDevice: Object.values(lifecycleReportFollowupDeviceBreakdown)
        .map((item) => ({
          ...item,
          chatPageViewRate: item.sent > 0 ? Math.round((item.chatPageViews / item.sent) * 100) : 0,
          chatCompletionRate: item.chatPageViews > 0 ? Math.round((item.chatCompleted / item.chatPageViews) * 100) : 0,
          chatToEventRate: item.chatCompleted > 0 ? Math.round((item.chatEventsSaved / item.chatCompleted) * 100) : 0,
        }))
        .sort((left, right) => right.chatCompleted - left.chatCompleted || right.sent - left.sent)
        .slice(0, 10),
      toolInterestBySource: Object.values(lifecycleToolInterestSourceBreakdown)
        .map((item) => ({
          ...item,
          detailToRunRate: item.detailViews > 0 ? Math.round((item.runStarts / item.detailViews) * 100) : 0,
          sentToRunRate: item.sent > 0 ? Math.round((item.runStarts / item.sent) * 100) : 0,
          runToResultRate: item.runStarts > 0 ? Math.round((item.resultViews / item.runStarts) * 100) : 0,
        }))
        .sort((left, right) => right.runStarts - left.runStarts || right.sent - left.sent)
        .slice(0, 10),
      toolInterestByDevice: Object.values(lifecycleToolInterestDeviceBreakdown)
        .map((item) => ({
          ...item,
          detailToRunRate: item.detailViews > 0 ? Math.round((item.runStarts / item.detailViews) * 100) : 0,
          sentToRunRate: item.sent > 0 ? Math.round((item.runStarts / item.sent) * 100) : 0,
          runToResultRate: item.runStarts > 0 ? Math.round((item.resultViews / item.runStarts) * 100) : 0,
        }))
        .sort((left, right) => right.runStarts - left.runStarts || right.sent - left.sent)
        .slice(0, 10),
    };
    const sourceFunnelRows = db.prepare(`
      SELECT event_name, page, meta, session_id, created_at
      FROM analytics_events
      WHERE datetime(created_at) >= datetime('now', '-30 days')
        AND event_name IN (
          'analyze_submitted',
          'report_generated',
          'report_viewed',
          'chat_message_sent',
          'chat_completed',
          'tool_run_started',
          'tool_result_viewed'
        )
        AND COALESCE(page, '') NOT LIKE '%127.0.0.1%'
        AND COALESCE(page, '') NOT LIKE '%localhost%'
      ORDER BY datetime(created_at) ASC
      LIMIT 6000
    `).all() as RawAnalyticsEventRow[];
    const sourceFunnel = buildSourceFunnelRows(sourceFunnelRows);
    const totalPageViews = Object.values(pageViewBuckets).reduce((sum, item) => sum + item.count, 0);
    const totalAnalyzeSubmissions = journeyCounts.analyze_submitted.count || 0;
    const totalChatActions = Object.values(chatActionBuckets).reduce((sum, item) => sum + item.count, 0);
    const totalReasoningModeCount = Object.values(reasoningModeBuckets).reduce((sum, item) => sum + item.count, 0);
    const emailRetryRows = emailDeliveryJobOperations.listRecent(50, 'all');
    const emailRetryQueue = emailRetryRows.reduce<{
      pending: number;
      running: number;
      sent: number;
      failed: number;
      cancelled: number;
    }>((accumulator, item) => {
      accumulator[item.status] += 1;
      return accumulator;
    }, {
      pending: 0,
      running: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
    });
    const recentPremiumRequests = premiumServiceRequestOperations.listRecent({ limit: 6, status: 'all' });
    const premiumServiceStatus = premiumServiceRequestOperations.countByStatus();
    const authRequested = journeyCounts.auth_code_requested.count || 0;
    const authVerified = journeyCounts.auth_verified.count || 0;
    const reportGenerated = journeyCounts.report_generated.count || 0;
    const reportViewed = journeyCounts.report_viewed.count || 0;
    const chatAsked = journeyCounts.chat_message_sent.count || 0;
    const premiumRequested = analyticsRows.filter((item) => item.event_name === 'premium_service_requested').length;
    const funnelDiagnostics = [
      {
        key: 'analyze_to_report',
        label: '提交测算 -> 成功出报告',
        from: totalAnalyzeSubmissions,
        to: reportGenerated,
      },
      {
        key: 'report_to_view',
        label: '报告生成 -> 打开结果页',
        from: reportGenerated,
        to: reportViewed,
      },
      {
        key: 'view_to_chat',
        label: '结果页查看 -> 继续聊天',
        from: reportViewed,
        to: chatAsked,
      },
      {
        key: 'auth_request_to_verify',
        label: '请求验证码 -> 完成验证',
        from: authRequested,
        to: authVerified,
      },
      {
        key: 'view_to_premium',
        label: '结果页查看 -> 提交专项需求',
        from: reportViewed,
        to: premiumRequested,
      },
    ].map((item) => ({
      ...item,
      conversionRate: item.from > 0 ? Math.round((item.to / item.from) * 100) : 0,
      dropOff: Math.max(0, item.from - item.to),
      severity: item.from === 0
        ? 'neutral'
        : item.to === 0 || Math.round((item.to / item.from) * 100) < 20
          ? 'critical'
          : Math.round((item.to / item.from) * 100) < 50
            ? 'warning'
            : 'healthy',
    }));
    const modelHealthBreakdown = Object.values(llmModelBuckets)
      .map((item) => {
        const lastStateChangedAtMs = item.lastStateChangedAt ? new Date(item.lastStateChangedAt).getTime() : Number.NaN;
        const reopenAtMs = item.reopenAt ? new Date(item.reopenAt).getTime() : Number.NaN;
        const openDurationMinutes = Number.isFinite(lastStateChangedAtMs)
          && (item.currentState === 'open' || item.currentState === 'half-open')
          ? Math.max(0, Math.round((nowTime - lastStateChangedAtMs) / 60000))
          : 0;
        const reopenOverdue = item.currentState === 'open' && Number.isFinite(reopenAtMs) ? reopenAtMs <= nowTime : false;

        return {
          model: item.model,
          attempts: item.attempts,
          successes: item.successes,
          failures: item.failures,
          successRate: item.attempts > 0 ? Math.round((item.successes / item.attempts) * 100) : 0,
          avgLatencyMs: item.attempts > 0 ? Math.round(item.totalLatencyMs / item.attempts) : 0,
          currentState: item.currentState,
          reopenAt: item.reopenAt,
          lastStateChangedAt: item.lastStateChangedAt,
          openDurationMinutes,
          reopenOverdue,
          scopes: item.scopes,
        };
      })
      .sort((left, right) => right.attempts - left.attempts);
    const totalModelAttempts = modelHealthBreakdown.reduce((sum, item) => sum + item.attempts, 0);
    const totalModelSuccesses = modelHealthBreakdown.reduce((sum, item) => sum + item.successes, 0);
    const totalModelFailures = modelHealthBreakdown.reduce((sum, item) => sum + item.failures, 0);
    const totalModelSuccessRate = totalModelAttempts > 0 ? Math.round((totalModelSuccesses / totalModelAttempts) * 100) : 0;
    const routeHealthBreakdown = Object.values(routeHealthBuckets)
      .map((item) => {
        const total = item.success + item.failed;
        return {
          key: item.key,
          label: item.label,
          success: item.success,
          failed: item.failed,
          fallbackCount: item.fallbacks,
          total,
          successRate: total > 0 ? Math.round((item.success / total) * 100) : 0,
          fallbackRate: item.success > 0 ? Math.round((item.fallbacks / item.success) * 100) : 0,
          avgDurationMs: total > 0 ? Math.round(item.totalDurationMs / total) : 0,
          maxDurationMs: item.maxDurationMs,
          lastSeenAt: item.lastSeenAt,
        };
      })
      .sort((left, right) => right.failed - left.failed || right.avgDurationMs - left.avgDurationMs);
    const openModelCount = modelHealthBreakdown.filter((item) => item.currentState === 'open').length;
    const halfOpenModelCount = modelHealthBreakdown.filter((item) => item.currentState === 'half-open').length;
    const overdueCircuitCount = modelHealthBreakdown.filter((item) => item.reopenOverdue).length;
    const recentLlmSuccessRate = recentLlmAttempts > 0 ? Math.round((recentLlmSuccesses / recentLlmAttempts) * 100) : 0;
    const pendingEmailQueue = emailRetryQueue.pending + emailRetryQueue.running;
    const failedEmailQueue = emailRetryQueue.failed;
    const feedbackBacklog = pendingValidationBuckets.overdue + pendingValidationBuckets.driftNeedsNotes + pendingValidationBuckets.driftReadyForCorrection;
    const worstFunnel = funnelDiagnostics
      .filter((item) => item.from > 0)
      .sort((left, right) => left.conversionRate - right.conversionRate)[0];
    const weakestRoute = routeHealthBreakdown
      .filter((item) => item.total > 0)
      .sort((left, right) => left.successRate - right.successRate || right.failed - left.failed)[0];
    const primaryBlockers: string[] = [];
    const healthySignals: string[] = [];

    if (recentLlmAttempts > 0 && recentLlmSuccessRate < 20) {
      primaryBlockers.push(`近 24 小时模型成功率仅 ${recentLlmSuccessRate}%，当前主要故障集中在模型供应链。`);
    } else if (openModelCount > 0 || halfOpenModelCount > 0) {
      primaryBlockers.push(`当前仍有 ${openModelCount} 个模型熔断、${halfOpenModelCount} 个模型处于半开探测。`);
    } else if (totalModelAttempts > 0 && totalModelSuccessRate < 70) {
      primaryBlockers.push(`模型总成功率 ${totalModelSuccessRate}% ，仍未达到稳定交付区间。`);
    } else {
      healthySignals.push('模型链路目前没有明显的熔断阻塞。');
    }

    if (worstFunnel && worstFunnel.conversionRate < 35) {
      primaryBlockers.push(`${worstFunnel.label} 转化仅 ${worstFunnel.conversionRate}% ，存在明显用户流失。`);
    } else if (worstFunnel) {
      healthySignals.push(`当前最弱漏斗是“${worstFunnel.label}”，转化 ${worstFunnel.conversionRate}%。`);
    }

    if (weakestRoute && weakestRoute.successRate < 85) {
      primaryBlockers.push(`${weakestRoute.label} 成功率仅 ${weakestRoute.successRate}% ，平均耗时 ${weakestRoute.avgDurationMs}ms。`);
    } else if (weakestRoute) {
      healthySignals.push(`${weakestRoute.label} 当前成功率 ${weakestRoute.successRate}% 。`);
    }

    if (feedbackBacklog > 0) {
      primaryBlockers.push(`还有 ${feedbackBacklog} 条验证/纠偏待处理，真实反馈闭环还不够快。`);
    } else {
      healthySignals.push('验证闭环队列当前可控。');
    }

    if (failedEmailQueue > 0 || pendingEmailQueue > 3) {
      primaryBlockers.push(`邮件重试队列仍有 ${pendingEmailQueue} 条待处理，另有 ${failedEmailQueue} 条最终失败。`);
    } else {
      healthySignals.push('邮件投递链路当前没有明显积压。');
    }

    const systemHealthSeverity = primaryBlockers.length === 0
      ? 'healthy'
      : (recentLlmAttempts > 0 && recentLlmSuccessRate < 20)
          || overdueCircuitCount > 0
          || (worstFunnel ? worstFunnel.conversionRate < 20 : false)
        ? 'critical'
        : 'warning';
    const systemHealth = {
      severity: systemHealthSeverity,
      title: systemHealthSeverity === 'critical'
        ? '当前系统存在明确阻塞，优先看模型链路与核心漏斗'
        : systemHealthSeverity === 'warning'
          ? '当前系统可运行，但有若干卡点正在拖慢体验与转化'
          : '当前系统整体健康，主要链路可闭环运行',
      summary: systemHealthSeverity === 'critical'
        ? '页面本身不是主问题，最可能影响用户体感的是模型请求失败、熔断恢复不及时，以及关键漏斗转化偏低。'
        : systemHealthSeverity === 'warning'
          ? '系统可继续跑，但已经出现局部故障或明显流失，需要针对性压降失败率和回收反馈。'
          : '模型、邮件、反馈和转化链路目前都没有明显硬阻塞，可以继续观察用户行为细节。',
      updatedAt: analyticsRows[0]?.created_at || null,
      blockers: primaryBlockers.slice(0, 4),
      healthySignals: healthySignals.slice(0, 4),
      cards: [
        {
          key: 'llm',
          label: '模型链路',
          value: `${totalModelSuccessRate}%`,
          helper: totalModelAttempts > 0
            ? `${totalModelAttempts} 次请求，失败 ${totalModelFailures} 次，熔断 ${openModelCount} 个`
            : '还没有模型调用数据',
          tone: recentLlmAttempts > 0 && recentLlmSuccessRate < 20 ? 'critical' : openModelCount > 0 || halfOpenModelCount > 0 ? 'warning' : 'healthy',
        },
        {
          key: 'funnel',
          label: '最弱漏斗',
          value: worstFunnel ? `${worstFunnel.conversionRate}%` : '-',
          helper: worstFunnel ? `${worstFunnel.label}，流失 ${worstFunnel.dropOff}` : '还没有足够的漏斗数据',
          tone: worstFunnel ? (worstFunnel.conversionRate < 20 ? 'critical' : worstFunnel.conversionRate < 50 ? 'warning' : 'healthy') : 'neutral',
        },
        {
          key: 'feedback',
          label: '反馈积压',
          value: `${feedbackBacklog}`,
          helper: `待验证 ${pendingValidationBuckets.overdue}，待备注 ${pendingValidationBuckets.driftNeedsNotes}，待纠偏 ${pendingValidationBuckets.driftReadyForCorrection}`,
          tone: feedbackBacklog > 12 ? 'critical' : feedbackBacklog > 0 ? 'warning' : 'healthy',
        },
        {
          key: 'email',
          label: '邮件队列',
          value: `${pendingEmailQueue}/${failedEmailQueue}`,
          helper: `待处理 ${pendingEmailQueue}，最终失败 ${failedEmailQueue}`,
          tone: failedEmailQueue > 0 ? 'critical' : pendingEmailQueue > 3 ? 'warning' : 'healthy',
        },
        {
          key: 'route',
          label: '接口健康',
          value: weakestRoute ? `${weakestRoute.successRate}%` : '-',
          helper: weakestRoute ? `${weakestRoute.label}，失败 ${weakestRoute.failed}，降级 ${weakestRoute.fallbackCount}` : '还没有接口健康样本',
          tone: weakestRoute ? (weakestRoute.successRate < 85 ? 'warning' : 'healthy') : 'neutral',
        },
      ],
      llmSnapshot: {
        attempts24h: recentLlmAttempts,
        successRate24h: recentLlmSuccessRate,
        openModelCount,
        halfOpenModelCount,
        overdueCircuitCount,
      },
    };

    return {
      totals: {
        ...totals,
        validation_accurate: validationAccurate,
        validation_drift: validationDrift,
        validation_pending: validationPending,
        result_report_linked_events: resultReportLinked,
        chat_sourced_events: chatSourcedEvents,
      },
      sourceBreakdown: Object.values(sourceBuckets)
        .map((item) => ({
          ...item,
          accuracyRate: item.accurate + item.drift > 0 ? Math.round((item.accurate / (item.accurate + item.drift)) * 100) : 0,
        }))
        .sort((left, right) => right.total - left.total),
      driftReasonBreakdown: Object.values(driftReasonBuckets)
        .map((item) => ({
          ...item,
          share: validationDrift > 0 ? Math.round((item.count / validationDrift) * 100) : 0,
        }))
        .sort((left, right) => right.count - left.count),
      pendingValidationBuckets,
      followupQueue: followupQueue
        .sort((left, right) => right.priorityScore - left.priorityScore || left.date.localeCompare(right.date))
        .slice(0, 8)
        .map(({ priorityScore, ...item }) => item),
      reportVersionBreakdown: reportVersionRows.map((item) => ({
        version: item.report_version || 'v1',
        count: item.count,
        share: totals.total_analyses > 0 ? Math.round((item.count / totals.total_analyses) * 100) : 0,
      })),
      pageViewBreakdown: Object.values(pageViewBuckets)
        .map((item) => ({
          ...item,
          share: totalPageViews > 0 ? Math.round((item.count / totalPageViews) * 100) : 0,
        }))
        .sort((left, right) => right.count - left.count),
      ctaBreakdown: Object.values(ctaBuckets)
        .sort((left, right) => right.count - left.count),
      ctaStrategyBreakdown: Object.values(ctaStrategyBuckets)
        .map((item) => ({
          ...item,
          clickToChatRate: item.clicks > 0 ? Math.round((item.chatPageViews / item.clicks) * 100) : 0,
          chatCompletionRate: item.chatPageViews > 0 ? Math.round((item.chatCompleted / item.chatPageViews) * 100) : 0,
        }))
        .sort((left, right) => (right.chatCompleted + right.toolCardClicks + right.contentCardClicks) - (left.chatCompleted + left.toolCardClicks + left.contentCardClicks))
        .slice(0, 12),
      chatActionBreakdown: Object.values(chatActionBuckets)
        .map((item) => ({
          ...item,
          share: totalChatActions > 0 ? Math.round((item.count / totalChatActions) * 100) : 0,
        }))
        .sort((left, right) => right.count - left.count),
      analyzeOptionBreakdown: Object.values(analyzeOptionBuckets)
        .map((item) => ({
          ...item,
          share: totalAnalyzeSubmissions > 0 ? Math.round((item.count / totalAnalyzeSubmissions) * 100) : 0,
        }))
        .sort((left, right) => right.count - left.count),
      reasoningModeBreakdown: Object.values(reasoningModeBuckets)
        .map((item) => ({
          ...item,
          share: totalReasoningModeCount > 0 ? Math.round((item.count / totalReasoningModeCount) * 100) : 0,
        }))
        .sort((left, right) => right.count - left.count),
      modelHealthBreakdown,
      llmFailureHotspots: Object.values(llmFailureHotspots)
        .sort((left, right) => right.count - left.count || right.avgLatencyMs - left.avgLatencyMs)
        .slice(0, 10),
      routeHealthBreakdown,
      requestFailureHotspots: Object.values(requestFailureHotspots)
        .sort((left, right) => right.count - left.count)
        .slice(0, 10),
      emailRetryQueue,
      recentEmailRetryJobs: emailRetryRows.slice(0, 8),
      premiumServiceStatus,
      recentPremiumRequests,
      funnelDiagnostics,
      userRegistrationSummary: {
        totalUsers: userRegistrationSummary.totalUsers,
        usersWithEmail: userRegistrationSummary.usersWithEmail,
        verifiedUsers: userRegistrationSummary.verifiedUsers,
        guestUsers: Math.max(0, userRegistrationSummary.totalUsers - userRegistrationSummary.verifiedUsers),
        verificationRate: userRegistrationSummary.totalUsers > 0
          ? Math.round((userRegistrationSummary.verifiedUsers / userRegistrationSummary.totalUsers) * 100)
          : 0,
        firstUserAt: userRegistrationSummary.firstUserAt || null,
        latestUserAt: userRegistrationSummary.latestUserAt || null,
      },
      weeklyUserGrowth,
      weeklyProductUsage: weeklyProductUsage.map((item) => ({
        ...item,
        eventsPerSession: item.sessions > 0 ? toRoundedDecimal(item.productEvents / item.sessions) : 0,
        eventsPerActiveKey: item.activeKeys > 0 ? toRoundedDecimal(item.productEvents / item.activeKeys) : 0,
      })),
      weeklyDeviceMix,
      weeklySourceTrend,
      sourceFunnel: sourceFunnel.sourceFunnel,
      sourceDeviceFunnel: sourceFunnel.sourceDeviceFunnel,
      deviceMeasurementSummary,
      deviceFunnelBreakdown,
      dailyProductUsage: dailyProductUsage.map((item) => ({
        ...item,
        eventsPerSession: item.sessions > 0 ? toRoundedDecimal(item.productEvents / item.sessions) : 0,
      })),
      sessionStrength30d,
      identityContinuity,
      lifecycleRecall,
      recentBehaviorShift,
      recentSourceShift,
      systemHealth,
      journeyFunnel: Object.values(journeyCounts),
      eventsLast7d,
      recentEvents: analyticsOperations.listRecent(12),
    };
  },
};

export const reportJourneyEventOperations = {
  create: (event: ReportJourneyEventRecord) => {
    return db.prepare(`
      INSERT INTO report_journey_events (
        id, user_id, report_id, workflow_id, layer_key, action_target, category, tool_slug, source, href, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.userId,
      event.reportId,
      event.workflowId,
      event.layerKey,
      event.actionTarget,
      event.category || null,
      event.toolSlug || null,
      event.source || null,
      event.href || null,
      JSON.stringify(event.meta || {})
    );
  },

  listByReport: (reportId: string, limit = 50) => {
    const rows = db.prepare(`
      SELECT * FROM report_journey_events
      WHERE report_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(reportId, limit) as RawReportJourneyEventRow[];

    return rows.map(mapReportJourneyEventRow);
  },

  listByUser: (userId: string, limit = 80) => {
    const rows = db.prepare(`
      SELECT * FROM report_journey_events
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(userId, limit) as RawReportJourneyEventRow[];

    return rows.map(mapReportJourneyEventRow);
  },

  getLatestByReport: (reportId: string) => {
    const row = db.prepare(`
      SELECT * FROM report_journey_events
      WHERE report_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT 1
    `).get(reportId) as RawReportJourneyEventRow | undefined;

    return row ? mapReportJourneyEventRow(row) : null;
  },

  listRecent: (limit = 200) => {
    const rows = db.prepare(`
      SELECT * FROM report_journey_events
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(limit) as RawReportJourneyEventRow[];

    return rows.map(mapReportJourneyEventRow);
  },

  getAnalyticsSnapshot: (days = 30) => {
    const rows = db.prepare(`
      SELECT * FROM report_journey_events
      WHERE datetime(created_at) >= datetime('now', ?)
      ORDER BY datetime(created_at) DESC
    `).all(`-${days} days`) as RawReportJourneyEventRow[];

    return buildReportJourneyAnalyticsSnapshot(rows.map(mapReportJourneyEventRow));
  },
};

export const contentSignalOperations = {
  upsert: (signal: ContentSignalRecord) => {
    const existing = db.prepare(`
      SELECT id FROM content_signals WHERE source_id = ? AND url = ? LIMIT 1
    `).get(signal.sourceId, signal.url) as { id: string } | undefined;

    if (existing) {
      return db.prepare(`
        UPDATE content_signals
        SET source_label = ?, platform = ?, title = ?, author = ?, summary = ?, published_at = ?,
            matched_keywords = ?, score = ?, meta = ?, created_at = datetime('now')
        WHERE source_id = ? AND url = ?
      `).run(
        signal.sourceLabel,
        signal.platform,
        signal.title,
        signal.author || null,
        signal.summary || null,
        signal.publishedAt || null,
        JSON.stringify(signal.matchedKeywords || []),
        signal.score || 0,
        JSON.stringify(signal.meta || {}),
        signal.sourceId,
        signal.url
      );
    }

    return db.prepare(`
      INSERT INTO content_signals (
        id, source_id, source_label, platform, title, url, author, summary,
        published_at, matched_keywords, score, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      signal.id,
      signal.sourceId,
      signal.sourceLabel,
      signal.platform,
      signal.title,
      signal.url,
      signal.author || null,
      signal.summary || null,
      signal.publishedAt || null,
      JSON.stringify(signal.matchedKeywords || []),
      signal.score || 0,
      JSON.stringify(signal.meta || {})
    );
  },

  listRecent: (limit = 50) => {
    const rows = db.prepare(`
      SELECT * FROM content_signals
      ORDER BY datetime(created_at) DESC, score DESC
      LIMIT ?
    `).all(limit) as RawContentSignalRow[];

    return rows.map(mapContentSignalRow);
  },

  getById: (id: string) => {
    const row = db.prepare(`
      SELECT * FROM content_signals
      WHERE id = ?
      LIMIT 1
    `).get(id) as RawContentSignalRow | undefined;

    return row ? mapContentSignalRow(row) : null;
  },
};

export const contentRadarRunOperations = {
  create: (run: ContentRadarRunRecord) => {
    return db.prepare(`
      INSERT INTO content_radar_runs (
        id, source_id, source_label, platform, status, fetched_count, saved_count, error, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      run.id,
      run.sourceId,
      run.sourceLabel,
      run.platform,
      run.status,
      run.fetchedCount || 0,
      run.savedCount || 0,
      run.error || null,
      JSON.stringify(run.meta || {})
    );
  },

  listRecent: (limit = 30) => {
    const rows = db.prepare(`
      SELECT * FROM content_radar_runs
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(limit) as RawContentRadarRunRow[];

    return rows.map(mapContentRadarRunRow);
  },
};

export const contentSchedulerRunOperations = {
  create: (run: ContentSchedulerRunRecord) => {
    return db.prepare(`
      INSERT INTO content_scheduler_runs (
        id, trigger, status, reason, generated_count, published_count, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      run.id,
      run.trigger,
      run.status,
      run.reason || null,
      run.generatedCount || 0,
      run.publishedCount || 0,
      JSON.stringify(run.meta || {})
    );
  },

  listRecent: (limit = 30) => {
    const rows = db.prepare(`
      SELECT * FROM content_scheduler_runs
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(limit) as RawContentSchedulerRunRow[];

    return rows.map(mapContentSchedulerRunRow);
  },
};

export const systemLockOperations = {
  acquire: (key: string, owner: string, ttlMs: number, meta?: Record<string, unknown>) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + Math.max(1000, ttlMs)).toISOString();

    const result = db.prepare(`
      INSERT INTO system_locks (key, owner, locked_at, expires_at, meta, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        owner = excluded.owner,
        locked_at = excluded.locked_at,
        expires_at = excluded.expires_at,
        meta = excluded.meta,
        updated_at = excluded.updated_at
      WHERE datetime(system_locks.expires_at) <= datetime(?)
    `).run(
      key,
      owner,
      nowIso,
      expiresAt,
      JSON.stringify(meta || {}),
      nowIso,
      nowIso
    );

    return result.changes > 0;
  },

  release: (key: string, owner: string) => {
    return db.prepare(`
      DELETE FROM system_locks
      WHERE key = ? AND owner = ?
    `).run(key, owner);
  },

  get: (key: string) => {
    const row = db.prepare(`
      SELECT * FROM system_locks
      WHERE key = ?
    `).get(key) as RawSystemLockRow | undefined;

    if (!row) {
      return null;
    }

    return {
      key: row.key,
      owner: row.owner,
      lockedAt: row.locked_at,
      expiresAt: row.expires_at,
      meta: parseJson(row.meta, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

export const contentGenerationJobOperations = {
  create: (job: ContentGenerationJobRecord) => {
    const now = new Date().toISOString();
    return db.prepare(`
      INSERT INTO content_generation_jobs (
        id, user_id, status, request_payload, result_payload,
        generated_count, llm_succeeded_count, fallback_count,
        attempts, max_attempts, next_run_at, locked_at, last_error, meta, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      job.id,
      job.userId,
      job.status,
      JSON.stringify(job.request || {}),
      JSON.stringify(job.result || {}),
      job.generatedCount || 0,
      job.llmSucceededCount || 0,
      job.fallbackCount || 0,
      job.attempts || 0,
      job.maxAttempts || 3,
      job.nextRunAt || now,
      job.lockedAt || null,
      job.lastError || null,
      JSON.stringify(job.meta || {}),
      now,
      now
    );
  },

  getById: (id: string) => {
    const row = db.prepare(`
      SELECT * FROM content_generation_jobs
      WHERE id = ?
      LIMIT 1
    `).get(id) as RawContentGenerationJobRow | undefined;

    return row ? mapContentGenerationJobRow(row) : null;
  },

  claimNextRunnable: (staleLockMinutes = 40) => {
    const staleLockCutoff = new Date(Date.now() - staleLockMinutes * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE content_generation_jobs
      SET status = 'retry',
          locked_at = NULL,
          next_run_at = COALESCE(next_run_at, ?),
          updated_at = ?,
          last_error = COALESCE(last_error, 'LOCK_STALE_REQUEUED')
      WHERE status = 'running'
        AND locked_at IS NOT NULL
        AND datetime(locked_at) <= datetime(?)
        AND attempts < max_attempts
    `).run(now, now, staleLockCutoff);

    db.prepare(`
      UPDATE content_generation_jobs
      SET status = 'failed',
          locked_at = NULL,
          updated_at = ?,
          last_error = COALESCE(last_error, 'LOCK_STALE_MAX_ATTEMPTS')
      WHERE status = 'running'
        AND locked_at IS NOT NULL
        AND datetime(locked_at) <= datetime(?)
        AND attempts >= max_attempts
    `).run(now, staleLockCutoff);

    const row = db.prepare(`
      SELECT * FROM content_generation_jobs
      WHERE status IN ('pending', 'retry')
        AND attempts < max_attempts
        AND (next_run_at IS NULL OR datetime(next_run_at) <= datetime(?))
      ORDER BY attempts ASC, datetime(next_run_at) ASC, datetime(created_at) ASC
      LIMIT 1
    `).get(now) as RawContentGenerationJobRow | undefined;

    if (!row) {
      return null;
    }

    const updated = db.prepare(`
      UPDATE content_generation_jobs
      SET status = 'running',
          attempts = attempts + 1,
          locked_at = ?,
          updated_at = ?
      WHERE id = ? AND status IN ('pending', 'retry')
    `).run(now, now, row.id);

    if (!updated.changes) {
      return null;
    }

    const claimed = db.prepare(`
      SELECT * FROM content_generation_jobs
      WHERE id = ?
      LIMIT 1
    `).get(row.id) as RawContentGenerationJobRow | undefined;

    return claimed ? mapContentGenerationJobRow(claimed) : null;
  },

  markCompleted: (id: string, updates?: Partial<ContentGenerationJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE content_generation_jobs
      SET status = 'completed',
          result_payload = ?,
          generated_count = ?,
          llm_succeeded_count = ?,
          fallback_count = ?,
          last_error = NULL,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(updates?.result || {}),
      updates?.generatedCount || 0,
      updates?.llmSucceededCount || 0,
      updates?.fallbackCount || 0,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  markRetry: (id: string, updates?: Partial<ContentGenerationJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE content_generation_jobs
      SET status = 'retry',
          result_payload = ?,
          generated_count = ?,
          llm_succeeded_count = ?,
          fallback_count = ?,
          next_run_at = ?,
          last_error = ?,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(updates?.result || {}),
      updates?.generatedCount || 0,
      updates?.llmSucceededCount || 0,
      updates?.fallbackCount || 0,
      updates?.nextRunAt || now,
      updates?.lastError || null,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  markFailed: (id: string, updates?: Partial<ContentGenerationJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE content_generation_jobs
      SET status = 'failed',
          result_payload = ?,
          generated_count = ?,
          llm_succeeded_count = ?,
          fallback_count = ?,
          last_error = ?,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(updates?.result || {}),
      updates?.generatedCount || 0,
      updates?.llmSucceededCount || 0,
      updates?.fallbackCount || 0,
      updates?.lastError || null,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  listRecent: (limit = 30) => {
    const rows = db.prepare(`
      SELECT * FROM content_generation_jobs
      ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
      LIMIT ?
    `).all(limit) as RawContentGenerationJobRow[];

    return rows.map(mapContentGenerationJobRow);
  },
};

export const reportUpgradeJobOperations = {
  enqueue: (job: ReportUpgradeJobRecord) => {
    const existing = db.prepare('SELECT * FROM report_upgrade_jobs WHERE report_id = ?').get(job.reportId) as RawReportUpgradeJobRow | undefined;
    const now = new Date().toISOString();

    if (existing) {
      return db.prepare(`
        UPDATE report_upgrade_jobs
        SET user_id = ?,
            status = ?,
            target_score = ?,
            max_attempts = ?,
            next_run_at = ?,
            locked_at = NULL,
            last_error = ?,
            meta = ?,
            updated_at = ?
        WHERE report_id = ?
      `).run(
        job.userId,
        job.status,
        job.targetScore || 95,
        job.maxAttempts || 6,
        job.nextRunAt || now,
        job.lastError || null,
        JSON.stringify(job.meta || {}),
        now,
        job.reportId
      );
    }

    return db.prepare(`
      INSERT INTO report_upgrade_jobs (
        id, report_id, user_id, status, target_score, attempts, max_attempts,
        last_score, best_score, best_grade, next_run_at, locked_at, last_error, meta, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      job.id,
      job.reportId,
      job.userId,
      job.status,
      job.targetScore || 95,
      job.attempts || 0,
      job.maxAttempts || 6,
      job.lastScore || 0,
      job.bestScore || 0,
      job.bestGrade || null,
      job.nextRunAt || now,
      job.lockedAt || null,
      job.lastError || null,
      JSON.stringify(job.meta || {}),
      now,
      now
    );
  },

  getByReportId: (reportId: string) => {
    const row = db.prepare('SELECT * FROM report_upgrade_jobs WHERE report_id = ?').get(reportId) as RawReportUpgradeJobRow | undefined;
    return row ? mapReportUpgradeJobRow(row) : null;
  },

  listByUserId: (userId: string, limit = 20) => {
    const rows = db.prepare(`
      SELECT * FROM report_upgrade_jobs
      WHERE user_id = ?
      ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC
      LIMIT ?
    `).all(userId, limit) as RawReportUpgradeJobRow[];

    return rows.map(mapReportUpgradeJobRow);
  },

  listRunnablePending: (limit = 20) => {
    const now = new Date().toISOString();
    const rows = db.prepare(`
      SELECT * FROM report_upgrade_jobs
      WHERE status = 'pending'
        AND attempts < max_attempts
        AND (next_run_at IS NULL OR datetime(next_run_at) <= datetime(?))
      ORDER BY ${REPORT_UPGRADE_PRIORITY_SQL},
               COALESCE(last_score, 0) ASC,
               attempts ASC,
               datetime(next_run_at) ASC,
               datetime(created_at) ASC
      LIMIT ?
    `).all(now, limit) as RawReportUpgradeJobRow[];

    return rows.map(mapReportUpgradeJobRow);
  },

  claimNextRunnable: () => {
    const staleLockCutoff = new Date(Date.now() - REPORT_UPGRADE_STALE_LOCK_MINUTES * 60 * 1000).toISOString();
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'retry',
          locked_at = NULL,
          next_run_at = COALESCE(next_run_at, ?),
          updated_at = ?,
          last_error = COALESCE(last_error, 'LOCK_STALE_REQUEUED')
      WHERE status = 'running'
        AND locked_at IS NOT NULL
        AND datetime(locked_at) <= datetime(?)
        AND attempts < max_attempts
    `).run(now, now, staleLockCutoff);

    db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'failed',
          locked_at = NULL,
          updated_at = ?,
          last_error = COALESCE(last_error, 'LOCK_STALE_MAX_ATTEMPTS')
      WHERE status = 'running'
        AND locked_at IS NOT NULL
        AND datetime(locked_at) <= datetime(?)
        AND attempts >= max_attempts
    `).run(now, staleLockCutoff);

    const row = db.prepare(`
      SELECT * FROM report_upgrade_jobs
      WHERE status IN ('pending', 'retry')
        AND attempts < max_attempts
        AND (next_run_at IS NULL OR datetime(next_run_at) <= datetime(?))
      ORDER BY ${REPORT_UPGRADE_PRIORITY_SQL},
               COALESCE(last_score, 0) ASC,
               attempts ASC,
               datetime(next_run_at) ASC,
               datetime(created_at) ASC
      LIMIT 1
    `).get(now) as RawReportUpgradeJobRow | undefined;

    if (!row) {
      return null;
    }

    const updated = db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'running',
          attempts = attempts + 1,
          locked_at = ?,
          updated_at = ?
      WHERE id = ? AND status IN ('pending', 'retry')
    `).run(now, now, row.id);

    if (!updated.changes) {
      return null;
    }

    const claimed = db.prepare('SELECT * FROM report_upgrade_jobs WHERE id = ?').get(row.id) as RawReportUpgradeJobRow | undefined;
    return claimed ? mapReportUpgradeJobRow(claimed) : null;
  },

  markCompleted: (id: string, updates?: Partial<ReportUpgradeJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'completed',
          last_score = ?,
          best_score = ?,
          best_grade = ?,
          last_error = NULL,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      updates?.lastScore || 0,
      updates?.bestScore || updates?.lastScore || 0,
      updates?.bestGrade || null,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  markRetry: (id: string, updates?: Partial<ReportUpgradeJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'retry',
          last_score = ?,
          best_score = ?,
          best_grade = ?,
          next_run_at = ?,
          last_error = ?,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      updates?.lastScore || 0,
      updates?.bestScore || updates?.lastScore || 0,
      updates?.bestGrade || null,
      updates?.nextRunAt || now,
      updates?.lastError || null,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  markDeferred: (id: string, updates?: Partial<ReportUpgradeJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'retry',
          attempts = CASE WHEN attempts > 0 THEN attempts - 1 ELSE 0 END,
          last_score = COALESCE(?, last_score),
          best_score = COALESCE(?, best_score),
          best_grade = COALESCE(?, best_grade),
          next_run_at = ?,
          last_error = ?,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      updates?.lastScore ?? null,
      updates?.bestScore ?? null,
      updates?.bestGrade ?? null,
      updates?.nextRunAt || now,
      updates?.lastError || null,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  markFailed: (id: string, updates?: Partial<ReportUpgradeJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'failed',
          last_score = ?,
          best_score = ?,
          best_grade = ?,
          last_error = ?,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      updates?.lastScore || 0,
      updates?.bestScore || updates?.lastScore || 0,
      updates?.bestGrade || null,
      updates?.lastError || null,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  markCancelled: (id: string, updates?: Partial<ReportUpgradeJobRecord>) => {
    const now = new Date().toISOString();
    return db.prepare(`
      UPDATE report_upgrade_jobs
      SET status = 'cancelled',
          last_score = COALESCE(?, last_score),
          best_score = COALESCE(?, best_score),
          best_grade = COALESCE(?, best_grade),
          last_error = ?,
          locked_at = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      updates?.lastScore ?? null,
      updates?.bestScore ?? null,
      updates?.bestGrade ?? null,
      updates?.lastError || null,
      JSON.stringify(updates?.meta || {}),
      now,
      id
    );
  },

  listRecent: (limit = 30) => {
    const rows = db.prepare(`
      SELECT * FROM report_upgrade_jobs
      ORDER BY datetime(updated_at) DESC
      LIMIT ?
    `).all(limit) as RawReportUpgradeJobRow[];

    return rows.map(mapReportUpgradeJobRow);
  },
};

// 事件操作
export const eventOperations = {
  create: (event: EventRecord) => {
    const stmt = db.prepare(`
      INSERT INTO events (id, user_id, type, title, date, time, description, impact, fortune_analysis, user_feedback, follow_up_advice, reminder_enabled, reminder_advance_days, reminder_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      event.id,
      event.userId,
      event.type,
      event.title,
      event.date,
      event.time,
      event.description,
      event.impact,
      JSON.stringify(event.fortuneAnalysis),
      JSON.stringify(event.userFeedback),
      JSON.stringify(event.followUpAdvice),
      event.reminderEnabled ? 1 : 0,
      event.reminderAdvanceDays,
      event.reminderMethod
    );
  },

  getById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
    const row = stmt.get(id) as RawEventRow | undefined;
    if (row) {
      return mapEventRow(row);
    }
    return null;
  },

  getByUserId: (userId: string) => {
    const stmt = db.prepare('SELECT * FROM events WHERE user_id = ? ORDER BY date DESC');
    const rows = stmt.all(userId) as RawEventRow[];
    return rows.map(mapEventRow);
  },

  getByDateRange: (userId: string, startDate: string, endDate: string) => {
    const stmt = db.prepare('SELECT * FROM events WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC');
    const rows = stmt.all(userId, startDate, endDate) as RawEventRow[];
    return rows.map(mapEventRow);
  },

  update: (id: string, updates: Record<string, unknown>) => {
    const JSON_FIELDS = ['fortuneAnalysis', 'userFeedback', 'followUpAdvice'] as const;
    const COLUMN_MAP: Record<string, string> = {
      fortuneAnalysis: 'fortune_analysis',
      userFeedback: 'user_feedback',
      followUpAdvice: 'follow_up_advice',
      reminderEnabled: 'reminder_enabled',
      reminderAdvanceDays: 'reminder_advance_days',
      reminderMethod: 'reminder_method',
    };
    const setClause = Object.keys(updates)
      .map((key) => `${COLUMN_MAP[key] || key} = ?`)
      .join(', ');
    const values = Object.entries(updates).map(([key, value]) => {
      if (key === 'reminder_enabled' || key === 'reminderEnabled') return value ? 1 : 0;
      if (JSON_FIELDS.includes(key as typeof JSON_FIELDS[number])) return JSON.stringify(value);
      return value;
    });
    values.push(new Date().toISOString());
    values.push(id);
    const stmt = db.prepare(`UPDATE events SET ${setClause}, updated_at = ? WHERE id = ?`);
    return stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    return stmt.run(id);
  },
};

// 问答操作
export const questionOperations = {
  create: (question: QuestionRecord) => {
    const stmt = db.prepare(`
      INSERT INTO questions (id, user_id, question, category, analysis)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      question.id,
      question.userId,
      question.question,
      question.category,
      JSON.stringify(question.analysis)
    );
  },

  getById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM questions WHERE id = ?');
    const row = stmt.get(id) as RawQuestionRow | undefined;
    if (row) {
      return mapQuestionRow(row);
    }
    return null;
  },

  getByUserId: (userId: string, limit = 50) => {
    const stmt = db.prepare(`SELECT * FROM questions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`);
    const rows = stmt.all(userId, limit) as RawQuestionRow[];
    return rows.map(mapQuestionRow);
  },

  getChatByUserId: (userId: string, limit = 100) => {
    const stmt = db.prepare(`
      SELECT * FROM questions
      WHERE user_id = ?
        AND category IN ('chat_user', 'chat_assistant')
      ORDER BY created_at ASC
      LIMIT ?
    `);
    const rows = stmt.all(userId, limit) as RawQuestionRow[];
    return rows.map(mapQuestionRow);
  },

  update: (id: string, updates: Partial<Omit<QuestionRecord, 'id' | 'userId'>>) => {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.entries(updates).map(([key, value]) =>
      key === 'analysis' ? JSON.stringify(value) : value
    );
    values.push(new Date().toISOString());
    values.push(id);
    const stmt = db.prepare(`UPDATE questions SET ${setClause}, updated_at = ? WHERE id = ?`);
    return stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM questions WHERE id = ?');
    return stmt.run(id);
  },

  deleteMany: (ids: string[]) => {
    if (!ids.length) {
      return { changes: 0 };
    }

    const placeholders = ids.map(() => '?').join(', ');
    const stmt = db.prepare(`DELETE FROM questions WHERE id IN (${placeholders})`);
    return stmt.run(...ids);
  },
};

export const emailSubscriptionOperations = {
  upsert: (email: string, source = 'site', tags: string[] = []) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = emailSubscriptionOperations.getByEmail(normalizedEmail);
    const mergedTags = [...new Set([...(existing?.tags || []), ...tags])];
    const stmt = db.prepare(`
      INSERT INTO email_subscriptions (id, email, status, source, tags)
      VALUES (?, ?, 'active', ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        status = 'active',
        source = excluded.source,
        tags = excluded.tags,
        updated_at = datetime('now')
    `);
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return stmt.run(id, normalizedEmail, source, JSON.stringify(mergedTags));
  },

  getByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM email_subscriptions WHERE email = ?');
    const row = stmt.get(email.trim().toLowerCase()) as any;
    if (!row) return null;
    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
    };
  },

  listActiveByTags: (tags: string[] = [], limit = 200) => {
    const rows = db.prepare(`
      SELECT * FROM email_subscriptions
      WHERE status = 'active'
      ORDER BY datetime(updated_at) DESC
      LIMIT ?
    `).all(limit) as Array<{ email: string; status: string; source?: string | null; tags?: string | null; updated_at?: string }>;

    const normalizedTags = tags.filter(Boolean);
    return rows
      .map((row) => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : [],
      }))
      .filter((row) => {
        if (normalizedTags.length === 0) {
          return true;
        }
        return row.tags.some((tag: string) => normalizedTags.includes(tag));
      });
  },

  unsubscribe: (email: string) => {
    const stmt = db.prepare(`
      UPDATE email_subscriptions
      SET status = 'unsubscribed', updated_at = datetime('now')
      WHERE email = ?
    `);
    return stmt.run(email.trim().toLowerCase());
  },
};

export const reportMonthlyDigestRunOperations = {
  create: (run: ReportMonthlyDigestRunRecord) => {
    return db.prepare(`
      INSERT INTO report_monthly_digest_runs (
        id, cycle_key, email, user_id, report_id, status, reason, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(cycle_key, email) DO UPDATE SET
        user_id = excluded.user_id,
        report_id = excluded.report_id,
        status = excluded.status,
        reason = excluded.reason,
        meta = excluded.meta
    `).run(
      run.id,
      run.cycleKey,
      run.email.trim().toLowerCase(),
      run.userId || null,
      run.reportId || null,
      run.status,
      run.reason || null,
      JSON.stringify(run.meta || {})
    );
  },

  getByCycleAndEmail: (cycleKey: string, email: string) => {
    const row = db.prepare(`
      SELECT * FROM report_monthly_digest_runs
      WHERE cycle_key = ? AND email = ?
      LIMIT 1
    `).get(cycleKey, email.trim().toLowerCase()) as RawReportMonthlyDigestRunRow | undefined;

    return row ? mapReportMonthlyDigestRunRow(row) : null;
  },

  listRecent: (limit = 50) => {
    const rows = db.prepare(`
      SELECT * FROM report_monthly_digest_runs
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(limit) as RawReportMonthlyDigestRunRow[];

    return rows.map(mapReportMonthlyDigestRunRow);
  },

  listByUserOrEmail: (params: {
    userId?: string | null;
    email?: string | null;
    limit?: number;
  }) => {
    const limit = Math.max(1, params.limit || 20);
    const normalizedEmail = `${params.email || ''}`.trim().toLowerCase();
    const rows = params.userId && normalizedEmail
      ? db.prepare(`
          SELECT * FROM report_monthly_digest_runs
          WHERE user_id = ? OR email = ?
          ORDER BY datetime(created_at) DESC
          LIMIT ?
        `).all(params.userId, normalizedEmail, limit) as RawReportMonthlyDigestRunRow[]
      : params.userId
        ? db.prepare(`
            SELECT * FROM report_monthly_digest_runs
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            LIMIT ?
          `).all(params.userId, limit) as RawReportMonthlyDigestRunRow[]
        : normalizedEmail
          ? db.prepare(`
              SELECT * FROM report_monthly_digest_runs
              WHERE email = ?
              ORDER BY datetime(created_at) DESC
              LIMIT ?
            `).all(normalizedEmail, limit) as RawReportMonthlyDigestRunRow[]
          : [];

    return rows.map(mapReportMonthlyDigestRunRow);
  },
};

export const userLifecycleEmailRunOperations = {
  create: (run: UserLifecycleEmailRunRecord) => {
    return db.prepare(`
      INSERT INTO user_lifecycle_email_runs (
        id, stage_key, email, user_id, report_id, status, reason, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stage_key, email) DO UPDATE SET
        user_id = excluded.user_id,
        report_id = excluded.report_id,
        status = excluded.status,
        reason = excluded.reason,
        meta = excluded.meta
    `).run(
      run.id,
      run.stageKey,
      run.email.trim().toLowerCase(),
      run.userId || null,
      run.reportId || null,
      run.status,
      run.reason || null,
      JSON.stringify(run.meta || {})
    );
  },

  getByStageAndEmail: (stageKey: string, email: string) => {
    const row = db.prepare(`
      SELECT * FROM user_lifecycle_email_runs
      WHERE stage_key = ? AND email = ?
      LIMIT 1
    `).get(stageKey, email.trim().toLowerCase()) as RawUserLifecycleEmailRunRow | undefined;

    return row ? mapUserLifecycleEmailRunRow(row) : null;
  },

  listRecentByUserOrEmail: (params: {
    userId?: string | null;
    email?: string | null;
    limit?: number;
  }) => {
    const limit = Math.max(1, params.limit || 20);
    const normalizedEmail = `${params.email || ''}`.trim().toLowerCase();
    const rows = params.userId && normalizedEmail
      ? db.prepare(`
          SELECT * FROM user_lifecycle_email_runs
          WHERE user_id = ? OR email = ?
          ORDER BY datetime(created_at) DESC
          LIMIT ?
        `).all(params.userId, normalizedEmail, limit) as RawUserLifecycleEmailRunRow[]
      : params.userId
        ? db.prepare(`
            SELECT * FROM user_lifecycle_email_runs
            WHERE user_id = ?
            ORDER BY datetime(created_at) DESC
            LIMIT ?
          `).all(params.userId, limit) as RawUserLifecycleEmailRunRow[]
        : normalizedEmail
          ? db.prepare(`
              SELECT * FROM user_lifecycle_email_runs
              WHERE email = ?
              ORDER BY datetime(created_at) DESC
              LIMIT ?
            `).all(normalizedEmail, limit) as RawUserLifecycleEmailRunRow[]
          : [];

    return rows.map(mapUserLifecycleEmailRunRow);
  },
};

export const emailDeliveryJobOperations = {
  create: (job: EmailDeliveryJobRecord) => {
    const now = new Date().toISOString();
    return db.prepare(`
      INSERT INTO email_delivery_jobs (
        id, kind, status, recipient_list, payload, attempts, max_attempts, next_run_at, locked_at, last_error, meta, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      job.id,
      job.kind,
      job.status || 'pending',
      JSON.stringify(job.to || []),
      JSON.stringify(job.payload || {}),
      job.attempts || 0,
      job.maxAttempts || 4,
      job.nextRunAt || now,
      job.lockedAt || null,
      job.lastError || null,
      JSON.stringify(job.meta || {}),
      now,
      now
    );
  },

  listRecent: (limit = 50, status?: EmailDeliveryJobRecord['status'] | 'all') => {
    const rows = status && status !== 'all'
      ? db.prepare(`
          SELECT * FROM email_delivery_jobs
          WHERE status = ?
          ORDER BY datetime(updated_at) DESC
          LIMIT ?
        `).all(status, limit) as RawEmailDeliveryJobRow[]
      : db.prepare(`
          SELECT * FROM email_delivery_jobs
          ORDER BY datetime(updated_at) DESC
          LIMIT ?
        `).all(limit) as RawEmailDeliveryJobRow[];

    return rows.map(mapEmailDeliveryJobRow);
  },

  acquireDueBatch: (limit = 5, lockMinutes = 10) => {
    const now = new Date().toISOString();
    const staleLockCutoff = new Date(Date.now() - lockMinutes * 60 * 1000).toISOString();
    const rows = db.prepare(`
      SELECT * FROM email_delivery_jobs
      WHERE status IN ('pending', 'running')
        AND (next_run_at IS NULL OR datetime(next_run_at) <= datetime('now'))
        AND (locked_at IS NULL OR datetime(locked_at) <= datetime(?))
        AND attempts < max_attempts
      ORDER BY datetime(next_run_at) ASC, datetime(created_at) ASC
      LIMIT ?
    `).all(staleLockCutoff, limit) as RawEmailDeliveryJobRow[];

    const items: EmailDeliveryJobRecord[] = [];
    for (const row of rows) {
      const result = db.prepare(`
        UPDATE email_delivery_jobs
        SET status = 'running',
            attempts = COALESCE(attempts, 0) + 1,
            locked_at = ?,
            updated_at = ?
        WHERE id = ?
          AND (locked_at IS NULL OR datetime(locked_at) <= datetime(?))
          AND attempts < max_attempts
      `).run(now, now, row.id, staleLockCutoff);

      if (result.changes > 0) {
        const updated = db.prepare(`SELECT * FROM email_delivery_jobs WHERE id = ? LIMIT 1`).get(row.id) as RawEmailDeliveryJobRow | undefined;
        if (updated) {
          items.push(mapEmailDeliveryJobRow(updated));
        }
      }
    }

    return items;
  },

  markSent: (id: string, meta?: Record<string, unknown>) => {
    const current = db.prepare(`SELECT * FROM email_delivery_jobs WHERE id = ? LIMIT 1`).get(id) as RawEmailDeliveryJobRow | undefined;
    const nextMeta = {
      ...parseJson(current?.meta, {}),
      ...(meta || {}),
    };

    return db.prepare(`
      UPDATE email_delivery_jobs
      SET status = 'sent',
          locked_at = NULL,
          last_error = NULL,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(nextMeta),
      new Date().toISOString(),
      id
    );
  },

  markRetryableFailure: (id: string, params: { lastError: string; nextRunAt: string; meta?: Record<string, unknown> }) => {
    const current = db.prepare(`SELECT * FROM email_delivery_jobs WHERE id = ? LIMIT 1`).get(id) as RawEmailDeliveryJobRow | undefined;
    const currentAttempts = Number(current?.attempts || 0);
    const maxAttempts = Number(current?.max_attempts || 0);
    const exhausted = maxAttempts > 0 && currentAttempts >= maxAttempts;
    const nextMeta = {
      ...parseJson(current?.meta, {}),
      ...(params.meta || {}),
    };

    return db.prepare(`
      UPDATE email_delivery_jobs
      SET status = ?,
          next_run_at = ?,
          locked_at = NULL,
          last_error = ?,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      exhausted ? 'failed' : 'pending',
      exhausted ? null : params.nextRunAt,
      params.lastError,
      JSON.stringify(nextMeta),
      new Date().toISOString(),
      id
    );
  },
};

export const premiumServiceRequestOperations = {
  create: (request: PremiumServiceRequestRecord) => {
    const now = new Date().toISOString();
    return db.prepare(`
      INSERT INTO premium_service_requests (
        id, user_id, report_id, service_key, status, priority, contact_name, contact_value, intake, meta, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      request.id,
      request.userId,
      request.reportId || null,
      request.serviceKey,
      request.status,
      request.priority || 'normal',
      request.contactName || null,
      request.contactValue || null,
      JSON.stringify(request.intake || {}),
      JSON.stringify(request.meta || {}),
      now,
      now
    );
  },

  listByUser: (userId: string, limit = 20) => {
    const rows = db.prepare(`
      SELECT * FROM premium_service_requests
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(userId, limit) as RawPremiumServiceRequestRow[];

    return rows.map(mapPremiumServiceRequestRow);
  },

  listByUserAndReport: (userId: string, reportId: string, limit = 20) => {
    const rows = db.prepare(`
      SELECT * FROM premium_service_requests
      WHERE user_id = ? AND report_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(userId, reportId, limit) as RawPremiumServiceRequestRow[];

    return rows.map(mapPremiumServiceRequestRow);
  },

  listRecent: (params?: {
    limit?: number;
    status?: PremiumServiceRequestRecord['status'] | 'all';
    serviceKey?: PremiumServiceRequestRecord['serviceKey'] | 'all';
  }) => {
    const limit = params?.limit || 50;
    const clauses: string[] = [];
    const queryParams: Array<string | number> = [];

    if (params?.status && params.status !== 'all') {
      clauses.push('status = ?');
      queryParams.push(params.status);
    }

    if (params?.serviceKey && params.serviceKey !== 'all') {
      clauses.push('service_key = ?');
      queryParams.push(params.serviceKey);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db.prepare(`
      SELECT * FROM premium_service_requests
      ${where}
      ORDER BY
        CASE status
          WHEN 'new' THEN 0
          WHEN 'contacted' THEN 1
          WHEN 'in_progress' THEN 2
          WHEN 'delivered' THEN 3
          WHEN 'closed' THEN 4
          WHEN 'cancelled' THEN 5
          ELSE 9
        END ASC,
        datetime(created_at) DESC
      LIMIT ?
    `).all(...queryParams, limit) as RawPremiumServiceRequestRow[];

    return rows.map(mapPremiumServiceRequestRow);
  },

  countByStatus: () => {
    const rows = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM premium_service_requests
      GROUP BY status
    `).all() as Array<{
      status: PremiumServiceRequestRecord['status'];
      count: number;
    }>;

    return rows.reduce<Record<PremiumServiceRequestRecord['status'], number>>((accumulator, row) => {
      accumulator[row.status] = Number(row.count || 0);
      return accumulator;
    }, {
      new: 0,
      contacted: 0,
      in_progress: 0,
      delivered: 0,
      closed: 0,
      cancelled: 0,
    });
  },

  getById: (id: string) => {
    const row = db.prepare(`
      SELECT * FROM premium_service_requests
      WHERE id = ?
      LIMIT 1
    `).get(id) as RawPremiumServiceRequestRow | undefined;

    return row ? mapPremiumServiceRequestRow(row) : null;
  },

  updateStatus: (
    id: string,
    updates: Pick<PremiumServiceRequestRecord, 'status'> & Partial<Pick<PremiumServiceRequestRecord, 'priority' | 'meta'>>
  ) => {
    return db.prepare(`
      UPDATE premium_service_requests
      SET status = ?,
          priority = ?,
          meta = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      updates.status,
      updates.priority || 'normal',
      JSON.stringify(updates.meta || {}),
      new Date().toISOString(),
      id
    );
  },
};

export const toolSessionOperations = {
  create: (session: ToolSessionRecord) => {
    const now = new Date().toISOString();
    return db.prepare(`
      INSERT INTO tool_sessions (
        id, user_id, report_id, tool_slug, status, input, result, meta, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.userId,
      session.reportId || null,
      session.toolSlug,
      session.status,
      JSON.stringify(session.input || {}),
      JSON.stringify(session.result || {}),
      JSON.stringify(session.meta || {}),
      now,
      now
    );
  },

  getById: (id: string) => {
    const row = db.prepare('SELECT * FROM tool_sessions WHERE id = ?').get(id) as RawToolSessionRow | undefined;
    return row ? mapToolSessionRow(row) : null;
  },

  listByUser: (userId: string, limit = 30) => {
    const rows = db.prepare(`
      SELECT * FROM tool_sessions
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(userId, limit) as RawToolSessionRow[];

    return rows.map(mapToolSessionRow);
  },

  listByUserAndTool: (userId: string, toolSlug: string, limit = 20) => {
    const rows = db.prepare(`
      SELECT * FROM tool_sessions
      WHERE user_id = ? AND tool_slug = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(userId, toolSlug, limit) as RawToolSessionRow[];

    return rows.map(mapToolSessionRow);
  },
};

// ==================== v5-D61 论坛 Q&A operations ====================

interface RawForumUserRow {
  id: string;
  handle: string;
  display_name: string;
  email: string;
  city: string | null;
  province: string | null;
  occupation: string | null;
  industry: string | null;
  interests: string | null;
  role: string;
  bio: string | null;
  avatar_seed: string | null;
  joined_at: string;
  reputation: number;
}

interface RawForumQuestionRow {
  id: string;
  slug: string;
  author_id: string;
  title: string;
  body: string;
  category: string;
  industry: string | null;
  tags: string | null;
  privacy_mode: string;
  metadata: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  view_count: number;
  answer_count: number;
}

interface RawForumAnswerRow {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  is_official: number;
  upvote_count: number;
  status: string;
  published_at: string | null;
  created_at: string;
  response_delay_minutes: number;
}

function mapForumUser(row: RawForumUserRow) {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    email: row.email,
    city: row.city || '',
    province: row.province || '',
    occupation: row.occupation || '',
    industry: row.industry || '',
    interests: row.interests ? JSON.parse(row.interests) : [],
    role: row.role as 'asker' | 'master' | 'enthusiast' | 'official',
    bio: row.bio || '',
    avatarSeed: row.avatar_seed || row.handle,
    joinedAt: row.joined_at,
    reputation: row.reputation,
  };
}

function mapForumQuestion(row: RawForumQuestionRow) {
  return {
    id: row.id,
    slug: row.slug,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    category: row.category,
    industry: row.industry || '',
    tags: row.tags ? JSON.parse(row.tags) : [],
    privacyMode: row.privacy_mode,
    metadata: row.metadata ? JSON.parse(row.metadata) : { visibilityMask: [] },
    status: row.status as 'pending' | 'visible' | 'archived',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    viewCount: row.view_count,
    answerCount: row.answer_count,
  };
}

function mapForumAnswer(row: RawForumAnswerRow) {
  return {
    id: row.id,
    questionId: row.question_id,
    authorId: row.author_id,
    body: row.body,
    isOfficial: row.is_official === 1,
    upvoteCount: row.upvote_count,
    status: row.status as 'pending' | 'visible',
    publishedAt: row.published_at,
    createdAt: row.created_at,
    responseDelayMinutes: row.response_delay_minutes,
  };
}

export const forumUserOperations = {
  upsertMany: (users: Array<{
    id: string; handle: string; displayName: string; email: string;
    city: string; province: string; occupation: string; industry: string;
    interests: string[]; role: string; bio: string; avatarSeed: string;
    joinedAt: string; reputation: number;
  }>) => {
    const stmt = db.prepare(`
      INSERT INTO forum_users (id, handle, display_name, email, city, province, occupation, industry, interests, role, bio, avatar_seed, joined_at, reputation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        handle=excluded.handle,
        display_name=excluded.display_name,
        email=excluded.email,
        city=excluded.city,
        province=excluded.province,
        occupation=excluded.occupation,
        industry=excluded.industry,
        interests=excluded.interests,
        role=excluded.role,
        bio=excluded.bio,
        reputation=excluded.reputation
    `);
    const tx = db.transaction((rows: typeof users) => {
      for (const u of rows) {
        stmt.run(u.id, u.handle, u.displayName, u.email, u.city, u.province, u.occupation, u.industry, JSON.stringify(u.interests), u.role, u.bio, u.avatarSeed, u.joinedAt, u.reputation);
      }
    });
    tx(users);
    return users.length;
  },
  count: () => (db.prepare('SELECT COUNT(*) as n FROM forum_users').get() as { n: number }).n,
  getById: (id: string) => {
    const row = db.prepare('SELECT * FROM forum_users WHERE id = ?').get(id) as RawForumUserRow | undefined;
    return row ? mapForumUser(row) : null;
  },
  listByRole: (role: string, limit = 100) => {
    const rows = db.prepare('SELECT * FROM forum_users WHERE role = ? LIMIT ?').all(role, limit) as RawForumUserRow[];
    return rows.map(mapForumUser);
  },
  listAll: () => {
    const rows = db.prepare('SELECT * FROM forum_users').all() as RawForumUserRow[];
    return rows.map(mapForumUser);
  },
};

export const forumQuestionOperations = {
  create: (q: {
    id: string; slug: string; authorId: string; title: string; body: string;
    category: string; industry: string; tags: string[]; privacyMode: string;
    metadata: Record<string, unknown>; status: string; publishedAt: string | null;
    viewCount: number; answerCount: number;
  }) => {
    db.prepare(`
      INSERT INTO forum_questions (id, slug, author_id, title, body, category, industry, tags, privacy_mode, metadata, status, published_at, view_count, answer_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(q.id, q.slug, q.authorId, q.title, q.body, q.category, q.industry, JSON.stringify(q.tags), q.privacyMode, JSON.stringify(q.metadata), q.status, q.publishedAt, q.viewCount, q.answerCount);
  },
  getBySlug: (slug: string) => {
    const row = db.prepare('SELECT * FROM forum_questions WHERE slug = ?').get(slug) as RawForumQuestionRow | undefined;
    return row ? mapForumQuestion(row) : null;
  },
  getById: (id: string) => {
    const row = db.prepare('SELECT * FROM forum_questions WHERE id = ?').get(id) as RawForumQuestionRow | undefined;
    return row ? mapForumQuestion(row) : null;
  },
  listVisible: (params: { limit?: number; offset?: number; category?: string; industry?: string; tag?: string } = {}) => {
    const limit = Math.min(Math.max(params.limit ?? 30, 1), 100);
    const offset = Math.max(params.offset ?? 0, 0);
    const where: string[] = [`status = 'visible'`, `datetime(published_at) <= datetime('now')`];
    const args: unknown[] = [];
    if (params.category) { where.push('category = ?'); args.push(params.category); }
    if (params.industry) { where.push('industry = ?'); args.push(params.industry); }
    if (params.tag) { where.push(`tags LIKE ?`); args.push(`%"${params.tag}"%`); }
    const sql = `SELECT * FROM forum_questions WHERE ${where.join(' AND ')} ORDER BY datetime(published_at) DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(sql).all(...args, limit, offset) as RawForumQuestionRow[];
    return rows.map(mapForumQuestion);
  },
  countVisible: (params: { category?: string; industry?: string; tag?: string } = {}) => {
    const where: string[] = [`status = 'visible'`, `datetime(published_at) <= datetime('now')`];
    const args: unknown[] = [];
    if (params.category) { where.push('category = ?'); args.push(params.category); }
    if (params.industry) { where.push('industry = ?'); args.push(params.industry); }
    if (params.tag) { where.push(`tags LIKE ?`); args.push(`%"${params.tag}"%`); }
    const sql = `SELECT COUNT(*) as n FROM forum_questions WHERE ${where.join(' AND ')}`;
    return (db.prepare(sql).get(...args) as { n: number }).n;
  },
  countTotal: () => (db.prepare('SELECT COUNT(*) as n FROM forum_questions').get() as { n: number }).n,
  countToday: () => (db.prepare(`SELECT COUNT(*) as n FROM forum_questions WHERE date(published_at) = date('now')`).get() as { n: number }).n,
  bumpView: (slug: string) => {
    db.prepare(`UPDATE forum_questions SET view_count = view_count + 1 WHERE slug = ?`).run(slug);
  },
  searchTitle: (q: string, limit = 20) => {
    if (!q.trim()) return [];
    const like = `%${q.trim()}%`;
    const rows = db.prepare(`
      SELECT * FROM forum_questions
      WHERE status = 'visible' AND datetime(published_at) <= datetime('now') AND (title LIKE ? OR body LIKE ?)
      ORDER BY datetime(published_at) DESC LIMIT ?
    `).all(like, like, limit) as RawForumQuestionRow[];
    return rows.map(mapForumQuestion);
  },
  listAllSlugsForSitemap: () => {
    const rows = db.prepare(`SELECT slug, published_at FROM forum_questions WHERE status = 'visible' AND datetime(published_at) <= datetime('now') ORDER BY datetime(published_at) DESC LIMIT 5000`).all() as Array<{ slug: string; published_at: string }>;
    return rows;
  },
};

// v5-D67/D70 LLM 预生成标题池（含 body / official_answer 配套）
export const forumTitlePoolOperations = {
  addBatch: (
    items: Array<{ title: string; category: string; keyword?: string | null; body?: string | null; officialAnswer?: string | null }>,
    batchId: string,
  ) => {
    if (!items.length) return { inserted: 0, skipped: 0 };
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO forum_title_pool (title, category, keyword, body, official_answer, status, batch_id) VALUES (?, ?, ?, ?, ?, 'fresh', ?)`
    );
    let inserted = 0;
    const tx = db.transaction((rows: typeof items) => {
      for (const r of rows) {
        const t = (r.title || '').trim();
        if (!t) continue;
        const info = stmt.run(t, r.category, r.keyword ?? null, r.body ?? null, r.officialAnswer ?? null, batchId);
        if (info.changes > 0) inserted += 1;
      }
    });
    tx(items);
    return { inserted, skipped: items.length - inserted };
  },
  consumeOne: (category?: string): { id: number; title: string; category: string; keyword: string | null; body: string | null; officialAnswer: string | null } | null => {
    const tx = db.transaction(() => {
      // v5-D70：优先消费 body 不为 NULL 的（D70+ 配对版），其次任何 fresh
      const sqlBody = category
        ? `SELECT id, title, category, keyword, body, official_answer FROM forum_title_pool WHERE status = 'fresh' AND category = ? AND body IS NOT NULL ORDER BY id ASC LIMIT 1`
        : `SELECT id, title, category, keyword, body, official_answer FROM forum_title_pool WHERE status = 'fresh' AND body IS NOT NULL ORDER BY id ASC LIMIT 1`;
      const sqlAny = category
        ? `SELECT id, title, category, keyword, body, official_answer FROM forum_title_pool WHERE status = 'fresh' AND category = ? ORDER BY id ASC LIMIT 1`
        : `SELECT id, title, category, keyword, body, official_answer FROM forum_title_pool WHERE status = 'fresh' ORDER BY id ASC LIMIT 1`;
      const args = category ? [category] : [];
      const row = (db.prepare(sqlBody).get(...args) || db.prepare(sqlAny).get(...args)) as
        | { id: number; title: string; category: string; keyword: string | null; body: string | null; official_answer: string | null }
        | undefined;
      if (!row) return null;
      db.prepare(`UPDATE forum_title_pool SET status = 'consumed', consumed_at = datetime('now') WHERE id = ?`).run(row.id);
      return {
        id: row.id,
        title: row.title,
        category: row.category,
        keyword: row.keyword,
        body: row.body,
        officialAnswer: row.official_answer,
      };
    });
    return tx() as ReturnType<typeof forumTitlePoolOperations.consumeOne>;
  },
  countFresh: (category?: string): number => {
    const sql = category
      ? `SELECT COUNT(*) as n FROM forum_title_pool WHERE status = 'fresh' AND category = ?`
      : `SELECT COUNT(*) as n FROM forum_title_pool WHERE status = 'fresh'`;
    const row = (category ? db.prepare(sql).get(category) : db.prepare(sql).get()) as { n: number };
    return row.n;
  },
  countByCategory: (): Array<{ category: string; n: number }> => {
    return db.prepare(`SELECT category, COUNT(*) as n FROM forum_title_pool WHERE status = 'fresh' GROUP BY category ORDER BY n DESC`).all() as Array<{ category: string; n: number }>;
  },
  prune: (keepDays = 30): number => {
    const info = db.prepare(`DELETE FROM forum_title_pool WHERE status = 'consumed' AND datetime(consumed_at) < datetime('now', ?)`).run(`-${keepDays} days`);
    return info.changes;
  },
};

export const forumAnswerOperations = {
  create: (a: {
    id: string; questionId: string; authorId: string; body: string;
    isOfficial: boolean; upvoteCount: number; status: string;
    publishedAt: string | null; responseDelayMinutes: number;
  }) => {
    db.prepare(`
      INSERT INTO forum_answers (id, question_id, author_id, body, is_official, upvote_count, status, published_at, response_delay_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a.id, a.questionId, a.authorId, a.body, a.isOfficial ? 1 : 0, a.upvoteCount, a.status, a.publishedAt, a.responseDelayMinutes);
  },
  listByQuestion: (questionId: string) => {
    const rows = db.prepare(`
      SELECT * FROM forum_answers
      WHERE question_id = ? AND status = 'visible' AND datetime(published_at) <= datetime('now')
      ORDER BY is_official DESC, datetime(published_at) ASC
    `).all(questionId) as RawForumAnswerRow[];
    return rows.map(mapForumAnswer);
  },
  listPendingDue: (limit = 200) => {
    // 找出该到时间发布的 pending 答（publishedAt 是计划发布时间，未来由 daemon 发布时再用）
    const rows = db.prepare(`
      SELECT * FROM forum_answers
      WHERE status = 'pending' AND published_at IS NOT NULL AND datetime(published_at) <= datetime('now')
      LIMIT ?
    `).all(limit) as RawForumAnswerRow[];
    return rows.map(mapForumAnswer);
  },
  releasePending: (id: string) => {
    db.prepare(`UPDATE forum_answers SET status='visible' WHERE id = ?`).run(id);
  },
  // 用于 daemon 一次性插入但延后展示
  createScheduled: (a: {
    id: string; questionId: string; authorId: string; body: string;
    isOfficial: boolean; upvoteCount: number; scheduledFor: string; responseDelayMinutes: number;
  }) => {
    db.prepare(`
      INSERT INTO forum_answers (id, question_id, author_id, body, is_official, upvote_count, status, published_at, response_delay_minutes)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(a.id, a.questionId, a.authorId, a.body, a.isOfficial ? 1 : 0, a.upvoteCount, a.scheduledFor, a.responseDelayMinutes);
  },
};

// ==================== 事务支持 ====================

/**
 * 在事务中执行多个操作，任一失败则全部回滚
 */
export function runInTransaction<T>(fn: () => T): T {
  const transaction = db.transaction(fn);
  return transaction();
}

/**
 * 命理分析完整事务：创建/更新用户 + 存储分析结果
 */
export function createFortuneWithUser(
  userId: string,
  userUpdates: Partial<Omit<import('./user-types').UserRecord, 'id'>>,
  fortune: import('./user-types').FortuneRecord
) {
  return runInTransaction(() => {
    // 更新用户档案
    try {
      userOperations.update(userId, userUpdates);
    } catch (e) {
      // 用户可能不存在，忽略更新失败
      if (e instanceof Error && !e.message.includes('no such')) {
        console.warn('[DB] User update skipped:', e.message);
      }
    }
    // 存储命理数据
    fortuneOperations.create(fortune);
  });
}

// 在应用启动时初始化数据库
if (typeof require !== 'undefined') {
  initializeDatabase();
}
