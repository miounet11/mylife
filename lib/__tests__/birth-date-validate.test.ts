import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  birthDateInputMax,
  birthDateInputMin,
  isYoungBirthAge,
  validateBirthDateString,
} from '@/lib/birth-date-validate';
import { parseToolBirthInput, parseToolBirthInputDetailed } from '@/lib/tool-birth-context';

describe('birth-date-validate', () => {
  const now = new Date(2026, 6, 17); // 2026-07-17 local

  it('accepts valid historical dates', () => {
    const v = validateBirthDateString('1990-06-15', now);
    assert.equal(v.ok, true);
    assert.equal(v.dateKey, '1990-06-15');
    assert.ok(typeof v.ageYears === 'number' && v.ageYears >= 35);
  });

  it('accepts today', () => {
    const v = validateBirthDateString('2026-07-17', now);
    assert.equal(v.ok, true);
    assert.equal(v.ageYears, 0);
    assert.equal(isYoungBirthAge(v.ageYears), true);
  });

  it('rejects future dates', () => {
    const v = validateBirthDateString('2027-06-15', now);
    assert.equal(v.ok, false);
    assert.equal(v.issue, 'future');
  });

  it('rejects pre-1900 and invalid calendar', () => {
    assert.equal(validateBirthDateString('1800-01-01', now).issue, 'too_early');
    assert.equal(validateBirthDateString('2020-02-30', now).issue, 'invalid_calendar');
    assert.equal(validateBirthDateString('', now).issue, 'empty');
  });

  it('exposes date input bounds', () => {
    assert.equal(birthDateInputMin(), '1900-01-01');
    assert.match(birthDateInputMax(now), /^2026-07-17$/);
  });
});

describe('parseToolBirthInput strict', () => {
  it('rejects future and ancient via detailed parse', () => {
    assert.equal(parseToolBirthInput({ birthDate: '2027-06-15', gender: 'male' }), null);
    assert.equal(parseToolBirthInput({ birthDate: '1800-01-01' }), null);
    assert.ok(parseToolBirthInput({ birthDate: '1990-06-15', gender: 'male' }));

    const future = parseToolBirthInputDetailed({ birthDate: '2027-06-15' });
    assert.equal(future.ok, false);
    if (!future.ok) {
      assert.equal(future.issue, 'future');
      assert.match(future.message, /未来/);
    }

    const ancient = parseToolBirthInputDetailed({ birthDate: '1800-01-01' });
    assert.equal(ancient.ok, false);
    if (!ancient.ok) assert.equal(ancient.issue, 'too_early');
  });
});
