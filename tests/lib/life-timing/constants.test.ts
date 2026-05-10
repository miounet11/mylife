import {
  EARTHLY_BRANCHES,
  BRANCH_CLASH,
  BRANCH_HARM,
  BRANCH_TRINE,
  BRANCH_DIRECTIONS,
} from '@/lib/life-timing/constants';

describe('地支关系表', () => {
  it('12 地支按顺序', () => {
    expect(EARTHLY_BRANCHES).toEqual(['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
  });

  it('地支六冲对称', () => {
    for (const b of EARTHLY_BRANCHES) {
      const clash = BRANCH_CLASH[b];
      if (clash) expect(BRANCH_CLASH[clash]).toBe(b);
    }
    expect(BRANCH_CLASH['子']).toBe('午');
    expect(BRANCH_CLASH['寅']).toBe('申');
  });

  it('地支六害对称', () => {
    for (const b of EARTHLY_BRANCHES) {
      const harm = BRANCH_HARM[b];
      if (harm) expect(BRANCH_HARM[harm]).toBe(b);
    }
    expect(BRANCH_HARM['子']).toBe('未');
    expect(BRANCH_HARM['丑']).toBe('午');
  });

  it('三合表完整 4 组', () => {
    expect(BRANCH_TRINE).toHaveLength(4);
    expect(BRANCH_TRINE).toContainEqual(['申', '子', '辰']);
    expect(BRANCH_TRINE).toContainEqual(['寅', '午', '戌']);
  });

  it('三会表完整 4 组', () => {
    expect(BRANCH_DIRECTIONS).toHaveLength(4);
    expect(BRANCH_DIRECTIONS).toContainEqual(['寅', '卯', '辰']);
  });
});
