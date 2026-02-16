// 数据库配置 - SQLite
import Database from 'better-sqlite3';
import path from 'path';

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
      gender TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL,
      birth_place TEXT,
      timezone INTEGER DEFAULT 8,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

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

  // 索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_fortunes_user_id ON fortunes(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_enhancements_user_id ON enhancements(user_id);
  `);
}

// 用户操作
export const userOperations = {
  create: (user: any) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, name, email, gender, birth_date, birth_time, birth_place, timezone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(user.id, user.name, user.email, user.gender, user.birthDate, user.birthTime, user.birthPlace, user.timezone);
  },

  getById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  getByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  update: (id: string, updates: any) => {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
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
  create: (fortune: any) => {
    const stmt = db.prepare(`
      INSERT INTO fortunes (id, user_id, name, birth_date, birth_time, birth_place, timezone, gender, bazi, five_elements, ten_gods, pattern, fortune, advice, evidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      JSON.stringify(fortune.evidence)
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
      };
    }
    return null;
  },

  getByUserId: (userId: string) => {
    const stmt = db.prepare('SELECT * FROM fortunes WHERE user_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(userId);
    return rows.map((row) => ({
      ...row,
      bazi: JSON.parse(row.bazi),
      fiveElements: JSON.parse(row.five_elements),
      tenGods: JSON.parse(row.ten_gods),
      pattern: JSON.parse(row.pattern),
      fortune: JSON.parse(row.fortune),
      advice: JSON.parse(row.advice),
      evidence: JSON.parse(row.evidence),
    }));
  },

  update: (id: string, updates: any) => {
    const setClause = Object.keys(updates).map(key => {
      if (['bazi', 'fiveElements', 'tenGods', 'pattern', 'fortune', 'advice', 'evidence'].includes(key)) {
        return `${key} = ?`;
      }
      return `${key} = ?`;
    }).join(', ');
    
    const values = Object.entries(updates).map(([key, value]) => {
      if (['bazi', 'fiveElements', 'tenGods', 'pattern', 'fortune', 'advice', 'evidence'].includes(key)) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE fortunes SET ${setClause}, updated_at = ? WHERE id = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM fortunes WHERE id = ?');
    return stmt.run(id);
  },
};

// 事件操作
export const eventOperations = {
  create: (event: any) => {
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
    return rows.map((row) => ({
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
    return rows.map((row) => ({
      ...row,
      reminder_enabled: row.reminder_enabled === 1,
      fortune_analysis: JSON.parse(row.fortune_analysis),
      user_feedback: JSON.parse(row.user_feedback),
      follow_up_advice: JSON.parse(row.follow_up_advice),
    }));
  },

  update: (id: string, updates: any) => {
    const setClause = Object.keys(updates).map(key => {
      if (['fortuneAnalysis', 'userFeedback', 'followUpAdvice'].includes(key)) {
        return `${key} = ?`;
      }
      return `${key} = ?`;
    }).join(', ');
    
    const values = Object.entries(updates).map(([key, value]) => {
      if (['reminder_enabled'].includes(key)) {
        return value ? 1 : 0;
      }
      if (['fortuneAnalysis', 'userFeedback', 'followUpAdvice'].includes(key)) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE events SET ${setClause}, updated_at = ? WHERE id = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    return stmt.run(id);
  },
};

// 问答操作
export const questionOperations = {
  create: (question: any) => {
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
    return rows.map((row) => ({
      ...row,
      analysis: JSON.parse(row.analysis),
    }));
  },

  update: (id: string, updates: any) => {
    const setClause = Object.keys(updates).map(key => {
      if (['analysis'].includes(key)) {
        return `${key} = ?`;
      }
      return `${key} = ?`;
    }).join(', ');
    
    const values = Object.entries(updates).map(([key, value]) => {
      if (['analysis'].includes(key)) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = db.prepare(`
      UPDATE questions SET ${setClause}, updated_at = ? WHERE id = ?
    `);
    return stmt.run(...values);
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM questions WHERE id = ?');
    return stmt.run(id);
  },
};

// 在应用启动时初始化数据库
if (typeof require !== 'undefined') {
  initializeDatabase();
}
