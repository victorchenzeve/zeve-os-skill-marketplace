import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeName } from './reconcile-feishu-skills.mjs';
import { latestAuditRelative } from './build-candidate-queue.mjs';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = {
  catalog: 'inventory/governance/catalog.json',
  waves: 'inventory/governance/waves.json',
  readme: 'inventory/governance/README.md',
  coverage: 'inventory/candidates/formal-coverage.json',
};
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const unique = values => [...new Set(values.filter(value => value != null && value !== ''))].sort(compare);
const hashId = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
const readJson = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

function add(map, name) {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;
  if (!map.has(normalizedName)) map.set(normalizedName, {
    normalizedName, displayNames: new Set(), inventory: [], tableRows: [], formal: [], auditFlags: new Set(),
  });
  const entry = map.get(normalizedName);
  if (name) entry.displayNames.add(String(name));
  return entry;
}

function runtimeScopes(records) {
  return unique(records.flatMap(record => record.runtime ?? []).map(item => item.scope || (item.pluginId ? 'plugin' : 'user')));
}

function disposition(entry) {
  if (entry.formal.length) return 'formal-managed';
  if (entry.auditFlags.has('runtime-load-error')) return 'repair-review';
  if (entry.auditFlags.has('runtime-missing-from-table')) return 'table-addition-review';
  if (entry.auditFlags.has('table-only')) return 'availability-review';
  if (entry.inventory.some(record => record.localCreation?.status === 'zewei-related-candidate')) return 'ownership-review';
  const classifications = new Set(entry.inventory.map(record => record.provenance?.classification));
  if (classifications.size && [...classifications].every(value => ['local-generated-from-external-catalog', 'plugin-package', 'vendor-catalog', 'extracted-external-archive', 'declared-author'].includes(value))) {
    return 'external-reference';
  }
  return 'candidate-review';
}

function priorityFor(value) {
  return ({ 'repair-review': 100, 'ownership-review': 90, 'table-addition-review': 80, 'availability-review': 70,
    'candidate-review': 50, 'external-reference': 20, 'formal-managed': 0 })[value];
}

function nextAction(value) {
  return ({
    'formal-managed': '按 Registry、评估证据和版本政策持续维护。',
    'repair-review': '由 Skill 所有者修复运行时结构错误并重新验证；本目录不修改原 Skill。',
    'ownership-review': '核实作者、来源与许可证，再决定是否进入正式纳管评估。',
    'table-addition-review': '核实来源与可用性；确认后再由目录所有者决定是否登记飞书。',
    'availability-review': '核实是否停用、移动、改名或缺失安装，保留记录直至有证据。',
    'external-reference': '保留为外部参考，取得再分发许可与完整评估前不复制进正式资产。',
    'candidate-review': '完成所有权、许可证、依赖和行为评估后再决定纳管或保留。',
  })[value];
}

function gates(entry, value) {
  if (value === 'formal-managed') return [];
  const result = ['ownership-verification', 'license-verification', 'behavior-evaluation', 'dependency-assessment'];
  if (!entry.inventory.length) result.push('source-package-location');
  if (entry.inventory.some(record => (record.issues ?? []).length)) result.push('structure-remediation');
  if (entry.inventory.some(record => ['local-generated-from-external-catalog', 'plugin-package', 'vendor-catalog', 'extracted-external-archive', 'declared-author'].includes(record.provenance?.classification))) result.push('redistribution-review');
  return unique(result);
}

