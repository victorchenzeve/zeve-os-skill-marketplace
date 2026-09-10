import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readMetadata, sanitize, duplicateGroups, buildInventory } from '../scripts/build-skill-inventory.mjs';
import { findSkills, hash } from '../scripts/discover-codex-skills.mjs';
import { validateInventory } from '../scripts/validate-inventory.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const parent = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(parent, 'zewei-inventory-test-'));
  t.after(() => {
    assert.equal(path.dirname(fs.realpathSync(root)), parent);
    assert.ok(path.basename(root).startsWith('zewei-inventory-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'source'));
  const file = path.join(root, 'source', 'SKILL.md');
  const content = '---\nname: demo\ndescription: demo inventory input\n---\n# Demo\n';
  fs.writeFileSync(file, content);
  fs.cpSync(path.join(repo, 'schemas'), path.join(root, 'schemas'), { recursive: true });
  const source = { path: file, root: 'fixture', roots: ['fixture'], kind: 'installed-location',
    alias: '%FIXTURE%/SKILL.md', sha256: hash(content), bytes: Buffer.byteLength(content), modifiedAt: '2026-09-09T00:00:00Z' };
  const discovery = { startedAt: '2026-09-09T00:00:00.000Z', finishedAt: '2026-09-09T00:00:01.000Z',
    roots: [{ id: 'fixture', path: path.dirname(file), alias: '%FIXTURE%', kind: 'installed-location', status: 'scanned', count: 1, errors: [] }],
    files: [source], changedDuringScan: [], runtime: { status: 'available', result: { data: [{ cwd: path.dirname(file), errors: [],
      skills: [{ path: file, name: 'demo', description: 'demo inventory input', enabled: true, scope: 'user', pluginId: null }] }] } } };
  return { root, file, content, discovery };
}

test('inventory snapshot validates without accessing source skill directories', () => assert.deepEqual(validateInventory(repo), []));
test('metadata extraction handles BOM, folded text and nested source declarations', () => {
  const result = readMetadata('\uFEFF---\nname: demo\ndescription: >-\n  line one\n  line two\nmetadata:\n  imported_status: "catalog-only-minimal"\n---\n# Demo');
  assert.equal(result.hasFrontmatter, true);
  assert.equal(result.fields.description, 'line one line two');
  assert.equal(result.fields.imported_status, 'catalog-only-minimal');
});
test('missing frontmatter is recorded, not fixed', () => {
  assert.deepEqual(readMetadata('# Demo'), { hasFrontmatter: false, fields: {} });
});
test('privacy filter removes local identity, credentials and private document IDs', () => {
  const text = 'C:\\Users\\someone\\skills\\demo user@example.com sk-abcdefghijklmnop https://tenant.feishu.cn/docx/private-id?token=abc';
  const filtered = sanitize(text, [{ path: 'C:\\Users\\someone\\skills', alias: '%SKILLS%' }]);
  assert.ok(filtered.includes('%SKILLS%'));
  assert.ok(!filtered.includes('someone'));
  assert.ok(!filtered.includes('user@example.com'));
  assert.ok(!filtered.includes('abcdefghijklmnop'));
  assert.ok(!filtered.includes('private-id'));
});
test('privacy filter preserves a separator after a drive-root alias', () => {
  assert.equal(sanitize('F:\\project', [{ path: 'F:\\', alias: '%DRIVE%' }]), '%DRIVE%/project');
});
test('duplicate grouping preserves each record and does not merge different hashes', () => {
  const rows = [{ recordId: 'a', name: 'same', sha256: 'one' }, { recordId: 'b', name: 'same', sha256: 'two' }];
  assert.equal(duplicateGroups(rows, 'name').length, 1);
  assert.equal(duplicateGroups(rows, 'sha256').length, 0);
  assert.equal(rows.length, 2);
});
test('scanner includes hidden SKILL files and excludes dependencies', t => {
  const f = fixture(t);
  const hidden = path.join(f.root, 'source', '.hidden');
  const dependency = path.join(f.root, 'source', 'node_modules');
  fs.mkdirSync(hidden); fs.mkdirSync(dependency);
  fs.writeFileSync(path.join(hidden, 'SKILL.md'), '# Hidden');
  fs.writeFileSync(path.join(dependency, 'SKILL.md'), '# Dependency');
  assert.equal(findSkills(path.join(f.root, 'source')).files.length, 2);
});
test('snapshot generation preserves the source and refuses overwrite', t => {
  const f = fixture(t);
  const summary = buildInventory(f.discovery, path.join(f.root, 'inventory'));
  assert.equal(fs.readFileSync(f.file, 'utf8'), f.content);
  assert.equal(summary.integrity.changedSkillMdFiles.length, 0);
  assert.deepEqual(validateInventory(f.root), []);
  assert.throws(() => buildInventory(f.discovery, path.join(f.root, 'inventory')), /Snapshot already exists/);
});
test('changed source fails before writing a snapshot', t => {
  const f = fixture(t); fs.writeFileSync(f.file, '# Changed');
  assert.throws(() => buildInventory(f.discovery, path.join(f.root, 'inventory')), /Source changed/);
  assert.equal(fs.existsSync(path.join(f.root, 'inventory')), false);
});
test('offline validator detects summary drift', t => {
  const f = fixture(t); const summary = buildInventory(f.discovery, path.join(f.root, 'inventory'));
  const file = path.join(f.root, 'inventory', 'snapshots', summary.snapshotId, 'summary.json');
  fs.writeFileSync(file, JSON.stringify({ ...summary, sourceFiles: 99 }));
  assert.match(validateInventory(f.root).join('\n'), /summary count mismatch: sourceFiles/);
});
