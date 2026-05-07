import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import {
  deleteLlmProviderConfig,
  ensureDefaultLlmProviderConfigs,
  listMaskedLlmProviderConfigs,
  saveLlmProviderConfig,
} from '@/lib/llm-provider-configs';

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

  ensureDefaultLlmProviderConfigs(user.id);

  return NextResponse.json({
    success: true,
    providers: listMaskedLlmProviderConfigs(),
  });
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const provider = saveLlmProviderConfig(body, user.id);
    return NextResponse.json({
      success: true,
      provider: provider ? {
        ...provider,
        apiKey: undefined,
        hasApiKey: Boolean(provider.apiKey),
      } : null,
    });
  } catch (error) {
    console.error('[API] 保存 LLM provider 失败:', error);
    return NextResponse.json({ success: false, error: '保存失败，请检查字段' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ success: false, error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await request.json();
    deleteLlmProviderConfig(`${body.id || ''}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] 删除 LLM provider 失败:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 400 });
  }
}
