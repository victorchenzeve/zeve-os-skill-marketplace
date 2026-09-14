import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCandidateQueue } from '../scripts/build-candidate-queue.mjs';
import { buildGovernanceCatalog, buildWaves } from '../scripts/build-governance-catalog.mjs';

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
  assert.match(queue.generatedFrom, /2026-09-15-feishu-base-reconciliation\.json$/);
  assert.ok(queue.items.every(item => item.status === 'decision-ready' && item.canAutoExecute === false));
});

test('every observed logical skill has one governance disposition and one planned place', () => {
  const catalog = buildGovernanceCatalog(repo);
  const waves = buildWaves(repo);
  assert.equal(catalog.summary.logicalSkills, 923);
  assert.equal(catalog.summary.formalSkills, 28);
  assert.equal(new Set(catalog.skills.map(item => item.normalizedName)).size, catalog.skills.length);
  const planned = waves.waves.flatMap(wave => wave.items);
  assert.equal(planned.length, catalog.summary.logicalSkills - catalog.summary.formalSkills);
  assert.equal(new Set(planned.map(item => item.id)).size, planned.length);
  assert.ok(waves.waves.every(wave => wave.itemCount > 0 && wave.itemCount <= 50));
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
