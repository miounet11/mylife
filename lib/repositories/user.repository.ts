// User Repository - 用户数据访问层
import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type { UserRecord } from '../user-types';

interface CreateUserInput {
  id: string;
  name: string;
  email?: string;
  gender: 'male' | 'female';
  birthDate: string;
  birthTime: string;
  birthPlace?: string;
  timezone?: number;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  birthPlace?: string;
  timezone?: number;
}

export class UserRepository extends BaseRepository<UserRecord> {
  protected get tableName(): string {
    return 'users';
  }

  create(input: CreateUserInput): UserRecord {
    const now = new Date().toISOString();

    this.execute(
      `INSERT INTO users (
        id, name, email, gender, birth_date, birth_time,
        birth_place, timezone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.name,
        input.email || null,
        input.gender,
        input.birthDate,
        input.birthTime,
        input.birthPlace || null,
        input.timezone || 8,
        now,
        now,
      ]
    );

    const user = this.findById(input.id);
    if (!user) {
      throw new Error(`Failed to create user ${input.id}`);
    }
    return user;
  }

  update(id: string, input: UpdateUserInput): UserRecord {
    const updates: string[] = [];
    const params: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      params.push(input.email);
    }
    if (input.birthPlace !== undefined) {
      updates.push('birth_place = ?');
      params.push(input.birthPlace);
    }
    if (input.timezone !== undefined) {
      updates.push('timezone = ?');
      params.push(input.timezone);
    }

    if (updates.length === 0) {
      const user = this.findById(id);
      if (!user) throw new Error(`User ${id} not found`);
      return user;
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const user = this.findById(id);
    if (!user) {
      throw new Error(`User ${id} not found after update`);
    }
    return user;
  }

  findByEmail(email: string): UserRecord | null {
    return this.queryOne<UserRecord>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  }

  findAll(limit = 100, offset = 0): UserRecord[] {
    return this.queryAll<UserRecord>(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
  }

  exists(id: string): boolean {
    const result = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE id = ?',
      [id]
    );
    return (result?.count || 0) > 0;
  }

  updateProfile(id: string, input: UpdateUserInput): UserRecord {
    return this.update(id, input);
  }
}
