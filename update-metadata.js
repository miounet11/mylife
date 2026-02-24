const fs = require('fs');
const path = 'app/result/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The original generateMetadata was very simple. Let's make it fetch data and use dynamic metadata
const replacement = `export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const fortuneData = fortuneOperations.getById(id);
    if (fortuneData) {
      return {
        title: \`\${fortuneData.name}的八字命理分析报告 | 人生K线\`,
        description: \`\${fortuneData.name}的专属AI命理解析，基于传统子平八字与现代AI技术，深度解析事业、财富、婚姻与健康。\`,
        openGraph: {
          title: \`\${fortuneData.name}的专属命理分析 | 人生K线\`,
          description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
        },
      };
    }
  } catch(e) {
    // ignore
  }
  
  return {
    title: '您的命理分析报告 | 人生K线',
    description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
  };
}

import { fortuneOperations } from '@/lib/database';`;

content = content.replace(/export async function generateMetadata[\s\S]*?import \{ fortuneOperations \} from '@\/lib\/database';/, replacement);

fs.writeFileSync(path, content);
console.log("Updated metadata in app/result/[id]/page.tsx");
