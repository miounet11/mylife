/**
 * Life Timing 真实样本验证脚本
 * 用法：npm run life-timing:verify
 *
 * 跑 10 个样本，输出 next_5_years 和 next_30_days，与命理软件结果对比。
 * 验收：太岁年 / 大运起算 / 节气 100% 一致。
 */

import { buildTimingProfile } from '@/lib/life-timing/timing-orchestrator';
import { PillarCalculatorService } from '@/lib/services/pillar-calculator.service';
import { calculateDayun } from '@/lib/dayun-calculator';
import type { DetectorInput } from '@/lib/life-timing/types';

interface Sample {
  name: string;
  birthDate: Date;
  birthTime: string;
  gender: 'male' | 'female';
  expectedNotes?: string;
}

const SAMPLES: Sample[] = [
  { name: '样本1', birthDate: new Date(1990, 4, 15), birthTime: '14:30', gender: 'male' },
  { name: '样本2', birthDate: new Date(1985, 8, 23), birthTime: '09:00', gender: 'female' },
  { name: '样本3', birthDate: new Date(1992, 11, 7), birthTime: '16:30', gender: 'male' },
  { name: '样本4', birthDate: new Date(1988, 2, 14), birthTime: '22:00', gender: 'female' },
  { name: '样本5', birthDate: new Date(1995, 6, 19), birthTime: '06:45', gender: 'male' },
  { name: '毛泽东', birthDate: new Date(1893, 11, 26), birthTime: '07:30', gender: 'male' },
  { name: '邓小平', birthDate: new Date(1904, 7, 22), birthTime: '06:00', gender: 'male' },
  { name: '样本8', birthDate: new Date(2000, 0, 1), birthTime: '12:00', gender: 'male' },
  { name: '样本9', birthDate: new Date(1976, 5, 5), birthTime: '18:30', gender: 'female' },
  { name: '样本10', birthDate: new Date(1968, 9, 12), birthTime: '04:15', gender: 'male' },
];

async function main() {
  const now = new Date();
  console.log(`=== Life Timing 验证 10 样本 (now=${now.toISOString().slice(0, 10)}) ===\n`);

  const pillarCalculator = new PillarCalculatorService();

  for (const sample of SAMPLES) {
    console.log(`──────────────────────────────────`);
    console.log(`【${sample.name}】 ${sample.birthDate.toISOString().slice(0, 10)} ${sample.birthTime} ${sample.gender}`);

    try {
      const pillars = pillarCalculator.calculate({
        date: sample.birthDate,
        time: sample.birthTime,
        timezone: 8,
      });

      const yearGan = pillars[0].celestialStem;
      const yearZhi = pillars[0].earthlyBranch;
      const monthGan = pillars[1].celestialStem;
      const monthZhi = pillars[1].earthlyBranch;
      const dayGan = pillars[2].celestialStem;
      const dayZhi = pillars[2].earthlyBranch;
      const hourGan = pillars[3].celestialStem;
      const hourZhi = pillars[3].earthlyBranch;

      const dayunResult = calculateDayun(
        sample.birthDate,
        sample.birthTime,
        sample.gender,
        yearGan,
        { gan: monthGan, zhi: monthZhi },
        null,
        sample.birthDate.getFullYear()
      );

      const input: DetectorInput = {
        bazi: { yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi },
        birthDate: sample.birthDate,
        currentDate: now,
        dayunResult,
      };

      const t0 = performance.now();
      const profile = buildTimingProfile(input);
      const elapsed = (performance.now() - t0).toFixed(1);

      console.log(`八字: ${profile.baziPillars}`);
      console.log(`computedForYear: ${profile.computedForYear}`);
      console.log(`耗时: ${elapsed}ms`);
      console.log();

      console.log('next_30_days:');
      for (const p of profile.next_30_days) {
        console.log(`  ${p.startDate} [${p.severity}] ${p.type}: ${p.rawReason}`);
      }

      console.log('\nnext_5_years (major):');
      for (const t of profile.next_5_years) {
        console.log(`  ${t.year} (${t.ageAtYear}岁) [${t.severity}] ${t.type}: ${t.rawReason}`);
      }
    } catch (err) {
      console.error(`错误：${err instanceof Error ? err.message : err}`);
    }

    console.log();
  }

  console.log(`\n=== 完成 ===`);
  console.log(`验收方法：把以上输出与你信任的命理软件结果对比`);
  console.log(`重点核对：1) 太岁年命中年份 2) 节气日期 3) 大运起算年龄`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
