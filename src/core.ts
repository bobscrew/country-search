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
