const STORAGE_KEY = 'country-search-history';
const MAX_HISTORY = 5;

export function getHistory(): string[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function addToHistory(query: string): void {
  if (!query.trim()) return;
  const history = getHistory();
  const filtered = history.filter((item) => item !== query);
  const updated = [query, ...filtered].slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
