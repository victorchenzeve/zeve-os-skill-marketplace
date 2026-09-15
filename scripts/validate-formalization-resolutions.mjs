import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const errors = [];
const resolutionDir = path.join(root, 'inventory/reviews/resolutions');
const files = fs.existsSync(resolutionDir) ? fs.readdirSync(resolutionDir).filter(name => name.endsWith('.json')).sort() : [];
if (!files.length) errors.push('no formalization resolution ledgers found');

const reviews = new Map();
for (let wave = 1; wave <= 18; wave += 1) {
  const relative = `inventory/reviews/wave-${String(wave).padStart(2, '0')}.json`;
  for (const review of readJson(relative).reviews) reviews.set(review.id, review);
}
const registry = readJson('registry/skills.yaml');
const skills = new Map(registry.skills.map(skill => [skill.id, skill]));
const latest = readJson('inventory/latest.json');
const inventory = readJson(path.join('inventory', latest.catalog));
const inventoryHashes = new Set(inventory.records.map(record => record.sha256));
const seenReviews = new Set();
const seenReplacements = new Set();
let total = 0;

for (const file of files) {
  const relative = `inventory/reviews/resolutions/${file}`;
  const ledger = readJson(relative);
  if (ledger.schemaVersion !== '1.0.0') errors.push(`${relative}: unsupported schemaVersion`);
  if (ledger.method !== 'clean-room-capability-replacement') errors.push(`${relative}: unsupported method`);
  if (ledger.summary?.thirdPartyFilesCopied !== 0 || ledger.summary?.originalCandidatesPromoted !== 0) errors.push(`${relative}: unsafe summary`);
  const resolutions = ledger.resolutions ?? [];
  if (ledger.summary?.reviewInputs !== resolutions.length || ledger.summary?.formalReplacements !== resolutions.length) errors.push(`${relative}: summary count mismatch`);
  total += resolutions.length;
  for (const resolution of resolutions) {
    const label = `${relative}:${resolution.formalReplacement ?? 'unknown'}`;
    if (seenReviews.has(resolution.reviewId)) errors.push(`${label}: review resolved more than once`);
    if (seenReplacements.has(resolution.formalReplacement)) errors.push(`${label}: replacement repeated`);
    seenReviews.add(resolution.reviewId);
    seenReplacements.add(resolution.formalReplacement);
    const review = reviews.get(resolution.reviewId);
    if (!review) errors.push(`${label}: unknown reviewId`);
    else {
      if (review.normalizedName !== resolution.candidate) errors.push(`${label}: candidate does not match review`);
      if (!String(review.formalizationDecision).startsWith('blocked-') && review.formalizationDecision !== 'external-reference-only') errors.push(`${label}: original candidate was not blocked`);
    }
    if (resolution.candidateDecision !== 'remains-blocked-provenance-and-license') errors.push(`${label}: candidate boundary was weakened`);
    const skill = skills.get(resolution.formalReplacement);
    if (!skill) { errors.push(`${label}: formal replacement is not registered`); continue; }
    if (skill.provenance?.classification !== 'original' || skill.provenance?.owner !== 'zeve-os' || skill.provenance?.source !== 'repository-clean-room-replacement') errors.push(`${label}: replacement provenance mismatch`);
    if (skill.license !== 'MIT') errors.push(`${label}: replacement license mismatch`);
    if (skill.evaluation?.evidencePath !== resolution.evidencePath || !fs.existsSync(path.join(root, resolution.evidencePath))) errors.push(`${label}: evaluation evidence mismatch`);
    if (skill.id.includes('zewei')) errors.push(`${label}: legacy brand prefix in formal id`);
    const skillFile = path.join(root, skill.path, 'SKILL.md');
    if (!fs.existsSync(skillFile)) errors.push(`${label}: SKILL.md missing`);
    else {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(skillFile)).digest('hex');
      if (inventoryHashes.has(hash)) errors.push(`${label}: formal SKILL.md duplicates an inventoried candidate`);
    }
    const gates = resolution.gateResults ?? {};
    if (gates.ownership !== 'verified-repository-original' || gates.license !== 'verified-mit' || gates.redistribution !== 'authorized-by-repository-license' || gates.structure !== 'repository-validated' || gates.dependencies !== 'declared' || !String(gates.behavior).includes('passed')) errors.push(`${label}: gate results incomplete`);
  }
}

if (errors.length) {
  console.error(`Formalization resolution validation failed (${errors.length}):\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Formalization resolutions passed (${files.length} ledgers, ${total} clean-room replacements).`);
}
