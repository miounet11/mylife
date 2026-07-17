import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { KNOWLEDGE_BASE, knowledgeBaseStampText } from '@/lib/knowledge-base-meta';
import { buildDecisionSheet } from '@/lib/report-decision-sheet';
import { buildExpertClientPack } from '@/lib/report-expert-client-pack';
import {
  buildSceneFollowupQuestion,
  buildTopicChatHref,
  topicKeyToScene,
} from '@/lib/chat-entry';
import type { ProReportView } from '@/lib/report-pro-view';
import type { ExpertDeskView } from '@/lib/report-expert-view';

describe('dual-track north star', () => {
  it('exposes 2026-07 knowledge base stamp', () => {
    assert.equal(KNOWLEDGE_BASE.version, '2026-07');
    assert.match(knowledgeBaseStampText('short'), /2026年7月/);
    assert.match(KNOWLEDGE_BASE.publicClaim, /2026 年 7 月/);
    assert.match(KNOWLEDGE_BASE.publicClaim, /知识库/);
  });

  it('builds consumer decision sheet with 30-day actions', () => {
    const view = {
      title: 't',
      subtitle: 's',
      patternLabel: '正官格',
      dayMaster: '甲',
      pillars: [],
      overview: {
        score10: 7,
        body: '结构中和，宜稳健推进。',
        tags: [],
        oneLiner: '你适合先稳后进，别同时开多线。',
      },
      beginnerGuide: [],
      nowAction: {
        doThis: '本月先完成一次岗位复盘',
        avoidThis: '不要裸辞冲高风险赛道',
        focusWindow: '5–6月',
      },
      elements: {
        yongShen: ['木'],
        xiShen: ['水'],
        jiShen: ['金'],
        doList: ['多学习拓展'],
        avoidList: ['硬刚高压'],
        plainSummary: '',
      },
      timeScores: [
        { key: 'month', label: '本月', sublabel: '', score10: 6, level: 'ok', tip: '' },
        { key: 'year', label: '今年', sublabel: '', score10: 7, level: 'good', tip: '' },
      ],
      monthStrip: [],
      riskAlerts: [
        {
          key: 'r1',
          when: '8月',
          severity: 'high',
          title: '决策波动',
          reason: '流年冲击',
          action: '少签大合同',
        },
      ],
      month: null,
      year: null,
      nextYear: null,
      topics: [
        {
          key: 'career',
          title: '事业',
          score10: 8,
          status: 'push',
          tags: [],
          summary: '宜推进',
          fullText: '宜推进',
        },
      ],
      klinePeak: null,
      klineTrough: null,
    } as ProReportView;

    const sheet = buildDecisionSheet(view);
    assert.match(sheet.structureLine, /稳后进|结构/);
    assert.ok(sheet.next30Days.length === 3);
    assert.ok(sheet.risks.some((r) => r.includes('8月') || r.includes('裸辞')));
    assert.match(sheet.revisitWhen, /8月|30 天/);
  });

  it('builds scene followups and topic chat deep links', () => {
    assert.equal(topicKeyToScene('marriage'), 'marriage');
    assert.match(buildSceneFollowupQuestion('career', 0), /事业|赛道|升职/);
    const href = buildTopicChatHref('report_x', 'health', '身体健康');
    assert.match(href, /reportId=report_x/);
    assert.match(href, /mode=opening/);
    assert.match(href, /teacher=health|topic=health|health|作息|养护|健康/);
  });

  it('builds expert client pack with 2026 speech style', () => {
    const desk = {
      input: { name: '测试', birthDate: '', birthTime: '', birthPlace: '', timezone: 8, gender: '男' },
      dayMaster: '甲',
      pattern: { type: '正官格', strength: '', quality: '', description: '' },
      yongJi: { yongShen: ['木', '火'], xiShen: ['水'], jiShen: ['金'] },
      dayun: { current: { ganZhi: '壬寅' } },
      liunian: { currentGanZhi: '丙午' },
      suiyun: {
        summary: '岁运相生，宜稳健扩展。',
        dayunGanZhi: '壬寅',
        liunianGanZhi: '丙午',
        notes: ['岁运对照'],
      },
      pillars: [
        { ganZhi: '甲子' },
        { ganZhi: '丙寅' },
        { ganZhi: '戊午' },
        { ganZhi: '庚申' },
      ],
      kongWang: ['戌', '亥'],
      domains: [
        {
          key: 'career',
          general: '事业宜深耕专业壁垒。',
          timing: '上半年布局',
          drivers: ['用神木火'],
          actions: ['复盘岗位'],
          specific: [],
          risks: [],
        },
        {
          key: 'marriage',
          general: '关系重沟通节奏。',
          timing: '',
          drivers: [],
          actions: [],
          specific: [],
          risks: ['情绪化'],
        },
      ],
      cosmos: {
        source: 'synthesized',
        temporal: { solarTerm: '小暑', liuNian: '丙午', phaseLabel: '推进段' },
        economicCycle: { label: '切换窗口' },
        industries: [{ industry: '科技' }],
        stateVector: [],
        human: { relationshipFocus: '事业与家庭双线' },
        domainTimeline: [{ year: 2026, career: 70, wealth: 65, marriage: 68, health: 64 }],
      },
      boost: { colors: ['绿'], directions: [], numbers: [], timing: [] },
    } as unknown as ExpertDeskView;

    const pack = buildExpertClientPack(desk);
    assert.match(pack.opening, /2026年7月|结构化/);
    assert.ok(pack.scriptBeats.length >= 5);
    assert.match(pack.clientPlain, /测试|甲|用/);
    assert.ok(pack.objections.length >= 2);
    assert.match(pack.copyAll, /异议|知识库|2026/);
    assert.equal(pack.knowledgeStamp, '2026年7月知识库');
  });
});
