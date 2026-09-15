import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeName } from './reconcile-feishu-skills.mjs';
import { buildGovernanceCatalog, buildWaves } from './build-governance-catalog.mjs';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const unique = values => [...new Set(values.filter(value => value != null && value !== ''))].sort(compare);
const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const structuralIssueNames = new Set([
  'missing-frontmatter-delimiters', 'name-not-extracted', 'description-not-extracted',
  'id-incompatible-with-marketplace-schema', 'runtime-load-error', 'template-or-example-candidate',
]);

function decisionFor(item, records) {
  if (!records.length) return 'blocked-source-package-missing';
  if (item.disposition === 'repair-review') return 'blocked-runtime-structure';
  if (item.disposition === 'external-reference') return 'external-reference-only';
  return 'blocked-provenance-and-license';
}

function nextEvidenceFor(item, records, authors, licenses, structuralIssues) {
  const needed = [];
  if (!records.length) needed.push('定位可访问的原始 Skill 包与权威来源。');
  if (!authors.length) needed.push('由作者或所有者提供可验证的归属证据。');
  else needed.push('把作者声明追溯到权威仓库、发布记录或所有者确认。');
  if (!licenses.length) needed.push('取得适用于该版本的明确许可证文本。');
  else needed.push('核对许可证原文、适用版本和再分发条件。');
  if (structuralIssues.length) needed.push('由原 Skill 所有者修复结构问题并重新运行加载检查。');
  needed.push('记录内部与外部依赖、权限、费用和不可用路径。');
  needed.push('完成成功、失败和边界行为评估。');
  if (item.disposition === 'table-addition-review') needed.push('由目录所有者决定是否补登飞书；本审查不写表。');
  if (item.disposition === 'availability-review') needed.push('核实停用、移动、改名或缺失安装状态。');
  return unique(needed);
}

function buildReview(item, catalogEntry, records, reviewedAt) {
  const authors = unique(records.map(record => record.provenance?.declaredAuthor));
  const licenses = unique(records.map(record => record.provenance?.declaredLicense));
  const classifications = unique(records.map(record => record.provenance?.classification));
  const sourceRoots = unique(records.flatMap(record => record.sourceRoots ?? []));
  const structuralIssues = unique([
    ...records.flatMap(record => record.issues ?? []).filter(issue => structuralIssueNames.has(issue)),
    ...(item.disposition === 'repair-review' ? ['runtime-load-error'] : []),
  ]);
  const hashes = unique(records.map(record => record.sha256));
  const runtimeOccurrences = records.flatMap(record => record.runtime ?? []).length;
  const decision = decisionFor(item, records);
  return {
    id: item.id,
    normalizedName: item.normalizedName,
    reviewedAt,
    reviewStatus: 'completed',
    priorDisposition: item.disposition,
    evidence: {
      sourcePackage: records.length ? 'observed-local-copy' : 'not-located',
      physicalPaths: records.length,
      installedPaths: records.filter(record => record.installedLocationOrRuntime).length,
      runtimeOccurrences,
      runtimeScopes: catalogEntry?.presence.runtimeScopes ?? [],
      feishuRows: catalogEntry?.presence.feishuRows ?? 0,
      contentHashes: hashes.length,
      classifications,
      sourceRoots,
      declaredAuthors: authors,
      declaredLicenses: licenses,
      structuralIssues,
      nonStructuralObservations: unique(records.flatMap(record => record.issues ?? []).filter(issue => !structuralIssueNames.has(issue))),
      duplicateAssessment: catalogEntry?.duplicates ?? null,
    },
    gateResults: {
      ownership: authors.length ? 'declared-unverified' : 'unknown',
      license: licenses.length ? 'declared-unverified' : 'unknown',
      redistribution: 'not-authorized-by-evidence',
      structure: records.length === 0 ? 'not-inspectable' : structuralIssues.length ? 'failed' : 'observed-pass',
      dependencies: 'not-verified',
      behavior: runtimeOccurrences && !structuralIssues.includes('runtime-load-error') ? 'runtime-observed-not-evaluated' : 'not-evaluated',
    },
    formalizationDecision: decision,
    promotionEligible: false,
    decisionReason: decision === 'blocked-source-package-missing'
      ? '没有可访问的原始包，无法核实正文、依赖和许可。'
      : decision === 'blocked-runtime-structure'
        ? '运行时结构失败，且来源、许可与行为证据仍未闭环。'
        : decision === 'external-reference-only'
          ? '当前证据表明它来自外部或派生来源；未取得适用版本的再分发证据。'
          : '本地副本或声明不能证明原创归属、适用许可证和再分发资格。',
    nextEvidence: nextEvidenceFor(item, records, authors, licenses, structuralIssues),
    mutationPerformed: false,
  };
}

