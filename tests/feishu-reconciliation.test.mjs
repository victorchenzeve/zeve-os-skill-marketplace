import test from 'node:test';
import assert from 'node:assert/strict';
import { cellText, normalizeName, normalizeSource, rowObjects } from '../scripts/reconcile-feishu-skills.mjs';

test('Feishu name normalization handles links and Unicode separators', () => {
  assert.equal(normalizeName('[Demo_Skill](https://example.invalid/doc)'), 'demo-skill');
  assert.equal(normalizeName('  Demo—Skill  '), 'demo-skill');
});

test('Feishu cells flatten common values and normalize source paths', () => {
  assert.equal(cellText(['可用', { text: '已验证' }]), '可用, 已验证');
  assert.equal(normalizeSource('"C:\\Users\\demo\\skill\\"'), 'c:/users/demo/skill');
});

test('record rows map both string fields and field objects', () => {
  assert.deepEqual(rowObjects({
    fields: ['技能编号', { name: '技能名称' }],
    records: [{ recordId: 'record-1', row: ['SK-1', 'demo'] }],
  }), [{ recordId: 'record-1', fields: { 技能编号: 'SK-1', 技能名称: 'demo' } }]);
});
