#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateRepository } from './validate.mjs';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const receiptName = '.zeve-os-marketplace.json';
const legacyReceiptName = '.zewei-os-marketplace.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function registry(root = repoRoot) {
  return {
    skills: readJson(path.join(root, 'registry', 'skills.yaml')).skills,
    plugins: readJson(path.join(root, 'registry', 'plugins.yaml')).plugins,
    agents: readJson(path.join(root, 'registry', 'agents.yaml')).agents,
    dependencies: readJson(path.join(root, 'registry', 'dependencies.yaml')).dependencies,
  };
}

function normalize(value) {
  return path.resolve(value).replaceAll('\\', '/').toLowerCase();
}

function assertInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === '' || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Unsafe path outside target root: ${target}`);
  }
}

function filesUnder(root, base = root) {
  if (!fs.existsSync(root)) return [];
  const output = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...filesUnder(target, base));
    else if (entry.isFile()) output.push(path.relative(base, target).replaceAll('\\', '/'));
  }
  return output.sort();
}

export function treeHash(root) {
  const hash = crypto.createHash('sha256');
  for (const relative of filesUnder(root)) {
    hash.update(relative); hash.update('\0'); hash.update(fs.readFileSync(path.join(root, relative))); hash.update('\0');
  }
  return hash.digest('hex');
}

function compareTrees(left, right) {
  const leftFiles = filesUnder(left);
  const rightFiles = filesUnder(right);
  if (JSON.stringify(leftFiles) !== JSON.stringify(rightFiles)) return false;
  return leftFiles.every(file => fs.readFileSync(path.join(left, file)).equals(fs.readFileSync(path.join(right, file))));
}

function skillFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (item) values[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return values;
}

export function syncPluginSkills(root = repoRoot) {
  const data = registry(root);
  const byId = new Map(data.skills.map(skill => [skill.id, skill]));
  const synced = [];
  for (const plugin of data.plugins) {
    const bundleRoot = path.join(root, plugin.path, 'skills');
    assertInside(root, bundleRoot);
    fs.rmSync(bundleRoot, { recursive: true, force: true });
    fs.mkdirSync(bundleRoot, { recursive: true });
    for (const id of plugin.skills) {
      const skill = byId.get(id);
      if (!skill) throw new Error(`Plugin ${plugin.id} references unknown skill ${id}`);
      fs.cpSync(path.join(root, skill.path), path.join(bundleRoot, id), { recursive: true });
    }
    synced.push({ plugin: plugin.id, skills: plugin.skills.length });
  }
  return synced;
}

export function verifyDistribution(root = repoRoot) {
  const errors = [...validateRepository(root)];
  let data;
  try { data = registry(root); } catch (error) { return [...errors, `registry unreadable: ${error.message}`]; }
  const packageJson = readJson(path.join(root, 'package.json'));
  if (packageJson.license !== 'MIT') errors.push('package.json: license must be MIT');
  if (packageJson.bin?.['zeve-skill-marketplace'] !== 'scripts/marketplace-cli.mjs') {
    errors.push('package.json: missing zeve-skill-marketplace bin');
  }
  if (!fs.existsSync(path.join(root, 'LICENSE'))) errors.push('LICENSE is missing');

  const marketplacePath = path.join(root, '.agents', 'plugins', 'marketplace.json');
  let marketplace = null;
  try { marketplace = readJson(marketplacePath); } catch (error) { errors.push(`marketplace unreadable: ${error.message}`); }
  if (marketplace?.name !== 'zeve-os') errors.push('marketplace name must be zeve-os');
  const entries = new Map((marketplace?.plugins ?? []).map(item => [item.name, item]));
  const skillsById = new Map(data.skills.map(skill => [skill.id, skill]));

  for (const skill of data.skills) {
    const folder = path.join(root, skill.path);
    const metadata = skillFrontmatter(path.join(folder, 'SKILL.md'));
    if (!metadata) errors.push(`${skill.id}: invalid SKILL.md frontmatter`);
    else {
      if (metadata.name !== skill.id) errors.push(`${skill.id}: frontmatter name mismatch`);
      if (metadata.license !== 'MIT') errors.push(`${skill.id}: frontmatter license must be MIT`);
    }
    if (!fs.existsSync(path.join(folder, 'agents', 'openai.yaml'))) errors.push(`${skill.id}: agents/openai.yaml is missing`);
    const body = fs.readFileSync(path.join(folder, 'SKILL.md'), 'utf8');
    for (const heading of ['## 触发条件', '## 输入', '## 执行步骤', '## 输出', '## 权限与边界', '## 失败处理', '## 验证方法']) {
      if (!body.includes(heading)) errors.push(`${skill.id}: missing ${heading}`);
    }
  }

  for (const plugin of data.plugins) {
    const entry = entries.get(plugin.id);
    if (!entry) errors.push(`${plugin.id}: missing marketplace entry`);
    else {
      if (entry.source?.path !== `./plugins/${plugin.id}`) errors.push(`${plugin.id}: marketplace source path mismatch`);
      if (entry.policy?.installation !== 'AVAILABLE') errors.push(`${plugin.id}: marketplace installation policy mismatch`);
    }
    const officialPath = path.join(root, plugin.path, '.codex-plugin', 'plugin.json');
    let official = null;
    try { official = readJson(officialPath); } catch (error) { errors.push(`${plugin.id}: official manifest unreadable`); }
    if (official) {
      if (official.name !== plugin.id || official.version !== plugin.version || official.skills !== './skills/') {
        errors.push(`${plugin.id}: official manifest does not match registry`);
      }
    }
    for (const id of plugin.skills) {
      const skill = skillsById.get(id);
      if (!skill) continue;
      const canonical = path.join(root, skill.path);
      const bundled = path.join(root, plugin.path, 'skills', id);
      if (!compareTrees(canonical, bundled)) errors.push(`${plugin.id}: bundled skill ${id} is out of sync`);
    }
  }
  return [...new Set(errors)];
}

function resolveSelection(data, id) {
  const skill = data.skills.find(item => item.id === id);
  if (skill) return { owner: `skill:${id}`, skills: [skill] };
  const plugin = data.plugins.find(item => item.id === id);
  if (plugin) {
    const byId = new Map(data.skills.map(item => [item.id, item]));
    return { owner: `plugin:${id}`, skills: plugin.skills.map(skillId => byId.get(skillId)) };
  }
  throw new Error(`Unknown skill or plugin: ${id}`);
}

function readReceipt(target) {
  let file = path.join(target, receiptName);
  if (!fs.existsSync(file)) {
    const legacy = path.join(target, legacyReceiptName);
    if (!fs.existsSync(legacy)) return { schemaVersion: '1.0.0', skills: {} };
    file = legacy;
  }
  const value = readJson(file);
  if (value.schemaVersion !== '1.0.0' || !value.skills || typeof value.skills !== 'object') {
    throw new Error(`Invalid installation receipt: ${file}`);
  }
  return value;
}

function writeReceipt(target, value) {
  fs.writeFileSync(path.join(target, receiptName), `${JSON.stringify(value, null, 2)}\n`);
  const legacy = path.join(target, legacyReceiptName);
  if (fs.existsSync(legacy)) fs.rmSync(legacy);
}

export function installSelection(id, options = {}) {
  const root = options.root ?? repoRoot;
  const target = path.resolve(options.target ?? path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills'));
  fs.mkdirSync(target, { recursive: true });
  const data = registry(root);
  const selected = resolveSelection(data, id);
  const receipt = readReceipt(target);
  const plans = selected.skills.map(skill => {
    const source = path.join(root, skill.path);
    const destination = path.join(target, skill.id);
    assertInside(target, destination);
    return { skill, source, destination, existing: fs.existsSync(destination), managed: Boolean(receipt.skills[skill.id]) };
  });
  for (const plan of plans) {
    if (plan.existing && !plan.managed && !options.force) {
      throw new Error(`${plan.skill.id} already exists and is not managed by this marketplace; use --force to replace it`);
    }
    if (plan.existing && plan.managed && treeHash(plan.destination) !== receipt.skills[plan.skill.id].sha256 && !options.force) {
      throw new Error(`${plan.skill.id} was modified after installation; use --force to replace it`);
    }
  }
  const installed = [];
  for (const { skill, source, destination, existing } of plans) {
    if (existing) fs.rmSync(destination, { recursive: true, force: true });
    fs.cpSync(source, destination, { recursive: true });
    const owners = new Set(receipt.skills[skill.id]?.owners ?? []); owners.add(selected.owner);
    receipt.skills[skill.id] = { version: skill.version, sha256: treeHash(destination), owners: [...owners].sort() };
    installed.push(skill.id);
  }
  writeReceipt(target, receipt);
  return { target, owner: selected.owner, installed };
}

export function uninstallSelection(id, options = {}) {
  const root = options.root ?? repoRoot;
  const target = path.resolve(options.target ?? path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills'));
  const data = registry(root);
  const selected = resolveSelection(data, id);
  const receipt = readReceipt(target);
  const plans = selected.skills.map(skill => {
    const state = receipt.skills[skill.id];
    const owned = Boolean(state?.owners.includes(selected.owner));
    const owners = owned ? state.owners.filter(owner => owner !== selected.owner) : [];
    const destination = path.join(target, skill.id);
    assertInside(target, destination);
    return { skill, state, owned, owners, destination };
  });
  for (const plan of plans) {
    if (!plan.owned || plan.owners.length || !fs.existsSync(plan.destination)) continue;
    if (treeHash(plan.destination) !== plan.state.sha256 && !options.force) {
      throw new Error(`${plan.skill.id} was modified after installation; refusing to remove it without --force`);
    }
  }
  const removed = [];
  for (const plan of plans) {
    if (!plan.owned) continue;
    if (plan.owners.length) {
      plan.state.owners = plan.owners;
      continue;
    }
    if (fs.existsSync(plan.destination)) fs.rmSync(plan.destination, { recursive: true, force: true });
    delete receipt.skills[plan.skill.id];
    removed.push(plan.skill.id);
  }
  writeReceipt(target, receipt);
  return { target, owner: selected.owner, removed };
}
function flag(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function printList(data, json) {
  if (json) return console.log(JSON.stringify(data, null, 2));
  for (const skill of data.skills) console.log(`skill  ${skill.id.padEnd(40)} ${skill.version}  ${skill.name}`);
  for (const plugin of data.plugins) console.log(`plugin ${plugin.id.padEnd(40)} ${plugin.version}  ${plugin.name}`);
  for (const agent of data.agents) console.log(`agent  ${agent.id.padEnd(40)} ${agent.version}  ${agent.name}`);
}

export function run(argv = process.argv.slice(2)) {
  const [command = 'help', id] = argv;
  const root = repoRoot;
  if (command === 'list') return printList(registry(root), argv.includes('--json'));
  if (command === 'verify') {
    const errors = verifyDistribution(root);
    if (errors.length) throw new Error(`Verification failed (${errors.length}):\n${errors.map(item => `- ${item}`).join('\n')}`);
    console.log('Marketplace verification passed.'); return;
  }
  if (command === 'install' || command === 'uninstall') {
    if (!id) throw new Error(`${command} requires a skill or plugin ID`);
    const options = { root, target: flag(argv, '--target'), force: argv.includes('--force') };
    const result = command === 'install' ? installSelection(id, options) : uninstallSelection(id, options);
    console.log(JSON.stringify(result, null, 2)); return;
  }
  console.log(`Zeve OS Skill Marketplace\n\nCommands:\n  list [--json]\n  verify\n  install <skill-or-plugin-id> [--target <skills-dir>] [--force]\n  uninstall <skill-or-plugin-id> [--target <skills-dir>] [--force]`);
}

if (process.argv[1] && normalize(process.argv[1]) === normalize(fileURLToPath(import.meta.url))) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
