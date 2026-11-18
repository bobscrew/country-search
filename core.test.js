import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, searchCountries, HttpError, mapCountryResponse, handleFetchError, clearCache, } from './core';
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
    let mockFetch;
    beforeEach(() => {
        clearCache();
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
        await expect(searchCountries('test', controller.signal)).rejects.toThrow(HttpError);
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
describe('mapCountryResponse', () => {
    it('should map raw API response to country object', () => {
        const raw = {
            name: 'Testland',
            flags: { png: 'flag.png' },
            capital: 'Test City',
            region: 'Test Region',
            population: 1000,
            languages: [{ name: 'Testish' }],
            area: 500,
            borders: ['A', 'B'],
            currencies: [{ name: 'Test Coin' }],
        };
        const result = mapCountryResponse(raw);
        expect(result).toEqual({
            name: 'Testland',
            flag: 'flag.png',
            capital: 'Test City',
            region: 'Test Region',
            population: 1000,
            languages: ['Testish'],
            area: 500,
            borders: ['A', 'B'],
            currency: 'Test Coin',
        });
    });
    it('should handle missing fields gracefully', () => {
        const raw = { name: 'EmptyLand' };
        const result = mapCountryResponse(raw);
        expect(result.name).toBe('EmptyLand');
        expect(result.capital).toBe('N/A');
    });
});
describe('handleFetchError', () => {
    it('should identify AbortError as cancellation', () => {
        const error = new DOMException('Aborted', 'AbortError');
        expect(handleFetchError(error)).toBe('cancelled');
    });
    it('should identify TimeoutError as timeout', () => {
        const error = new DOMException('Timeout', 'TimeoutError');
        expect(handleFetchError(error)).toBe('timeout');
    });
    it('should identify HttpError as network error', () => {
        const error = new HttpError(500, 'Server Error');
        expect(handleFetchError(error)).toBe('error');
    });
    it('should identify generic error as error', () => {
        const error = new Error('Network failed');
        expect(handleFetchError(error)).toBe('error');
    });
});
describe('Race condition', () => {
    it('should only render the result of the latest request', async () => {
        let rejectFirst;
        const firstPromise = new Promise((_resolve, reject) => {
            rejectFirst = reject;
        });
        const secondResponse = {
            ok: true,
            status: 200,
            json: () => Promise.resolve([{ name: 'Second' }]),
        };
        const mockFetch = vi.fn((url, options) => {
            if (url.includes('a') && !url.includes('ab')) {
                options.signal.addEventListener('abort', () => {
                    rejectFirst(new DOMException('Aborted', 'AbortError'));
                });
                return firstPromise;
            }
            return Promise.resolve(secondResponse);
        });
        vi.stubGlobal('fetch', mockFetch);
        const controller1 = new AbortController();
        const p1 = searchCountries('a', controller1.signal);
        const controller2 = new AbortController();
        const p2 = searchCountries('ab', controller2.signal);
        controller1.abort();
        const p1Catch = p1.catch((err) => err);
        const result = await p2;
        expect(result).toEqual([{ name: 'Second' }]);
        const error = await p1Catch;
        expect(error).toBeInstanceOf(DOMException);
        expect(error.name).toBe('AbortError');
    });
});
