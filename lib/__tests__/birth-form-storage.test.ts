import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import {
  loadRememberedBirthForm,
  saveRememberedBirthForm,
  loadRememberedHehunBirthPair,
  saveRememberedHehunBirthPair,
} from '@/lib/birth-form-storage';
import { buildHehunHref, hehunBirthPairFromQuery } from '@/lib/hehun-prefill';

// Minimal localStorage polyfill for node tests
function installMemoryStorage() {
  const map = new Map<string, string>();
  // @ts-expect-error test polyfill
  globalThis.window = {
    localStorage: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
      removeItem: (k: string) => {
        map.delete(k);
      },
    },
  };
  return map;
}

describe('birth-form-storage', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('saves and loads single birth form', () => {
    saveRememberedBirthForm({
      birthDate: '1990-06-15',
      birthTime: '10:00',
      gender: 'male',
      name: '测试',
      birthPlace: '成都 · 104.1°E',
    });
    const loaded = loadRememberedBirthForm();
    assert.ok(loaded);
    assert.equal(loaded?.birthDate, '1990-06-15');
    assert.equal(loaded?.gender, 'male');
    assert.equal(loaded?.name, '测试');
    assert.equal(loaded?.birthPlace, '成都 · 104.1°E');
  });

  it('saves hehun birth pair and mirrors primary to tool form', () => {
    saveRememberedHehunBirthPair({
      a: { birthDate: '1990-06-15', gender: 'male', name: '甲' },
      b: { birthDate: '1992-03-08', gender: 'female', name: '乙' },
    });
    const pair = loadRememberedHehunBirthPair();
    assert.equal(pair?.a.name, '甲');
    assert.equal(pair?.b.gender, 'female');
    const toolForm = loadRememberedBirthForm();
    assert.equal(toolForm?.birthDate, '1990-06-15');
  });
});

describe('hehun birth share query', () => {
  it('round-trips birth pair via href + query parse', () => {
    const href = buildHehunHref({
      birthA: { birthDate: '1990-06-15', birthTime: '10:00', gender: 'male', name: '甲' },
      birthB: { birthDate: '1992-03-08', birthTime: '14:00', gender: 'female', name: '乙' },
    });
    const qs = href.split('?')[1] || '';
    const pair = hehunBirthPairFromQuery(new URLSearchParams(qs));
    assert.equal(pair.a?.birthDate, '1990-06-15');
    assert.equal(pair.b?.name, '乙');
    assert.equal(pair.b?.gender, 'female');
  });

  it('privacy share omits real names from query', () => {
    const href = buildHehunHref({
      personA: {
        name: '张三',
        dayMaster: '甲',
        dayBranch: '子',
        yongShen: ['木'],
      },
      personB: {
        name: '李四',
        dayMaster: '庚',
        dayBranch: '午',
        yongShen: ['金'],
      },
      birthA: { birthDate: '1990-06-15', birthTime: '10:00', gender: 'male', name: '张三' },
      birthB: { birthDate: '1992-03-08', birthTime: '14:00', gender: 'female', name: '李四' },
      privacy: true,
    });
    assert.ok(!href.includes('张三'));
    assert.ok(!href.includes('李四'));
    assert.ok(!href.includes('aName='));
    assert.ok(!href.includes('bName='));
    assert.ok(href.includes('aBirth=1990-06-15'));
    assert.ok(href.includes('aDm=%E7%94%B2') || href.includes('aDm=甲'));
    assert.ok(href.includes('privacy=1'));
  });
});
