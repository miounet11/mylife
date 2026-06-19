import {
  abortControllerRef,
  fetchJsonWithTimeout,
  formatDate,
  formatTime,
  getTodayLocalDateKey,
  isAbortLikeError,
  parseLocalDate,
} from '@/lib/utils';

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

describe('client fetch timeout utils', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it('returns parsed json and clears the controller ref after success', async () => {
    const controllerRef = { current: null as AbortController | null };
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    } as any);

    const result = await fetchJsonWithTimeout<{ success: boolean }>('/api/test', {
      cache: 'no-store',
      timeoutMs: 1000,
      timeoutReason: 'test-timeout',
      controllerRef,
    });

    expect(result.data).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      cache: 'no-store',
      signal: expect.any(AbortSignal),
    }));
    expect(controllerRef.current).toBeNull();
  });

  it('aborts the previous controller before starting a superseding request', async () => {
    const previous = new AbortController();
    const controllerRef = { current: previous };
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ ok: true }),
    } as any);

    await fetchJsonWithTimeout('/api/test', {
      timeoutMs: 1000,
      timeoutReason: 'test-timeout',
      controllerRef,
      supersedeReason: 'newer-request',
    });

    expect(previous.signal.aborted).toBe(true);
    expect(previous.signal.reason).toBe('newer-request');
  });

  it('detects abort-like errors and clears controller refs explicitly', () => {
    const controllerRef = { current: new AbortController() };

    abortControllerRef(controllerRef, 'manual-abort');

    expect(controllerRef.current).toBeNull();
    expect(isAbortLikeError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortLikeError('profile-history-timeout')).toBe(true);
    expect(isAbortLikeError(new Error('socket timeout'))).toBe(true);
    expect(isAbortLikeError(new Error('validation failed'))).toBe(false);
  });

  it('rethrows abort reasons so callers can distinguish timeout from superseded requests', async () => {
    const controllerRef = { current: null as AbortController | null };
    global.fetch = jest.fn((_url, init) => {
      const signal = (init as RequestInit).signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    }) as any;

    const request = fetchJsonWithTimeout('/api/test', {
      timeoutMs: 1,
      timeoutReason: 'reason-timeout',
      controllerRef,
    });

    await expect(request).rejects.toBe('reason-timeout');
    expect(controllerRef.current).toBeNull();
  });
});
