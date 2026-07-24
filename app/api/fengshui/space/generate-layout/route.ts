import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getApiBaseUrl, getApiKey } from '@/lib/env';
import { createOpenAiCompatibleChatCompletion } from '@/lib/openai-compatible-chat';
import {
  DOMAIN_LABELS,
  filterPresets,
  getPresetById,
  scalePresetToArea,
  type LayoutDomain,
} from '@/lib/fengshui/space/layout-presets';
import { parseOpeningsFromModelText } from '@/lib/fengshui/space/opening-suggest';
import { trackServerEvent } from '@/lib/analytics';

export const runtime = 'nodejs';
export const maxDuration = 90;

const MODEL_FAST = 'grok-4.3-fast';
const MODEL_HIGH = 'grok-4.3-high';

function resolveModel(raw: unknown): { model: string; tier: 'fast' | 'high' } {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (s.includes('high') || s === MODEL_HIGH) return { model: MODEL_HIGH, tier: 'high' };
  return { model: MODEL_FAST, tier: 'fast' };
}

function parseDomain(raw: unknown): LayoutDomain {
  if (
    raw === 'shop' ||
    raw === 'tomb' ||
    raw === 'residential' ||
    raw === 'villa' ||
    raw === 'rural' ||
    raw === 'office' ||
    raw === 'apartment'
  ) {
    return raw;
  }
  return 'residential';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain') || undefined;
  const layout = searchParams.get('layout') || undefined;
  const areaRaw = searchParams.get('areaSqm');
  const areaSqm = areaRaw ? Number(areaRaw) : undefined;
  const query = searchParams.get('q') || undefined;

  const domainParam = searchParams.get('domain');
  const domainFilter = parseDomain(domainParam || undefined);
  const presets = filterPresets({
    domain: domainParam ? domainFilter : undefined,
    layout: layout || undefined,
    areaSqm: Number.isFinite(areaSqm) ? areaSqm : undefined,
    query,
  }).map((p) => ({
    id: p.id,
    domain: p.domain,
    title: p.title,
    layout: p.layout,
    areaSqm: p.areaSqm,
    areaMin: p.areaMin,
    areaMax: p.areaMax,
    tags: p.tags,
    blurb: p.blurb,
    popularity: p.popularity,
    room: p.room,
  }));

  return NextResponse.json({
    success: true,
    domains: DOMAIN_LABELS,
    count: presets.length,
    presets,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const domain = parseDomain(body?.domain);
    const layout = typeof body?.layout === 'string' ? body.layout.trim().slice(0, 40) : '';
    const areaSqm = Number(body?.areaSqm);
    const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 400) : '';
    const entranceFacing =
      typeof body?.entranceFacing === 'string' && body.entranceFacing.trim()
        ? body.entranceFacing.trim().slice(0, 8)
        : domain === 'tomb'
          ? '南'
          : '南';
    const { model, tier } = resolveModel(body?.model);
    const preferPresetId = typeof body?.presetId === 'string' ? body.presetId : '';

    // 1) If user picked a catalog preset, return scaled geometry immediately
    if (preferPresetId) {
      const base = getPresetById(preferPresetId);
      if (!base) {
        return NextResponse.json({ success: false, error: '预设不存在' }, { status: 404 });
      }
      const scaled =
        Number.isFinite(areaSqm) && areaSqm > 0 ? scalePresetToArea(base, areaSqm) : base;
      void trackServerEvent({
        eventName: 'fengshui_layout_generate',
        page: '/tools/fengshui-space',
        meta: { mode: 'preset', domain, presetId: preferPresetId },
      });
      return NextResponse.json({
        success: true,
        mode: 'preset',
        model: null,
        preset: scaled,
        message: `已应用预设「${scaled.title}」${Number.isFinite(areaSqm) ? ` · 面积按 ${Math.round(areaSqm)}㎡ 缩放` : ''}`,
      });
    }

    // 2) Nearest catalog match (no LLM)
    const nearest = filterPresets({
      domain,
      layout: layout || undefined,
      areaSqm: Number.isFinite(areaSqm) ? areaSqm : undefined,
    });
    const catalogHit = nearest[0]
      ? Number.isFinite(areaSqm) && areaSqm > 0
        ? scalePresetToArea(nearest[0], areaSqm)
        : nearest[0]
      : null;

    const apiKey = getApiKey();
    if (!apiKey || body?.mode === 'catalog_only') {
      if (!catalogHit) {
        return NextResponse.json({ success: false, error: '未找到匹配预设' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        mode: 'catalog',
        model: null,
        preset: catalogHit,
        message: '已匹配目录预设（未调用模型）。',
      });
    }

    // 3) LLM customize on top of catalog seed
    const seed = catalogHit;
    const openai = new OpenAI({ apiKey, baseURL: getApiBaseUrl() || undefined });
    const system = `你是空间布局结构助手。为人生K线「空间场模拟」生成可加载的布局 JSON。
领域：${DOMAIN_LABELS[domain]}。
规则：
1. 只输出 JSON，不要吉凶词汇。
2. 坐标 x,y 归一化 0–1（左上 0,0，右下 1,1，y 向下）。
3. vents: kind inlet|outlet；azimuthDeg 0东 90北 180西 270南（屏幕向上为北）。
4. structures: kind box|column|arc，含 x,y,w,h,block(0-1)。
5. room: widthM, depthM, heightM, entranceFacing。
6. openings 可选，与 vents 语义一致时可省略。
格式：
{"title":"...","layout":"...","areaSqm":80,"room":{"widthM":8,"depthM":10,"heightM":2.8,"entranceFacing":"南"},"vents":[...],"lights":[{"x":0.5,"y":0.9,"azimuthDeg":90,"intensity":1.2,"followSun":true,"label":"主窗"}],"structures":[...],"notes":["结构说明1"]}`;

    const userPrompt = [
      `领域: ${domain}`,
      layout ? `布局: ${layout}` : '',
      Number.isFinite(areaSqm) ? `目标面积约 ${areaSqm} ㎡` : '',
      `入口朝向: ${entranceFacing}`,
      notes ? `补充: ${notes}` : '',
      seed
        ? `参考预设: ${seed.title} / ${seed.layout} / ${seed.areaSqm}㎡ / 面宽${seed.room.widthM}×进深${seed.room.depthM}`
        : '',
      '请生成 1 套结构合理、可用于模拟的布局。阳宅给室厅关系；商铺给门头/后仓；阴宅给穴位与祭台关系。',
    ]
      .filter(Boolean)
      .join('\n');

    let llmPreset: Record<string, unknown> | null = null;
    let mode: 'llm' | 'catalog' = 'catalog';
    let message = '';

    try {
      const completion = await createOpenAiCompatibleChatCompletion(
        openai,
        {
          model,
          temperature: tier === 'high' ? 0.35 : 0.25,
          maxTokens: tier === 'high' ? 1400 : 900,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
          ],
        },
        { timeout: tier === 'high' ? 60_000 : 35_000 },
      );
      const text = completion.choices?.[0]?.message?.content || '';
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const raw = (fenced?.[1] || text).trim();
      const parsed = JSON.parse(raw);
      if (parsed && parsed.room && Array.isArray(parsed.vents)) {
        llmPreset = parsed;
        mode = 'llm';
        message = `已用 ${model} 生成定制布局，可再微调风口。`;
      }
    } catch (err) {
      console.error('[fengshui/generate-layout] llm failed', err);
      message = '模型生成失败，已回退目录预设。';
    }

    // Also try openings parser if model returned openings only
    if (!llmPreset) {
      // leave null
    }

    if (!llmPreset && !catalogHit) {
      return NextResponse.json({ success: false, error: '无法生成布局' }, { status: 500 });
    }

    // Normalize LLM → preset-like object
    let presetOut: unknown = catalogHit;
    if (llmPreset) {
      const room = (llmPreset.room || {}) as Record<string, unknown>;
      const vents = Array.isArray(llmPreset.vents) ? llmPreset.vents : [];
      const lights = Array.isArray(llmPreset.lights) ? llmPreset.lights : [];
      const structures = Array.isArray(llmPreset.structures) ? llmPreset.structures : [];
      // if openings present, merge as vents
      const openings = parseOpeningsFromModelText(JSON.stringify(llmPreset));
      const ventList =
        vents.length > 0
          ? vents
          : (openings || []).map((o) => ({
              kind: o.kind,
              x: o.x,
              y: o.y,
              azimuthDeg: o.azimuthDeg,
              spreadDeg: o.spreadDeg,
              speed: o.speed,
              intensity: o.intensity,
              halfLifeSec: o.halfLifeSec,
              enabled: true,
            }));

      presetOut = {
        id: `llm-${domain}-${Date.now()}`,
        domain,
        title: String(llmPreset.title || '模型定制布局').slice(0, 40),
        layout: String(llmPreset.layout || layout || DOMAIN_LABELS[domain]).slice(0, 40),
        areaSqm: Number(llmPreset.areaSqm) || areaSqm || catalogHit?.areaSqm || 80,
        areaMin: 0,
        areaMax: 9999,
        tags: ['LLM', model],
        blurb: Array.isArray(llmPreset.notes)
          ? llmPreset.notes.slice(0, 3).join('；')
          : notes || '模型定制结构方案',
        popularity: 50,
        room: {
          widthM: Number(room.widthM) || catalogHit?.room.widthM || 8,
          depthM: Number(room.depthM) || catalogHit?.room.depthM || 10,
          heightM: Number(room.heightM) || catalogHit?.room.heightM || 2.8,
          entranceFacing: String(room.entranceFacing || entranceFacing).slice(0, 8),
          planRotationDeg: 0,
        },
        vents: ventList.slice(0, 10).map((v: Record<string, unknown>) => ({
          kind: v.kind === 'outlet' ? 'outlet' : 'inlet',
          x: Number(v.x) || 0.5,
          y: Number(v.y) || 0.5,
          azimuthDeg: Number(v.azimuthDeg) || 90,
          spreadDeg: Number(v.spreadDeg) || 80,
          speed: Number(v.speed) || 36,
          intensity: Number(v.intensity) || 1.8,
          halfLifeSec: Number(v.halfLifeSec) || 12,
          enabled: v.enabled !== false,
        })),
        lights: lights.slice(0, 6).map((l: Record<string, unknown>) => ({
          x: Number(l.x) || 0.5,
          y: Number(l.y) || 0.85,
          azimuthDeg: Number(l.azimuthDeg) || 90,
          intensity: Number(l.intensity) || 1.2,
          followSun: l.followSun !== false,
          label: String(l.label || '采光').slice(0, 30),
          enabled: true,
        })),
        structures: structures.slice(0, 16).map((s: Record<string, unknown>) => ({
          kind: s.kind === 'column' || s.kind === 'arc' ? s.kind : 'box',
          x: Number(s.x) || 0.2,
          y: Number(s.y) || 0.2,
          w: Number(s.w) || 0.2,
          h: Number(s.h) || 0.2,
          block: Number(s.block) || 0.45,
        })),
      };
    }

    void trackServerEvent({
      eventName: 'fengshui_layout_generate',
      page: '/tools/fengshui-space',
      meta: { mode, domain, model: mode === 'llm' ? model : 'none', tier },
    });

    return NextResponse.json({
      success: true,
      mode,
      model: mode === 'llm' ? model : null,
      tier,
      preset: presetOut,
      catalogFallbackId: catalogHit?.id || null,
      message: message || (mode === 'llm' ? '生成完成' : '已使用目录预设'),
    });
  } catch (error) {
    console.error('[fengshui/generate-layout]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成失败' },
      { status: 500 },
    );
  }
}
