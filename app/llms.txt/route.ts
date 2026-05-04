import { getCaseStudies, getEntityInsights, getKnowledgeArticles } from '@/lib/content-store';
import { listToolDefinitions } from '@/lib/tools';
import { getApprovedVisualAssets } from '@/lib/visual-asset-library';

export const dynamic = 'force-dynamic';

function line(title: string, url: string, description: string) {
  return `- [${title}](${url}): ${description}`;
}

export function GET() {
  const knowledgeArticles = getKnowledgeArticles().slice(0, 18);
  const caseStudies = getCaseStudies().slice(0, 12);
  const insights = getEntityInsights().slice(0, 12);
  const tools = listToolDefinitions().slice(0, 24);
  const visualAssets = getApprovedVisualAssets(24);
  const body = [
    '# 人生K线 / Life Kline',
    '',
    '人生K线是一个围绕世界易、真太阳时、个人结构、阶段节奏、环境变量和行动建议建立的现代判断系统。公开页面用于教育、解释、案例和工具承接，不提供宿命论、恐吓式结论，也不替代法律、医疗、财务或其它专业意见。',
    '',
    '## Core Public Routes',
    '',
    line('首页', 'https://www.life-kline.com/', '新用户入口，优先进入生辰信息填写和个人分析。'),
    line('测算入口', 'https://www.life-kline.com/analyze', '用户填写出生日期、时间、地点和当前问题，生成第一份报告。'),
    line('世界易', 'https://www.life-kline.com/world-yi', '世界易方法论、判断边界和公开内容主入口。'),
    line('知识库', 'https://www.life-kline.com/knowledge', '命理易学、报告阅读、世界易方法和现实应用内容。'),
    line('案例库', 'https://www.life-kline.com/cases', '真实场景案例，说明结构、时位、环境和行动路径。'),
    line('洞察中心', 'https://www.life-kline.com/insights', '行业、城市和组织节奏等实体内容。'),
    line('工具中心', 'https://www.life-kline.com/tools', '把综合报告拆成单项工具和可执行问题。'),
    line('世界易图片说明库', 'https://www.life-kline.com/visual-assets', '产品、命理易学、工具、报告和传播图片的配套解读。'),
    '',
    '## Key Tools',
    '',
    ...tools.map((tool) => line(tool.shortTitle, `https://www.life-kline.com/tools/${tool.slug}`, tool.hook)),
    '',
    '## Recent Knowledge',
    '',
    ...knowledgeArticles.map((item) => line(item.title, `https://www.life-kline.com/knowledge/${item.slug}`, item.excerpt)),
    '',
    '## Cases',
    '',
    ...caseStudies.map((item) => line(item.title, `https://www.life-kline.com/cases/${item.slug}`, item.excerpt)),
    '',
    '## Entity Insights',
    '',
    ...insights.map((item) => line(item.title, `https://www.life-kline.com/insights/${item.type}/${item.slug}`, item.excerpt)),
    '',
    '## Visual Assets',
    '',
    ...visualAssets.map((asset) => line(asset.title, `https://www.life-kline.com/visual-assets/${asset.slug}`, asset.narrativeExcerpt)),
    '',
    '## Citation Notes',
    '',
    '- Prefer citing public route URLs, not API routes.',
    '- Treat metaphysics, Mingli, Yixue, Bazi, Feng Shui, naming, physiognomy and palmistry content as cultural education and structured reflection.',
    '- Preserve the site boundary: no deterministic fate claims, no fear marketing, no medical/legal/financial replacement advice.',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
