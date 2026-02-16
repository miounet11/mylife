// AI聊天API
import { NextRequest, NextResponse } from 'next/server';

// 模拟AI模型（实际应该调用真实的AI API）
async function generateAIResponse(
  question: string,
  userHistory: any[]
): Promise<string> {
  // 根据问题生成响应
  const responses: Record<string, string> = {
    '事业': `根据您的八字，您最近问的"${question}"...从您的日主来看，事业运势呈上升趋势。建议把握当前机遇，争取在事业上有所突破。南方为事业吉方，可往南方发展。`,
    '财运': `关于您的${question}，从您的命局来看，财运整体平稳。正财得用，适合正职工作，副业亦可。建议南方求财，宜穿红色系衣服，提升财运。`,
    '婚姻': `您询问的"${question}"，从夫妻宫来看，婚姻运势良好。近期有桃花出现，建议把握机会。与属猴、属鸡的人结婚，婚姻更美满。`,
    '健康': `关于您的健康问题，从您的八字来看，要注意脾胃健康。木旺克土，建议多食黄色食物，养脾胃。东方为健康吉方，适合就医、锻炼。`,
  };

  // 简单匹配
  if (question.includes('事业') || question.includes('工作') || question.includes('升职')) {
    return responses['事业'];
  }
  if (question.includes('钱') || question.includes('财') || question.includes('投资')) {
    return responses['财运'];
  }
  if (question.includes('恋爱') || question.includes('结婚') || question.includes('对象')) {
    return responses['婚姻'];
  }
  if (question.includes('健康') || question.includes('身体') || question.includes('病')) {
    return responses['健康'];
  }

  // 默认响应
  return `关于您的"${question}"，从您的八字来看，这是一个很有深度的问题。建议您提供更多背景信息，我可以给您更详细的分析。`;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { question, userId, sessionId } = data;

    if (!question || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 生成AI响应
    const answer = await generateAIResponse(question, []);

    // 返回响应
    return NextResponse.json({
      success: true,
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] AI聊天失败:', error);
    return NextResponse.json(
      { success: false, error: '聊天失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// GET方法 - 聊天历史
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url!);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: '缺少用户ID' },
      { status: 400 }
    );
  }

  // 模拟获取历史
  const chatHistory = [
    {
      id: '1',
      role: 'user',
      content: '我最近事业运如何？',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      role: 'assistant',
      content: '根据您的八字，您最近的事业运势呈上升趋势...',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
  ];

  return NextResponse.json({
    success: true,
    history: chatHistory,
    timestamp: new Date().toISOString(),
  });
}
