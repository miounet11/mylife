// Base Repository - 通用数据库操作抽象
import type Database from 'better-sqlite3';

export abstract class BaseRepository<T> {
  constructor(protected db: Database.Database) {}

  protected abstract get tableName(): string;

  protected execute(sql: string, params?: any[]): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return stmt.run(params || []);
  }

  protected queryOne<R = T>(sql: string, params?: any[]): R | null {
    const stmt = this.db.prepare(sql);
    return (stmt.get(params || []) as R) || null;
  }

  protected queryAll<R = T>(sql: string, params?: any[]): R[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(params || []) as R[];
  }

  findById(id: string): T | null {
    return this.queryOne<T>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }

  deleteById(id: string): boolean {
    const result = this.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  }

  count(): number {
    const result = this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName}`
    );
    return result?.count || 0;
  }
}
