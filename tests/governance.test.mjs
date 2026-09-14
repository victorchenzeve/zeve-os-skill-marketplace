import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCandidateQueue } from '../scripts/build-candidate-queue.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Feishu reconciliation is fully represented by the candidate queue', () => {
  const queue = buildCandidateQueue(repo);
  assert.equal(queue.summary.total, 58);
  assert.deepEqual(queue.summary.countByType, {
    'duplicate-record-review': 21,
    'runtime-load-error': 3,
    'runtime-missing-from-table': 26,
    'table-entry-absent-from-runtime': 8,
  });
  assert.equal(new Set(queue.items.map(item => item.id)).size, queue.items.length);
});

test('all formal asset evaluation evidence is readable', () => {
  for (const kind of ['skills', 'plugins', 'agents']) {
    const registry = JSON.parse(fs.readFileSync(path.join(repo, 'registry', `${kind}.yaml`), 'utf8'));
    for (const entry of registry[kind]) {
      const evidence = path.resolve(repo, entry.evaluation.evidencePath);
      assert.ok(evidence.startsWith(`${repo}${path.sep}`));
      assert.ok(fs.statSync(evidence).isFile(), entry.id);
    }
  }
});
