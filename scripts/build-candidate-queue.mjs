import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auditRelative = 'inventory/audits/2026-09-13-feishu-base-reconciliation.json';
const outputRelative = 'inventory/candidates/queue.json';

const fingerprint = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);
const compare = (a, b) => {
  const left = `${a.type}:${a.name}:${a.id}`;
  const right = `${b.type}:${b.name}:${b.id}`;
  return left < right ? -1 : left > right ? 1 : 0;
};

export function buildCandidateQueue(root = defaultRoot) {
  const auditText = fs.readFileSync(path.join(root, auditRelative), 'utf8').replace(/\r\n/g, '\n');
  const auditBytes = Buffer.from(auditText, 'utf8');
  const audit = JSON.parse(auditText);
  const items = [];
  for (const group of audit.duplicateNames) {
    items.push({
      id: `duplicate-${fingerprint(group)}`,
      type: 'duplicate-record-review', status: 'pending-external-review',
      name: group.normalizedName,
      action: '核对版本、状态和来源，确定主记录；未经确认不合并或删除。',
      evidence: { rows: group.rows }
    });
  }
  for (const entry of audit.missingFromTable) {
    items.push({
      id: `missing-table-${fingerprint(entry)}`,
      type: 'runtime-missing-from-table', status: 'pending-external-review',
      name: entry.name,
      action: '核实来源、许可证、所有者和是否值得登记；系统或插件资产不得冒充自有资产。',
      evidence: entry
    });
  }
  for (const entry of audit.tableOnly) {
    items.push({
      id: `table-only-${fingerprint(entry)}`,
      type: 'table-entry-absent-from-runtime', status: 'pending-external-review',
      name: entry.name,
      action: '核实是否已停用、移动、改名或缺失安装；未经确认不恢复、不删除。',
      evidence: entry
    });
  }
  for (const entry of audit.runtimeLoadErrors) {
    items.push({
      id: `load-error-${fingerprint(entry)}`,
      type: 'runtime-load-error', status: 'pending-skill-owner-review',
      name: entry.name,
      action: '由资产所有者核实文件结构并决定是否修复；本盘点阶段不修改原 Skill。',
      evidence: entry
    });
  }
  items.sort(compare);
  const countByType = Object.fromEntries([...new Set(items.map(item => item.type))].sort().map(type => [type, items.filter(item => item.type === type).length]));
  return {
    schemaVersion: '1.0.0',
    generatedFrom: auditRelative.replaceAll('\\', '/'),
    sourceAuditedAt: audit.auditedAt,
    sourceSha256: crypto.createHash('sha256').update(auditBytes).digest('hex'),
    policy: '只记录核对动作；不自动修改 Skill、飞书表、安装状态或正式 Registry。',
    summary: { total: items.length, countByType },
    items
  };
}

export function queueText(root = defaultRoot) {
  return `${JSON.stringify(buildCandidateQueue(root), null, 2)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = defaultRoot;
  const target = path.join(root, outputRelative);
  const expected = queueText(root);
  if (process.argv.includes('--check')) {
    const actual = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (actual !== expected) {
      console.error('Candidate queue is stale. Run npm run candidates:build.');
      process.exitCode = 1;
    } else console.log(`Candidate queue is current (${buildCandidateQueue(root).summary.total} items).`);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected);
    console.log(`Wrote ${path.relative(root, target)} (${buildCandidateQueue(root).summary.total} items).`);
  }
}
