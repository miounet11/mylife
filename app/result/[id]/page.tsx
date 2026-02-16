// 命理分析结果页面
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 动态导入以减少首屏加载
const TrustReport = dynamic(() => import('@/components/trust-report'), {
  loading: () => <ReportSkeleton />,
});

const FortuneChart = dynamic(() => import('@/components/fortune-chart'), {
  loading: () => <ChartSkeleton />,
});

const NextStepGuide = dynamic(() => import('@/components/next-step-guide'), {
  loading: () => <GuideSkeleton />,
});

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: '您的命理分析报告 | 人生K线',
    description: 'AI驱动的八字命理分析，像真正的大师一样精准可信',
  };
}

async function getResult(reportId: string) {
  // 这里应该从数据库获取
  // 暂时返回模拟数据
  return {
    basic: {
      name: '张先生',
      dayMaster: '甲',
      pillars: [
        { celestialStem: '甲', earthlyBranch: '辰', nayin: '海中金' },
        { celestialStem: '丙', earthlyBranch: '寅', nayin: '炉中火' },
        { celestialStem: '甲', earthlyBranch: '寅', nayin: '大溪水' },
        { celestialStem: '丙', earthlyBranch: '寅', nayin: '炉中火' },
      ],
    },
    fiveElements: {
      wood: { strength: 25, quality: 'strong', description: '木旺，性格刚毅，有领导力' },
      fire: { strength: 30, quality: 'strong', description: '火旺，热情开朗，善于表达' },
      earth: { strength: 15, quality: 'weak', description: '土弱，缺乏安全感' },
      metal: { strength: 10, quality: 'weak', description: '金弱，优柔寡断' },
      water: { strength: 20, quality: 'medium', description: '水适中，聪明伶俐' },
    },
    tenGods: {
      self: '甲',
      output: ['丙', '丁'],
      input: ['戊', '己'],
      control: ['庚', '辛'],
      controlled: ['壬', '癸'],
    },
    pattern: {
      type: '从杀格',
      strength: 'strong',
      quality: 'excellent',
      description: '日主从杀，七杀透干，格局清奇，主事业有成，权力在握',
    },
    fortune: {
      currentDaYun: '丙子大运',
      currentLiuNian: '甲辰流年',
      interaction: '甲辰与丙子形成合局，利于合作、求财、婚姻',
      nextYear: '乙巳年，巳火生午土，事业上升，财运亨通',
    },
    advice: {
      career: {
        general: '您的命局适合从政、管理、金融、司法等领域',
        specific: [
          '若您从事管理，2024-2026年是上升期，可争取升职',
          '适合创业，选择火、土相关的行业，如科技、教育、金融',
          '注意与属猴、属鸡的人合作，利于事业发展',
          '不宜与属龙的人产生冲突，不利合作',
          '事业运势在下半年起，2025年达到高峰',
        ],
        timing: '南方为事业吉方，可往南方发展',
        direction: '南方',
        colors: ['红色', '紫色'],
        avoid: ['不宜赌博投机', '不宜冲动决策', '不宜大额投资'],
      },
      wealth: {
        general: '正财得用，财运以正职工作为主，副业为辅',
        specific: [
          '2024年农历九月、十月财运最旺，适合投资',
          "偏财运在2025年较强，可考虑小额投资",
          '不宜赌博、炒股，正财稳健',
          '正财在2026年最强，适合正职工作',
          '近期有意外之财，但要谨慎处理',
        ],
        timing: "南方为求财吉方，可往南方发展",
        direction: '南方',
        colors: ['红色', '紫色'],
        avoid: ['忌穿黑白色系', '忌赌博投机', '忌大额投资'],
      },
      marriage: {
        general: '伤官见财，婚姻稍晚，但晚婚更幸福，配偶贤惠能干',
        specific: [
          '2024年下半年有桃花，适合恋爱、结婚',
          '2025年是结婚吉年，宜把握时机',
          '配偶属属猴、属鸡的人，婚姻更美满',
          '不宜与属龙的人结合',
          '婚姻运在下半年起，2025年达到高峰',
        ],
        timing: '南方为婚姻吉方，适合恋爱、结婚',
        direction: '南方',
        colors: ['红色', '粉色'],
        avoid: ["不宜在冲克日结婚", '不宜与属龙的人恋爱'],
      },
      health: {
        general: '木旺克土，注意脾胃、消化系统，多食黄色食物',
        specific: [
          '2024年农历二月注意脾胃健康',
          '定期体检，早发现早治疗',
          '多食黄色食物，养脾胃',
          '适当运动，增强体质',
          '避免熬夜，保证睡眠',
        ],
        timing: '东方为健康吉方，适合就医、锻炼',
        directions: ['东方', '东北方'],
        colors: ['黄色', '棕色'],
        avoid: ["忌熬夜", "忌暴饮暴食", "忌过度劳累"],
      },
      colors: ['红色', '紫色', '黄色'],
      directions: ['南方', '东方', '东南方'],
      timing: ["2024年下半年", "2025年", "2026年"],
    },
    evidence: {
      statistics: {
        totalSamples: 100000,
        similarCases: 1500,
        successRate: 0.85,
        averageIncome: '500万/年',
        averageAge: 45,
      },
      celebrities: [
        {
          name: '马云',
          bazi: ['甲辰', '丙寅', '甲寅', '丙寅'],
          similar: ['甲木为日主', '得令而旺', '格局清奇'],
          lesson: '格局清奇，从杀格，主大富大贵',
        },
        {
          name: '李嘉诚',
          bazi: ['甲午', '丙戌', '甲午', '丙寅'],
          similar: ['甲木为日主', '火旺', '从火格'],
          lesson: '从火格，财星得用，大富之命',
        },
      ],
    },
    analysis: {
      opening: '细观您的八字，命理之象，历历在目。从您的八字来看，命局清奇，格局分明，乃富贵之命也。',
      explanation: '从您的八字来看，日主为甲，生于寅月，月令为寅，这是一个春季，万物复苏的时令。年柱甲辰，为您的祖上运，反映您家族的传承；月柱丙寅，为父母宫，反映您与父母的关系；日柱甲寅，为夫妻宫，反映您的婚姻感情；时柱丙寅，为子女宫，反映您与子女的关系。',
    },
    masterLanguage: {
      opening: '细观您的八字，命理之象，历历在目。',
      descriptions: ['乃富贵之命也', '格局清奇，主事业有成'],
      judgments: ['主事业有成，权力在握', '主财运亨通，财富日增'],
      timing: ['近期运势上升', '下半年事业起', '未来三年大运'],
      advice: ['宜往南方发展', '宜穿红紫衣物', '宜与属猴人合作'],
      closing: '愿您事业有成，家庭幸福。',
    },
  };
}

export default async function ResultPage({ params }: PageProps) {
  const result = await getResult(params.id);

  if (!result) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                K
              </div>
              <div className="text-xl font-bold text-gray-900">
                人生K线
              </div>
            </a>
            <a
              href="/analyze"
              className="hidden md:block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              再次分析
            </a>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8">
        {/* 可信报告 */}
        <Suspense fallback={<ReportSkeleton />}>
          <TrustReport result={result} />
        </Suspense>

        {/* NextStep引导 */}
        <div className="mt-16">
          <Suspense fallback={<GuideSkeleton />}>
            <NextStepGuide />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © 2024 人生K线. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 骨架组件
function ReportSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
  );
}

function GuideSkeleton() {
  return (
    <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
  );
}
