import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findSkills, listRuntimeSkills, normalize as normalizePath } from './discover-codex-skills.mjs';
import { readMetadata } from './build-skill-inventory.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function runCli(cliScript, args) {
  const result = spawnSync(process.execPath, [cliScript, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1',
      LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1',
    },
  });
  if (result.error) throw result.error;
  let envelope;
  try { envelope = JSON.parse(result.stdout); }
  catch { throw new Error(`lark-cli returned invalid JSON (exit ${result.status})`); }
  if (result.status !== 0 || envelope.ok !== true) {
    throw new Error(envelope.error?.message || `lark-cli failed (exit ${result.status})`);
  }
  return envelope.data;
}

async function listAllRecords(cliScript, baseToken, tableId, viewId) {
  const records = [];
  let offset = 0;
  let fields = [];
  for (let page = 0; page < 1000; page++) {
    const args = ['base', '+record-list', '--base-token', baseToken, '--table-id', tableId,
      '--limit', '200', '--offset', String(offset), '--as', 'user', '--format', 'json'];
    if (viewId) args.push('--view-id', viewId);
    const data = runCli(cliScript, args);
    if (!fields.length) fields = data.fields ?? [];
    const rows = data.data ?? [];
    const recordIds = data.record_ids ?? data.record_id_list ?? [];
    for (let i = 0; i < rows.length; i++) {
      records.push({ recordId: recordIds[i] ?? null, row: rows[i] });
    }
    if (!data.has_more) return { fields, records, pages: page + 1 };
    if (!rows.length) throw new Error('Pagination reported has_more with an empty page.');
    offset += rows.length;
  }
  throw new Error('Pagination exceeded 1000 pages.');
}

export function cellText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(cellText).filter(Boolean).join(', ');
  if (typeof value === 'object') return cellText(value.text ?? value.name ?? value.value ?? value.link ?? '');
  return '';
}

function markdownLabel(value) {
  const text = cellText(value).trim();
  const match = text.match(/^\[([^\]]+)]\([^)]+\)$/);
  return (match?.[1] ?? text).trim();
}

