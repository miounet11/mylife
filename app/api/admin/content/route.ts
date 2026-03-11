import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  deleteManagedContentEntry,
  listManagedContentEntries,
  saveManagedContentEntry,
} from '@/lib/content-store';

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    return null;
  }
  return session.user;
}

export async function GET() {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    entries: listManagedContentEntries(),
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const entry = saveManagedContentEntry(body, user.id);
    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('[API] 创建内容失败:', error);
    return NextResponse.json({ success: false, error: '创建失败，请检查字段' }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const entry = saveManagedContentEntry(body, user.id);
    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('[API] 更新内容失败:', error);
    return NextResponse.json({ success: false, error: '更新失败，请检查字段' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    deleteManagedContentEntry(`${body.id || ''}`);
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[API] 删除内容失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 400 });
  }
}
