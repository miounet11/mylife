import { callJsonLLM } from '@/lib/agentic-report/llm-client';

type EmailReplyContext = {
  subject: string;
  preview: string;
  category: string;
  reportSummary?: string;
  profileContextSummary?: string;
  focusItems?: Array<{ label: string; value: string }>;
};

type EmailReplyResult = {
  answer: string;
  model: string;
};

export async function generateProfessionalEmailReply(params: {
  userQuestion: string;
  message: EmailReplyContext;
}): Promise<EmailReplyResult | null> {
  const focusBlock = (params.message.focusItems || [])
    .slice(0, 3)
    .map((item) => `- ${item.label}：${item.value}`)
    .join('\n');

  const result = await callJsonLLM<{ answer: string }>({
    system: [
      '你是人生K线（Life Kline）的专业命理顾问回复助手。',
      '你的任务：针对用户对已收到邮件的追问，给出克制、专业、可执行的中文回答。',
      '要求：',
      '1. 只基于邮件主题、摘要和用户问题作答，不编造用户未提供的命盘细节。',
      '2. 语气稳重、可信，避免夸张承诺和恐吓式表达。',
      '3. 给出 2-4 条具体建议，必要时说明“需结合完整报告进一步判断”。',
      '4. 不做医疗、法律、投资建议，不判断具体疾病或违法事项。',
      '5. 输出 JSON：{"answer":"..."}，answer 为完整回复正文，300-500 字。',
    ].join('\n'),
    user: [
      `邮件主题：${params.message.subject}`,
      `邮件摘要：${params.message.preview}`,
      `邮件类型：${params.message.category}`,
      params.message.reportSummary ? `报告摘要：${params.message.reportSummary}` : '',
      params.message.profileContextSummary ? `用户补充资料：\n${params.message.profileContextSummary}` : '',
      focusBlock ? `用户关注重点：\n${focusBlock}` : '',
      `用户追问：${params.userQuestion}`,
    ].filter(Boolean).join('\n\n'),
    temperature: 0.35,
    timeoutMs: 45000,
    traceLabel: 'email_reply_assistant',
    scope: 'agent',
  });

  const answer = `${result?.answer || ''}`.trim();
  if (!answer) {
    return null;
  }

  return {
    answer,
    model: process.env.DEFAULT_MODEL || 'auto',
  };
}