export function buildGovernanceCatalog(root = defaultRoot) {
  const latest = readJson(root, 'inventory/latest.json');
  const inventory = readJson(root, `inventory/${latest.catalog}`);
  const auditRelative = latestAuditRelative(root);
  const audit = readJson(root, auditRelative);
  const formal = readJson(root, 'registry/skills.yaml').skills;
  const map = new Map();

  for (const record of inventory.records) {
    const entry = add(map, record.baseName || record.name);
    if (!entry) continue;
    entry.displayNames.add(record.name);
    entry.inventory.push(record);
  }
  for (const table of audit.tableIndex ?? []) {
    const entry = add(map, table.normalizedName);
    entry.tableRows.push(...table.rows);
    for (const row of table.rows) entry.displayNames.add(row.name);
  }
  for (const skill of formal) {
    const entry = add(map, skill.id);
    entry.displayNames.add(skill.name);
    entry.formal.push(skill);
  }
  for (const item of audit.missingFromTable ?? []) add(map, item.name)?.auditFlags.add('runtime-missing-from-table');
  for (const item of audit.tableOnly ?? []) add(map, item.name)?.auditFlags.add('table-only');
  for (const item of audit.runtimeLoadErrors ?? []) add(map, item.name)?.auditFlags.add('runtime-load-error');
  for (const item of audit.duplicateNames ?? []) add(map, item.normalizedName)?.auditFlags.add('table-duplicate');

  const skills = [...map.values()].map(entry => {
    const dispositionValue = disposition(entry);
    const pathCount = entry.inventory.length;
    const hashes = unique(entry.inventory.map(record => record.sha256));
    const issues = unique(entry.inventory.flatMap(record => record.issues ?? []));
    const formalIds = unique(entry.formal.map(skill => skill.id));
    const installedPaths = entry.inventory.filter(record => record.installedLocationOrRuntime).length;
    const runtimeEntries = entry.inventory.flatMap(record => record.runtime ?? []);
    const classifications = unique(entry.inventory.map(record => record.provenance?.classification));
    const declaredLicenses = unique(entry.inventory.map(record => record.provenance?.declaredLicense));
    const declaredAuthors = unique(entry.inventory.map(record => record.provenance?.declaredAuthor));
    const health = formalIds.length ? 'formal-validated' :
      entry.auditFlags.has('runtime-load-error') ? 'runtime-load-error' : issues.length ? 'structure-issues' : 'observed-only';
    return {
      id: `logical-${hashId(entry.normalizedName)}`,
      normalizedName: entry.normalizedName,
      displayNames: unique([...entry.displayNames]),
      presence: {
        inventoryPaths: pathCount, installedPaths, runtimeOccurrences: runtimeEntries.length,
        runtimeScopes: runtimeScopes(entry.inventory), feishuRows: entry.tableRows.length,
        feishuRecords: entry.tableRows, formalIds,
      },
      provenance: {
        classifications, declaredAuthors, declaredLicenses,
        sourceRoots: unique(entry.inventory.flatMap(record => record.sourceRoots ?? [record.scanRoot])),
        pluginPackages: unique(entry.inventory.map(record => record.provenance?.plugin?.name)),
        zeveSignalPaths: entry.inventory.filter(record => record.localCreation?.status === 'zewei-related-candidate').length,
        ownerReview: formalIds.length ? 'verified-repository-original' : 'unverified',
        licenseReview: formalIds.length ? 'verified-mit' : declaredLicenses.length ? 'declared-unverified' : 'unknown',
      },
      health: { status: health, issues },
      duplicates: {
        physicalPathCopies: pathCount, uniqueSkillMdHashes: hashes.length,
        identicalContentCopies: Math.max(0, pathCount - hashes.length), contentVariants: hashes.length > 1,
        tableRows: entry.tableRows.length, tableDuplicate: entry.tableRows.length > 1,
      },
      disposition: dispositionValue,
      priority: priorityFor(dispositionValue),
      formalizationGates: gates(entry, dispositionValue),
      nextAction: nextAction(dispositionValue),
    };
  }).sort((a, b) => compare(a.normalizedName, b.normalizedName));

  const count = key => skills.filter(skill => skill.disposition === key).length;
  const healthCount = key => skills.filter(skill => skill.health.status === key).length;
  const summary = {
    logicalSkills: skills.length,
    inventoryLogicalNames: skills.filter(skill => skill.presence.inventoryPaths > 0).length,
    feishuLogicalNames: skills.filter(skill => skill.presence.feishuRows > 0).length,
    formalSkills: skills.filter(skill => skill.presence.formalIds.length > 0).length,
    inventoryAndFeishu: skills.filter(skill => skill.presence.inventoryPaths > 0 && skill.presence.feishuRows > 0).length,
    inventoryOnly: skills.filter(skill => skill.presence.inventoryPaths > 0 && skill.presence.feishuRows === 0).length,
    feishuOnly: skills.filter(skill => skill.presence.inventoryPaths === 0 && skill.presence.feishuRows > 0).length,
    byDisposition: Object.fromEntries(['formal-managed','repair-review','ownership-review','table-addition-review','availability-review','candidate-review','external-reference'].map(key => [key, count(key)])),
    byHealth: Object.fromEntries(['formal-validated','runtime-load-error','structure-issues','observed-only'].map(key => [key, healthCount(key)])),
    physicalDuplicateGroups: skills.filter(skill => skill.duplicates.physicalPathCopies > 1).length,
    contentVariantGroups: skills.filter(skill => skill.duplicates.contentVariants).length,
    tableDuplicateGroups: skills.filter(skill => skill.duplicates.tableDuplicate).length,
    zeveSignalLogicalNames: skills.filter(skill => skill.provenance.zeveSignalPaths > 0).length,
  };
  return {
    schemaVersion: '1.0.0', generatedAt: audit.auditedAt, inventorySnapshotId: latest.snapshotId,
    generatedFrom: { inventory: `inventory/${latest.catalog}`, feishuAudit: auditRelative, formalRegistry: 'registry/skills.yaml' },
    policy: '全量目录只记录证据与处置状态；不自动复制、修改、合并、删除、安装 Skill，也不写入飞书。',
    summary, skills,
  };
}

