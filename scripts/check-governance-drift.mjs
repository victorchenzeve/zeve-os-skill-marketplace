import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { queueText } from './build-candidate-queue.mjs';
import { generatedTexts } from './build-governance-catalog.mjs';
import { generatedReviewTexts } from './build-wave-reviews.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const errors = [];
const pkg = json('package.json');
const skills = json('registry/skills.yaml').skills;
const plugins = json('registry/plugins.yaml').plugins;
const agents = json('registry/agents.yaml').agents;
const marketplace = json('.agents/plugins/marketplace.json');

const expectedCounts = { skills: 39, plugins: 6, agents: 6 };
for (const [kind, value] of Object.entries(expectedCounts)) {
  const actual = ({ skills, plugins, agents })[kind].length;
  if (actual !== value) errors.push(`${kind}: expected ${value}, got ${actual}`);
}
for (const entry of [...skills, ...plugins, ...agents]) {
  if (entry.license !== 'MIT') errors.push(`${entry.id}: formal original asset must declare MIT`);
  if (entry.provenance?.classification !== 'original' || entry.provenance?.owner !== 'zeve-os') {
    errors.push(`${entry.id}: unexpected formal provenance`);
  }
  if (!fs.existsSync(path.join(root, entry.evaluation?.evidencePath ?? ''))) errors.push(`${entry.id}: missing evaluation evidence`);
}
for (const entry of skills.filter(item => ['marketplace-asset-curator', 'zeve-skill-release-auditor'].includes(item.id))) {
  if (entry.maturity !== 'stable' || entry.evaluation.status !== 'repository-passed') errors.push(`${entry.id}: core governance evidence drift`);
}
for (const entry of skills.filter(item => !['marketplace-asset-curator', 'zeve-skill-release-auditor'].includes(item.id))) {
  if (entry.maturity !== 'experimental') errors.push(`${entry.id}: asset requires more real-world evidence before stable`);
}
const marketNames = marketplace.plugins.map(item => item.name).sort();
const pluginNames = plugins.map(item => item.id).sort();
if (JSON.stringify(marketNames) !== JSON.stringify(pluginNames)) errors.push('Codex Marketplace plugin list differs from Registry');
if (!read('README.md').includes(`当前版本：\`${pkg.version}\``)) errors.push('README current version is stale');
if (!read('README.md').includes('39 个 Skill、6 个插件、6 个代理')) errors.push('README asset counts are stale');
if (!read('CHANGELOG.md').includes(`## ${pkg.version} —`)) errors.push('CHANGELOG lacks current version');
if (!read('OPERATING_STATUS.md').includes(`版本：\`${pkg.version}\``)) errors.push('operating status version is stale');
const queuePath = path.join(root, 'inventory/candidates/queue.json');
if (!fs.existsSync(queuePath) || fs.readFileSync(queuePath, 'utf8') !== queueText(root)) errors.push('candidate queue differs from source audit');
for (const [relative, expected] of Object.entries(generatedTexts(root))) {
  if (!fs.existsSync(path.join(root, relative)) || read(relative) !== expected) errors.push(`${relative}: generated governance artifact is stale`);
}

for (const [relative, expected] of Object.entries(generatedReviewTexts(root))) {
  if (!fs.existsSync(path.join(root, relative)) || read(relative) !== expected) errors.push(`${relative}: generated review artifact is stale`);
}
if (errors.length) {
  console.error(`Governance drift detected (${errors.length}):\n${errors.map(item => `- ${item}`).join('\n')}`);
  process.exitCode = 1;
} else console.log('Governance drift check passed.');