export function buildWaveReviews(root = defaultRoot) {
  const catalog = buildGovernanceCatalog(root);
  const waves = buildWaves(root);
  const latest = readJson(root, 'inventory/latest.json');
  const inventory = readJson(root, `inventory/${latest.catalog}`);
  const recordsByName = new Map();
  for (const record of inventory.records) {
    const key = normalizeName(record.baseName || record.name);
    if (!recordsByName.has(key)) recordsByName.set(key, []);
    recordsByName.get(key).push(record);
  }
  const catalogByName = new Map(catalog.skills.map(item => [item.normalizedName, item]));
  const reviewedWaves = waves.waves.map(wave => {
    const reviews = wave.items.map(item => buildReview(
      item, catalogByName.get(item.normalizedName), recordsByName.get(item.normalizedName) ?? [], catalog.generatedAt,
    ));
    const decisions = unique(reviews.map(item => item.formalizationDecision));
    return {
      schemaVersion: '1.0.0',
      waveId: wave.id,
      reviewedAt: catalog.generatedAt,
      status: 'completed-evidence-review',
      policy: '逐项核实只形成证据结论；不修改、复制、合并、删除或安装原 Skill，也不写入飞书。',
      summary: {
        reviewed: reviews.length,
        promotionEligible: reviews.filter(item => item.promotionEligible).length,
        mutationsPerformed: reviews.filter(item => item.mutationPerformed).length,
        decisionCounts: Object.fromEntries(decisions.map(key => [key, reviews.filter(item => item.formalizationDecision === key).length])),
      },
      reviews,
    };
  });
  const reviews = reviewedWaves.flatMap(wave => wave.reviews);
  const decisions = unique(reviews.map(item => item.formalizationDecision));
  const index = {
    schemaVersion: '1.0.0',
    reviewedAt: catalog.generatedAt,
    sourceCatalog: 'inventory/governance/catalog.json',
    sourceWaves: 'inventory/governance/waves.json',
    status: 'all-waves-reviewed',
    summary: {
      waves: reviewedWaves.length,
      reviewed: reviews.length,
      promotionEligible: reviews.filter(item => item.promotionEligible).length,
      evidenceBlocked: reviews.filter(item => !item.promotionEligible).length,
      mutationsPerformed: reviews.filter(item => item.mutationPerformed).length,
      decisionCounts: Object.fromEntries(decisions.map(key => [key, reviews.filter(item => item.formalizationDecision === key).length])),
    },
    waves: reviewedWaves.map(wave => ({ waveId: wave.waveId, status: wave.status, file: `inventory/reviews/${wave.waveId}.json`, summary: wave.summary })),
  };
  return { catalog, waves: reviewedWaves, index };
}

function formalizationResolutionCount(root) {
  const directory = path.join(root, 'inventory/reviews/resolutions');
  if (!fs.existsSync(directory)) return 0;
  return fs.readdirSync(directory).filter(name => name.endsWith('.json')).reduce((total, name) => {
    const ledger = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    return total + (ledger.resolutions?.length ?? 0);
  }, 0);
}

function readmeText(result, resolved) {
  const s = result.index.summary;
  return `# 18 批 Skill 逐项核实记录\n\n已按统一证据门槛完成 ${s.waves} 个批次、${s.reviewed} 个非正式逻辑 Skill 的逐项核实。每项都记录来源包、作者与许可证声明、结构、运行时、重复关系、依赖与行为证据状态。\n\n- 可直接正式纳管的原候选：${s.promotionEligible}\n- 证据阻塞：${s.evidenceBlocked}\n- 已完成原创干净实现替代：${resolved}\n- 修改、复制、合并、删除或安装原 Skill：${s.mutationsPerformed}\n\n[证据补充档案](evidence/README.md) 已为全部 895 条记录建立确定性关联：880 条可定位至少一个来源包，15 条缺失来源包，101 条观察到许可证声明或许可证文件，863 条通过快照结构观测。所有权、再分发、依赖与行为门槛没有证据时仍明确记为未通过，不能由声明或本机存在状态推定。\n\n当前没有原候选同时具备已验证的所有权、适用许可证、再分发资格、依赖评估和行为证据，因此没有把本地或第三方副本自动写进正式 Registry。声明为 MIT 或出现在本机只算证据线索，不算完成核实。\n\n## 处理方式\n\n- \`blocked-source-package-missing\`：先定位权威原始包。\n- \`blocked-runtime-structure\`：由原所有者修复加载结构，再重新评估。\n- \`blocked-provenance-and-license\`：补齐可验证作者、来源、许可证和行为证据。\n- \`external-reference-only\`：保留外部参考，取得再分发证据前不复制。\n\n## 干净实现解析\n\n\`resolutions/*.json\` 记录从审查缺口到原创正式替代的映射。正式替代必须使用新 ID、原创正文和仓库 MIT 许可；原候选仍保持原有来源与再分发结论。\n\n每个 \`wave-NN.json\` 都有逐项结论和下一证据动作。新的证据到达后只重审对应条目，不重写原 Skill。\n`;
}

export function generatedReviewTexts(root = defaultRoot) {
  const result = buildWaveReviews(root);
  const texts = {
    'inventory/reviews/index.json': `${JSON.stringify(result.index, null, 2)}\n`,
    'inventory/reviews/README.md': readmeText(result, formalizationResolutionCount(root)),
  };
  for (const wave of result.waves) texts[`inventory/reviews/${wave.waveId}.json`] = `${JSON.stringify(wave, null, 2)}\n`;
  return texts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const expected = generatedReviewTexts(defaultRoot);
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
    console.error(`Wave reviews are stale: ${stale.join(', ')}`);
    process.exitCode = 1;
  } else {
    const index = buildWaveReviews(defaultRoot).index;
    console.log(`${check ? 'Checked' : 'Wrote'} ${index.summary.waves} wave reviews (${index.summary.reviewed} skills).`);
  }
}