export function normalizeName(value) {
  return markdownLabel(value).normalize('NFKC').toLowerCase()
    .replace(/[`'"“”‘’]/g, '')
    .replace(/[‐‑‒–—―_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeSource(value) {
  return cellText(value).trim().replace(/^['"]|['"]$/g, '').replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase();
}

export function rowObjects(result) {
  const names = result.fields.map(field => typeof field === 'string' ? field : field.name);
  return result.records.map(({ recordId, row }) => ({
    recordId,
    fields: Object.fromEntries(names.map((name, index) => [name, row[index]])),
  }));
}

function groups(rows, getter) {
  const result = new Map();
  for (const row of rows) {
    const key = getter(row);
    if (!key) continue;
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(row);
  }
  return [...result.entries()].filter(([, members]) => members.length > 1);
}

function aliasesFor(name, skillPath) {
  const aliases = new Set([normalizeName(name)]);
  const suffix = String(name).split(':').at(-1);
  aliases.add(normalizeName(suffix));
  if (skillPath) aliases.add(normalizeName(path.basename(path.dirname(skillPath))));
  aliases.delete('');
  return aliases;
}

function hasIntersection(left, right) {
  for (const value of left) if (right.has(value)) return true;
  return false;
}

function displayScope(skill) {
  if (skill.scope === 'system') return 'system';
  if (skill.pluginId) return 'plugin';
  return skill.scope || 'user';
}

function md(value) {
  return String(value ?? '').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function bullets(items, render, empty = '无。') {
  return items.length ? items.map(item => `- ${render(item)}`).join('\n') : empty;
}

function publicRow(row) {
  return {
    number: cellText(row.fields['技能编号']),
    name: markdownLabel(row.fields['技能名称']),
    status: cellText(row.fields['技能状态']),
    version: cellText(row.fields['版本号']),
    sourcePresent: Boolean(normalizeSource(row.fields['源文件路径'])),
  };
}

function uniqueBy(items, key) {
  const map = new Map();
  for (const item of items) if (!map.has(key(item))) map.set(key(item), item);
  return [...map.values()];
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function main() {
  const cliScript = argument('--cli-script') || process.env.LARK_CLI_JS;
  const baseToken = argument('--base-token');
  const tableId = argument('--table-id');
  const viewId = argument('--view-id');
  if (!cliScript || !baseToken || !tableId || !viewId) {
    throw new Error('Required: --cli-script, --base-token, --table-id and --view-id.');
  }

  // The supplied view and the full table are both read, serially and to has_more=false.
  const viewResult = await listAllRecords(cliScript, baseToken, tableId, viewId);
  const tableResult = await listAllRecords(cliScript, baseToken, tableId, null);
  const viewRows = rowObjects(viewResult);
  const tableRows = rowObjects(tableResult);
  const viewIds = new Set(viewRows.map(row => row.recordId).filter(Boolean));
  const tableIds = new Set(tableRows.map(row => row.recordId).filter(Boolean));
  const viewOutsideTable = [...viewIds].filter(id => !tableIds.has(id));
  if (viewOutsideTable.length) throw new Error('View returned records absent from full table query.');

  const runtimeResult = await listRuntimeSkills([repo]);
  if (runtimeResult.status !== 'available') throw new Error(`Codex skills/list unavailable: ${runtimeResult.reason}`);
  const runtimeContext = runtimeResult.result?.data?.[0];
  if (!runtimeContext) throw new Error('Codex skills/list returned no context.');
  const runtimeSkills = uniqueBy(runtimeContext.skills, skill => normalizePath(skill.path));

  const codexSkillRoot = path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills');
  const diskScan = findSkills(codexSkillRoot);
  const diskSkills = diskScan.files.map(skillPath => {
    let name = path.basename(path.dirname(skillPath));
    try { name = readMetadata(fs.readFileSync(skillPath, 'utf8')).fields.name || name; } catch {}
    return { name, path: skillPath, aliases: aliasesFor(name, skillPath) };
  });

  const tableAliases = new Set(tableRows.flatMap(row => [...aliasesFor(markdownLabel(row.fields['技能名称']), null)]));
  const diskAliasSet = new Set(diskSkills.flatMap(skill => [...skill.aliases]));
  const runtimeAliasSet = new Set(runtimeSkills.flatMap(skill => [...aliasesFor(skill.name, skill.path)]));

  const missingRuntime = runtimeSkills.filter(skill => !hasIntersection(aliasesFor(skill.name, skill.path), tableAliases));
  const missingRuntimeLogical = uniqueBy(missingRuntime, skill => `${displayScope(skill)}:${normalizeName(skill.name)}`)
    .map(skill => ({ name: skill.name, scope: displayScope(skill), pluginId: skill.pluginId || null }));
  const tableOnly = tableRows.filter(row => {
    const aliases = aliasesFor(markdownLabel(row.fields['技能名称']), null);
    return !hasIntersection(aliases, runtimeAliasSet);
  });
  const tableOnlyUnique = uniqueBy(tableOnly, row => normalizeName(row.fields['技能名称']));
  const tableOnlyDisk = tableOnlyUnique.filter(row => hasIntersection(aliasesFor(markdownLabel(row.fields['技能名称']), null), diskAliasSet));
  const tableOnlyAbsentDisk = tableOnlyUnique.filter(row => !hasIntersection(aliasesFor(markdownLabel(row.fields['技能名称']), null), diskAliasSet));

  const duplicateNames = groups(tableRows, row => normalizeName(row.fields['技能名称']));
  const duplicateNumbers = groups(tableRows, row => cellText(row.fields['技能编号']).trim().toLowerCase());
  const duplicateSources = groups(tableRows, row => normalizeSource(row.fields['源文件路径']));
  const blankNames = tableRows.filter(row => !normalizeName(row.fields['技能名称']));
  const blankNumbers = tableRows.filter(row => !cellText(row.fields['技能编号']).trim());
  const blankSources = tableRows.filter(row => !normalizeSource(row.fields['源文件路径']));
  const blankVersions = tableRows.filter(row => !cellText(row.fields['版本号']).trim());
  const blankStatuses = tableRows.filter(row => !cellText(row.fields['技能状态']).trim());
  const uniqueTableNames = new Set(tableRows.map(row => normalizeName(row.fields['技能名称'])).filter(Boolean));
  const tableIndexMap = new Map();
  for (const row of tableRows) {
    const normalizedName = normalizeName(row.fields['技能名称']);
    if (!normalizedName) continue;
    if (!tableIndexMap.has(normalizedName)) tableIndexMap.set(normalizedName, []);
    tableIndexMap.get(normalizedName).push(publicRow(row));
  }
  const runtimeByScope = Object.fromEntries(['user', 'plugin', 'system'].map(scope =>
    [scope, runtimeSkills.filter(skill => displayScope(skill) === scope).length]));
  const runAt = new Date();
  let priorInventory = null;
  const latestPath = path.join(repo, 'inventory', 'latest.json');
  if (fs.existsSync(latestPath)) {
    const latest = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    const prior = JSON.parse(fs.readFileSync(path.join(repo, 'inventory', latest.summary), 'utf8'));
    priorInventory = {
      snapshotId: prior.snapshotId,
      sourceFiles: prior.sourceFiles,
      installedLocationOrRuntime: prior.installedLocationOrRuntime,
      runtimeUniquePaths: prior.runtimeUniquePaths,
      localCreationReviewFiles: prior.localCreationReviewFiles,
      zeweiRelatedCandidates: prior.zeweiRelatedCandidates,
      verifiedZeweiOriginals: prior.verifiedZeweiOriginals,
    };
  }
  const summary = {
    auditedAt: runAt.toISOString(),
    source: { tableIdHash: hashText(tableId), viewIdHash: hashText(viewId) },
    table: {
      rows: tableRows.length,
      uniqueNormalizedNames: uniqueTableNames.size,
      blankNames: blankNames.length,
      blankNumbers: blankNumbers.length,
      blankSources: blankSources.length,
      blankVersions: blankVersions.length,
      blankStatuses: blankStatuses.length,
      viewRows: viewRows.length,
      rowsHiddenByView: tableRows.length - viewRows.length,
      pagesRead: tableResult.pages,
      viewPagesRead: viewResult.pages,
      duplicateNameGroups: duplicateNames.length,
      duplicateNameExtraRows: duplicateNames.reduce((sum, [, members]) => sum + members.length - 1, 0),
      duplicateNumberGroups: duplicateNumbers.length,
      duplicateSourceGroups: duplicateSources.length,
    },
    codex: {
      runtimePaths: runtimeSkills.length,
      runtimeByScope,
      runtimeLoadErrors: runtimeContext.errors?.length ?? 0,
      diskSkillMdFiles: diskSkills.length,
      diskScanStatus: diskScan.status,
    },
    priorInventory,
    reconciliation: {
      runtimeLogicalNamesMissingFromTable: missingRuntimeLogical.length,
      tableUniqueNamesAbsentFromRuntime: tableOnlyUnique.length,
      tableUniqueNamesPresentOnDiskButNotRuntime: tableOnlyDisk.length,
      tableUniqueNamesAbsentFromRuntimeAndDisk: tableOnlyAbsentDisk.length,
    },
    tableIndex: [...tableIndexMap].map(([normalizedName, rows]) => ({ normalizedName, rows }))
      .sort((a, b) => compareText(a.normalizedName, b.normalizedName)),
    duplicateNames: duplicateNames.map(([normalizedName, members]) => ({
      normalizedName,
      rows: members.map(publicRow),
    })),
    duplicateNumbers: duplicateNumbers.map(([number, members]) => ({ number, rows: members.map(publicRow) })),
    duplicateSources: duplicateSources.map(([, members]) => ({ rows: members.map(publicRow) })),
    blankNameRows: blankNames.map(publicRow),
    missingFromTable: missingRuntimeLogical.sort((a, b) => compareText(a.name, b.name)),
    tableOnly: tableOnlyUnique.map(publicRow).sort((a, b) => compareText(a.name, b.name)),
    tableOnlyPresentOnDisk: tableOnlyDisk.map(publicRow).sort((a, b) => compareText(a.name, b.name)),
    tableOnlyAbsentFromDisk: tableOnlyAbsentDisk.map(publicRow).sort((a, b) => compareText(a.name, b.name)),
    runtimeLoadErrors: (runtimeContext.errors ?? []).map(error => ({
      name: path.basename(path.dirname(error.path)), message: error.message,
    })),
    limitations: [
      'Names are compared case-insensitively after Markdown-link extraction, Unicode normalization, whitespace/underscore normalization and plugin suffix aliases.',
      'A name match does not prove that the Feishu row and local package are the same version or content.',
      'The full table and supplied view were paginated serially to has_more=false. Results reflect read permissions at audit time.',
      'A privacy-safe name index is stored; raw record IDs, document links and local source paths are not stored in this audit artifact.',
    ],
  };

  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(runAt);
  const auditTimeChina = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    dateStyle: 'long',
    timeStyle: 'medium',
    hour12: false,
  }).format(runAt);
  const outputDir = path.join(repo, 'inventory', 'audits');
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `${date}-feishu-base-reconciliation.json`);
  const reportPath = path.join(outputDir, `${date}-feishu-base-reconciliation.md`);
  const dupNameRows = summary.duplicateNames.map(group => ({
    name: group.rows[0]?.name || group.normalizedName,
    count: group.rows.length,
    numbers: group.rows.map(row => row.number || '无编号').join('、'),
  }));
  const report = `# 飞书 Skill 登记表核对报告\n\n` +
    `核对时间：${auditTimeChina}（Asia/Shanghai；${summary.auditedAt}）\n\n` +
    `本报告只读取用户提供的飞书多维表格和当前 Codex 技能状态，没有修改表格或 Skill。原始记录、记录 ID、文档链接及本地绝对路径未写入仓库。\n\n` +
    `## 数量\n\n` +
    `- 飞书整表：${summary.table.rows} 行；按规范化技能名称去重后 ${summary.table.uniqueNormalizedNames} 个。\n` +
    `- 用户指定视图：${summary.table.viewRows} 行；该视图隐藏 ${summary.table.rowsHiddenByView} 行。\n` +
    `- 当前 Codex 运行时：${summary.codex.runtimePaths} 个唯一路径，其中 user ${summary.codex.runtimeByScope.user ?? 0}、plugin ${summary.codex.runtimeByScope.plugin ?? 0}、system ${summary.codex.runtimeByScope.system ?? 0}。\n` +
    `- 当前 %CODEX_HOME%/skills：${summary.codex.diskSkillMdFiles} 份 SKILL.md；运行时另报告 ${summary.codex.runtimeLoadErrors} 个加载错误。\n\n` +
    (summary.priorInventory ?
      `### 与上一阶段全盘快照的口径\n\n` +
      `上一阶段快照 ${summary.priorInventory.snapshotId} 记录了 ${summary.priorInventory.sourceFiles} 个磁盘路径，其中安装目录或运行时发现 ${summary.priorInventory.installedLocationOrRuntime} 个、跨多个项目上下文的运行时唯一路径 ${summary.priorInventory.runtimeUniquePaths} 个。该快照包含来源存档、历史副本和项目级技能，不能与本次单一当前上下文的 ${summary.codex.runtimePaths} 个直接作增减比较。归属待核实记录 ${summary.priorInventory.localCreationReviewFiles} 份，泽玮相关候选 ${summary.priorInventory.zeweiRelatedCandidates} 份，已确认原创仍为 ${summary.priorInventory.verifiedZeweiOriginals}。\n\n` : '') +
    `### 字段完整性\n\n` +
    `- 名称为空：${summary.table.blankNames} 行；编号为空：${summary.table.blankNumbers} 行。\n` +
    `- 源路径为空：${summary.table.blankSources} 行；版本为空：${summary.table.blankVersions} 行；状态为空：${summary.table.blankStatuses} 行。\n\n` +
    `## 重复\n\n` +
    `- 同名重复：${summary.table.duplicateNameGroups} 组，多出 ${summary.table.duplicateNameExtraRows} 行。\n` +
    `- 技能编号重复：${summary.table.duplicateNumberGroups} 组。\n` +
    `- 非空源路径重复：${summary.table.duplicateSourceGroups} 组。\n\n` +
    `${bullets(dupNameRows, item => `**${md(item.name)}**：${item.count} 行（${md(item.numbers)}）`, '没有同名重复。')}\n\n` +
    `## 遗漏与表内存量\n\n` +
    `- 当前运行时有、飞书整表没有：${summary.reconciliation.runtimeLogicalNamesMissingFromTable} 个逻辑名称。\n` +
    `- 飞书整表有、当前运行时没有：${summary.reconciliation.tableUniqueNamesAbsentFromRuntime} 个唯一名称。\n` +
    `  - 其中仍在本机技能目录：${summary.reconciliation.tableUniqueNamesPresentOnDiskButNotRuntime} 个。\n` +
    `  - 当前技能目录也未找到：${summary.reconciliation.tableUniqueNamesAbsentFromRuntimeAndDisk} 个。\n\n` +
    `### 当前运行时有、飞书没有\n\n` +
    `${bullets(summary.missingFromTable, item => `${md(item.name)}（${item.scope}${item.pluginId ? `，plugin=${md(item.pluginId)}` : ''}）`)}\n\n` +
    `### 飞书有、运行时没有，但本机目录仍存在\n\n` +
    `${bullets(summary.tableOnlyPresentOnDisk, item => `${md(item.name)}（${md(item.number || '无编号')}，状态：${md(item.status || '未填')}）`)}\n\n` +
    `### 飞书有、运行时和当前技能目录均未找到\n\n` +
    `${bullets(summary.tableOnlyAbsentFromDisk, item => `${md(item.name)}（${md(item.number || '无编号')}，状态：${md(item.status || '未填')}）`)}\n\n` +
    `## 运行时加载错误\n\n` +
    `${bullets(summary.runtimeLoadErrors, item => `${md(item.name)}：${md(item.message)}`)}\n\n` +
    `## 判定边界\n\n` +
    `名称比较会提取 Markdown 链接显示名、统一大小写与 Unicode、把空格和下划线统一为连字符，并允许插件前缀后的技能名匹配。名称命中不能证明版本或内容一致；后续若要正式补表，应再按源路径、版本和正文哈希逐条确认。\n`;
  fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(reportPath, report);
  console.log(JSON.stringify({
    reportPath,
    jsonPath,
    auditedAt: summary.auditedAt,
    table: summary.table,
    codex: summary.codex,
    priorInventory: summary.priorInventory,
    reconciliation: summary.reconciliation,
  }, null, 2));
}

function hashText(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

// Only irreversible fingerprints are stored for remote IDs; the raw IDs remain CLI arguments.

if (process.argv[1] && normalizePath(process.argv[1]) === normalizePath(fileURLToPath(import.meta.url))) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
