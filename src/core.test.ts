import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, searchCountries, HttpError } from './core';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call the function after the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toBeCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(1);
  });

  it('should reset the timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toBeCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toBeCalledTimes(1);
  });
});

describe('searchCountries', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return data on successful fetch', async () => {
    const mockData = [{ name: 'Test' }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });
    const controller = new AbortController();
    const result = await searchCountries('test', controller.signal);
    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith('https://countries.dev/name/test', {
      signal: controller.signal,
    });
  });

  it('should throw HttpError on non-ok response (not 404)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });
    const controller = new AbortController();
    await expect(searchCountries('test', controller.signal)).rejects.toThrow(
      HttpError
    );
  });

  it('should return empty array on 404', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    });
    const controller = new AbortController();
    const result = await searchCountries('test', controller.signal);
    expect(result).toEqual([]);
  });
});
