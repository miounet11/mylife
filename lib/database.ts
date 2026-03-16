// 数据库配置 - SQLite
import Database from 'better-sqlite3';
import path from 'path';
import type {
  UserRecord,
  FortuneRecord,
  EventRecord,
  QuestionRecord,
  AnalyticsEventRecord,
  ContentSignalRecord,
  ContentRadarRunRecord,
  ContentSchedulerRunRecord,
  ContentGenerationJobRecord,
  ReportUpgradeJobRecord,
  ReportMonthlyDigestRunRecord,
  EmailDeliveryJobRecord,
  PremiumServiceRequestRecord,
} from './user-types';

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

interface RawEmailDeliveryJobRow {
  id: string;
  kind: 'premium_service_request_receipt' | 'premium_service_admin_alert' | 'premium_service_status_update' | 'report_ready';
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

const REPORT_UPGRADE_STALE_LOCK_MINUTES = Math.max(5, Number(process.env.REPORT_UPGRADE_LOCK_MINUTES || 20));

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

function mapEventRow(row: RawEventRow): EventRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    date: row.date,
    time: row.time || undefined,
    description: row.description || undefined,
    impact: row.impact,
    fortuneAnalysis: parseJson(row.fortune_analysis, {}),
    userFeedback: parseJson(row.user_feedback, {}),
    followUpAdvice: parseJson(row.follow_up_advice, {}),
    reminderEnabled: row.reminder_enabled === 1,
    reminderAdvanceDays: row.reminder_advance_days || undefined,
    reminderMethod: row.reminder_method || undefined,
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

// 启用WAL模式（提高并发性能）
db.pragma('journal_mode = WAL');

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
    CREATE INDEX IF NOT EXISTS idx_content_signals_source_id ON content_signals(source_id);
    CREATE INDEX IF NOT EXISTS idx_content_signals_created_at ON content_signals(created_at);
    CREATE INDEX IF NOT EXISTS idx_content_radar_runs_source_id ON content_radar_runs(source_id);
    CREATE INDEX IF NOT EXISTS idx_content_radar_runs_created_at ON content_radar_runs(created_at);
    CREATE INDEX IF NOT EXISTS idx_content_scheduler_runs_created_at ON content_scheduler_runs(created_at);
    CREATE INDEX IF NOT EXISTS idx_content_generation_jobs_status_next_run ON content_generation_jobs(status, next_run_at);
    CREATE INDEX IF NOT EXISTS idx_content_generation_jobs_user_created_at ON content_generation_jobs(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_report_upgrade_jobs_status_next_run ON report_upgrade_jobs(status, next_run_at);
    CREATE INDEX IF NOT EXISTS idx_report_upgrade_jobs_report_id ON report_upgrade_jobs(report_id);
    CREATE INDEX IF NOT EXISTS idx_report_monthly_digest_runs_cycle ON report_monthly_digest_runs(cycle_key, status);
    CREATE INDEX IF NOT EXISTS idx_email_delivery_jobs_status_next_run ON email_delivery_jobs(status, next_run_at);
    CREATE INDEX IF NOT EXISTS idx_email_delivery_jobs_kind_created_at ON email_delivery_jobs(kind, created_at);
    CREATE INDEX IF NOT EXISTS idx_premium_service_requests_user_id ON premium_service_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_premium_service_requests_report_id ON premium_service_requests(report_id);
    CREATE INDEX IF NOT EXISTS idx_premium_service_requests_status_created_at ON premium_service_requests(status, created_at);
  `);
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
      INSERT INTO fortunes (id, user_id, name, birth_date, birth_time, birth_place, timezone, gender, bazi, five_elements, ten_gods, pattern, fortune, advice, evidence, analysis, kline_data, dayun, shen_sha, report_version, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      fortune.isPublic === false ? 0 : 1
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
    const stmt = db.prepare('SELECT * FROM fortunes WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId) as RawFortuneRow[];
    return rows.map(mapFortuneRow);
  },

  listRecent: (limit = 100) => {
    const stmt = db.prepare('SELECT * FROM fortunes ORDER BY datetime(updated_at) DESC, datetime(created_at) DESC LIMIT ?');
    const rows = stmt.all(limit) as RawFortuneRow[];
    return rows.map(mapFortuneRow);
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
    const values = Object.entries(updates).map(([key, value]) =>
      JSON_FIELDS.includes(key as typeof JSON_FIELDS[number]) ? JSON.stringify(value) : value
    );
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

  getOverview: () => {
    const totals = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM fortunes) as total_analyses,
        (SELECT COUNT(*) FROM fortunes WHERE is_public = 1) as public_reports,
        (SELECT COUNT(*) FROM questions WHERE category = 'chat_user') as chat_messages,
        (SELECT COUNT(*) FROM email_subscriptions WHERE status = 'active') as active_subscribers,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM analytics_events) as total_tracked_events,
        (SELECT COUNT(*) FROM fortunes WHERE datetime(created_at) >= datetime('now', '-7 days')) as analyses_last_7d,
        (SELECT COUNT(*) FROM analytics_events WHERE datetime(created_at) >= datetime('now', '-7 days')) as tracked_events_last_7d
    `).get() as {
      total_analyses: number;
      public_reports: number;
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
    const journeyCounts: Record<string, { key: string; label: string; count: number }> = {
      home_page_viewed: { key: 'home_page_viewed', label: '首页访问', count: 0 },
      analyze_page_viewed: { key: 'analyze_page_viewed', label: '分析页访问', count: 0 },
      analyze_submitted: { key: 'analyze_submitted', label: '提交测算', count: 0 },
      report_generated: { key: 'report_generated', label: '生成报告', count: 0 },
      report_viewed: { key: 'report_viewed', label: '打开结果页', count: 0 },
      chat_page_viewed: { key: 'chat_page_viewed', label: '聊天页访问', count: 0 },
      chat_message_sent: { key: 'chat_message_sent', label: '发送聊天消息', count: 0 },
      report_event_saved_from_result: { key: 'report_event_saved_from_result', label: '结果页沉淀事件', count: 0 },
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
        const label = rawTarget === 'chat'
          ? '结果页进入聊天'
          : rawTarget === 'events'
            ? '结果页进入事件中心'
            : rawTarget === 'chat_followup'
              ? '聊天追问按钮'
              : '报告升级重算';
        if (!ctaBuckets[rawTarget]) {
          ctaBuckets[rawTarget] = {
            key: rawTarget,
            label,
            count: 0,
          };
        }
        ctaBuckets[rawTarget].count += 1;
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
        const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : Number.NaN;
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
      systemHealth,
      journeyFunnel: Object.values(journeyCounts),
      eventsLast7d,
      recentEvents: analyticsOperations.listRecent(12),
    };
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
            last_error = NULL,
            meta = ?,
            updated_at = ?
        WHERE report_id = ?
      `).run(
        job.userId,
        job.status,
        job.targetScore || 95,
        job.maxAttempts || 6,
        job.nextRunAt || now,
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
      ORDER BY COALESCE(last_score, 0) ASC, attempts ASC, datetime(next_run_at) ASC, datetime(created_at) ASC
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
      ORDER BY COALESCE(last_score, 0) ASC, attempts ASC, datetime(next_run_at) ASC, datetime(created_at) ASC
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
