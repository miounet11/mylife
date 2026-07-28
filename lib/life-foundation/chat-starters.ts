/**
 * 根据数据底座缺口生成 Chat 开场 starter（客户端 / 服务端均可）
 */

import type { LifeFoundationSnapshot } from '@/lib/life-foundation/types';

export type FoundationChatStarter = {
  id: string;
  text: string;
  /** 点击后若应跳转工具而非发消息 */
  href?: string;
  source: string;
};

/**
 * 有报告时：优先补缺口的对话句；无报告时：引导排盘/填参数
 */
export function buildFoundationChatStarters(
  foundation: LifeFoundationSnapshot | null | undefined,
  opts?: { hasReport?: boolean; en?: boolean },
): FoundationChatStarter[] {
  const en = Boolean(opts?.en);
  const hasReport = opts?.hasReport ?? Boolean(foundation?.hasReport);
  const out: FoundationChatStarter[] = [];

  if (!foundation) {
    return hasReport
      ? [
          {
            id: 'default_priority',
            text: en
              ? 'From my latest report, what should I prioritize first?'
              : '基于我的最新报告，现在最该优先推进的一件事是什么？',
            source: 'foundation_starter_default',
          },
        ]
      : [];
  }

  const next = foundation.nextSteps.slice(0, 4);

  for (const step of next) {
    if (step.itemId === 'birth_date' || step.itemId === 'pillars') {
      if (!hasReport) {
        out.push({
          id: 'need_report',
          text: en
            ? 'I want a structure report from my birth data first.'
            : '我想先用生辰生成一份结构报告，再继续深聊。',
          href: '/analyze?source=chat_foundation_starter',
          source: 'foundation_starter_analyze',
        });
      }
      continue;
    }

    if (step.itemId === 'qa_wizard' || step.layerId === 'life_qa') {
      out.push({
        id: `qa_${step.itemId}`,
        text: en
          ? `Help me fill life context: ${step.title}. Why does it matter?`
          : `帮我补一下「${step.title}」：为什么这对建议很重要？我该怎么说清楚现状。`,
        source: 'foundation_starter_life_qa',
      });
      continue;
    }

    if (step.layerId === 'body') {
      out.push({
        id: `body_${step.itemId}`,
        text: en
          ? `I haven't done ${step.title} yet — what should I prepare before uploading?`
          : `我还没做「${step.title}」。上传前要注意什么？做完后你会怎么和命盘交叉？`,
        href: step.href,
        source: 'foundation_starter_body',
      });
      continue;
    }

    if (step.layerId === 'astro') {
      out.push({
        id: 'astro',
        text: en
          ? 'How should I use sun sign / Chinese zodiac with my Bazi structure?'
          : '太阳星座和生肖，应该怎么和我的八字结构一起看，而不是两套系统打架？',
        source: 'foundation_starter_astro',
      });
      continue;
    }

    if (step.layerId === 'tools') {
      out.push({
        id: `tools_${step.itemId}`,
        text: en
          ? `Should I run “${step.title}” next for my current goal?`
          : `就我现在的目标，下一步要不要做「${step.title}」？做完会补哪一层参数？`,
        href: step.href,
        source: 'foundation_starter_tools',
      });
      continue;
    }

    if (step.layerId === 'interact') {
      out.push({
        id: `interact_${step.itemId}`,
        text: en
          ? 'What life events should I log so future advice can be calibrated?'
          : '我该先记录哪些人生事件，才能让后续建议可以回测校准？',
        source: 'foundation_starter_interact',
      });
    }
  }

  // Highlight existing tool signals as conversation hooks
  const hehun = foundation.appsHighlights?.hehun;
  if (hehun?.headline) {
    out.unshift({
      id: 'hehun_followup',
      text: en
        ? `About my compatibility result (${hehun.score ?? '—'}/100): what boundary should we set first?`
        : `结合我的合婚结果（${hehun.score ?? '—'}分 · ${hehun.band || ''}）：我们最先该对齐哪条边界？`,
      source: 'foundation_starter_hehun',
    });
  }

  const dim = foundation.appsHighlights?.dimension;
  if (dim?.title && dim?.summary) {
    out.unshift({
      id: 'dim_followup',
      text: en
        ? `On my last dimension “${dim.title}”: ${dim.summary.slice(0, 40)} — what’s the next action?`
        : `上次十维度「${dim.title}」说：${dim.summary.slice(0, 36)}… 下一步最该做什么？`,
      source: 'foundation_starter_dimension',
    });
  }

  // Deduplicate by text
  const seen = new Set<string>();
  const unique = out.filter((s) => {
    if (seen.has(s.text)) return false;
    seen.add(s.text);
    return true;
  });

  return unique.slice(0, 5);
}
