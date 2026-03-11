// 数据库配置 - SQLite
import Database from 'better-sqlite3';
import path from 'path';
import type { UserRecord, FortuneRecord, EventRecord, QuestionRecord } from './user-types';

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
      INSERT INTO fortunes (id, user_id, name, birth_date, birth_time, birth_place, timezone, gender, bazi, five_elements, ten_gods, pattern, fortune, advice, evidence, analysis, kline_data, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      fortune.isPublic === false ? 0 : 1
    );
  },

  getById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM fortunes WHERE id = ?');
    const row = stmt.get(id);
    if (row) {
      // 解析JSON字段
      return {
        ...row,
        bazi: JSON.parse(row.bazi),
        fiveElements: JSON.parse(row.five_elements),
        tenGods: JSON.parse(row.ten_gods),
        pattern: JSON.parse(row.pattern),
        fortune: JSON.parse(row.fortune),
        advice: JSON.parse(row.advice),
        evidence: JSON.parse(row.evidence),
        analysis: row.analysis ? JSON.parse(row.analysis) : null,
        klineData: row.kline_data ? JSON.parse(row.kline_data) : null,
        isPublic: row.is_public !== 0,
      };
    }
    return null;
  },

  getByUserId: (userId: string) => {
    const stmt = db.prepare('SELECT * FROM fortunes WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId);
    return rows.map((row: any) => ({
      ...row,
      bazi: JSON.parse(row.bazi),
      fiveElements: JSON.parse(row.five_elements),
      tenGods: JSON.parse(row.ten_gods),
      pattern: JSON.parse(row.pattern),
      fortune: JSON.parse(row.fortune),
      advice: JSON.parse(row.advice),
      evidence: JSON.parse(row.evidence),
      analysis: row.analysis ? JSON.parse(row.analysis) : null,
      klineData: row.kline_data ? JSON.parse(row.kline_data) : null,
      isPublic: row.is_public !== 0,
    }));
  },

  update: (id: string, updates: Partial<Omit<FortuneRecord, 'id' | 'userId'>>) => {
    const JSON_FIELDS = ['bazi', 'fiveElements', 'tenGods', 'pattern', 'fortune', 'advice', 'evidence', 'analysis', 'klineData'] as const;
    const COLUMN_MAP: Record<string, string> = {
      fiveElements: 'five_elements',
      tenGods: 'ten_gods',
      klineData: 'kline_data',
      isPublic: 'is_public',
      birthDate: 'birth_date',
      birthTime: 'birth_time',
      birthPlace: 'birth_place',
      userId: 'user_id',
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
    const row = stmt.get(id);
    if (row) {
      return {
        ...row,
        reminder_enabled: row.reminder_enabled === 1,
        fortune_analysis: JSON.parse(row.fortune_analysis),
        user_feedback: JSON.parse(row.user_feedback),
        follow_up_advice: JSON.parse(row.follow_up_advice),
      };
    }
    return null;
  },

  getByUserId: (userId: string) => {
    const stmt = db.prepare('SELECT * FROM events WHERE user_id = ? ORDER BY date DESC');
    const rows = stmt.all(userId);
    return rows.map((row: any) => ({
      ...row,
      reminder_enabled: row.reminder_enabled === 1,
      fortune_analysis: JSON.parse(row.fortune_analysis),
      user_feedback: JSON.parse(row.user_feedback),
      follow_up_advice: JSON.parse(row.follow_up_advice),
    }));
  },

  getByDateRange: (userId: string, startDate: string, endDate: string) => {
    const stmt = db.prepare('SELECT * FROM events WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC');
    const rows = stmt.all(userId, startDate, endDate);
    return rows.map((row: any) => ({
      ...row,
      reminder_enabled: row.reminder_enabled === 1,
      fortune_analysis: JSON.parse(row.fortune_analysis),
      user_feedback: JSON.parse(row.user_feedback),
      follow_up_advice: JSON.parse(row.follow_up_advice),
    }));
  },

  update: (id: string, updates: Record<string, unknown>) => {
    const JSON_FIELDS = ['fortuneAnalysis', 'userFeedback', 'followUpAdvice'] as const;
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.entries(updates).map(([key, value]) => {
      if (key === 'reminder_enabled') return value ? 1 : 0;
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
    const row = stmt.get(id);
    if (row) {
      return {
        ...row,
        analysis: JSON.parse(row.analysis),
      };
    }
    return null;
  },

  getByUserId: (userId: string, limit = 50) => {
    const stmt = db.prepare(`SELECT * FROM questions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`);
    const rows = stmt.all(userId, limit);
    return rows.map((row: any) => ({
      ...row,
      analysis: JSON.parse(row.analysis),
    }));
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
