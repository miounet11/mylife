import { NextResponse } from 'next/server';
import { logoutCurrentSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  await logoutCurrentSession();
  return NextResponse.json({ success: true });
}