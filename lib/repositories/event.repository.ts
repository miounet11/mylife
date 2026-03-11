// Event Repository - 事件数据访问层
import type Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import type { EventRecord } from '../user-types';

interface CreateEventInput {
  id: string;
  userId: string;
  type: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  impact: string;
  fortuneAnalysis?: any;
  userFeedback?: any;
  followUpAdvice?: any;
  reminderEnabled?: boolean;
  reminderAdvanceDays?: number;
  reminderMethod?: string;
}

interface UpdateEventInput {
  title?: string;
  date?: string;
  time?: string;
  description?: string;
  impact?: string;
  fortuneAnalysis?: any;
  userFeedback?: any;
  followUpAdvice?: any;
  reminderEnabled?: boolean;
  reminderAdvanceDays?: number;
  reminderMethod?: string;
}

export class EventRepository extends BaseRepository<EventRecord> {
  protected get tableName(): string {
    return 'events';
  }

  create(input: CreateEventInput): EventRecord {
    const now = new Date().toISOString();

    this.execute(
      `INSERT INTO events (
        id, user_id, type, title, date, time, description, impact,
        fortune_analysis, user_feedback, follow_up_advice,
        reminder_enabled, reminder_advance_days, reminder_method,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.userId,
        input.type,
        input.title,
        input.date,
        input.time || null,
        input.description || null,
        input.impact,
        input.fortuneAnalysis ? JSON.stringify(input.fortuneAnalysis) : null,
        input.userFeedback ? JSON.stringify(input.userFeedback) : null,
        input.followUpAdvice ? JSON.stringify(input.followUpAdvice) : null,
        input.reminderEnabled ? 1 : 0,
        input.reminderAdvanceDays || 0,
        input.reminderMethod || null,
        now,
        now,
      ]
    );

    const event = this.findById(input.id);
    if (!event) {
      throw new Error(`Failed to create event ${input.id}`);
    }
    return event;
  }

  update(id: string, input: UpdateEventInput): EventRecord {
    const updates: string[] = [];
    const params: any[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }
    if (input.date !== undefined) {
      updates.push('date = ?');
      params.push(input.date);
    }
    if (input.time !== undefined) {
      updates.push('time = ?');
      params.push(input.time);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description);
    }
    if (input.impact !== undefined) {
      updates.push('impact = ?');
      params.push(input.impact);
    }
    if (input.fortuneAnalysis !== undefined) {
      updates.push('fortune_analysis = ?');
      params.push(JSON.stringify(input.fortuneAnalysis));
    }
    if (input.userFeedback !== undefined) {
      updates.push('user_feedback = ?');
      params.push(JSON.stringify(input.userFeedback));
    }
    if (input.followUpAdvice !== undefined) {
      updates.push('follow_up_advice = ?');
      params.push(JSON.stringify(input.followUpAdvice));
    }
    if (input.reminderEnabled !== undefined) {
      updates.push('reminder_enabled = ?');
      params.push(input.reminderEnabled ? 1 : 0);
    }
    if (input.reminderAdvanceDays !== undefined) {
      updates.push('reminder_advance_days = ?');
      params.push(input.reminderAdvanceDays);
    }
    if (input.reminderMethod !== undefined) {
      updates.push('reminder_method = ?');
      params.push(input.reminderMethod);
    }

    if (updates.length === 0) {
      const event = this.findById(id);
      if (!event) throw new Error(`Event ${id} not found`);
      return event;
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.execute(
      `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const event = this.findById(id);
    if (!event) {
      throw new Error(`Event ${id} not found after update`);
    }
    return event;
  }

  findByUserId(userId: string, limit = 50): EventRecord[] {
    return this.queryAll<EventRecord>(
      'SELECT * FROM events WHERE user_id = ? ORDER BY date DESC LIMIT ?',
      [userId, limit]
    );
  }

  findByUserIdAndDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): EventRecord[] {
    return this.queryAll<EventRecord>(
      'SELECT * FROM events WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
      [userId, startDate, endDate]
    );
  }

  findByUserIdAndType(userId: string, type: string): EventRecord[] {
    return this.queryAll<EventRecord>(
      'SELECT * FROM events WHERE user_id = ? AND type = ? ORDER BY date DESC',
      [userId, type]
    );
  }

  findUpcomingReminders(daysAhead = 7): EventRecord[] {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    return this.queryAll<EventRecord>(
      `SELECT * FROM events
       WHERE reminder_enabled = 1
       AND date >= ?
       AND date <= ?
       ORDER BY date ASC`,
      [today, futureDateStr]
    );
  }

  countByUserId(userId: string): number {
    const result = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM events WHERE user_id = ?',
      [userId]
    );
    return result?.count || 0;
  }

  deleteByUserId(userId: string): number {
    const result = this.execute(
      'DELETE FROM events WHERE user_id = ?',
      [userId]
    );
    return result.changes;
  }
}
