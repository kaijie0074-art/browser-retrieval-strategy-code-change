import http from 'node:http';
import { URL } from 'node:url';
import { retrieveWithFallback } from '../src/strategy.mjs';

const result = (id, title) => ({ id, title, url: `https://fixture.invalid/${id}` });

function providerResponse(provider, query, cursor) {
  if (query === 'fallback' && provider === 'primary') {
    return { status: 503, results: [], error: 'primary unavailable' };
  }
  if (query === 'fallback' && provider === 'secondary') {
    return { status: 200, results: [result('fallback-1', 'Fallback result')] };
  }
  if (query === 'rate limit' || query === 'limit rate') {
    return { status: 429, results: [], error: 'rate limited', retryAfter: 30 };
  }
  if (query === 'empty') {
    return { status: 200, results: [], semanticEmpty: true };
  }
  if (query === 'paged-loop') {
    return { status: 200, results: [result('loop-1', 'Loop page')], nextCursor: 'loop-cursor' };
  }
  if (query === 'paged') {
    if (cursor === null) {
      return {
        status: 200,
        results: [result('page-1', 'First page')],
        nextCursor: 'page-2',
      };
    }
    return {
      status: 200,
      results: [result('page-2', 'Second page')],
      nextCursor: null,
    };
  }
  if (query === 'browser retrieval') {
    return {
      status: 200,
      results: [result('browser-1', 'Browser retrieval'), result('browser-2', 'Retrieval strategy')],
    };
  }
  if (query.includes('  ') || query.trim() !== query) {
    return { status: 200, results: [], semanticEmpty: false, note: 'raw query was not normalized' };
  }
  return { status: 200, results: [result(`${provider}-generic`, `Generic ${provider} result`)] };
}

function html() {
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>Browser Retrieval Strategy Fixture</title></head>
<body>
  <main>
    <h1>Browser Retrieval Strategy Fixture</h1>
    <label>Query <input id="query" value=" Browser   Retrieval "></label>
    <label>Strategy <select id="strategy"><option value="baseline">baseline</option><option value="strategy-v2">strategy-v2</option></select></label>
    <button id="run">Run retrieval</button>
    <pre id="evidence" aria-live="polite">not run</pre>
  </main>
  <script>
    const query = document.querySelector('#query');
    const strategy = document.querySelector('#strategy');
    const evidence = document.querySelector('#evidence');
    document.querySelector('#run').addEventListener('click', async () => {
      const params = new URLSearchParams({ query: query.value, strategy: strategy.value });
      const response = await fetch('/api/retrieve?' + params);
      const body = await response.json();
      window.__strategyEvidence = body;
      evidence.textContent = JSON.stringify(body, null, 2);
    });
  </script>
</body>
</html>`;
}

export function createProviderFixtureServer({ port = 0 } = {}) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(html());
      return;
    }
    if (url.pathname === '/api/retrieve') {
      const rawQuery = url.searchParams.get('query') ?? '';
      const strategy = url.searchParams.get('strategy') ?? 'strategy-v2';
      const cursor = url.searchParams.get('cursor') || null;
      const body = await retrieveWithFallback({
        rawQuery,
        strategy,
        cursor,
        providerRequest: async (provider, input) => providerResponse(provider, input.query, input.cursor),
      });
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(body));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
  });

  return {
    server,
    async start() {
      await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
      const address = server.address();
      return `http://127.0.0.1:${address.port}`;
    },
    async close() {
      if (!server.listening) return;
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}
