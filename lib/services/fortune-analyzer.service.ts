// 命理分析服务 - 协调各个分析模块
import type { FortuneAnalysisResult, Pillar } from '../user-types';
import type { YongShenResult } from '../bazi-analyzer';
import { determineYongShen, generateBaziShiShenAnalysis, getLuckyElements, analyzeShenSha } from '../bazi-analyzer';
import { calculateDayun } from '../dayun-calculator';
import type { DayunResult } from '../dayun-calculator';
import { PillarCalculatorService, type BirthInfo } from './pillar-calculator.service';
import { FiveElementsAnalyzer } from './analyzers/five-elements.analyzer';
import { TenGodsAnalyzer } from './analyzers/ten-gods.analyzer';
import { PatternAnalyzer } from './analyzers/pattern.analyzer';
import { AdviceGenerator } from './generators/advice.generator';
import { EvidenceGenerator } from './generators/evidence.generator';
import { ExplanationGenerator } from './generators/explanation.generator';
import { KlineDataGenerator } from './generators/kline-data.generator';
import { PhysiqueAnalyzer } from './analyzers/physique.analyzer';
import { CareerAnalyzer } from './analyzers/career.analyzer';
import { FortuneTrendAnalyzer } from './analyzers/fortune-trend.analyzer';
import type { Pillar as ServicePillar } from './types';

export interface FortuneAnalysisInput {
  name: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  timezone?: number;
  gender: 'male' | 'female';
}

export class FortuneAnalyzerService {
  private pillarCalculator: PillarCalculatorService;
  private fiveElementsAnalyzer: FiveElementsAnalyzer;
  private tenGodsAnalyzer: TenGodsAnalyzer;
  private patternAnalyzer: PatternAnalyzer;
  private physiqueAnalyzer: PhysiqueAnalyzer;
  private careerAnalyzer: CareerAnalyzer;
  private fortuneTrendAnalyzer: FortuneTrendAnalyzer;
  private adviceGenerator: AdviceGenerator;
  private evidenceGenerator: EvidenceGenerator;
  private explanationGenerator: ExplanationGenerator;
  private klineDataGenerator: KlineDataGenerator;

  constructor() {
    this.pillarCalculator = new PillarCalculatorService();
    this.fiveElementsAnalyzer = new FiveElementsAnalyzer();
    this.tenGodsAnalyzer = new TenGodsAnalyzer();
    this.patternAnalyzer = new PatternAnalyzer();
    this.physiqueAnalyzer = new PhysiqueAnalyzer();
    this.careerAnalyzer = new CareerAnalyzer();
    this.fortuneTrendAnalyzer = new FortuneTrendAnalyzer();
    this.adviceGenerator = new AdviceGenerator();
    this.evidenceGenerator = new EvidenceGenerator();
    this.explanationGenerator = new ExplanationGenerator();
    this.klineDataGenerator = new KlineDataGenerator();
  }

  analyze(input: FortuneAnalysisInput): FortuneAnalysisResult {
    const { name, birthDate, birthTime, birthPlace, timezone = 8, gender } = input;

    // 1. 计算四柱
    const birthInfo: BirthInfo = { date: birthDate, time: birthTime, timezone };
    const pillars = this.pillarCalculator.calculate(birthInfo);
    const dayMaster = this.pillarCalculator.getDayMaster(pillars);
    const baziStr = this.pillarCalculator.toBaziString(pillars);

    // 2. 用神分析
    const yongShenResult = determineYongShen(baziStr);

    // 3. 十神分析
    const shiShenAnalysis = generateBaziShiShenAnalysis(baziStr);

    // 4. 幸运元素
    const luckyElements = yongShenResult
      ? ({
          elements: [...(yongShenResult.yongShen || []), ...(yongShenResult.xiShen || [])],
          ...getLuckyElements(yongShenResult),
        } as any)
      : null;

    // 5. 神煞分析
    const shenShaResult = analyzeShenSha(baziStr);

    // 6. 五行分析
    const servicePillars = pillars as unknown as ServicePillar[];
    const fiveElements = this.fiveElementsAnalyzer.analyze(baziStr, servicePillars);

    // 7. 十神分析
    const tenGods = this.tenGodsAnalyzer.analyze(servicePillars, dayMaster, shiShenAnalysis as any);

    // 8. 格局分析
    const pattern = this.patternAnalyzer.analyze(yongShenResult);

    // 9. 体质分析
    const physique = this.physiqueAnalyzer.analyze(dayMaster);

    // 10. 职业建议
    const careerSuggestion = this.careerAnalyzer.analyze(tenGods, dayMaster);

    // 11. 大运计算
    const dayunResult = calculateDayun(
      birthDate,
      birthTime,
      gender,
      pillars[0].celestialStem,
      { gan: pillars[1].celestialStem, zhi: pillars[1].earthlyBranch },
      yongShenResult,
      birthDate.getFullYear()
    );

    // 12. 运势趋势
    const fortune = this.fortuneTrendAnalyzer.analyze(
      baziStr,
      birthDate,
      gender,
      yongShenResult,
      dayunResult
    );

    // 13. 建议生成
    const advice = this.adviceGenerator.generate(yongShenResult, luckyElements);

    // 14. 证据生成
    const evidence = this.evidenceGenerator.generate(servicePillars);

    // 15. 解释生成
    const user = {
      name,
      age: this.calculateAge(birthDate),
      bazi: { pillars, fiveElements, tenGods, pattern, dayMaster },
    };
    const explanation = this.explanationGenerator.generate(
      servicePillars,
      yongShenResult,
      shiShenAnalysis as any,
      user
    );

    // 16. K线数据生成
    const klineData = this.klineDataGenerator.generate(
      birthDate,
      gender,
      servicePillars,
      yongShenResult,
      dayunResult
    );

    return {
      basic: { dayMaster, pillars },
      fiveElements,
      tenGods,
      pattern: {
        ...pattern,
        strength: pattern.strength || 'medium',
        quality: pattern.quality || 'medium',
      },
      physique,
      careerSuggestion,
      fortune,
      advice: advice as any,
      evidence: {
        statistics: evidence.statistics as any,
        celebrities: evidence.celebrities,
        similarCases: [],
      },
      analysis: explanation,
      klineData: klineData as any,
      dayun: dayunResult,
      shenSha: shenShaResult ?? undefined,
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
