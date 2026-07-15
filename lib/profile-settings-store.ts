import { db } from '@/lib/database';
import { generateId } from '@/lib/utils';
import type {
  ProfileDocumentCategory,
  ProfileDocumentVisibility,
  SupplementDomain,
} from '@/lib/profile-settings-types';
import {
  MAX_PINNED_PROFILE_DOCUMENTS,
  MAX_PROFILE_DOCUMENT_CHARS,
  MAX_PROFILE_DOCUMENTS,
} from '@/lib/profile-settings-types';

export interface RawProfileSupplementRow {
  id: string;
  user_id: string;
  fortune_id: string | null;
  domain: string;
  fields: string;
  created_at?: string;
  updated_at?: string;
}

export interface RawProfileDocumentRow {
  id: string;
  user_id: string;
  fortune_id: string | null;
  title: string;
  category: string;
  content: string;
  visibility: string;
  pinned: number;
  word_count: number;
  source: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface RawProfileChangeLogRow {
  id: string;
  user_id: string;
  fortune_id: string | null;
  change_type: string;
  field_path: string | null;
  old_value: string | null;
  new_value: string | null;
  triggered_recalc: number;
  meta: string | null;
  created_at?: string;
}

let schemaReady = false;

export function ensureProfileSettingsSchema() {
  if (schemaReady) return;
  schemaReady = true;

  db.exec(`
    CREATE TABLE IF NOT EXISTS profile_supplements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      fortune_id TEXT,
      domain TEXT NOT NULL,
      fields JSON NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_supplements_scope
      ON profile_supplements(user_id, COALESCE(fortune_id, ''), domain)
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS profile_change_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      fortune_id TEXT,
      change_type TEXT NOT NULL,
      field_path TEXT,
      old_value TEXT,
      new_value TEXT,
      triggered_recalc INTEGER DEFAULT 0,
      meta JSON,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_profile_change_log_user
      ON profile_change_log(user_id, datetime(created_at) DESC)
  `);

  const fortuneColumns = db.prepare('PRAGMA table_info(fortunes)').all() as Array<{ name: string }>;
  const columnNames = new Set(fortuneColumns.map((column) => column.name));

  const fortuneMigrations: Array<[string, string]> = [
    ['birth_accuracy', "TEXT DEFAULT 'range'"],
    ['intent', 'TEXT'],
    ['is_primary', 'INTEGER DEFAULT 0'],
    ['birth_signature', 'TEXT'],
    ['profile_completeness', 'INTEGER DEFAULT 0'],
    ['deleted_at', 'TEXT'],
  ];

  for (const [name, definition] of fortuneMigrations) {
    if (!columnNames.has(name)) {
      db.exec(`ALTER TABLE fortunes ADD COLUMN ${name} ${definition}`);
    }
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS profile_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      fortune_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      content TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'engine',
      pinned INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fortune_id) REFERENCES fortunes(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_profile_documents_user
      ON profile_documents(user_id, datetime(updated_at) DESC)
  `);
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapSupplementRow(row: RawProfileSupplementRow) {
  return {
    id: row.id,
    userId: row.user_id,
    fortuneId: row.fortune_id,
    domain: row.domain as SupplementDomain,
    fields: parseJson<Record<string, string>>(row.fields, {}),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

export const profileSupplementOperations = {
  listByUser: (userId: string, fortuneId?: string | null) => {
    ensureProfileSettingsSchema();
    const rows = db.prepare(`
      SELECT * FROM profile_supplements
      WHERE user_id = ?
        AND (
          (? IS NULL AND fortune_id IS NULL)
          OR fortune_id = ?
        )
      ORDER BY domain ASC
    `).all(userId, fortuneId || null, fortuneId || null) as RawProfileSupplementRow[];

    return rows.map(mapSupplementRow);
  },

  upsert: (input: {
    userId: string;
    fortuneId?: string | null;
    domain: SupplementDomain;
    fields: Record<string, string>;
  }) => {
    ensureProfileSettingsSchema();
    const existing = db.prepare(`
      SELECT id FROM profile_supplements
      WHERE user_id = ?
        AND domain = ?
        AND (
          (? IS NULL AND fortune_id IS NULL)
          OR fortune_id = ?
        )
      LIMIT 1
    `).get(
      input.userId,
      input.domain,
      input.fortuneId || null,
      input.fortuneId || null,
    ) as { id: string } | undefined;

    const now = new Date().toISOString();
    const cleanedFields = Object.fromEntries(
      Object.entries(input.fields)
        .map(([key, value]) => [key, `${value || ''}`.trim()])
        .filter(([, value]) => value.length > 0),
    );

    if (existing) {
      // 合并已有字段，避免部分更新冲掉同域其他键
      const row = db.prepare(`SELECT fields FROM profile_supplements WHERE id = ?`).get(existing.id) as
        | { fields?: string }
        | undefined;
      let prev: Record<string, string> = {};
      try {
        prev = row?.fields ? (JSON.parse(row.fields) as Record<string, string>) : {};
      } catch {
        prev = {};
      }
      const merged = { ...prev, ...cleanedFields };
      db.prepare(`
        UPDATE profile_supplements
        SET fields = ?, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(merged), now, existing.id);
      return existing.id;
    }

