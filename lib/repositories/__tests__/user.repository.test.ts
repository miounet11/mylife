// 单元测试 - 用户仓储
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { UserRepository } from '../user.repository';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

describe('UserRepository', () => {
  let repo: UserRepository;
  const testDbPath = path.join(__dirname, 'test.db');

  const createUserInput = (id: string) => ({
    id,
    name: '测试用户',
    gender: 'male' as const,
    birthDate: '1990-01-01',
    birthTime: '12:00',
    birthPlace: '北京',
    timezone: 8,
  });

  beforeEach(() => {
    // 使用测试数据库
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const db = new Database(testDbPath);

    // 创建测试表
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        gender TEXT,
        birth_date TEXT,
        birth_time TEXT,
        birth_place TEXT,
        timezone INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    repo = new UserRepository(db);
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('create', () => {
    it('should create a new user', () => {
      const userId = 'test_user_1';
      repo.create(createUserInput(userId));

      const user = repo.findById(userId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });

    it('should throw on duplicate create', () => {
      const userId = 'test_user_1';
      repo.create(createUserInput(userId));

      expect(() => repo.create(createUserInput(userId))).toThrow();
    });
  });

  describe('findById', () => {
    it('should return null for non-existent user', () => {
      const user = repo.findById('non_existent');
      expect(user).toBeNull();
    });

    it('should return user if exists', () => {
      const userId = 'test_user_1';
      repo.create(createUserInput(userId));

      const user = repo.findById(userId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      const userId = 'test_user_1';
      repo.create(createUserInput(userId));

      repo.updateProfile(userId, {
        name: '张三',
        birthPlace: '上海',
        timezone: 8,
      });

      const user = repo.findById(userId);
      expect(user?.name).toBe('张三');
      expect(user?.gender).toBe('male');
      expect(user?.birthPlace).toBe('上海');
    });

    it('should handle partial updates', () => {
      const userId = 'test_user_1';
      repo.create(createUserInput(userId));

      repo.updateProfile(userId, { name: '李四' });

      const user = repo.findById(userId);
      expect(user?.name).toBe('李四');
    });
  });
});
