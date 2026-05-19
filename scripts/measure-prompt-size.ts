import { buildPrompt } from '@/lib/prompts';
import '@/lib/prompts/agentic/core-constitution';
import '@/lib/prompts/agentic/career-wealth';
import '@/lib/prompts/agentic/relationship-family';
import '@/lib/prompts/agentic/health-lifestyle';
import '@/lib/prompts/agentic/temporal-spatial-advisor';

const ctx: any = {
  engine: {
    constitution: { dayMaster: '丙', strength: 'weak', yongShen: ['水','金'], jiShen: ['火','土'] },
    tenGodsTable: { 比劫:1, 食伤:0, 财:1, 官杀:2, 印:0 },
    dayun: { current: '甲辰', windows: [{ label:'甲辰大运', range:'2024-2034' }] },
    kline: { anchorPoints: [{ year:2028, score:70, label:'转折前夜' }], windows:[{label:'2028 春', score:80}] },
  },
  context: {
    temporal: { currentLiuNian:'丙午', currentSolarTerm:'立夏' },
    macroCycles: { industryCycle:[{industry:'AI', phase:'up'}] },
    geoClimate: { currentPlace:'杭州' },
    spatialFactors: { favorableDirections:['东','南'] },
    humanFactors: { householdSummary:'与伴侣同住' },
    worldState: { mood:'推进期' },
  },
};

for (const id of ['agentic.core_constitution','agentic.career_wealth','agentic.relationship_family','agentic.health_lifestyle','agentic.temporal_spatial_advisor']) {
  const p = buildPrompt(id as any, ctx);
  console.log(`${id} | user.len=${p.user.length} | system.len=${p.system.length}`);
}
