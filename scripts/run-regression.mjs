import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createProviderFixtureServer } from '../fixtures/provider-server.mjs';
import { collectPages, normalizeQuery, retrieveWithFallback } from '../src/strategy.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = createProviderFixtureServer();
const baseUrl = await fixture.start();
const checks = [];
const record = (id, detail) => checks.push({ id, status: 'passed', detail });

try {
  assert.equal(normalizeQuery(' Browser   Retrieval browser '), 'browser retrieval');
  record('query-normalization', 'trim, lowercase, collapse, deduplicate, stable sort');

  const baseRaw = await fetch(`${baseUrl}/api/retrieve?query=${encodeURIComponent(' Browser   Retrieval ')}&strategy=baseline`).then((r) => r.json());
  assert.equal(baseRaw.results.length, 0);
  record('baseline-raw-query', baseRaw.stopReason);

  const normalized = await fetch(`${baseUrl}/api/retrieve?query=${encodeURIComponent(' Browser   Retrieval ')}&strategy=strategy-v2`).then((r) => r.json());
  assert.equal(normalized.normalizedQuery, 'browser retrieval');
  assert.equal(normalized.results.length, 2);
  record('query-normalization-browser', JSON.stringify(normalized.attempts));

  const fallback = await fetch(`${baseUrl}/api/retrieve?query=fallback&strategy=strategy-v2`).then((r) => r.json());
  assert.deepEqual(fallback.attempts.map((attempt) => [attempt.provider, attempt.status]), [['primary', 503], ['secondary', 200]]);
  assert.equal(fallback.results.length, 1);
  record('fallback-503', 'primary 503 -> secondary 200 exactly once');

  const rateLimit = await fetch(`${baseUrl}/api/retrieve?query=rate%20limit&strategy=strategy-v2`).then((r) => r.json());
  assert.equal(rateLimit.stopReason, 'rate-limited');
  assert.equal(rateLimit.attempts.length, 1);
  record('rate-limit-no-fallback', '429 stops without secondary call');

  const empty = await fetch(`${baseUrl}/api/retrieve?query=empty&strategy=strategy-v2`).then((r) => r.json());
  assert.equal(empty.stopReason, 'semantic-empty');
  assert.equal(empty.attempts.length, 1);
  record('semantic-empty-no-fallback', 'semantic-empty is not treated as provider outage');

  const repeated = await collectPages({
    fetchPage: async () => ({ results: [{ id: 'loop-1' }], nextCursor: 'same' }),
  });
  assert.equal(repeated.stopReason, 'repeated-cursor');
  assert.equal(repeated.pages.length, 2);
  record('repeated-cursor', 'duplicate cursor stops pagination');

  const transportFallback = await retrieveWithFallback({
    rawQuery: 'transport',
    providerRequest: async (provider) => {
      if (provider === 'primary') throw new Error('fixture transport failure');
      return { status: 200, results: [{ id: 'secondary-1' }] };
    },
  });
  assert.equal(transportFallback.results.length, 1);
  assert.equal(transportFallback.attempts[0].transportError, true);
  record('transport-fallback', 'transport error is bounded to one secondary attempt');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(baseUrl);
  await page.locator('#query').fill(' Browser   Retrieval ');
  await page.locator('#strategy').selectOption('strategy-v2');
  await page.locator('#run').click();
  await page.waitForFunction(() => Boolean(window.__strategyEvidence));
  const visibleEvidence = await page.locator('#evidence').textContent();
  assert.match(visibleEvidence, /browser retrieval/);
  assert.match(visibleEvidence, /browser-1/);
  await browser.close();
  record('browser-smoke', 'Chromium rendered strategy evidence and results');

  await fs.writeFile(
    path.join(projectRoot, 'evidence/latest-run.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), checks }, null, 2) + '\n',
  );
  console.log(`PASS ${checks.length} retrieval strategy checks`);
} finally {
  await fixture.close();
}
