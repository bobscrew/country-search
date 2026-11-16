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

export async function searchCountries(
  query: string,
  signal?: AbortSignal
): Promise<unknown[]> {
  const response = await fetch(`https://countries.dev/name/${query}`, {
    signal,
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new HttpError(response.status, 'API Error');
  return response.json() as Promise<unknown[]>;
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
