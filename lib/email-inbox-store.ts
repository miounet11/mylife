import path from 'node:path';
import Database from 'better-sqlite3';
import { generateId } from '@/lib/utils';

export type EmailInboxMessageRecord = {
  id: string;
  email: string;
  userId?: string | null;
  reportId?: string | null;
  sourceLogId?: string | null;
  category: string;
  campaign?: string | null;
  subject: string;
  preview: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  replyToken: string;
  meta?: Record<string, unknown>;
  sentAt: string;
  createdAt: string;
};

export type EmailReplyMessageRecord = {
  id: string;
  inboxMessageId: string;
  email: string;
  direction: 'inbound' | 'outbound';
  channel: 'web' | 'email';
  body: string;
  answer?: string | null;
  llmModel?: string | null;
  status: 'pending' | 'answered' | 'failed';
  meta?: Record<string, unknown>;
  createdAt: string;
};

let schemaReady = false;

function getDb(readonly = false) {
  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'), { readonly });
  if (!readonly && !schemaReady) {
    ensureSchema(db);
    schemaReady = true;
  }
  return db;
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_inbox_messages (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      user_id TEXT,
      report_id TEXT,
      source_log_id TEXT,
      category TEXT NOT NULL,
      campaign TEXT,
      subject TEXT NOT NULL,
      preview TEXT NOT NULL,
      body_text TEXT,
      body_html TEXT,
      reply_token TEXT NOT NULL UNIQUE,
      meta TEXT,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_email_inbox_messages_email_sent
      ON email_inbox_messages(email, sent_at DESC);
    CREATE INDEX IF NOT EXISTS idx_email_inbox_messages_reply_token
      ON email_inbox_messages(reply_token);

    CREATE TABLE IF NOT EXISTS email_reply_messages (
      id TEXT PRIMARY KEY,
      inbox_message_id TEXT NOT NULL,
      email TEXT NOT NULL,
      direction TEXT NOT NULL,
      channel TEXT NOT NULL,
      body TEXT NOT NULL,
      answer TEXT,
      llm_model TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      meta TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(inbox_message_id) REFERENCES email_inbox_messages(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_email_reply_messages_inbox
      ON email_reply_messages(inbox_message_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_email_reply_messages_email
      ON email_reply_messages(email, created_at DESC);
  `);
}

function parseMeta(raw?: string | null) {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function mapInboxRow(row: Record<string, unknown>): EmailInboxMessageRecord {
  return {
    id: `${row.id}`,
    email: `${row.email}`,
    userId: row.user_id ? `${row.user_id}` : null,
    reportId: row.report_id ? `${row.report_id}` : null,
    sourceLogId: row.source_log_id ? `${row.source_log_id}` : null,
    category: `${row.category}`,
    campaign: row.campaign ? `${row.campaign}` : null,
    subject: `${row.subject}`,
    preview: `${row.preview}`,
    bodyText: row.body_text ? `${row.body_text}` : null,
    bodyHtml: row.body_html ? `${row.body_html}` : null,
    replyToken: `${row.reply_token}`,
    meta: parseMeta(row.meta as string | null),
    sentAt: `${row.sent_at}`,
    createdAt: `${row.created_at}`,
  };
}

function mapReplyRow(row: Record<string, unknown>): EmailReplyMessageRecord {
  return {
    id: `${row.id}`,
    inboxMessageId: `${row.inbox_message_id}`,
    email: `${row.email}`,
    direction: row.direction === 'outbound' ? 'outbound' : 'inbound',
    channel: row.channel === 'email' ? 'email' : 'web',
    body: `${row.body}`,
    answer: row.answer ? `${row.answer}` : null,
    llmModel: row.llm_model ? `${row.llm_model}` : null,
    status: row.status === 'answered' || row.status === 'failed' ? row.status : 'pending',
    meta: parseMeta(row.meta as string | null),
    createdAt: `${row.created_at}`,
  };
}

export const emailInboxStore = {
  recordOutboundMessage(input: {
    email: string;
    userId?: string | null;
    reportId?: string | null;
    sourceLogId?: string | null;
    category: string;
    campaign?: string | null;
    subject: string;
    preview: string;
    bodyText?: string | null;
    bodyHtml?: string | null;
    meta?: Record<string, unknown>;
    sentAt?: string;
  }) {
    const db = getDb();
    try {
      const id = `eml_${generateId()}`;
      const replyToken = `rpl_${generateId()}`;
      db.prepare(`
        INSERT INTO email_inbox_messages (
          id, email, user_id, report_id, source_log_id, category, campaign,
          subject, preview, body_text, body_html, reply_token, meta, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        input.email.trim().toLowerCase(),
        input.userId || null,
        input.reportId || null,
        input.sourceLogId || null,
        input.category,
        input.campaign || null,
        input.subject,
        input.preview,
        input.bodyText || null,
        input.bodyHtml || null,
        replyToken,
        JSON.stringify(input.meta || {}),
        input.sentAt || new Date().toISOString(),
      );
      return emailInboxStore.getById(id);
    } finally {
      db.close();
    }
  },

  listByEmail(email: string, limit = 40) {
    const db = getDb(true);
    try {
      const rows = db.prepare(`
        SELECT * FROM email_inbox_messages
        WHERE email = ?
        ORDER BY datetime(sent_at) DESC, datetime(created_at) DESC
        LIMIT ?
      `).all(email.trim().toLowerCase(), limit) as Array<Record<string, unknown>>;
      return rows.map(mapInboxRow);
    } finally {
      db.close();
    }
  },

  getById(id: string) {
    const db = getDb(true);
    try {
      const row = db.prepare(`SELECT * FROM email_inbox_messages WHERE id = ? LIMIT 1`).get(id) as Record<string, unknown> | undefined;
      return row ? mapInboxRow(row) : null;
    } finally {
      db.close();
    }
  },

  getByReplyToken(replyToken: string) {
    const db = getDb(true);
    try {
      const row = db.prepare(`SELECT * FROM email_inbox_messages WHERE reply_token = ? LIMIT 1`).get(replyToken) as Record<string, unknown> | undefined;
      return row ? mapInboxRow(row) : null;
    } finally {
      db.close();
    }
  },

  listReplies(inboxMessageId: string) {
    const db = getDb(true);
    try {
      const rows = db.prepare(`
        SELECT * FROM email_reply_messages
        WHERE inbox_message_id = ?
        ORDER BY datetime(created_at) ASC
      `).all(inboxMessageId) as Array<Record<string, unknown>>;
      return rows.map(mapReplyRow);
    } finally {
      db.close();
    }
  },

  createInboundReply(input: {
    inboxMessageId: string;
    email: string;
    body: string;
    channel?: 'web' | 'email';
  }) {
    const db = getDb();
    try {
      const id = `erpl_${generateId()}`;
      db.prepare(`
        INSERT INTO email_reply_messages (
          id, inbox_message_id, email, direction, channel, body, status, meta
        ) VALUES (?, ?, ?, 'inbound', ?, ?, 'pending', ?)
      `).run(
        id,
        input.inboxMessageId,
        input.email.trim().toLowerCase(),
        input.channel || 'web',
        input.body,
        JSON.stringify({ createdAt: new Date().toISOString() }),
      );
      return emailInboxStore.getReplyById(id);
    } finally {
      db.close();
    }
  },

  getReplyById(id: string) {
    const db = getDb(true);
    try {
      const row = db.prepare(`SELECT * FROM email_reply_messages WHERE id = ? LIMIT 1`).get(id) as Record<string, unknown> | undefined;
      return row ? mapReplyRow(row) : null;
    } finally {
      db.close();
    }
  },

  markReplyAnswered(id: string, answer: string, llmModel?: string | null) {
    const db = getDb();
    try {
      db.prepare(`
        UPDATE email_reply_messages
        SET status = 'answered',
            answer = ?,
            llm_model = ?,
            meta = ?
        WHERE id = ?
      `).run(
        answer,
        llmModel || null,
        JSON.stringify({ answeredAt: new Date().toISOString() }),
        id,
      );
      return emailInboxStore.getReplyById(id);
    } finally {
      db.close();
    }
  },

  markReplyFailed(id: string, error: string) {
    const db = getDb();
    try {
      db.prepare(`
        UPDATE email_reply_messages
        SET status = 'failed',
            meta = ?
        WHERE id = ?
      `).run(JSON.stringify({ failedAt: new Date().toISOString(), error: error.slice(0, 500) }), id);
      return emailInboxStore.getReplyById(id);
    } finally {
      db.close();
    }
  },

  backfillFromTimingLog(email: string, limit = 30) {
    const db = getDb();
    try {
      const rows = db.prepare(`
        SELECT id, email, category, campaign, report_id, sent_at, meta, status
        FROM timing_email_log
        WHERE email = ? AND status = 'sent'
        ORDER BY datetime(sent_at) DESC
        LIMIT ?
      `).all(email.trim().toLowerCase(), limit) as Array<Record<string, unknown>>;

      let created = 0;
      for (const row of rows) {
        const sourceLogId = `${row.id}`;
        const existing = db.prepare(`
          SELECT id FROM email_inbox_messages WHERE source_log_id = ? LIMIT 1
        `).get(sourceLogId);
        if (existing) continue;

        const category = `${row.category}`;
        const campaign = row.campaign ? `${row.campaign}` : '';
        const subject = buildLegacySubject(category, campaign);
        const preview = buildLegacyPreview(category, campaign, row.meta as string | null);
        emailInboxStore.recordOutboundMessage({
          email: `${row.email}`,
          reportId: row.report_id ? `${row.report_id}` : null,
          sourceLogId,
          category,
          campaign,
          subject,
          preview,
          bodyText: preview,
          meta: { backfilled: true, timingLogStatus: row.status },
          sentAt: `${row.sent_at}`,
        });
        created += 1;
      }
      return created;
    } finally {
      db.close();
    }
  },
};

function buildLegacySubject(category: string, campaign: string) {
  if (category === 'daily') return `${campaign} · 日常运势提醒`;
  if (category === 'monthly') return `${campaign} · 月度窗口提醒`;
  if (category === 'solar_term') return `${campaign} · 节气过渡提醒`;
  if (category === 'major_event') return `${campaign} · 命理大事提醒`;
  return '人生K线 · 邮件提醒';
}

function buildLegacyPreview(category: string, campaign: string, metaRaw?: string | null) {
  const meta = parseMeta(metaRaw);
  if (typeof meta.preview === 'string' && meta.preview.trim()) {
    return meta.preview.trim();
  }
  if (category === 'daily') return '已发送今日运势细节与注意事项。';
  if (category === 'monthly') return '已发送本月关键时点与行动建议。';
  if (category === 'solar_term') return '已发送节气切换前后的生活建议。';
  if (category === 'major_event') return '已发送命理大事节点提醒。';
  return campaign ? `系统提醒：${campaign}` : '系统已向你发送一封运势相关邮件。';
}