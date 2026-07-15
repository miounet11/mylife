import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getChangSheng,
  getKongWangByDayPillar,
  getYearGanZhi,
  probeLiunianYear,
} from '@/lib/bazi-pro-tools';

describe('bazi-pro-tools', () => {
  it('十二长生：甲木长生在亥', () => {
    assert.equal(getChangSheng('甲', '亥'), '长生');
    assert.equal(getChangSheng('甲', '寅'), '临官');
    assert.equal(getChangSheng('甲', '卯'), '帝旺');
  });

  it('空亡：甲子日空戌亥', () => {
    assert.deepEqual(getKongWangByDayPillar('甲子'), ['戌', '亥']);
  });

  it('年柱：1984 甲子', () => {
    assert.equal(getYearGanZhi(1984), '甲子');
    assert.equal(getYearGanZhi(2026), '丙午');
  });

  it('流年点盘含并临提示', () => {
    const p = probeLiunianYear({
      year: 2026,
      dayMaster: '辛',
      dayPillarGanZhi: '辛卯',
      currentDayunGanZhi: '丙午',
      yongShen: ['金', '水'],
      jiShen: ['火', '土'],
    });
    assert.equal(p.ganZhi, '丙午');
    assert.equal(p.vsDayun, '岁运并临');
    assert.ok(p.notes.some((n) => /并临|相同/.test(n)));
  });
});
