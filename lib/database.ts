// 数据库配置 - SQLite
import Database from 'better-sqlite3';
import path from 'path';
import type { UserRecord, FortuneRecord, EventRecord, QuestionRecord, AnalyticsEventRecord } from './user-types';

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
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

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

    const eventsLast7d = analyticsOperations.countByEventNameSinceDays(7).map((item) => ({
      eventName: item.event_name,
      count: item.count,
    }));

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
      eventsLast7d,
      recentEvents: analyticsOperations.listRecent(12),
    };
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
    return stmt.run(id, email.trim().toLowerCase(), source, JSON.stringify(tags));
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

  unsubscribe: (email: string) => {
    const stmt = db.prepare(`
      UPDATE email_subscriptions
      SET status = 'unsubscribed', updated_at = datetime('now')
      WHERE email = ?
    `);
    return stmt.run(email.trim().toLowerCase());
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
