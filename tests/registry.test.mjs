import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRepository, validateSchema } from '../scripts/validate.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zeve-registry-test-'));
  t.after(() => {
    // Only remove the exact temporary directory this test created.
    assert.equal(path.dirname(root), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('zeve-registry-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  fs.cpSync(path.join(repo, 'schemas'), path.join(root, 'schemas'), { recursive: true });
  const write = (name, value) => {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
  };
  for (const kind of ['skills', 'plugins', 'agents', 'dependencies']) {
    write(`registry/${kind}.yaml`, { schemaVersion: '2.0.0', [kind]: [] });
  }
  const metadata = evidencePath => ({
    license: 'MIT',
    provenance: { classification: 'original', owner: 'zeve-os', source: 'fixture', reviewedAt: '2026-09-14' },
    evaluation: { status: 'synthetic-passed', evidencePath, reviewedAt: '2026-09-14' },
  });
  const skill = { id: 'demo', name: '示例', description: '演示能力', version: '0.1.0',
    path: 'skills/core/demo', category: 'core', maturity: 'draft', status: 'active', tags: [],
    ...metadata('evals/demo/evaluation.md') };
  write('skills/core/demo/SKILL.md', '---\nname: demo\ndescription: A complete demo skill for registry validation.\nlicense: MIT\n---\n# 示例\n');
  write('evals/demo/evaluation.md', '# Eval\n');
  write('registry/skills.yaml', { schemaVersion: '2.0.0', skills: [skill] });
  const registry = (kind, entries) => write(`registry/${kind}.yaml`, { schemaVersion: '2.0.0', [kind]: entries });
  const plugin = () => {
    const entry = { id: 'demo-pack', name: '示例插件', description: '组合示例', version: '0.1.0',
      path: 'plugins/demo-pack', maturity: 'draft', status: 'active', skills: ['demo'],
      ...metadata('evals/plugins/demo-pack/evaluation.md') };
    const { id, name, description, version, skills } = entry;
    write('plugins/demo-pack/plugin.json', { id, name, description, version, skills });
    write('evals/plugins/demo-pack/evaluation.md', '# Eval\n');
    registry('plugins', [entry]);
    return entry;
  };
  return { root, write, registry, skill, plugin, errors: () => validateRepository(root) };
}

test('the repository validates', () => assert.deepEqual(validateRepository(repo), []));
test('valid skill, plugin, agent and explicit dependency', t => {
  const f = fixture(t);
  f.plugin();
  f.write('templates/agent/DEMO.md', '# Demo');
  f.registry('agents', [{ id: 'demo-agent', name: '代理', description: '演示代理', version: '0.1.0',
    path: 'templates/agent/DEMO.md', maturity: 'draft', status: 'active', skills: ['demo'],
    license: 'MIT', provenance: { classification: 'original', owner: 'zeve-os', source: 'fixture', reviewedAt: '2026-09-14' },
    evaluation: { status: 'synthetic-passed', evidencePath: 'evals/agents/demo-agent/evaluation.md', reviewedAt: '2026-09-14' } }]);
  f.write('evals/agents/demo-agent/evaluation.md', '# Eval\n');
  f.registry('dependencies', [{ from: 'agent:demo-agent', to: 'plugin:demo-pack', reason: '组合' }]);
  assert.deepEqual(f.errors(), []);
});
test('duplicate ids are rejected', t => {
  const f = fixture(t); f.registry('skills', [f.skill, f.skill]);
  assert.match(f.errors().join('\n'), /duplicate id/);
});
test('legacy zewei asset prefix is rejected', t => {
  const f = fixture(t);
  const legacy = { ...f.skill, id: 'zewei-demo', path: 'skills/core/zewei-demo' };
  f.write('skills/core/zewei-demo/SKILL.md', '# Legacy\n');
  f.registry('skills', [legacy]);
  assert.match(f.errors().join('\n'), /legacy zewei prefix is forbidden/);
});
test('missing skill instructions are rejected', t => {
  const f = fixture(t); fs.unlinkSync(path.join(f.root, f.skill.path, 'SKILL.md'));
  assert.match(f.errors().join('\n'), /SKILL.md: missing/);
});
test('skill frontmatter name and allowed fields are enforced', t => {
  const f = fixture(t);
  f.write('skills/core/demo/SKILL.md', '---\nname: wrong\ndescription: Demo.\nlicense: MIT\nunexpected: true\n---\n# Demo\n');
  assert.match(f.errors().join('\n'), /name differs from Registry/);
  assert.match(f.errors().join('\n'), /unexpected SKILL.md frontmatter key/);
});
test('version format and unknown fields are rejected', t => {
  const f = fixture(t); f.registry('skills', [{ ...f.skill, version: '01.0.0', typo: true }]);
  assert.match(f.errors().join('\n'), /version: invalid format/);
  assert.match(f.errors().join('\n'), /unknown field typo/);
});
test('required fields are checked', t => {
  const f = fixture(t); const { description, ...entry } = f.skill;
  f.registry('skills', [entry]); assert.match(f.errors().join('\n'), /missing description/);
});
test('unsafe and category-mismatched paths are rejected', t => {
  const f = fixture(t); f.registry('skills', [{ ...f.skill, path: '../outside' }]);
  assert.match(f.errors().join('\n'), /unsafe relative path/);
  assert.match(f.errors().join('\n'), /path must match/);
});
test('symlinks cannot escape the repository', t => {
  const f = fixture(t);
  const link = path.join(f.root, 'skills', 'core', 'external');
  fs.symlinkSync(repo, link, process.platform === 'win32' ? 'junction' : 'dir');
  f.registry('skills', [{ ...f.skill, id: 'external', path: 'skills/core/external' }]);
  assert.match(f.errors().join('\n'), /path escapes repository/);
});
test('unknown plugin skill references are rejected', t => {
  const f = fixture(t); f.plugin(); f.registry('skills', []);
  assert.match(f.errors().join('\n'), /unregistered dependency target/);
});
test('plugin manifest drift is rejected', t => {
  const f = fixture(t); const entry = f.plugin();
  f.registry('plugins', [{ ...entry, version: '0.2.0' }]);
  assert.match(f.errors().join('\n'), /manifest version mismatch/);
});
test('implicit membership edges participate in cycle checks', t => {
  const f = fixture(t); f.plugin();
  f.registry('dependencies', [{ from: 'skill:demo', to: 'plugin:demo-pack', reason: '循环' }]);
  assert.match(f.errors().join('\n'), /dependency cycle/);
});
test('duplicate edges and self dependencies are rejected', t => {
  const f = fixture(t); const edge = { from: 'skill:demo', to: 'skill:demo', reason: '错误' };
  f.registry('dependencies', [edge, edge]);
  assert.match(f.errors().join('\n'), /duplicate dependency/);
  assert.match(f.errors().join('\n'), /self dependency/);
});
test('unregistered dependency sources are rejected', t => {
  const f = fixture(t);
  f.registry('dependencies', [{ from: 'agent:missing', to: 'skill:demo', reason: '错误' }]);
  assert.match(f.errors().join('\n'), /unregistered dependency source/);
});
test('malformed YAML content fails with a diagnostic', t => {
  const f = fixture(t); f.write('registry/skills.yaml', 'skills: []');
  assert.match(f.errors().join('\n'), /cannot read JSON-compatible YAML/);
});
test('duplicate members and invalid maturity are rejected', t => {
  const f = fixture(t); f.registry('skills', [{ ...f.skill, tags: ['a', 'a'], maturity: 'ready' }]);
  assert.match(f.errors().join('\n'), /duplicate array item/);
  assert.match(f.errors().join('\n'), /invalid enum value/);
});
test('unknown schema keywords fail closed', () => {
  const errors = []; validateSchema('abc', { type: 'string', maxLength: 2 }, 'fixture', errors);
  assert.match(errors.join('\n'), /unsupported schema keyword maxLength/);
});
test('stable skills require repository or real-world evidence', t => {
  const f = fixture(t);
  f.registry('skills', [{ ...f.skill, maturity: 'stable' }]);
  assert.match(f.errors().join('\n'), /stable maturity requires repository or real-world evidence/);
});