export function buildWaves(root = defaultRoot) {
  const catalog = buildGovernanceCatalog(root);
  const candidates = catalog.skills.filter(skill => skill.disposition !== 'formal-managed')
    .sort((a, b) => b.priority - a.priority || compare(a.normalizedName, b.normalizedName));
  const waves = [];
  for (let offset = 0; offset < candidates.length; offset += 50) {
    const batch = candidates.slice(offset, offset + 50);
    waves.push({
      id: `wave-${String(waves.length + 1).padStart(2, '0')}`,
      status: 'planned-evidence-review',
      itemCount: batch.length,
      dispositionCounts: Object.fromEntries(unique(batch.map(item => item.disposition)).map(key => [key, batch.filter(item => item.disposition === key).length])),
      items: batch.map(item => ({ id: item.id, normalizedName: item.normalizedName, disposition: item.disposition, priority: item.priority, gates: item.formalizationGates, nextAction: item.nextAction })),
    });
  }
  return { schemaVersion: '1.0.0', generatedAt: catalog.generatedAt, catalog: targets.catalog, batchSize: 50, candidateCount: candidates.length, waveCount: waves.length, policy: catalog.policy, waves };
}

function readmeText(root, catalog, waves) {
  const s = catalog.summary;
  return `# 全量 Skill 治理目录\n\n本目录把最新本机盘点、Codex 运行时、飞书只读审计和正式 Registry 合并为逻辑 Skill 视图。它是治理证据，不代表安装、启用、原创归属或再分发许可。\n\n- 逻辑 Skill：${s.logicalSkills}\n- 物理 SKILL.md：${readJson(root, 'inventory/' + readJson(root, 'inventory/latest.json').summary).sourceFiles}\n- 飞书唯一名称：${s.feishuLogicalNames}\n- 正式纳管：${s.formalSkills}\n- 待证据审核：${waves.candidateCount}，分为 ${waves.waveCount} 个批次，每批最多 ${waves.batchSize} 项\n- 物理重复组：${s.physicalDuplicateGroups}；内容变体组：${s.contentVariantGroups}；飞书重复组：${s.tableDuplicateGroups}\n\n## 文件\n\n- \`catalog.json\`：每个逻辑 Skill 的出现位置、来源声明、健康度、重复关系、处置状态和纳管门槛。\n- \`waves.json\`：全部非正式 Skill 的确定性审核顺序；任何条目都不会遗漏在计划之外。\n- \`../candidates/queue.json\`：58 项本机、运行时与飞书之间的可执行核对事项。\n\n审核批次只安排证据核查。没有作者、许可证、依赖与行为评估证据时，Skill 不进入正式 Registry，也不会从原位置被复制、修改、合并或删除。\n`;
}

export function generatedTexts(root = defaultRoot) {
  const catalog = buildGovernanceCatalog(root);
  const waves = buildWaves(root);
  const pkg = readJson(root, 'package.json');
  const plugins = readJson(root, 'registry/plugins.yaml').plugins;
  const agents = readJson(root, 'registry/agents.yaml').agents;
  const audit = readJson(root, catalog.generatedFrom.feishuAudit);
  const coverage = {
    schemaVersion: '1.0.0', reviewedAt: catalog.generatedAt.slice(0, 10),
    formalRegistry: { skills: catalog.summary.formalSkills, plugins: plugins.length, agents: agents.length, provenance: 'repository-original', license: 'MIT' },
    feishuAudit: { auditedAt: audit.auditedAt, rows: audit.table.rows, uniqueNormalizedNames: audit.table.uniqueNormalizedNames },
    fullGovernanceCatalog: { logicalSkills: catalog.summary.logicalSkills, pendingEvidenceReview: waves.candidateCount, waves: waves.waveCount, version: pkg.version },
    interpretation: `正式 Registry 与盘点目录用途不同。${catalog.summary.formalSkills} 个正式 Skill 均为本仓库原创；其余 ${waves.candidateCount} 个逻辑 Skill 已全部进入证据审核批次，取得来源、许可、结构、依赖与行为证据后才考虑纳管。`,
    automaticImports: 0,
  };
  return {
    [targets.catalog]: `${JSON.stringify(catalog, null, 2)}\n`,
    [targets.waves]: `${JSON.stringify(waves, null, 2)}\n`,
    [targets.readme]: readmeText(root, catalog, waves),
    [targets.coverage]: `${JSON.stringify(coverage, null, 2)}\n`,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const expected = generatedTexts(defaultRoot);
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [relative, text] of Object.entries(expected)) {
    const target = path.join(defaultRoot, relative);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) stale.push(relative);
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, text);
    }
  }
  if (check && stale.length) {
    console.error(`Governance catalog is stale: ${stale.join(', ')}`);
    process.exitCode = 1;
  } else {
    const catalog = buildGovernanceCatalog(defaultRoot);
    const waves = buildWaves(defaultRoot);
    console.log(`${check ? 'Checked' : 'Wrote'} governance catalog (${catalog.summary.logicalSkills} logical skills, ${waves.waveCount} waves).`);
  }
}
