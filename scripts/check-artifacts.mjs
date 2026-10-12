import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'README.md',
  'LICENSE',
  'docs/open-source-references.md',
  'docs/strategy-change.md',
  'docs/repair-references.md',
  'docs/reproductions/README.md',
  'docs/regression-records/浏览器检索策略-回归记录-20261012.md',
  'src/strategy.mjs',
  'fixtures/provider-server.mjs',
  'scripts/run-regression.mjs',
  'evidence/latest-run.json',
];
for (const relative of required) {
  await fs.access(path.join(root, relative));
}
const reports = (await fs.readdir(path.join(root, 'docs/issue-reports'))).filter((name) => name.endsWith('.md'));
assert.ok(reports.length >= 5, 'at least five issue reports are required');
for (const report of reports) {
  const content = await fs.readFile(path.join(root, 'docs/issue-reports', report), 'utf8');
  assert.match(content, /FIX-STR-/);
  assert.match(content, /回归/);
}
const files = [];
async function visit(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(file);
    else files.push(file);
  }
}
await visit(root);
for (const file of files) {
  const content = await fs.readFile(file, 'utf8');
  assert.doesNotMatch(content, /ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9]+|Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/i, file);
}
console.log(`PASS artifact check: ${reports.length} reports, ${files.length} files scanned`);
