import {
  validateBirthDate,
  validateBirthTime,
  validateEventDate,
  validateName,
  validateGender,
  validateTimezone,
  validateQuestion,
  validateEventType,
  validateAnalyzeRequest,
  validateEventRequest,
} from '@/lib/validators';

describe('validateBirthDate', () => {
  it('accepts valid date', () => {
    expect(validateBirthDate('1990-06-15')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateBirthDate('')).not.toBeNull();
  });

  it('rejects year before 1800', () => {
    expect(validateBirthDate('1799-01-01')).not.toBeNull();
  });

  it('rejects future year', () => {
    expect(validateBirthDate('2099-01-01')).not.toBeNull();
  });

  it('rejects invalid month', () => {
    expect(validateBirthDate('1990-13-01')).not.toBeNull();
  });

  it('rejects invalid day', () => {
    expect(validateBirthDate('1990-02-30')).not.toBeNull();
  });

  it('rejects wrong format', () => {
    expect(validateBirthDate('1990/06/15')).not.toBeNull();
  });
});

describe('validateEventDate', () => {
  it('accepts a future event date', () => {
    expect(validateEventDate('2099-06-15')).toBeNull();
  });

  it('rejects impossible event dates', () => {
    expect(validateEventDate('2026-02-30')).not.toBeNull();
  });
});

describe('validateBirthTime', () => {
  it('accepts valid time', () => {
    expect(validateBirthTime('14:30')).toBeNull();
  });

  it('accepts midnight', () => {
    expect(validateBirthTime('00:00')).toBeNull();
  });

  it('rejects invalid hour', () => {
    expect(validateBirthTime('24:00')).not.toBeNull();
  });

  it('rejects invalid minute', () => {
    expect(validateBirthTime('12:60')).not.toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateBirthTime('')).not.toBeNull();
  });
});

describe('validateName', () => {
  it('accepts valid name', () => {
    expect(validateName('张三')).toBeNull();
  });

  it('rejects empty name', () => {
    expect(validateName('')).not.toBeNull();
  });

  it('rejects whitespace only', () => {
    expect(validateName('   ')).not.toBeNull();
  });

  it('rejects name over 50 chars', () => {
    expect(validateName('a'.repeat(51))).not.toBeNull();
  });
});

describe('validateGender', () => {
  it('accepts male', () => {
    expect(validateGender('male')).toBeNull();
  });

  it('accepts female', () => {
    expect(validateGender('female')).toBeNull();
  });

  it('rejects invalid gender', () => {
    expect(validateGender('other')).not.toBeNull();
  });

  it('accepts empty (optional field)', () => {
    expect(validateGender('')).toBeNull();
  });
});

describe('validateTimezone', () => {
  it('accepts valid timezone', () => {
    expect(validateTimezone(8)).toBeNull();
  });

  it('accepts negative timezone', () => {
    expect(validateTimezone(-5)).toBeNull();
  });

  it('rejects out of range', () => {
    expect(validateTimezone(15)).not.toBeNull();
    expect(validateTimezone(-13)).not.toBeNull();
  });
});

describe('validateQuestion', () => {
  it('accepts valid question', () => {
    expect(validateQuestion('我的事业运势如何？')).toBeNull();
  });

  it('rejects empty question', () => {
    expect(validateQuestion('')).not.toBeNull();
  });

  it('rejects question over 2000 chars', () => {
    expect(validateQuestion('a'.repeat(2001))).not.toBeNull();
  });
});

describe('validateEventType', () => {
  it('accepts valid types', () => {
    ['career', 'wealth', 'marriage', 'health', 'family', 'other'].forEach(t => {
      expect(validateEventType(t)).toBeNull();
    });
  });

  it('rejects invalid type', () => {
    expect(validateEventType('invalid')).not.toBeNull();
  });

  it('rejects empty type', () => {
    expect(validateEventType('')).not.toBeNull();
  });
});

describe('validateAnalyzeRequest', () => {
  const validRequest = {
    name: '张三',
    birthDate: '1990-06-15',
    birthTime: '14:30',
    gender: 'male',
    timezone: 8,
  };

  it('accepts valid request', () => {
    const result = validateAnalyzeRequest(validRequest);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing name', () => {
    const result = validateAnalyzeRequest({ ...validRequest, name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'name')).toBe(true);
  });

  it('rejects invalid date', () => {
    const result = validateAnalyzeRequest({ ...validRequest, birthDate: '1799-01-01' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.field === 'birthDate')).toBe(true);
  });

  it('collects multiple errors', () => {
    const result = validateAnalyzeRequest({ name: '', birthDate: 'bad', birthTime: 'bad' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('validateEventRequest', () => {
  const validEvent = {
    type: 'career',
    title: '升职',
    date: '2026-03-01',
    impact: 'positive',
  };

  it('accepts valid event', () => {
    const result = validateEventRequest(validEvent);
    expect(result.valid).toBe(true);
  });

  it('accepts future event dates', () => {
    const result = validateEventRequest({ ...validEvent, date: '2099-03-01' });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = validateEventRequest({ ...validEvent, type: 'invalid' });
    expect(result.valid).toBe(false);
  });

  it('rejects empty title', () => {
    const result = validateEventRequest({ ...validEvent, title: '' });
    expect(result.valid).toBe(false);
  });
});
