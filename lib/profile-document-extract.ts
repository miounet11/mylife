import { fortuneOperations } from '@/lib/database';
import { emailInboxStore } from '@/lib/email-inbox-store';
import type { ProfileDocumentCategory } from '@/lib/profile-settings-types';

export type ProfileDocumentExtractDraft = {
  title: string;
  category: ProfileDocumentCategory;
  content: string;
  source: 'email' | 'report' | 'email_thread';
  sourceId: string;
  fortuneId?: string | null;
};

function clip(text: string, max = 1800) {
  const normalized = `${text || ''}`.replace(/\s+\n/g, '\n').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max)}…`;
}

function categoryFromEmail(category: string): ProfileDocumentCategory {
  if (category === 'daily' || category === 'monthly' || category === 'major_event') return 'life_event';
  if (category === 'report') return 'career_note';
  if (category === 'lifecycle') return 'other';
  return 'other';
}

function categoryFromIntent(intent?: string | null): ProfileDocumentCategory {
  if (intent === 'relationship') return 'relationship_note';
  if (intent === 'career' || intent === 'wealth' || intent === 'yearly') return 'career_note';
  return 'other';
}

export function extractDocumentFromEmail(
  messageId: string,
  userEmail: string,
): ProfileDocumentExtractDraft | null {
  const message = emailInboxStore.getById(messageId);
  if (!message || message.email.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
    return null;
  }

  const replies = emailInboxStore.listReplies(message.id);
  const inbound = replies.filter((item) => item.direction === 'inbound').map((item) => item.body).filter(Boolean);
  const outbound = replies.filter((item) => item.direction === 'outbound').map((item) => item.answer || item.body).filter(Boolean);

  const lines = [
    `【邮件主题】${message.subject}`,
    `【发送时间】${message.sentAt}`,
    `【摘要】${message.preview}`,
    message.bodyText ? `【正文】${message.bodyText}` : '',
    inbound.length ? `【我的追问】\n${inbound.join('\n\n')}` : '',
    outbound.length ? `【专业回复】\n${outbound.join('\n\n')}` : '',
  ].filter(Boolean);

  return {
    title: clip(message.subject, 80) || '邮件往来记录',
    category: categoryFromEmail(message.category),
    content: clip(lines.join('\n\n')),
    source: inbound.length || outbound.length ? 'email_thread' : 'email',
    sourceId: message.id,
    fortuneId: message.reportId || null,
  };
}

export function extractDocumentFromReport(
  reportId: string,
  userId: string,
): ProfileDocumentExtractDraft | null {
  const fortune = fortuneOperations.getById(reportId);
  if (!fortune || fortune.userId !== userId) {
    return null;
  }

  const analysis = (fortune.analysis || {}) as Record<string, unknown>;
  const advice = (fortune.advice || {}) as Record<string, unknown>;
  const pattern = (fortune.pattern || {}) as { type?: string; description?: string };
  const intent = (fortune as { intent?: string }).intent || null;

  const highlights: string[] = [];
  if (pattern.type) highlights.push(`格局：${pattern.type}`);
  if (pattern.description) highlights.push(pattern.description);
  if (typeof analysis.summary === 'string') highlights.push(`摘要：${analysis.summary}`);
  if (typeof analysis.explanation === 'string') highlights.push(`解读：${analysis.explanation.slice(0, 400)}`);

  const careerAdvice = advice.career as { general?: string; specific?: string[] } | undefined;
  if (careerAdvice?.general) highlights.push(`事业：${careerAdvice.general}`);
  if (Array.isArray(careerAdvice?.specific) && careerAdvice.specific.length) {
    highlights.push(`事业建议：${careerAdvice.specific.slice(0, 3).join('；')}`);
  }

  const wealthAdvice = advice.wealth as { general?: string } | undefined;
  if (wealthAdvice?.general) highlights.push(`财运：${wealthAdvice.general}`);

  const marriageAdvice = advice.marriage as { general?: string } | undefined;
  if (marriageAdvice?.general) highlights.push(`关系：${marriageAdvice.general}`);

  if (!highlights.length) {
    highlights.push(`档案：${fortune.name}，出生 ${fortune.birthDate} ${fortune.birthPlace || ''}`.trim());
  }

  return {
    title: `${fortune.name} · 报告要点摘录`,
    category: categoryFromIntent(intent),
    content: clip(highlights.join('\n\n')),
    source: 'report',
    sourceId: reportId,
    fortuneId: reportId,
  };
}