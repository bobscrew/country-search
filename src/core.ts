export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

const cache = new Map<string, unknown[]>();
const inFlight = new Map<string, Promise<unknown[]>>();

export async function searchCountries(
  query: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  if (cache.has(query)) {
    return cache.get(query) as unknown[];
  }

  if (inFlight.has(query)) {
    return inFlight.get(query) as Promise<unknown[]>;
  }

  const promise = (async () => {
    const response = await fetch(`https://countries.dev/name/${query}`, {
      signal,
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new HttpError(response.status, 'API Error');
    const data = (await response.json()) as unknown[];
    cache.set(query, data);
    return data;
  })();

  inFlight.set(query, promise);

  try {
    const result = await promise;
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Если запрос отменили, удаляем из inFlight, чтобы можно было повторить
      inFlight.delete(query);
    }
    throw error;
  } finally {
    inFlight.delete(query);
  }
}

export interface Country {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
  area?: number;
  borders?: string[];
  currency?: string;
}

export function mapCountryResponse(raw: Record<string, unknown>): Country {
  return {
    name: (raw.name as string) || 'N/A',
    flag: (raw.flags as Record<string, string>)?.png || '',
    capital: (raw.capital as string) || 'N/A',
    region: (raw.region as string) || 'N/A',
    population: (raw.population as number) || 0,
    languages:
      (raw.languages as Record<string, string>[])?.map((l) => l.name) || [],
    area: raw.area as number,
    borders: raw.borders as string[],
    currency: (raw.currencies as Record<string, string>[])?.[0]?.name,
  };
}

export type FetchErrorType = 'cancelled' | 'timeout' | 'error';

export function handleFetchError(error: unknown): FetchErrorType {
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') return 'cancelled';
    if (error.name === 'TimeoutError') return 'timeout';
  }
  return 'error';
}

export function clearCache() {
  cache.clear();
  inFlight.clear();
}
