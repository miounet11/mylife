import { NextResponse } from 'next/server';
import { getSavedReportById } from '@/lib/membership-store';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ success: false, error: '缺少报告 ID' }, { status: 400 });
  }

  const record = getSavedReportById(id);
  if (!record) {
    return NextResponse.json({ success: false, error: '未找到报告' }, { status: 404 });
  }

  let snapshot: unknown = null;
  try {
    snapshot = JSON.parse(record.snapshot);
  } catch {
    snapshot = null;
  }

  return NextResponse.json({
    success: true,
    report: {
      id: record.id,
      email: record.email,
      birthDate: record.birthDate,
      birthTime: record.birthTime,
      birthPlace: record.birthPlace,
      intent: record.intent,
      birthAccuracy: record.birthAccuracy,
      createdAt: record.createdAt,
      snapshot,
    },
  });
}