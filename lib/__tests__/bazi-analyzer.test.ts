import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  determineYongShen,
  generateBaziShiShenAnalysis,
  getLuckyElements,
  calculateWuxingStrength,
  analyzeShenSha,
} from '../bazi-analyzer';

const EN_ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];

describe('determineYongShen', () => {
  it('returns null for invalid bazi input', () => {
    assert.equal(determineYongShen([]), null);
    assert.equal(determineYongShen(['甲']), null);
    assert.equal(determineYongShen(['甲子', '丙寅', 'X', '庚申']), null);
  });

  it('detects very strong day master and uses drain/control elements as yong', () => {
    // 甲木寅月得令，多甲比劫
    const result = determineYongShen(['甲辰', '丙寅', '甲寅', '甲寅']);
    assert.ok(result);
    assert.equal(result!.dayMaster, '甲');
    assert.equal(result!.dayMasterElement, '木');
    assert.ok(['strong', 'very_strong'].includes(result!.strength));
    assert.ok(result!.score >= 58);
    EN_ELEMENTS.forEach((el) => {
      result!.yongShen.forEach((item) => assert.ok(EN_ELEMENTS.includes(item), `yong ${item}`));
      result!.jiShen.forEach((item) => assert.ok(EN_ELEMENTS.includes(item), `ji ${item}`));
    });
    assert.ok(
      result!.yongShen.some((el) => ['metal', 'fire', 'earth', 'wood'].includes(el)),
      'strong/follow wood uses drain or follow-wood yong',
    );
  });

  it('丑月甲木：月令己土失令，不因「冬木相气」误判身偏旺喜金土', () => {
    // 用户反馈盘：丙戌 辛丑 甲辰 乙丑 — 旧逻辑 score=62 身偏旺→用神金土火/忌水木
    const result = determineYongShen(['丙戌', '辛丑', '甲辰', '乙丑']);
    assert.ok(result);
    assert.equal(result!.dayMaster, '甲');
    assert.equal(result!.dayMasterElement, '木');
    // 克泄重于帮扶 + 丑月失令 → 不应硬判身偏旺
    assert.ok(
      ['weak', 'very_weak', 'neutral'].includes(result!.strength),
      `expected weak/neutral, got ${result!.strength} score=${result!.score}`,
    );
    assert.ok(result!.score < 58, `score should be below strong threshold, got ${result!.score}`);
    // 身弱/中和偏弱：用神应含印比（水/木），忌神不应把水木整组打成忌
    assert.ok(
      result!.yongShen.some((el) => el === 'water' || el === 'wood'),
      `weak/neutral 甲 should favor water/wood yong, got ${result!.yongShen.join(',')}`,
    );
    assert.ok(
      result!.threeGain?.reasonChain?.some((line) => /失令|本气/.test(line)),
      'reason chain should mention month-order (本气/失令)',
    );
  });

  it('detects weak day master and favors resource/peer elements', () => {
    // 庚金生于午月，火旺克金，少根
    const result = determineYongShen(['丙午', '甲午', '庚辰', '丙子']);
    assert.ok(result);
    assert.equal(result!.dayMaster, '庚');
    assert.equal(result!.dayMasterElement, '金');
    assert.ok(['weak', 'very_weak', 'neutral'].includes(result!.strength));
    assert.ok(
      result!.yongShen.some((el) => ['metal', 'earth'].includes(el)),
      'weak metal should favor metal/earth (peer/resource)',
    );
    assert.ok(result!.jiShen.some((el) => ['fire', 'wood'].includes(el)));
  });

  it('classifies follow-strong pattern when self element dominates', () => {
    const result = determineYongShen(['甲寅', '丙寅', '甲寅', '甲寅']);
    assert.ok(result);
    assert.ok(result!.pattern);
    assert.match(result!.pattern!.pattern, /从旺|从强|正格/);
    assert.ok(result!.pattern!.description.length > 4);
  });

  it('classifies follow-weak pattern for heavily drained charts', () => {
    const result = determineYongShen(['丙午', '甲午', '庚子', '丙午']);
    assert.ok(result);
    assert.ok(result!.score <= 55);
    assert.ok(
      result!.pattern!.pattern.includes('从') || result!.strength === 'weak' || result!.strength === 'very_weak',
    );
  });

  it('applies winter tiaohuo (needs fire)', () => {
    const result = determineYongShen(['甲子', '丙子', '甲子', '甲子']);
    assert.ok(result?.tiaohuo);
    assert.equal(result!.tiaohuo!.element, 'fire');
    assert.match(result!.tiaohuo!.reason, /冬|寒|火/);
  });

  it('applies summer tiaohuo (needs water)', () => {
    const result = determineYongShen(['甲午', '丙午', '甲午', '甲午']);
    assert.ok(result?.tiaohuo);
    assert.equal(result!.tiaohuo!.element, 'water');
    assert.match(result!.tiaohuo!.reason, /夏|燥|水/);
  });

  it('sets confidence boundary near neutral strength', () => {
    const result = determineYongShen(['甲子', '丙寅', '戊戌', '庚申']);
    assert.ok(result);
    assert.ok(result!.confidence);
    assert.ok(result!.confidence!.score >= 0 && result!.confidence!.score <= 1);
    if (result!.score >= 42 && result!.score <= 58) {
      assert.ok(result!.confidence!.boundary);
    }
    assert.ok(result!.details.helpStrength >= 0);
    assert.ok(result!.details.drainStrength >= 0);
    assert.ok(Array.isArray(result!.priority) && result!.priority.length > 0);
    assert.ok(result!.threeGain?.reasonChain?.length);
  });

  it('may detect tongguan when opposing elements are both strong', () => {
    const result = determineYongShen(['甲寅', '戊辰', '甲寅', '戊辰']);
    assert.ok(result);
    if (result!.tongguan) {
      assert.ok(EN_ELEMENTS.includes(result!.tongguan.element));
      assert.ok(result!.xiShen.includes(result!.tongguan.element) || result!.yongShen.includes(result!.tongguan.element));
    }
  });
});

