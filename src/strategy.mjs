export function normalizeQuery(rawQuery) {
  if (typeof rawQuery !== 'string') return '';
  const tokens = rawQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return [...new Set(tokens)].sort().join(' ');
}

export function selectProvider(normalizedQuery) {
  return normalizedQuery.startsWith('site:local') ? 'secondary' : 'primary';
}

export function isFallbackAllowed({ status, semanticEmpty = false, transportError = false }) {
  if (semanticEmpty) return false;
  if (transportError) return true;
  return status === 502 || status === 503 || status === 504;
}

function stopReasonFor(status, semanticEmpty) {
  if (semanticEmpty) return 'semantic-empty';
  if (status === 429) return 'rate-limited';
  if (status === 401 || status === 403) return 'access-denied';
  if (status >= 500) return 'provider-error';
  return 'request-failed';
}

export async function retrieveWithFallback({
  rawQuery,
  strategy = 'strategy-v2',
  cursor = null,
  providerRequest,
}) {
  const normalizedQuery = strategy === 'strategy-v2' ? normalizeQuery(rawQuery) : rawQuery;
  const initialProvider = strategy === 'strategy-v2' ? selectProvider(normalizedQuery) : 'primary';
  const providers = strategy === 'strategy-v2'
    ? [initialProvider, initialProvider === 'primary' ? 'secondary' : 'primary']
    : ['primary'];
  const attempts = [];

  for (const provider of providers) {
    try {
      const response = await providerRequest(provider, {
        query: normalizedQuery,
        cursor,
      });
      const semanticEmpty = response.semanticEmpty === true;
      attempts.push({
        provider,
        status: response.status,
        semanticEmpty,
      });

      if (response.status === 200) {
        if (semanticEmpty) {
          return {
            rawQuery,
            normalizedQuery,
            attempts,
            results: response.results ?? [],
            nextCursor: response.nextCursor ?? null,
            stopReason: 'semantic-empty',
          };
        }
        return {
          rawQuery,
          normalizedQuery,
          attempts,
          results: response.results ?? [],
          nextCursor: response.nextCursor ?? null,
          stopReason: 'success',
        };
      }

      if (
        strategy === 'strategy-v2'
        && isFallbackAllowed({ status: response.status, semanticEmpty })
        && provider !== providers.at(-1)
      ) {
        continue;
      }

      return {
        rawQuery,
        normalizedQuery,
        attempts,
        results: [],
        nextCursor: null,
        stopReason: stopReasonFor(response.status, semanticEmpty),
      };
    } catch (error) {
      attempts.push({ provider, status: null, transportError: true });
      if (strategy === 'strategy-v2' && isFallbackAllowed({ transportError: true }) && provider !== providers.at(-1)) {
        continue;
      }
      return {
        rawQuery,
        normalizedQuery,
        attempts,
        results: [],
        nextCursor: null,
        stopReason: 'transport-error',
      };
    }
  }

  return {
    rawQuery,
    normalizedQuery,
    attempts,
    results: [],
    nextCursor: null,
    stopReason: 'provider-exhausted',
  };
}

export async function collectPages({ fetchPage, maxPages = 8 }) {
  const pages = [];
  const seenCursors = new Set();
  let cursor = null;

  for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
    if (seenCursors.has(cursor)) {
      return { pages, stopReason: 'repeated-cursor', cursor };
    }
    seenCursors.add(cursor);
    const page = await fetchPage(cursor);
    pages.push(page);
    const nextCursor = page.nextCursor ?? null;
    if (nextCursor === null) {
      return { pages, stopReason: 'complete', cursor: null };
    }
    if (seenCursors.has(nextCursor)) {
      return { pages, stopReason: 'repeated-cursor', cursor: nextCursor };
    }
    cursor = nextCursor;
  }

  return { pages, stopReason: 'max-pages', cursor };
}
