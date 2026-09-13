import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installSelection, uninstallSelection, verifyDistribution } from '../scripts/marketplace-cli.mjs';

function target(t) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'zewei-marketplace-test-'));
  t.after(() => {
    assert.ok(path.basename(root).startsWith('zewei-marketplace-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return root;
}

test('formal marketplace distribution validates', () => {
  assert.deepEqual(verifyDistribution(), []);
});

test('plugin install copies its registered skills and writes a receipt', t => {
  const root = target(t);
  const result = installSelection('zewei-os-private-domain', { target: root });
  assert.deepEqual(result.installed, [
    'private-domain-audience-segmenter',
    'private-domain-campaign-planner',
    'private-domain-conversation-reviewer',
  ]);
  for (const id of result.installed) assert.ok(fs.existsSync(path.join(root, id, 'SKILL.md')));
  const receipt = JSON.parse(fs.readFileSync(path.join(root, '.zewei-os-marketplace.json'), 'utf8'));
  assert.deepEqual(receipt.skills['private-domain-audience-segmenter'].owners, ['plugin:zewei-os-private-domain']);
});

test('shared ownership prevents plugin uninstall from removing a separately installed skill', t => {
  const root = target(t);
  installSelection('zewei-os-private-domain', { target: root });
  installSelection('private-domain-audience-segmenter', { target: root });
  uninstallSelection('zewei-os-private-domain', { target: root });
  assert.ok(fs.existsSync(path.join(root, 'private-domain-audience-segmenter', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(root, 'private-domain-campaign-planner')));
  uninstallSelection('private-domain-audience-segmenter', { target: root });
  assert.ok(!fs.existsSync(path.join(root, 'private-domain-audience-segmenter')));
});

test('uninstall refuses to remove locally modified skills without force', t => {
  const root = target(t);
  installSelection('private-domain-conversation-reviewer', { target: root });
  fs.appendFileSync(path.join(root, 'private-domain-conversation-reviewer', 'SKILL.md'), '\nlocal change\n');
  assert.throws(() => uninstallSelection('private-domain-conversation-reviewer', { target: root }), /modified after installation/);
  const result = uninstallSelection('private-domain-conversation-reviewer', { target: root, force: true });
  assert.deepEqual(result.removed, ['private-domain-conversation-reviewer']);
});
test('plugin install preflight prevents partial writes when one member conflicts', t => {
  const root = target(t);
  const conflict = path.join(root, 'private-domain-campaign-planner');
  fs.mkdirSync(conflict);
  fs.writeFileSync(path.join(conflict, 'SKILL.md'), 'unmanaged');
  assert.throws(() => installSelection('zewei-os-private-domain', { target: root }), /not managed/);
  assert.ok(!fs.existsSync(path.join(root, 'private-domain-audience-segmenter')));
  assert.equal(fs.readFileSync(path.join(conflict, 'SKILL.md'), 'utf8'), 'unmanaged');
});

test('plugin uninstall preflight prevents partial removal when one member changed', t => {
  const root = target(t);
  installSelection('zewei-os-private-domain', { target: root });
  fs.appendFileSync(path.join(root, 'private-domain-campaign-planner', 'SKILL.md'), '\nlocal change\n');
  assert.throws(() => uninstallSelection('zewei-os-private-domain', { target: root }), /modified after installation/);
  assert.ok(fs.existsSync(path.join(root, 'private-domain-audience-segmenter')));
  assert.ok(fs.existsSync(path.join(root, 'private-domain-conversation-reviewer')));
});