describe('supporting bazi-analyzer functions', () => {
  const sample = ['甲子', '丙寅', '戊戌', '庚申'];

  it('generateBaziShiShenAnalysis returns pillar and count data', () => {
    const analysis = generateBaziShiShenAnalysis(sample);
    assert.equal(analysis.pillarsAnalysis.length, 4);
    assert.equal(analysis.pillarsAnalysis[2].tianGanShiShen, '日主');
    assert.ok(Object.keys(analysis.shiShenCount).length > 0);
    assert.equal(analysis.tenGodStructure.self, '戊');
    assert.ok(analysis.tenGodStructure.lifeDomains.length >= 4);
  });

  it('getLuckyElements maps english elements to lifestyle hints', () => {
    const ys = determineYongShen(sample);
    assert.ok(ys);
    const lucky = getLuckyElements(ys!);
    assert.ok(lucky.colors.length > 0);
    assert.ok(lucky.directions.length > 0);
    assert.ok(lucky.numbers.length > 0);
    assert.deepEqual(lucky.yongShen, ys!.yongShen);
  });

  it('calculateWuxingStrength returns percentage-like scores', () => {
    const wood = calculateWuxingStrength(sample, '木');
    const total = EN_ELEMENTS
      .map((el) => calculateWuxingStrength(sample, el))
      .reduce((a, b) => a + b, 0);
    assert.ok(wood >= 0 && wood <= 100);
    assert.ok(Math.abs(total - 100) < 2);
  });

  it('analyzeShenSha returns structured list for known chart', () => {
    const shenSha = analyzeShenSha(['癸丑', '甲子', '甲子', '甲子']);
    assert.ok(shenSha);
    assert.ok(Array.isArray(shenSha!.list));
    assert.ok(shenSha!.list.every((item) => item.name && item.pillar));
  });
});