// @ts-nocheck
import { NextResponse } from 'next/server';
import { saveReportSnapshot, upsertLead } from '@/lib/membership-store';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const source = typeof body.source === 'string' ? body.source.slice(0, 64) : 'direct';
    const intent = typeof body.intent === 'string' ? body.intent.slice(0, 32) : undefined;
    const birthDate = typeof body.birthDate === 'string' ? body.birthDate : undefined;
    const birthTime = typeof body.birthTime === 'string' ? body.birthTime : undefined;
    const birthPlace = typeof body.birthPlace === 'string' ? body.birthPlace : undefined;
    const birthAccuracy = typeof body.birthAccuracy === 'string' ? body.birthAccuracy : undefined;
    const reportSnapshot = body.reportSnapshot;

    if (birthDate && reportSnapshot) {
      const saved = saveReportSnapshot({
        email,
        birthDate,
        birthTime,
        birthPlace,
        intent,
        birthAccuracy,
        snapshot: reportSnapshot,
      });

      console.info('[membership lead] report_saved', {
        email,
        source,
        reportId: saved.id,
      });

      return NextResponse.json({
        ok: true,
        leadId: saved.id,
        reportId: saved.id,
        email,
        status: 'lead',
        saved: true,
      });
    }

    const lead = upsertLead({
      email,
      source,
      intent,
      birthDate,
      birthTime,
      birthPlace,
      birthAccuracy,
      reportId: typeof body.reportId === 'string' ? body.reportId : undefined,
    });

    console.info('[membership lead] captured', {
      email,
      source,
      leadId: lead.id,
    });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      email,
      status: 'lead',
      saved: false,
    });
  } catch (err: any) {
    console.error('[membership lead]', err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}