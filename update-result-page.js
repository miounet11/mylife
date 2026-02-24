const fs = require('fs');

const path = 'app/result/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the mock getResult with real one
const newGetResult = `import { fortuneOperations } from '@/lib/database';

async function getResult(reportId: string) {
  try {
    const fortuneData = fortuneOperations.getById(reportId);
    if (!fortuneData) return null;

    // Transform database format to match frontend expectations
    return {
      basic: {
        name: fortuneData.name || '测算者',
        dayMaster: fortuneData.bazi?.dayMaster || '未知',
        ...fortuneData.bazi
      },
      fiveElements: fortuneData.fiveElements,
      tenGods: fortuneData.tenGods,
      pattern: fortuneData.pattern,
      fortune: fortuneData.fortune,
      advice: fortuneData.advice,
      evidence: fortuneData.evidence,
      analysis: fortuneData.analysis || {
        opening: '细观您的八字，命理之象，历历在目。',
        explanation: '（加载中或模型未生成深度解析）'
      }
    };
  } catch(e) {
    console.error("Error fetching report:", e);
    return null;
  }
}`;

content = content.replace(/async function getResult\(reportId: string\) \{[\s\S]*?\}\n\nexport default async function ResultPage/, newGetResult + '\n\nexport default async function ResultPage');

// Add the import at the top if not exists
if (!content.includes("import { fortuneOperations }")) {
  // It's already in the replacement above, but wait, imports should be at the top level
  // Actually, I put the import above getResult, which is fine in some cases but better at the top.
}

fs.writeFileSync(path, content);
