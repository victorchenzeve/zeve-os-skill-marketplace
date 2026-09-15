import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeName } from './reconcile-feishu-skills.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'inventory', 'reviews', 'evidence');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const unique = values => [...new Set(values.filter(value => value != null && value !== ''))].sort(compare);

function inventoryByName() {
  const latest = readJson('inventory/latest.json');
  const catalog = readJson(`inventory/${latest.catalog}`);
  const result = new Map();
  for (const record of catalog.records) {
    const name = normalizeName(record.baseName || record.name);
    if (!name) continue;
    if (!result.has(name)) result.set(name, []);
    result.get(name).push(record);
  }
  for (const records of result.values()) records.sort((a, b) => compare(a.sourcePath, b.sourcePath));
  return { latest, records: result };
}

function resolutionsByReviewId() {
  const directory = path.join(root, 'inventory', 'reviews', 'resolutions');
  const result = new Map();
  if (!fs.existsSync(directory)) return result;
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort(compare)) {
    const ledger = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    for (const resolution of ledger.resolutions ?? []) {
      result.set(resolution.reviewId, { ledger: `inventory/reviews/resolutions/${name}`, ...resolution });
    }
  }
  return result;
}

function sourceEvidence(records) {
  return {
    status: records.length ? 'observed-packages' : 'source-package-missing',
    physicalPackages: records.map(record => ({
      recordId: record.recordId,
      sourcePath: record.sourcePath,
      skillMdSha256: record.sha256,
      bytes: record.bytes,
      modifiedAt: record.modifiedAt,
      classification: record.provenance?.classification ?? 'unknown',
      declaredAuthor: record.provenance?.declaredAuthor ?? null,
      sourceCatalog: record.provenance?.sourceCatalog ?? null,
      sourceArchive: record.provenance?.sourceArchive ?? null,
      plugin: record.provenance?.plugin ?? null,
      installedLocationOrRuntime: record.installedLocationOrRuntime === true,
    })),
    classifications: unique(records.map(record => record.provenance?.classification)),
    ownershipConclusion: records.some(record => record.provenance?.verifiedOriginalAuthor === true)
      ? 'verified-by-inventory-evidence'
      : 'not-verified-by-inventory-evidence',
  };
}

function licenseEvidence(records) {
  const declarations = unique(records.map(record => record.provenance?.declaredLicense));
  const files = records.flatMap(record => (record.standardsObserved?.licenseFiles ?? []).map(file => ({
    recordId: record.recordId,
    file,
  })));
  return {
    status: declarations.length || files.length ? 'declaration-observed-verification-required' : 'no-license-evidence-observed',
    declarations,
    licenseFiles: files,
    redistributionConclusion: 'not-authorized-by-inventory-evidence',
  };
}

function runtimeStructureEvidence(records, review) {
  return {
    status: review.gateResults.structure,
    packages: records.map(record => ({
      recordId: record.recordId,
      frontmatterDelimiters: record.standardsObserved?.frontmatterDelimiters === true,
      extractedName: record.standardsObserved?.extractedName ?? null,
      extractedDescription: record.standardsObserved?.extractedDescription === true,
      registryIdFormat: record.standardsObserved?.registryIdFormat === true,
      scriptsDirectory: record.standardsObserved?.scriptsDirectory === true,
      referencesDirectory: record.standardsObserved?.referencesDirectory === true,
      evalsDirectory: record.standardsObserved?.evalsDirectory === true,
      testsDirectory: record.standardsObserved?.testsDirectory === true,
      runtimeOccurrences: (record.runtime ?? []).length,
      runtimeScopes: unique((record.runtime ?? []).map(item => item.scope)),
      runtimeError: record.runtimeError ?? null,
      issues: record.issues ?? [],
    })),
    conclusion: review.gateResults.structure === 'observed-pass'
      ? 'snapshot-structure-observed; formal-package-validation-still-required'
      : 'structure-gate-not-passed',
  };
}

