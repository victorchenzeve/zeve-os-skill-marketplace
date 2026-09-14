import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSchema } from './validate.mjs';
import { duplicateGroups } from './build-skill-inventory.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function validateInventory(root = repo) {
  const errors = [];
  try {
    const base = path.join(root, 'inventory');
    const read = name => JSON.parse(fs.readFileSync(name, 'utf8'));
    const latest = read(path.join(base, 'latest.json'));
    for (const file of [latest.catalog, latest.summary]) {
      if (typeof file !== 'string' || !file.startsWith('snapshots/') || file.includes('..') || file.includes('\\')) {
        return ['latest.json contains unsafe snapshot path'];
      }
    }
    const catalog = read(path.join(base, latest.catalog));
    const summary = read(path.join(base, latest.summary));
    const schema = read(path.join(root, 'schemas', 'inventory.schema.json'));
    validateSchema(catalog, schema, 'inventory catalog', errors);
    if (errors.length) return errors;
    const records = catalog.records;
    if (latest.snapshotId !== catalog.snapshotId || latest.snapshotId !== summary.snapshotId) errors.push('snapshot IDs differ');
    if (new Set(records.map(record => record.recordId)).size !== records.length) errors.push('duplicate inventory IDs');
    if (new Set(records.map(record => record.sourcePath.toLowerCase())).size !== records.length) errors.push('duplicate source paths');
    const outsideRuntime = summary.runtimeOutsideScan.flatMap(item => item.runtime ?? []);
    const expected = {
      sourceFiles: records.length,
      installedLocationOrRuntime: records.filter(record => record.installedLocationOrRuntime).length,
      runtimeUniquePaths: records.filter(record => record.runtime.length).length + summary.runtimeOutsideScan.length,
      enabledInAnyContext: records.filter(record => record.runtime.some(item => item.enabled)).length +
        summary.runtimeOutsideScan.filter(item => (item.runtime ?? []).some(runtime => runtime.enabled)).length,
      localCreationReviewFiles: records.filter(record => record.localCreation.status !== 'unverified').length,
      localDerivedFiles: records.filter(record => record.localCreation.status === 'derived-generation-evidence').length,
      zeweiRelatedCandidates: records.filter(record => record.localCreation.status === 'zewei-related-candidate').length,
      sameNameGroups: duplicateGroups(records, 'baseName').length,
      identicalSkillMdGroups: duplicateGroups(records, 'sha256').length,
    };
    for (const [key, value] of Object.entries(expected)) {
      if (summary[key] !== value) errors.push(`summary count mismatch: ${key}`);
    }
    if (summary.integrity.checkedSkillMdFiles !== records.length || summary.integrity.changedSkillMdFiles.length || summary.integrity.pathChanges.length) {
      errors.push('source integrity checks incomplete or report changes');
    }
    const directory = path.dirname(path.join(base, latest.catalog));
    const groups = read(path.join(directory, 'duplicates.json'));
    if (JSON.stringify(groups.sameName) !== JSON.stringify(duplicateGroups(records, 'baseName'))) errors.push('same-name groups mismatch');
    if (JSON.stringify(groups.identicalSkillMd) !== JSON.stringify(duplicateGroups(records, 'sha256'))) errors.push('identical-content groups mismatch');
    for (const context of summary.runtimeContexts) {
      const members = records.flatMap(record => record.runtime.filter(item => item.contextId === context.id))
        .concat(outsideRuntime.filter(item => item.contextId === context.id));
      if (members.length !== context.count || members.filter(item => item.enabled).length !== context.enabled ||
          members.filter(item => !item.enabled).length !== context.disabled) errors.push(`runtime count mismatch: ${context.id}`);
    }
    for (const record of records) {
      if (!fs.existsSync(path.join(directory, 'records', `${record.recordId}.md`))) errors.push(`missing record document: ${record.recordId}`);
    }
    const csv = fs.readFileSync(path.join(directory, 'catalog.csv'), 'utf8').trimEnd().split(/\r?\n/);
    if (csv.length !== records.length + 1) errors.push('CSV row count mismatch');
    for (const name of ['REPORT.md', 'installed-skills/INDEX.md', 'external-skills/INDEX.md', 'zewei-created-skills/INDEX.md']) {
      const file = path.join(base, name);
      const markdown = fs.readFileSync(file, 'utf8');
      for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
        if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) errors.push(`broken inventory link: ${name} -> ${match[1]}`);
      }
    }
    const serialized = JSON.stringify(catalog);
    // Do not treat the trailing "s:/" inside an https:// URL as a Windows drive path.
    if (/(?<![A-Za-z])[A-Za-z]:[\\/]/.test(serialized) || /\b(sk-[A-Za-z0-9_-]{12,}|ghp_[A-Za-z0-9_]{15,})\b/.test(serialized)) {
      errors.push('catalog contains a raw local path or recognized credential pattern');
    }
  } catch (error) { errors.push(`cannot validate inventory: ${error.message}`); }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateInventory();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else console.log('Inventory validation passed (offline; no source skill execution).');
}
