import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEngineSurfaceFromExpertDesk,
  buildEngineSurfaceFromFortuneLike,
  buildEngineSurfaceFromProView,
  buildEngineSurfacePack,
  ENGINE_DISPLAY_LAYERS,
  ENGINE_MODULE_META,
  getEngineDisplay,
} from '@/lib/engine-surface';

describe('engine surface pack', () => {
  it('display policy: desk vs lock never mix', () => {
    assert.equal(getEngineDisplay('report').mountDesk, true);
    assert.equal(getEngineDisplay('report').showCite, true);
    assert.equal(getEngineDisplay('chatBound').mountDesk, false);
    assert.equal(getEngineDisplay('chatBound').mode, 'lock');
    assert.equal(getEngineDisplay('dimensions').mode, 'lock');
    assert.equal(getEngineDisplay('hehun').mode, 'lock');
    assert.equal(ENGINE_DISPLAY_LAYERS.length, 3);
  });

  it('exports module meta for all ids', () => {
    const ids = Object.keys(ENGINE_MODULE_META);
    assert.ok(ids.includes('pillars'));
    assert.ok(ids.includes('kline'));
    assert.ok(ids.includes('almanac'));
    assert.ok(ids.includes('formula'));
  });

  it('builds pack from loose fortune-like blob', () => {
    const pack = buildEngineSurfaceFromFortuneLike({
      id: 'r1',
      name: '测',
      gender: 'male',
      birthDate: '1990-05-15',
      birthTime: '10:30',
      birthPlace: '上海',
      bazi: {
        pillars: [
          { label: '年柱', ganZhi: '庚午' },
          { label: '月柱', ganZhi: '辛巳' },
          { label: '日柱', ganZhi: '甲子' },
          { label: '时柱', ganZhi: '己巳' },
        ],
        dayMaster: '甲',
      },
      fiveElements: {
        wood: { strength: 70 },
        fire: { strength: 55 },
        earth: { strength: 40 },
        metal: { strength: 30 },
        water: { strength: 50 },
      },
      advice: { yongShen: ['水', '金'], jiShen: ['火'], xiShen: ['木'] },
      dayun: {
        list: [
          {
            ganZhi: '壬午',
            startYear: 2020,
            endYear: 2029,
            startAge: 30,
            endAge: 39,
            quality: 'good',
            isCurrent: true,
          },
        ],
      },
      klineData: [
        { year: 1990, career: 50, wealth: 48, marriage: 45, health: 55 },
        { year: 2000, career: 60, wealth: 58, marriage: 50, health: 52 },
        { year: 2010, career: 75, wealth: 70, marriage: 60, health: 58 },
        { year: 2020, career: 68, wealth: 72, marriage: 65, health: 60 },
        {
          year: new Date().getFullYear(),
          career: 70,
          wealth: 68,
          marriage: 62,
          health: 58,
        },
      ],
    });

    assert.equal(pack.version, 'engine-surface-v1');
    assert.equal(pack.source, 'report');
    assert.equal(pack.dayMaster, '甲');
    assert.equal(pack.pillars.length, 4);
    assert.equal(pack.pillars[2]?.ganZhi, '甲子');
    assert.ok(pack.yongShen.includes('水'));
    assert.ok(pack.jiShen.includes('火'));
    assert.ok(pack.modules.includes('pillars'));
    assert.ok(pack.modules.includes('yongji'));
    assert.ok(pack.modules.includes('almanac'));
    assert.ok(pack.modules.includes('formula'));
    assert.ok(pack.almanac.todayHref.startsWith('/almanac/'));
    assert.ok(pack.elements.length >= 3);
    assert.ok(pack.dayun.length >= 1);
    assert.ok(pack.kline);
    assert.ok(pack.kline!.sampleYears >= 1);
    assert.ok(pack.tags.some((t) => t.includes('日主')));
  });

  it('builds pack from ProReportView fields', () => {
    const pack = buildEngineSurfaceFromProView({
      reportId: 'pro-1',
      view: {
        dayMaster: '丙',
        patternLabel: '伤官生财',
        pillars: [
          { label: '年柱', ganZhi: '甲子' },
          { label: '月柱', ganZhi: '丙寅' },
          { label: '日柱', ganZhi: '丙午' },
          { label: '时柱', ganZhi: '戊戌' },
        ],
        elements: { yongShen: ['水'], jiShen: ['火'], xiShen: ['金'] },
        monthStrip: [
          { key: '2026-03', label: '3月', shortLabel: '3月', score10: 7.2, level: 'good', isCurrent: true },
          { key: '2026-04', label: '4月', shortLabel: '4月', score10: 5.5, level: 'ok' },
        ],
        riskAlerts: [
          { when: '2026-08', title: '交运窗口', reason: '宜稳勿赌' },
        ],
      },
      klineData: [
        { year: 2000, career: 55, wealth: 50, marriage: 48, health: 52 },
        {
          year: new Date().getFullYear(),
          career: 66,
          wealth: 62,
          marriage: 58,
          health: 55,
        },
      ],
    });

    assert.equal(pack.dayMaster, '丙');
    assert.equal(pack.pattern, '伤官生财');
    assert.equal(pack.pillars[2]?.ganZhi, '丙午');
    assert.ok(pack.months.length === 2);
    assert.equal(pack.months[0]?.status, '当前');
    assert.ok(typeof pack.months[0]?.score === 'number');
    assert.ok(pack.risks.some((r) => r.includes('交运窗口')));
    assert.ok(pack.modules.includes('months'));
    assert.ok(pack.modules.includes('risks'));
  });

  it('builds pack from expert desk shape', () => {
    const pack = buildEngineSurfaceFromExpertDesk({
      reportId: 'ex-1',
      desk: {
        dayMaster: '庚',
        gender: '女',
        input: {
          name: '客',
          birthDate: '1988-01-02',
          birthTime: '08:00',
          birthPlace: '杭州',
          gender: '女',
        },
        chartIdentity: {
          clockBirthTime: '08:00',
          effectiveBirthTime: '07:52',
          chartFingerprint: '庚午-戊子-庚寅-庚辰',
          useSolarTime: true,
          useSeparateZiHour: false,
          timeMismatch: false,
        },
        pillars: [
          { label: '年柱', ganZhi: '丁卯', gan: '丁', zhi: '卯' },
          { label: '月柱', ganZhi: '壬子', gan: '壬', zhi: '子' },
          { label: '日柱', ganZhi: '庚寅', gan: '庚', zhi: '寅' },
          { label: '时柱', ganZhi: '庚辰', gan: '庚', zhi: '辰' },
        ],
        fiveElements: [
          { key: 'metal', label: '金', strength: 80, quality: '旺', description: '' },
          { key: 'wood', label: '木', strength: 45, quality: '中', description: '' },
        ],
        tenGods: {
          self: '比劫',
          output: ['食神'],
          input: ['正印'],
          control: ['正官'],
          controlled: ['正财'],
        },
        pattern: { type: '从革' },
        yongJi: { yongShen: ['火', '木'], jiShen: ['金'], xiShen: ['土'] },
        dayun: {
          rows: [
            {
              ganZhi: '辛丑',
              startYear: 2018,
              endYear: 2027,
              startAge: 30,
              endAge: 39,
              quality: 'good',
              isCurrent: true,
              yongShenMatch: '偏助',
            },
          ],
        },
        shenSha: ['天乙贵人', '文昌'],
        liuyue: [
          { year: 2026, month: 3, label: '3月', ganZhi: '乙卯' },
          { year: 2026, month: 4, label: '4月', ganZhi: '丙辰' },
        ],
      },
    });

    assert.equal(pack.dayMaster, '庚');
    assert.ok(pack.identity?.chartFingerprint?.includes('庚寅'));
    assert.equal(pack.identity?.useSolarTime, true);
    assert.ok(pack.modules.includes('identity'));
    assert.ok(pack.modules.includes('tenGods'));
    assert.ok(pack.modules.includes('shenSha'));
    assert.ok(pack.dayun[0]?.quality === '较好' || pack.dayun[0]?.quality === 'good');
    assert.ok(pack.months.length === 2);
    assert.ok(pack.shenSha.includes('天乙贵人'));
  });

  it('allows module subset override', () => {
    const pack = buildEngineSurfacePack({
      source: 'tool',
      pillars: [
        { label: '年柱', ganZhi: '甲子' },
        { label: '月柱', ganZhi: '乙丑' },
        { label: '日柱', ganZhi: '丙寅' },
        { label: '时柱', ganZhi: '丁卯' },
      ],
      dayMaster: '丙',
      advice: { yongShen: ['水'], jiShen: ['火'] },
      modules: ['pillars', 'yongji', 'almanac'],
    });
    assert.deepEqual(pack.modules, ['pillars', 'yongji', 'almanac']);
  });
});
