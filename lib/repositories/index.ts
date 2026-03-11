// Repository Factory - 统一数据访问入口
import Database from 'better-sqlite3';
import path from 'path';
import { UserRepository } from './user.repository';
import { FortuneRepository } from './fortune.repository';
import { EventRepository } from './event.repository';

// 数据库单例
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'data', 'lifekline.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
  }
  return dbInstance;
}

// Repository 实例缓存
let userRepo: UserRepository | null = null;
let fortuneRepo: FortuneRepository | null = null;
let eventRepo: EventRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepo) {
    userRepo = new UserRepository(getDatabase());
  }
  return userRepo;
}

export function getFortuneRepository(): FortuneRepository {
  if (!fortuneRepo) {
    fortuneRepo = new FortuneRepository(getDatabase());
  }
  return fortuneRepo;
}

export function getEventRepository(): EventRepository {
  if (!eventRepo) {
    eventRepo = new EventRepository(getDatabase());
  }
  return eventRepo;
}

// 初始化数据库表结构
export function initializeDatabase(): void {
  const db = getDatabase();

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
      analysis JSON,
      kline_data JSON,
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
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_fortunes_user_id ON fortunes(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`);
}

// 关闭数据库连接
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    userRepo = null;
    fortuneRepo = null;
    eventRepo = null;
  }
}
