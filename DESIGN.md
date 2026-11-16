# Design Document: Country Search

## 1. Cancellation Mechanism

To prevent race conditions (when a slower older request resolves after a faster newer one), we use `AbortController`.
When the input changes, the previous controller's `abort()` method is called immediately (even before the debounce delay finishes). This ensures the older request is physically cancelled and its `fetch` promise rejects with an `AbortError`. We do not rely on a simple "isLatest" flag, because ignoring the response still wastes network resources and memory.

## 2. Debounce Delay Choice

We use a 300ms delay.

- If removed (0ms), a request fires on every keystroke. Typing "spain" would fire 5 requests, overwhelming the API and the browser.
- If increased (e.g., 1000ms), the UI feels sluggish and unresponsive.
  300ms is the sweet spot where it catches the end of a fast typing burst without making the user wait too long.

## 3. Complexity (Big O)

- `mapCountryResponse`: **O(1)**. It only reads specific properties from the raw object and creates a new one. It does not loop over arrays (except for `languages` and `borders`, which are very small).
- _Bonus_: If we implemented caching, the cache lookup would be **O(1)** via a `Map` or object dictionary.

## 4. Clean Code Principles

- **Pure Functions**: `mapCountryResponse` and `debounce` are in `src/core.ts`. They do not depend on the DOM or global state.
- **Single Responsibility**: `src/core.ts` handles all logic (fetching, mapping, errors). `src/main.ts` handles only DOM rendering and event listeners.
- **No `any`**: We strictly use `unknown` and type assertions where necessary (e.g., in tests) to satisfy TypeScript's `strict` mode.
