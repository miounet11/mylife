// 服务层统一入口 - Facade 模式
export { FortuneAnalyzerService } from './fortune-analyzer.service';
export { PillarCalculatorService } from './pillar-calculator.service';

// Analyzers
export { FiveElementsAnalyzer } from './analyzers/five-elements.analyzer';
export { TenGodsAnalyzer } from './analyzers/ten-gods.analyzer';
export { PatternAnalyzer } from './analyzers/pattern.analyzer';
export { PhysiqueAnalyzer } from './analyzers/physique.analyzer';
export { CareerAnalyzer } from './analyzers/career.analyzer';
export { FortuneTrendAnalyzer } from './analyzers/fortune-trend.analyzer';

// Generators
export { AdviceGenerator } from './generators/advice.generator';
export { EvidenceGenerator } from './generators/evidence.generator';
export { ExplanationGenerator } from './generators/explanation.generator';
export { KlineDataGenerator } from './generators/kline-data.generator';

// Types
export type { FortuneAnalysisInput } from './fortune-analyzer.service';
export type { BirthInfo } from './pillar-calculator.service';