    const id = `psup_${generateId()}`;
    db.prepare(`
      INSERT INTO profile_supplements (id, user_id, fortune_id, domain, fields, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.userId,
      input.fortuneId || null,
      input.domain,
      JSON.stringify(cleanedFields),
      now,
      now,
    );
    return id;
  },
};

function mapDocumentRow(row: RawProfileDocumentRow) {
  return {
    id: row.id,
    userId: row.user_id,
    fortuneId: row.fortune_id,
    title: row.title,
    category: row.category as ProfileDocumentCategory,
    content: row.content,
    visibility: row.visibility as ProfileDocumentVisibility,
    pinned: row.pinned === 1,
    wordCount: row.word_count || 0,
    source: row.source || 'manual',
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    deletedAt: row.deleted_at || null,
  };
}

export const profileDocumentOperations = {
  listByUser: (userId: string, fortuneId?: string | null) => {
    ensureProfileSettingsSchema();
    const rows = db.prepare(`
      SELECT * FROM profile_documents
      WHERE user_id = ?
        AND deleted_at IS NULL
        AND (
          (? IS NULL)
          OR (fortune_id IS NULL)
          OR fortune_id = ?
        )
      ORDER BY pinned DESC, datetime(updated_at) DESC
    `).all(userId, fortuneId || null, fortuneId || null) as RawProfileDocumentRow[];

    return rows.map(mapDocumentRow);
  },

  getById: (id: string, userId: string) => {
    ensureProfileSettingsSchema();
    const row = db.prepare(`
      SELECT * FROM profile_documents
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
      LIMIT 1
    `).get(id, userId) as RawProfileDocumentRow | undefined;
    return row ? mapDocumentRow(row) : null;
  },

  countActive: (userId: string, fortuneId?: string | null) => {
    ensureProfileSettingsSchema();
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM profile_documents
      WHERE user_id = ?
        AND deleted_at IS NULL
        AND (
          (? IS NULL)
          OR fortune_id IS NULL
          OR fortune_id = ?
        )
    `).get(userId, fortuneId || null, fortuneId || null) as { count: number };
    return row.count;
  },

  countPinned: (userId: string, fortuneId?: string | null, excludeId?: string) => {
    ensureProfileSettingsSchema();
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM profile_documents
      WHERE user_id = ?
        AND deleted_at IS NULL
        AND pinned = 1
        AND (? IS NULL OR id != ?)
        AND (
          (? IS NULL)
          OR fortune_id IS NULL
          OR fortune_id = ?
        )
    `).get(
      userId,
      excludeId || null,
      excludeId || null,
      fortuneId || null,
      fortuneId || null,
    ) as { count: number };
    return row.count;
  },

  create: (input: {
    userId: string;
    fortuneId?: string | null;
    title: string;
    category: ProfileDocumentCategory;
    content: string;
    visibility?: ProfileDocumentVisibility;
    pinned?: boolean;
  }) => {
    ensureProfileSettingsSchema();
    const activeCount = profileDocumentOperations.countActive(input.userId, input.fortuneId || null);
    if (activeCount >= MAX_PROFILE_DOCUMENTS) {
      throw new Error('DOCUMENT_LIMIT_REACHED');
    }

    const content = `${input.content || ''}`.trim().slice(0, MAX_PROFILE_DOCUMENT_CHARS);
    if (!content) {
      throw new Error('DOCUMENT_CONTENT_REQUIRED');
    }

    const pinned = !!input.pinned;
    if (pinned) {
      const pinnedCount = profileDocumentOperations.countPinned(input.userId, input.fortuneId || null);
      if (pinnedCount >= MAX_PINNED_PROFILE_DOCUMENTS) {
        throw new Error('PIN_LIMIT_REACHED');
      }
    }

    const now = new Date().toISOString();
    const id = `pdoc_${generateId()}`;
    db.prepare(`
      INSERT INTO profile_documents (
        id, user_id, fortune_id, title, category, content, visibility, pinned, word_count, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)
    `).run(
      id,
      input.userId,
      input.fortuneId || null,
      input.title.trim(),
      input.category,
      content,
      input.visibility || 'engine',
      pinned ? 1 : 0,
      content.length,
      now,
      now,
    );
    return id;
  },

  update: (input: {
    id: string;
    userId: string;
    title?: string;
    category?: ProfileDocumentCategory;
    content?: string;
    visibility?: ProfileDocumentVisibility;
    pinned?: boolean;
  }) => {
    ensureProfileSettingsSchema();
    const existing = profileDocumentOperations.getById(input.id, input.userId);
    if (!existing) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    const nextPinned = input.pinned ?? existing.pinned;
    if (nextPinned && !existing.pinned) {
      const pinnedCount = profileDocumentOperations.countPinned(
        input.userId,
        existing.fortuneId,
        input.id,
      );
      if (pinnedCount >= MAX_PINNED_PROFILE_DOCUMENTS) {
        throw new Error('PIN_LIMIT_REACHED');
      }
    }

    const content = input.content !== undefined
      ? `${input.content}`.trim().slice(0, MAX_PROFILE_DOCUMENT_CHARS)
      : existing.content;
    if (!content) {
      throw new Error('DOCUMENT_CONTENT_REQUIRED');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE profile_documents
      SET title = ?, category = ?, content = ?, visibility = ?, pinned = ?, word_count = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      (input.title ?? existing.title).trim(),
      input.category ?? existing.category,
      content,
      input.visibility ?? existing.visibility,
      nextPinned ? 1 : 0,
      content.length,
      now,
      input.id,
      input.userId,
    );
    return input.id;
  },

  softDelete: (id: string, userId: string) => {
    ensureProfileSettingsSchema();
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE profile_documents
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `).run(now, now, id, userId);
    if (!result.changes) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }
    return id;
  },
};