function dependencyEvidence(records, review) {
  return {
    status: review.gateResults.dependencies,
    observedPackagingSignals: {
      packagesWithScripts: records.filter(record => record.standardsObserved?.scriptsDirectory).map(record => record.recordId),
      packagesWithReferences: records.filter(record => record.standardsObserved?.referencesDirectory).map(record => record.recordId),
    },
    conclusion: 'commands-services-permissions-costs-and-failure-paths-not-verified',
  };
}

function validationEvidence(records, review) {
  return {
    behaviorStatus: review.gateResults.behavior,
    structuralObservationStatus: review.gateResults.structure,
    runtimeObservedPackages: records.filter(record => (record.runtime ?? []).length > 0).map(record => record.recordId),
    packagesWithEvaluationDirectory: records.filter(record => record.standardsObserved?.evalsDirectory).map(record => record.recordId),
    packagesWithTestsDirectory: records.filter(record => record.standardsObserved?.testsDirectory).map(record => record.recordId),
    executionPolicy: 'not-executed-during-read-only-inventory-review',
    conclusion: review.gateResults.behavior === 'not-evaluated'
      ? 'success-failure-and-boundary-behavior-evidence-required'
      : review.gateResults.behavior,
  };
}

export function buildEvidenceSupplements() {
  const { latest, records: inventory } = inventoryByName();
  const resolutions = resolutionsByReviewId();
  const files = {};
  const all = [];
  for (let number = 1; number <= 18; number++) {
    const waveId = `wave-${String(number).padStart(2, '0')}`;
    const reviewFile = `inventory/reviews/${waveId}.json`;
    const review = readJson(reviewFile);
    const evidenceRecords = review.reviews.map(item => {
      const packages = inventory.get(normalizeName(item.normalizedName)) ?? [];
      const resolution = resolutions.get(item.id) ?? null;
      const record = {
        reviewId: item.id,
        candidate: item.normalizedName,
        immutableReview: reviewFile,
        sourceEvidence: sourceEvidence(packages),
        licenseEvidence: licenseEvidence(packages),
        runtimeStructureEvidence: runtimeStructureEvidence(packages, item),
        dependencyEvidence: dependencyEvidence(packages, item),
        validationEvidence: validationEvidence(packages, item),
        registryOutcome: {
          originalCandidatePromotionEligible: item.promotionEligible === true,
          originalCandidateDecision: item.formalizationDecision,
          reason: item.decisionReason,
          cleanRoomResolution: resolution ? {
            ledger: resolution.ledger,
            formalReplacement: resolution.formalReplacement,
            evidencePath: resolution.evidencePath,
            candidateDecision: resolution.candidateDecision,
          } : null,
        },
      };
      all.push(record);
      return record;
    });
    const summary = {
      records: evidenceRecords.length,
      sourcePackagesObserved: evidenceRecords.filter(item => item.sourceEvidence.physicalPackages.length > 0).length,
      sourcePackagesMissing: evidenceRecords.filter(item => item.sourceEvidence.physicalPackages.length === 0).length,
      licenseSignalsObserved: evidenceRecords.filter(item => item.licenseEvidence.declarations.length || item.licenseEvidence.licenseFiles.length).length,
      structureObservedPass: evidenceRecords.filter(item => item.runtimeStructureEvidence.status === 'observed-pass').length,
      behaviorEvaluated: evidenceRecords.filter(item => item.validationEvidence.behaviorStatus !== 'not-evaluated').length,
      originalCandidatesPromotionEligible: evidenceRecords.filter(item => item.registryOutcome.originalCandidatePromotionEligible).length,
      cleanRoomResolutions: evidenceRecords.filter(item => item.registryOutcome.cleanRoomResolution).length,
    };
    files[`inventory/reviews/evidence/${waveId}.json`] = `${JSON.stringify({
      schemaVersion: '1.0.0',
      waveId,
      generatedFrom: { inventorySnapshotId: latest.snapshotId, review: reviewFile },
      policy: '补充档案只汇总可验证证据；缺失证据保持缺失，不推定所有权、许可、再分发权或行为有效性。',
      summary,
      records: evidenceRecords,
    }, null, 2)}\n`;
  }
  const summary = {
    records: all.length,
    sourcePackagesObserved: all.filter(item => item.sourceEvidence.physicalPackages.length > 0).length,
    sourcePackagesMissing: all.filter(item => item.sourceEvidence.physicalPackages.length === 0).length,
    licenseSignalsObserved: all.filter(item => item.licenseEvidence.declarations.length || item.licenseEvidence.licenseFiles.length).length,
    ownershipVerified: all.filter(item => item.sourceEvidence.ownershipConclusion === 'verified-by-inventory-evidence').length,
    redistributionAuthorized: all.filter(item => item.licenseEvidence.redistributionConclusion === 'authorized').length,
    structureObservedPass: all.filter(item => item.runtimeStructureEvidence.status === 'observed-pass').length,
    dependencyVerified: all.filter(item => item.dependencyEvidence.status !== 'not-verified').length,
    behaviorEvaluated: all.filter(item => item.validationEvidence.behaviorStatus !== 'not-evaluated').length,
    originalCandidatesPromotionEligible: all.filter(item => item.registryOutcome.originalCandidatePromotionEligible).length,
    cleanRoomResolutions: all.filter(item => item.registryOutcome.cleanRoomResolution).length,
  };
  files['inventory/reviews/evidence/index.json'] = `${JSON.stringify({
    schemaVersion: '1.0.0',
    inventorySnapshotId: latest.snapshotId,
    reviewWaves: 18,
    policy: '895 份原审查保持不可变；补充档案提供来源、许可、运行结构、依赖和验证证据的逐项索引。',
    summary,
    files: Array.from({ length: 18 }, (_, index) => `wave-${String(index + 1).padStart(2, '0')}.json`),
  }, null, 2)}\n`;
  files['inventory/reviews/evidence/README.md'] = `# 审查证据补充档案\n\n本目录为 18 个审查批次、895 个非正式 Skill 提供逐项证据索引。原始审查文件保持不可变。\n\n- 已定位来源包：${summary.sourcePackagesObserved}\n- 来源包缺失：${summary.sourcePackagesMissing}\n- 观察到许可证声明或许可证文件：${summary.licenseSignalsObserved}\n- 运行结构观察通过：${summary.structureObservedPass}\n- 所有权已被原盘点证据验证：${summary.ownershipVerified}\n- 再分发已被原盘点证据授权：${summary.redistributionAuthorized}\n- 依赖闭环：${summary.dependencyVerified}\n- 原候选行为评估完成：${summary.behaviorEvaluated}\n- 原候选可直接晋级：${summary.originalCandidatesPromotionEligible}\n- 已建立干净实现替代：${summary.cleanRoomResolutions}\n\n“观察到声明”不等于许可证已经核验，“结构观察通过”也不等于行为验证通过。只有所有权、许可证、再分发、结构、依赖和行为六项门槛均有可验证证据时，原候选才可进入正式 Registry。\n`;
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const expected = buildEvidenceSupplements();
  const check = process.argv.includes('--check');
  const stale = [];
  for (const [relative, content] of Object.entries(expected)) {
    const target = path.join(root, relative);
    if (check) {
      if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) stale.push(relative);
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  }
  const expectedNames = new Set(Object.keys(expected).map(relative => path.basename(relative)));
  if (fs.existsSync(outputRoot)) {
    for (const name of fs.readdirSync(outputRoot)) {
      if (!expectedNames.has(name)) stale.push(`inventory/reviews/evidence/${name}`);
    }
  }
  if (stale.length) {
    console.error(`Evidence supplements are stale: ${stale.join(', ')}`);
    process.exit(1);
  }
  const index = JSON.parse(expected['inventory/reviews/evidence/index.json']);
  console.log(`${check ? 'Checked' : 'Generated'} evidence supplements (${index.summary.records} records, ${index.reviewWaves} waves).`);
}
