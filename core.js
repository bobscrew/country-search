export function debounce(fn, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'HttpError';
    }
}
const cache = new Map();
const inFlight = new Map();
export async function searchCountries(query, signal) {
    if (cache.has(query)) {
        return cache.get(query);
    }
    if (inFlight.has(query)) {
        return inFlight.get(query);
    }
    const promise = (async () => {
        const response = await fetch(`https://countries.dev/name/${query}`, {
            signal,
        });
        if (response.status === 404)
            return [];
        if (!response.ok)
            throw new HttpError(response.status, 'API Error');
        const data = (await response.json());
        cache.set(query, data);
        return data;
    })();
    inFlight.set(query, promise);
    try {
        const result = await promise;
        return result;
    }
    catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            // Если запрос отменили, удаляем из inFlight, чтобы можно было повторить
            inFlight.delete(query);
        }
        throw error;
    }
    finally {
        inFlight.delete(query);
    }
}
export function mapCountryResponse(raw) {
    return {
        name: raw.name || 'N/A',
        flag: raw.flags?.png || '',
        capital: raw.capital || 'N/A',
        region: raw.region || 'N/A',
        population: raw.population || 0,
        languages: raw.languages?.map((l) => l.name) || [],
        area: raw.area,
        borders: raw.borders,
        currency: raw.currencies?.[0]?.name,
    };
}
export function handleFetchError(error) {
    if (error instanceof DOMException) {
        if (error.name === 'AbortError')
            return 'cancelled';
        if (error.name === 'TimeoutError')
            return 'timeout';
    }
    return 'error';
}
export function clearCache() {
    cache.clear();
    inFlight.clear();
}