function mapChangeLogRow(row: RawProfileChangeLogRow) {
  const typeLabels: Record<string, string> = {
    account: '账户信息',
    birth_field: '出生信息',
    fortune_field: '档案信息',
    supplement: '补充资料',
    chat_progressive: '对话补充',
    document: '附加文档',
    archive_create: '新建档案',
    archive_primary: '设为默认档案',
    archive_delete: '删除档案',
  };

  const label = typeLabels[row.change_type] || row.change_type;
  let detail = row.field_path ? `（${row.field_path}）` : '';
  // 对话补充：meta 里带 fields 摘要时展示更可读
  if (row.change_type === 'chat_progressive' && row.new_value) {
    try {
      const parsed = JSON.parse(row.new_value) as Record<string, string>;
      const bits = Object.entries(parsed)
        .map(([k, v]) => `${k}=${v}`)
        .slice(0, 4);
      if (bits.length) detail = `：${bits.join('，')}`;
    } catch {
      // keep path detail
    }
  }
  const recalc = row.triggered_recalc ? '，已触发命盘重算' : '';

  return {
    id: row.id,
    changeType: row.change_type,
    fieldPath: row.field_path,
    triggeredRecalc: row.triggered_recalc === 1,
    summary: `${label}${detail}${recalc}`,
    createdAt: row.created_at || null,
  };
}

export const profileChangeLogOperations = {
  create: (input: {
    userId: string;
    fortuneId?: string | null;
    changeType: string;
    fieldPath?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    triggeredRecalc?: boolean;
    meta?: Record<string, unknown>;
  }) => {
    ensureProfileSettingsSchema();
    const id = `pcl_${generateId()}`;
    db.prepare(`
      INSERT INTO profile_change_log (
        id, user_id, fortune_id, change_type, field_path, old_value, new_value, triggered_recalc, meta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.userId,
      input.fortuneId || null,
      input.changeType,
      input.fieldPath || null,
      input.oldValue || null,
      input.newValue || null,
      input.triggeredRecalc ? 1 : 0,
      JSON.stringify(input.meta || {}),
    );
    return id;
  },

  listRecent: (userId: string, limit = 10) => {
    ensureProfileSettingsSchema();
    const rows = db.prepare(`
      SELECT * FROM profile_change_log
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `).all(userId, limit) as RawProfileChangeLogRow[];
    return rows.map(mapChangeLogRow);
  },
};

export function invalidateUserTimingProfile(userId: string) {
  ensureProfileSettingsSchema();
  db.prepare('DELETE FROM user_timing_profiles WHERE user_id = ?').run(userId);
}