import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createProviderFixtureServer } from '../fixtures/provider-server.mjs';
import { collectPages } from '../src/strategy.mjs';
import { scenarios } from './scenario-catalog.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(root, '..');
const scenarioName = process.argv[2] === '--scenario' ? process.argv[3] : 'query-normalization';
const scenario = scenarios[scenarioName];
if (!scenario) throw new Error(`Unknown scenario: ${scenarioName}`);

const fixture = createProviderFixtureServer();
const baseUrl = await fixture.start();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const requests = [];
page.on('request', (request) => {
  if (request.url().includes('/api/retrieve')) requests.push(request.url());
});

try {
  await page.goto(baseUrl);
  await page.locator('#query').fill(scenario.rawQuery);
  await page.locator('#strategy').selectOption(scenario.strategy);
  if (scenarioName === 'repeated-cursor') {
    const evidence = await page.evaluate(async ({ rawQuery, strategy }) => {
      const pages = [];
      const seen = new Set();
      let cursor = null;
      for (let index = 0; index < 8; index += 1) {
        if (seen.has(cursor)) return { pages, stopReason: 'repeated-cursor', cursor };
        seen.add(cursor);
        const params = new URLSearchParams({ query: rawQuery, strategy });
        if (cursor) params.set('cursor', cursor);
        const body = await fetch('/api/retrieve?' + params).then((response) => response.json());
        pages.push(body);
        if (!body.nextCursor) return { pages, stopReason: 'complete', cursor: null };
        if (seen.has(body.nextCursor)) return { pages, stopReason: 'repeated-cursor', cursor: body.nextCursor };
        cursor = body.nextCursor;
      }
      return { pages, stopReason: 'max-pages', cursor };
    }, scenario);
    const evidenceWithRequests = { scenario: scenarioName, ...evidence, requests };
    await fs.writeFile(path.join(projectRoot, 'evidence/latest-run.json'), JSON.stringify(evidenceWithRequests, null, 2) + '\n');
    console.log(JSON.stringify(evidenceWithRequests, null, 2));
  } else {
    await page.locator('#run').click();
    await page.waitForFunction(() => Boolean(window.__strategyEvidence));
    const evidence = await page.evaluate(() => window.__strategyEvidence);
    const evidenceWithRequests = { scenario: scenarioName, ...evidence, requests };
    await fs.writeFile(path.join(projectRoot, 'evidence/latest-run.json'), JSON.stringify(evidenceWithRequests, null, 2) + '\n');
    console.log(JSON.stringify(evidenceWithRequests, null, 2));
  }
} finally {
  await browser.close();
  await fixture.close();
}
