import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import Database from 'better-sqlite3';

export const maxDuration = 10;

interface RecallPayload {
  action: 'returned_to_site' | 'completed_view' | 'session_end';
  reportId?: string;
  pointId?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  email?: string;
  sessionDurationMs?: number;
  pagesViewed?: number;
}

export async function POST(request: NextRequest) {
  let body: RecallPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'invalid json' }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ success: false, error: 'missing action' }, { status: 400 });
  }

  const db = new Database(path.join(process.cwd(), 'data', 'lifekline.db'));
  try {
    // 关联 email_log_id
    let emailLogId: string | null = null;
    if (body.utm_campaign && body.email) {
      const row = db.prepare(
        `SELECT id FROM timing_email_log WHERE email = ? AND campaign = ? LIMIT 1`
      ).get(body.email, body.utm_campaign) as { id: string } | undefined;
      if (row) emailLogId = row.id;
    }

    const id = `recall_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`
      INSERT INTO timing_email_recall_log
        (id, email, email_log_id, action, landed_at, landed_point_id,
         session_duration_ms, pages_viewed, utm_source, utm_medium, utm_campaign)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.email || null,
      emailLogId,
      body.action,
      body.reportId ? `/r/${body.reportId}` : null,
      body.pointId || null,
      body.sessionDurationMs || null,
      body.pagesViewed || null,
      body.utm_source || null,
      body.utm_medium || null,
      body.utm_campaign || null,
    );

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
