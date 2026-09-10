import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { hash, normalize, findSkills, excludedDirectories } from './discover-codex-skills.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function readMetadata(text) {
  const match = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const fields = {};
  if (!match) return { hasFrontmatter: false, fields };
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const found = lines[i].match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (!found) continue;
    const [, indent, key, initial] = found;
    let value = initial.trim();
    if (/^[>|][+-]?$/.test(value)) {
      const block = [];
      while (i + 1 < lines.length && (lines[i + 1].trim() === '' || lines[i + 1].search(/\S/) > indent.length)) {
        block.push(lines[++i].trim());
      }
      value = block.join(' ').trim();
    } else if (value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value); } catch { value = value.slice(1, -1); }
    } else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1).replaceAll("''", "'");
    else value = value.replace(/\s+#.*$/, '').trim();
    // This is scalar extraction, NOT YAML validation. Runtime diagnostics are separate.
    if (value && !Object.hasOwn(fields, key)) fields[key] = value;
  }
  return { hasFrontmatter: true, fields };
}

export function sanitize(value, roots = []) {
  let result = String(value ?? '');
  for (const root of [...roots].sort((a, b) => b.path.length - a.path.length)) {
    for (const candidate of [root.path, root.path.replaceAll('\\', '/')]) {
      const replacement = /[\\/]$/.test(candidate) ? `${root.alias}/` : root.alias;
      result = result.replace(new RegExp(candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement);
    }
  }
  result = result.replace(/\b[A-Za-z]:[\\/][^\s"'<>`，。；）)]+/g, '[LOCAL_PATH]');
  result = result.replace(/\b(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{15,}|github_pat_[A-Za-z0-9_]+)\b/g, '[REDACTED]');
  result = result.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]');
  result = result.replace(/https?:\/\/[^\s<>"`]+/g, raw => {
    try {
      const url = new URL(raw); url.username = ''; url.password = ''; url.search = ''; url.hash = '';
      if (/feishu|larksuite|notion/.test(url.hostname)) return `[PRIVATE_LINK:${url.hostname}]`;
      return url.toString();
    } catch { return '[URL]'; }
  });
  result = result.replace(/\b(api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]');
  return result;
}

export function duplicateGroups(records, key) {
  const groups = new Map();
  for (const record of records) {
    const value = record[key];
    if (!value) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(record.recordId);
  }
  return [...groups].filter(([, ids]) => ids.length > 1).map(([value, recordIds]) => ({ value, recordIds }));
}

const md = value => String(value ?? '待核实').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const readJson = file => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')); } catch { return {}; }
};

export function buildInventory(discovery, outputRoot = path.join(repo, 'inventory')) {
  if (!discovery.files?.length) throw new Error('Discovery is empty; refusing to replace inventory.');
  const roots = discovery.roots;
  const safe = value => sanitize(value, roots);
  const runtimeByPath = new Map();
  const runtimeErrors = new Map();
  const contexts = [];
  for (const context of discovery.runtime.result?.data ?? []) {
    const contextId = `context-${contexts.length + 1}`;
    contexts.push({ id: contextId, cwd: safe(context.cwd), count: context.skills.length,
      enabled: context.skills.filter(skill => skill.enabled === true).length,
      disabled: context.skills.filter(skill => skill.enabled === false).length,
      errors: context.errors.map(error => ({ path: safe(error.path), message: safe(error.message) })) });
    for (const skill of context.skills) {
      const key = normalize(skill.path);
      if (!runtimeByPath.has(key)) runtimeByPath.set(key, []);
      runtimeByPath.get(key).push({ contextId, enabled: skill.enabled, scope: skill.scope,
        name: skill.name, description: skill.description, pluginId: skill.pluginId });
    }
    for (const error of context.errors) runtimeErrors.set(normalize(error.path), safe(error.message));
  }

  const generationLog = path.join(os.homedir(), 'Documents', 'SKILL', 'generated-minimal-skills-results-20260823.json');
  const generation = readJson(generationLog);
  const generatedPaths = new Set((Array.isArray(generation) ? generation : []).flatMap(entry =>
    [entry.stage_path, entry.install_path].filter(Boolean).map(dir => normalize(path.join(dir, 'SKILL.md')))));
  const records = [];
  for (const file of discovery.files) {
    const bytes = fs.readFileSync(file.path);
    if (hash(bytes) !== file.sha256) throw new Error(`Source changed since discovery: ${file.alias}`);
    const text = bytes.toString('utf8');
    const { hasFrontmatter, fields } = readMetadata(text);
    const runtime = runtimeByPath.get(normalize(file.path)) ?? [];
    const directory = path.dirname(file.path);
    const metadata = readJson(path.join(directory, 'metadata.json'));
    const recordId = `inv-${hash(file.alias).slice(0, 16)}`;
    const name = runtime[0]?.name ?? fields.name ?? path.basename(directory);
    const baseName = fields.name ?? name.split(':').at(-1);
    const generatedEvidence = generatedPaths.has(normalize(file.path));
    const derived = fields.imported_status === 'catalog-only-minimal' || generatedEvidence;
    const zeweiCandidate = /zewei|zeve|泽玮/i.test(`${baseName} ${fields.description ?? ''}`);
    const isTemplate = /\/(templates?|examples?|fixtures)\//i.test(file.alias);
    const pluginMatch = file.alias.match(/\/plugins\/cache\/([^/]+)\/([^/]+)\/([^/]+)\//);
    const importedArchive = /feishu-skill-import-work[^/]*\/extracted\//.test(file.alias);
    const genericCache = /\/(?:AppData|\.codex|vendor_imports)\//i.test(file.path.replaceAll('\\', '/'));
    const localArtifact = !isTemplate && file.kind === 'local-source' && !importedArchive && !genericCache;
    const installed = file.kind === 'installed-location' || /\/\.agents\/skills\//.test(file.alias) || runtime.length > 0;
    const provenance = derived ? 'local-generated-from-external-catalog' :
      pluginMatch ? 'plugin-package' : file.root === 'vendor-catalog' ? 'vendor-catalog' :
      importedArchive ? 'extracted-external-archive' : metadata.author || fields.author ? 'declared-author' : 'unknown';
    const topFiles = fs.readdirSync(directory);
    const licenses = topFiles.filter(name => /^(licen[cs]e|copying)([.-]|$)/i.test(name));
    const observed = {
      frontmatterDelimiters: hasFrontmatter,
      extractedName: fields.name ?? null,
      extractedDescription: Boolean(fields.description),
      registryIdFormat: /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(baseName),
      scriptsDirectory: fs.existsSync(path.join(directory, 'scripts')),
      referencesDirectory: fs.existsSync(path.join(directory, 'references')),
      evalsDirectory: fs.existsSync(path.join(directory, 'evals')),
      testsDirectory: fs.existsSync(path.join(directory, 'tests')),
      readmeFile: topFiles.some(name => /^readme(?:\.|$)/i.test(name)),
      licenseFiles: licenses,
    };
    const issues = [];
    if (!hasFrontmatter) issues.push('missing-frontmatter-delimiters');
    if (!fields.name) issues.push('name-not-extracted');
    if (!fields.description) issues.push('description-not-extracted');
    if (!observed.registryIdFormat) issues.push('id-incompatible-with-marketplace-schema');
    if (runtimeErrors.has(normalize(file.path))) issues.push('runtime-load-error');
    if (derived) issues.push('catalog-derived-minimal-not-original-package');
    if (!runtime.length && installed) issues.push('not-returned-by-queried-runtime');
    if (isTemplate) issues.push('template-or-example-candidate');
    const declaredVersion = fields.version || metadata.version || null;
    const declaredAuthor = fields.author || metadata.author || null;
    records.push({
      recordId, name: safe(name), baseName: safe(baseName), description: safe(runtime[0]?.description ?? fields.description ?? '').slice(0, 2500),
      sourcePath: file.alias, scanRoot: file.root, sourceRoots: file.roots,
      sha256: file.sha256, bytes: file.bytes, modifiedAt: file.modifiedAt,
      installedLocationOrRuntime: installed, templateCandidate: isTemplate,
      runtime: runtime.map(({ contextId, enabled, scope, pluginId }) => ({ contextId, enabled, scope, pluginId })),
      runtimeError: runtimeErrors.get(normalize(file.path)) ?? null,
      provenance: { classification: provenance, verifiedOriginalAuthor: false,
        declaredAuthor: declaredAuthor ? safe(typeof declaredAuthor === 'object' ? declaredAuthor.name ?? '声明格式需人工核查' : declaredAuthor) : null,
        declaredVersion: declaredVersion ? safe(declaredVersion) : null,
        plugin: pluginMatch ? { marketplace: pluginMatch[1], name: pluginMatch[2], cachedVersion: pluginMatch[3] } : null,
        declaredLicense: fields.license ? safe(fields.license) : null,
        sourceCatalog: fields.imported_from ? safe(fields.imported_from) : null,
        sourceArchive: fields.source_archive ? safe(fields.source_archive) : null,
        generationLog: generatedEvidence ? safe(generationLog) : null },
      localCreation: { status: derived ? 'derived-generation-evidence' : zeweiCandidate ? 'zewei-related-candidate' : localArtifact ? 'local-artifact-authorship-unverified' : 'unverified',
        evidence: generatedEvidence ? 'Historical generation/install log identifies this exact path; this is not proof of original authorship.' :
          derived ? 'SKILL frontmatter declares catalog-only-minimal.' :
          zeweiCandidate ? 'Name or description mentions Zewei; authorship requires confirmation.' :
          localArtifact ? 'File exists in a local project/archive directory; creation and authorship are not established.' : null },
      standardsObserved: observed, issues,
      governanceStatus: 'pending-review', registryId: null, maturity: null,
      dependencyAssessment: 'not-executed', behaviorEvaluation: 'not-executed',
    });
  }
  records.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath, 'en'));
  if (new Set(records.map(record => record.recordId)).size !== records.length) throw new Error('Inventory ID collision.');
  const nameGroups = duplicateGroups(records, 'baseName');
  const hashGroups = duplicateGroups(records, 'sha256');
  const installedRecords = records.filter(record => record.installedLocationOrRuntime);
  const externalRecords = records.filter(record => ['local-generated-from-external-catalog', 'plugin-package', 'vendor-catalog', 'extracted-external-archive', 'declared-author'].includes(record.provenance.classification));
  const createdRecords = records.filter(record => record.localCreation.status !== 'unverified');
  const runtimePaths = [...runtimeByPath.keys()];
  const sourcePaths = new Set(discovery.files.map(file => normalize(file.path)));
  const runtimeOutsideScan = runtimePaths.filter(file => !sourcePaths.has(file)).map(safe);
  const changed = [...discovery.changedDuringScan];
  for (const file of discovery.files) {
    if (hash(fs.readFileSync(file.path)) !== file.sha256) changed.push(file.alias);
  }
  const pathChanges = [];
  for (const root of roots.filter(root => root.status === 'scanned')) {
    const again = findSkills(root.path);
    const before = new Set(discovery.files.filter(file => file.roots.includes(root.id)).map(file => normalize(file.path)));
    const after = new Set(again.files.map(normalize));
    for (const value of after) if (!before.has(value)) pathChanges.push({ root: root.id, change: 'added', path: safe(value) });
    for (const value of before) if (!after.has(value)) pathChanges.push({ root: root.id, change: 'removed', path: safe(value) });
    if (again.status !== 'scanned') pathChanges.push({ root: root.id, change: 'rescan-incomplete' });
  }
  const snapshotId = discovery.startedAt.replaceAll(':', '-').replaceAll('.', '-');
  const summary = {
    snapshotId, startedAt: discovery.startedAt, finishedAt: discovery.finishedAt, generatedAt: new Date().toISOString(),
    sourceFiles: records.length, installedLocationOrRuntime: installedRecords.length,
    runtimeUniquePaths: runtimePaths.length, enabledInAnyContext: [...runtimeByPath.values()].filter(items => items.some(item => item.enabled === true)).length,
    runtimeOutsideScan, runtimeStatus: discovery.runtime.status, runtimeContexts: contexts,
    externalEvidenceFiles: externalRecords.length, localCreationReviewFiles: createdRecords.length,
    localDerivedFiles: records.filter(record => record.localCreation.status === 'derived-generation-evidence').length,
    zeweiRelatedCandidates: records.filter(record => record.localCreation.status === 'zewei-related-candidate').length,
    verifiedZeweiOriginals: 0, sameNameGroups: nameGroups.length, identicalSkillMdGroups: hashGroups.length,
    runtimeLoadErrors: [...runtimeErrors].map(([file, message]) => ({ path: safe(file), message })),
    roots: roots.map(({ id, alias, kind, status, count, errors }) => ({ id, alias, kind, status, count, errors: errors.map(safe) })),
    exclusions: excludedDirectories, integrity: { checkedSkillMdFiles: records.length, changedSkillMdFiles: [...new Set(changed)], pathChanges,
      scope: 'SKILL.md bytes and discovered paths only; supporting scripts/assets are not hashed.' },
    limitations: [
      'Only listed local roots were scanned. Missing roots, cloud-only tasks, unopened archives and excluded dependency directories are not covered.',
      'Runtime availability is specific to the queried standalone app-server contexts. It is not a complete statement about every desktop plugin session.',
      'Frontmatter scalar extraction is best effort, not full YAML validation. Codex runtime errors are authoritative for queried paths.',
      'Identical SHA-256 means identical SKILL.md bytes only, not identical supporting files or interchangeable skills.',
      'Creation, installation, authorship and original ownership are separate. No original authorship is inferred from local presence.',
      'Inventory views overlap and must not be summed. Every physical path retains its own record. No skill is registered or evaluated by this scan.',
    ],
  };
  const target = path.join(outputRoot, 'snapshots', snapshotId);
  if (fs.existsSync(target)) throw new Error('Snapshot already exists; use a new discovery rather than overwrite an audit.');
  fs.mkdirSync(path.join(target, 'records'), { recursive: true });
  const write = (name, value) => fs.writeFileSync(path.join(target, name), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  write('summary.json', summary);
  write('catalog.json', { schemaVersion: '1.0.0', snapshotId, records });
  write('duplicates.json', { sameName: nameGroups, identicalSkillMd: hashGroups, action: 'none' });
  const csvFields = ['recordId', 'name', 'sourcePath', 'sha256', 'installedLocationOrRuntime', 'governanceStatus'];
  const csvCell = value => {
    let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  write('catalog.csv', '\uFEFF' + [csvFields.join(','), ...records.map(record => csvFields.map(field => csvCell(record[field])).join(','))].join('\r\n') + '\r\n');
  const groupsById = new Map();
  for (const group of hashGroups) for (const id of group.recordIds) groupsById.set(id, group.recordIds.filter(other => other !== id));
  for (const record of records) {
    write(`records/${record.recordId}.md`, `# ${md(record.name)}\n\n` +
      `- 盘点 ID：${record.recordId}\n- 原路径：\`${record.sourcePath}\`\n- SKILL.md SHA-256：\`${record.sha256}\`\n` +
      `- 描述：${md(record.description || '未提取')}\n- 声明版本：${md(record.provenance.declaredVersion)}\n` +
      `- 声明作者：${md(record.provenance.declaredAuthor)}；原创归属未核实\n- 许可证声明：${md(record.provenance.declaredLicense)}；未核验\n` +
      `- 来源分类：${record.provenance.classification}\n- 本地创建线索：${record.localCreation.status}\n` +
      `- 创建证据：${md(record.localCreation.evidence)}\n- 历史记录：${md(record.provenance.generationLog)}\n` +
      `- 位于安装目录或运行时可发现：${record.installedLocationOrRuntime}\n` +
      `- 运行时：${record.runtime.length ? record.runtime.map(item => `${item.contextId}: enabled=${item.enabled}, scope=${item.scope}`).join('; ') : '未被本次查询返回；不能直接判为禁用'}\n` +
      `- 运行时错误：${md(record.runtimeError || '无已报告错误')}\n- 观察项：${record.issues.join(', ') || '无上述自动观察项'}\n` +
      `- 状态：待评估；未纳管；未设置成熟度；未执行技能\n- 负责人：待指定\n` +
      `- 相同 SKILL.md 内容记录：${(groupsById.get(record.recordId) ?? []).map(id => `[${id}](${id}.md)`).join('、') || '无'}\n\n` +
      `只记录元信息与校验值，不复制技能正文。结构、来源和行为尚需人工核查；相同正文不代表相同附件。\n`);
  }
  const snapshotRelative = `snapshots/${snapshotId}`;
  const index = list => `| Skill | 盘点记录 | 来源路径 |\n| --- | --- | --- |\n${list.map(record => `| ${md(record.name)} | [${record.recordId}](../${snapshotRelative}/records/${record.recordId}.md) | ${md(record.sourcePath)} |`).join('\n')}\n`;
  for (const [directory, title, list, explanation] of [
    ['installed-skills', '安装位置与运行时发现清单', installedRecords, '包含安装目录中存在但可能无法加载的技能，以及运行时返回的插件与项目技能。'],
    ['external-skills', '外部来源证据清单', externalRecords, '记录插件、导入存档、目录派生和作者声明线索；来源声明不等于已核实许可。'],
    ['zewei-created-skills', '本地创建证据与归属待核实清单', createdRecords, '区分本地目录派生、泽玮相关候选和普通本地存档；不宣称这些记录全部为泽玮原创。'],
  ]) {
    fs.mkdirSync(path.join(outputRoot, directory), { recursive: true });
    fs.writeFileSync(path.join(outputRoot, directory, 'INDEX.md'), `# ${title}\n\n快照：${snapshotId}。${list.length} 份路径记录。${explanation}\n\n${index(list)}`);
  }
  fs.writeFileSync(path.join(outputRoot, 'latest.json'), `${JSON.stringify({ schemaVersion: '1.0.0', snapshotId, summary: `${snapshotRelative}/summary.json`, catalog: `${snapshotRelative}/catalog.json` }, null, 2)}\n`);
  const runtimeTable = contexts.map(context => `| ${context.id} | ${md(context.cwd)} | ${context.count} | ${context.enabled} | ${context.disabled} | ${context.errors.length} |`).join('\n');
  const rootTable = summary.roots.map(root => `| ${root.id} | ${root.alias} | ${root.status} | ${root.count} |`).join('\n');
  const report = `# Codex Skills 盘点报告\n\n快照：${snapshotId}。本阶段只盘点，未修改、合并、删除、注册或执行任何 Skill。\n\n` +
    `## 数量口径\n\n- 磁盘 SKILL.md 路径记录：${records.length} 份。\n- 安装目录或运行时发现：${installedRecords.length} 份。\n` +
    `- 三类盘点视图存在重叠，不得相加作为技能总数。\n- 运行时跨查询目录共发现 ${runtimePaths.length} 个唯一路径。\n` +
    `- 同名分组 ${nameGroups.length} 组；SKILL.md 字节相同分组 ${hashGroups.length} 组。仅标记，未去重或合并。\n` +
    `- 本地目录派生证据 ${summary.localDerivedFiles} 份；泽玮相关待核实候选 ${summary.zeweiRelatedCandidates} 份。已确认泽玮原创：0（尚未做归属核验）。\n\n` +
    `## 运行时查询\n\n| 上下文 | 查询目录 | 返回 | 启用 | 禁用 | 错误 |\n| --- | --- | --- | --- | --- | --- |\n${runtimeTable}\n\n` +
    `独立 app-server 的结果可能与桌面任务的插件注入不同；未返回的插件缓存不能直接判为未安装或禁用。\n\n` +
    `## 扫描范围\n\n| 根目录 ID | 路径别名 | 状态 | 文件数 |\n| --- | --- | --- | --- |\n${rootTable}\n\n` +
    `额外根目录别名的机器路径只保存在忽略提交的 .tmp/skill-discovery.json。未扫描压缩包内容、云端任务和依赖目录。\n\n` +
    `## 已观察问题\n\n${summary.runtimeLoadErrors.map(error => `- \`${error.path}\`：${md(error.message)}`).join('\n') || '无运行时已报告错误。'}\n\n` +
    `本轮未修复。其他格式观察、生成占位说明、来源及版本缺失情况见逐条记录。\n\n` +
    `## 数据与完整性\n\n- [完整 JSON 清单](${snapshotRelative}/catalog.json)\n- [CSV 清单](${snapshotRelative}/catalog.csv)\n` +
    `- [详细统计](${snapshotRelative}/summary.json)\n- [同名及相同正文分组](${snapshotRelative}/duplicates.json)\n` +
    `- [安装位置清单](installed-skills/INDEX.md)\n- [外部来源清单](external-skills/INDEX.md)\n- [本地创建与归属线索](zewei-created-skills/INDEX.md)\n\n` +
    `对 ${records.length} 份 SKILL.md 复核 SHA-256，变化 ${summary.integrity.changedSkillMdFiles.length} 份；复扫发现路径变化 ${pathChanges.length} 项。只核对正文与路径，未对全部附件做哈希。\n\n` +
    `正式 Registry 保持空表。成熟度、实际依赖、费用、许可证和原创作者均未据本轮扫描自动认定。\n`;
  fs.writeFileSync(path.join(outputRoot, 'REPORT.md'), report);
  write('REPORT.md', report.replaceAll(`](${snapshotRelative}/`, '](').replaceAll('](installed-skills/', '](../../installed-skills/').replaceAll('](external-skills/', '](../../external-skills/').replaceAll('](zewei-created-skills/', '](../../zewei-created-skills/'));
  return summary;
}

if (process.argv[1] && normalize(process.argv[1]) === normalize(fileURLToPath(import.meta.url))) {
  const discovery = readJson(path.join(repo, '.tmp', 'skill-discovery.json'));
  const summary = buildInventory(discovery);
  console.log(JSON.stringify({ snapshotId: summary.snapshotId, files: summary.sourceFiles, installed: summary.installedLocationOrRuntime,
    runtimePaths: summary.runtimeUniquePaths, external: summary.externalEvidenceFiles, createdReview: summary.localCreationReviewFiles,
    derived: summary.localDerivedFiles, zeweiCandidates: summary.zeweiRelatedCandidates, nameGroups: summary.sameNameGroups,
    hashGroups: summary.identicalSkillMdGroups, integrity: summary.integrity }, null, 2));
}
