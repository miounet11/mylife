import { formatDate, formatTime, getTodayLocalDateKey, parseLocalDate } from '@/lib/utils';

describe('date utils', () => {
  it('parses YYYY-MM-DD as a local calendar date', () => {
    const parsed = parseLocalDate('2026-04-20');

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(3);
    expect(parsed?.getDate()).toBe(20);
  });

  it('parses YYYY-MM-DDTHH:mm using local time', () => {
    const parsed = parseLocalDate('2026-04-20T09:30');

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(3);
    expect(parsed?.getDate()).toBe(20);
    expect(parsed?.getHours()).toBe(9);
    expect(parsed?.getMinutes()).toBe(30);
  });

  it('parses YYYY-MM-DDTHH:mm:ss using local time', () => {
    const parsed = parseLocalDate('2026-04-20T09:30:45');

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(3);
    expect(parsed?.getDate()).toBe(20);
    expect(parsed?.getHours()).toBe(9);
    expect(parsed?.getMinutes()).toBe(30);
    expect(parsed?.getSeconds()).toBe(45);
  });

  it('rejects invalid local calendar dates', () => {
    expect(parseLocalDate('2026-02-30')).toBeNull();
  });

  it('formats date and time with stable numeric output', () => {
    const date = new Date(2026, 3, 20, 9, 5, 0);

    expect(formatDate(date)).toBe('2026-04-20');
    expect(formatTime(date)).toBe('09:05');
  });

  it('builds a local today key without UTC slicing', () => {
    const date = new Date(2026, 3, 20, 23, 59, 0);

    expect(getTodayLocalDateKey(date)).toBe('2026-04-20');
  });
});
