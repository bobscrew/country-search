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
export async function searchCountries(query, signal) {
    const response = await fetch(`https://countries.dev/name/${query}`, {
        signal,
    });
    if (response.status === 404)
        return [];
    if (!response.ok)
        throw new HttpError(response.status, 'API Error');
    return response.json();
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
