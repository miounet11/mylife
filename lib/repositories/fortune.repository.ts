// Fortune Repository - 命理数据访问层
import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type { FortuneRecord } from '../user-types';

interface CreateFortuneInput {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace?: string;
  timezone?: number;
  gender: 'male' | 'female';
  bazi: any;
  fiveElements: any;
  tenGods: any;
  pattern: any;
  fortune: any;
  advice: any;
  evidence: any;
  analysis?: any;
  klineData?: any;
}

export class FortuneRepository extends BaseRepository<FortuneRecord> {
  protected get tableName(): string {
    return 'fortunes';
  }

  create(input: CreateFortuneInput): FortuneRecord {
    const now = new Date().toISOString();

    this.execute(
      `INSERT INTO fortunes (
        id, user_id, name, birth_date, birth_time, birth_place, timezone, gender,
        bazi, five_elements, ten_gods, pattern, fortune, advice, evidence,
        analysis, kline_data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.userId,
        input.name,
        input.birthDate,
        input.birthTime,
        input.birthPlace || null,
        input.timezone || 8,
        input.gender,
        JSON.stringify(input.bazi),
        JSON.stringify(input.fiveElements),
        JSON.stringify(input.tenGods),
        JSON.stringify(input.pattern),
        JSON.stringify(input.fortune),
        JSON.stringify(input.advice),
        JSON.stringify(input.evidence),
        input.analysis ? JSON.stringify(input.analysis) : null,
        input.klineData ? JSON.stringify(input.klineData) : null,
        now,
        now,
      ]
    );

    const fortune = this.findById(input.id);
    if (!fortune) {
      throw new Error(`Failed to create fortune ${input.id}`);
    }
    return fortune;
  }

  findByUserId(userId: string, limit = 10): FortuneRecord[] {
    return this.queryAll<FortuneRecord>(
      'SELECT * FROM fortunes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
  }

  findLatestByUserId(userId: string): FortuneRecord | null {
    return this.queryOne<FortuneRecord>(
      'SELECT * FROM fortunes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
  }

  updateAnalysis(id: string, analysis: any): void {
    this.execute(
      'UPDATE fortunes SET analysis = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(analysis), new Date().toISOString(), id]
    );
  }

  updateKlineData(id: string, klineData: any): void {
    this.execute(
      'UPDATE fortunes SET kline_data = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(klineData), new Date().toISOString(), id]
    );
  }

  countByUserId(userId: string): number {
    const result = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM fortunes WHERE user_id = ?',
      [userId]
    );
    return result?.count || 0;
  }

  deleteByUserId(userId: string): number {
    const result = this.execute(
      'DELETE FROM fortunes WHERE user_id = ?',
      [userId]
    );
    return result.changes;
  }
}
