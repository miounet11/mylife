import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  appendAnswerStructureContract,
  buildVerifyEventFields,
  parseChatAnswerStructure,
} from '@/lib/chat-answer-contract';

describe('chat-answer-contract', () => {
  it('appends structure contract once', () => {
    const a = appendAnswerStructureContract('base');
    assert.ok(a.includes('回答结构'));
    const b = appendAnswerStructureContract(a);
    assert.equal(b, a);
  });

  it('parses structured answer sections', () => {
    const answer = `
**判断依据** 日主甲木，用神水，大运乙酉。
**当前结论** 宜先稳住再小步试探。
**阶段动作**
- 今天：列出岗位清单
- 7 天内：投递 3 家
- 30 天内：完成一次面试复盘
**风险提醒** 不要因焦虑加杠杆跳槽。
**验证点** 两周内是否拿到 1 个有效面试反馈。
`;
    const p = parseChatAnswerStructure(answer);
    assert.match(p.basis, /日主甲木/);
    assert.match(p.conclusion, /稳住/);
    assert.match(p.today, /岗位/);
    assert.match(p.in7d, /投递/);
    assert.match(p.in30d, /面试/);
    assert.match(p.risk, /杠杆|跳槽/);
    assert.match(p.verify, /面试反馈/);
  });

  it('builds verify event fields', () => {
    const fields = buildVerifyEventFields({
      question: '我该不该跳槽',
      answer: '**验证点** 30 天内是否谈妥一份 offer。\n**当前结论** 可条件推进。',
      topScenario: '事业推进',
    });
    assert.ok(fields.title.includes('验证'));
    assert.ok(fields.description.includes('验证点'));
    assert.ok(fields.verifyPoint.length > 0);
  });
});
