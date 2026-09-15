import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const kinds = ['skills', 'plugins', 'agents', 'dependencies'];
const singular = { skills: 'skill', plugins: 'plugin', agents: 'agent' };

// Deliberately limited to the keywords used by schemas/; fail on unknown rules.
export function validateSchema(value, schema, label, errors) {
  const supported = new Set(['$schema', 'title', 'type', 'required', 'properties',
    'additionalProperties', 'items', 'uniqueItems', 'minLength', 'pattern', 'enum', 'const']);
  for (const key of Object.keys(schema)) {
    if (!supported.has(key)) errors.push(`${label}: unsupported schema keyword ${key}`);
  }
  if ('const' in schema && value !== schema.const) errors.push(`${label}: expected ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${label}: invalid enum value`);
  if (schema.type) {
    const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    if (actual !== schema.type) {
      errors.push(`${label}: expected ${schema.type}, got ${actual}`);
      return;
    }
  }
  if (typeof value === 'string') {
    if (schema.minLength && [...value].length < schema.minLength) errors.push(`${label}: empty string`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${label}: invalid format`);
  }
  if (Array.isArray(value)) {
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) {
      errors.push(`${label}: duplicate array item`);
    }
    if (schema.items) value.forEach((item, i) => validateSchema(item, schema.items, `${label}[${i}]`, errors));
  } else if (value && typeof value === 'object') {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${label}: missing ${key}`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (Object.hasOwn(schema.properties ?? {}, key)) {
        validateSchema(item, schema.properties[key], `${label}.${key}`, errors);
      } else if (schema.additionalProperties === false) errors.push(`${label}: unknown field ${key}`);
    }
  }
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function resolveAsset(root, value, expectedType, errors) {
  if (value.includes('\\') || value.includes(':') || value.startsWith('/') ||
      value.split('/').some(part => part === '..' || part === '.' || part === '')) {
    errors.push(`${value}: unsafe relative path`);
    return null;
  }
  const target = path.resolve(root, value);
  try {
    if (!inside(fs.realpathSync(root), fs.realpathSync(target))) {
      errors.push(`${value}: path escapes repository`);
      return null;
    }
    const stat = fs.statSync(target);
    if (expectedType === 'directory' ? !stat.isDirectory() : !stat.isFile()) {
      errors.push(`${value}: expected ${expectedType}`);
      return null;
    }
    return target;
  } catch (error) {
    errors.push(`${value}: missing or unreadable path (${error.code ?? error.message})`);
    return null;
  }
}

function validateSkillFile(content, entry, key, errors) {
  const match = content.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`${key}: invalid SKILL.md frontmatter`);
    return;
  }
  const allowed = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (!item) continue;
    fields[item[1]] = item[2].trim().replace(/^['"]|['"]$/g, '');
    if (!allowed.has(item[1])) errors.push(`${key}: unexpected SKILL.md frontmatter key ${item[1]}`);
  }
  if (fields.name !== entry.id) errors.push(`${key}: SKILL.md name differs from Registry`);
  if (!fields.description) errors.push(`${key}: SKILL.md description is missing`);
  else {
    if (fields.description.includes('<') || fields.description.includes('>')) errors.push(`${key}: SKILL.md description contains angle brackets`);
    if ([...fields.description].length > 1024) errors.push(`${key}: SKILL.md description exceeds 1024 characters`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.name ?? '') || [...(fields.name ?? '')].length > 64) errors.push(`${key}: invalid SKILL.md name`);
  if (/(^|\n)[ ]{0,3}\[TODO:[^\n]*\][ \t]*(\n|$)/.test(content.slice(match[0].length))) errors.push(`${key}: unfinished SKILL.md TODO`);
}
export function validateRepository(root = defaultRoot) {
  const errors = [];
  const registry = {};
  const schemas = {};
  for (const kind of [...kinds, 'plugin-manifest']) {
    try {
      schemas[kind] = JSON.parse(fs.readFileSync(path.join(root, 'schemas', `${kind}.schema.json`), 'utf8'));
      if (kind === 'plugin-manifest') continue;
      registry[kind] = JSON.parse(fs.readFileSync(path.join(root, 'registry', `${kind}.yaml`), 'utf8'));
      validateSchema(registry[kind], schemas[kind], `${kind}.yaml`, errors);
    } catch (error) {
      errors.push(`${kind}: cannot read JSON-compatible YAML/schema (${error.message})`);
    }
  }
  if (errors.length) return errors;

  const assets = new Map();
  const graph = new Map();
  const paths = new Set();
  for (const kind of ['skills', 'plugins', 'agents']) {
    for (const entry of registry[kind][kind]) {
      const key = `${singular[kind]}:${entry.id}`;
      if (/zewei/i.test(entry.id)) errors.push(`${key}: legacy zewei prefix is forbidden; use zeve`);
      if (assets.has(key)) errors.push(`${key}: duplicate id`);
      assets.set(key, entry);
      graph.set(key, new Set());
      const normalized = entry.path.toLowerCase();
      if (paths.has(normalized)) errors.push(`${key}: duplicate asset path ${entry.path}`);
      paths.add(normalized);
      if (kind === 'skills' && entry.path !== `skills/${entry.category}/${entry.id}`) {
        errors.push(`${key}: path must match skills/category/id`);
      }
      if (kind === 'plugins' && entry.path !== `plugins/${entry.id}`) {
        errors.push(`${key}: path must match plugins/id`);
      }
      const target = resolveAsset(root, entry.path, kind === 'agents' ? 'file' : 'directory', errors);
      resolveAsset(root, entry.evaluation.evidencePath, 'file', errors);
      if (!target) continue;
      if (kind === 'skills') {
        const skillPath = resolveAsset(root, `${entry.path}/SKILL.md`, 'file', errors);
        if (skillPath) {
          const content = fs.readFileSync(skillPath, 'utf8');
          validateSkillFile(content, entry, key, errors);
          const declaredLicense = content.match(/^license:\s*(.+)$/m)?.[1]?.trim();
          if (declaredLicense !== entry.license) errors.push(`${key}: SKILL.md license differs from Registry`);
        }
        if (entry.maturity === 'stable' && !['repository-passed', 'real-world-passed'].includes(entry.evaluation.status)) {
          errors.push(`${key}: stable maturity requires repository or real-world evidence`);
        }
      }
      if (kind === 'plugins') {
        const manifestPath = resolveAsset(root, `${entry.path}/plugin.json`, 'file', errors);
        if (!manifestPath) continue;
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const before = errors.length;
          validateSchema(manifest, schemas['plugin-manifest'], `${key}/plugin.json`, errors);
          if (errors.length !== before) continue;
          for (const field of ['id', 'name', 'description', 'version']) {
            if (manifest[field] !== entry[field]) errors.push(`${key}: manifest ${field} mismatch`);
          }
          if (JSON.stringify([...manifest.skills].sort()) !== JSON.stringify([...entry.skills].sort())) {
            errors.push(`${key}: manifest skills mismatch`);
          }
        } catch (error) { errors.push(`${key}: invalid plugin.json (${error.message})`); }
      }
    }
  }

  function addEdge(from, to) {
    if (!assets.has(from)) errors.push(`${from}: unregistered dependency source`);
    if (!assets.has(to)) errors.push(`${to}: unregistered dependency target`);
    if (from === to) errors.push(`${from}: self dependency`);
    if (assets.has(from) && assets.has(to)) graph.get(from).add(to);
  }
  for (const kind of ['plugins', 'agents']) {
    for (const entry of registry[kind][kind]) {
      for (const skill of entry.skills) addEdge(`${singular[kind]}:${entry.id}`, `skill:${skill}`);
    }
  }
  const edges = new Set();
  for (const { from, to } of registry.dependencies.dependencies) {
    const key = `${from} -> ${to}`;
    if (edges.has(key)) errors.push(`${key}: duplicate dependency`);
    edges.add(key);
    addEdge(from, to);
  }

  const visited = new Set();
  const visiting = new Set();
  function visit(key, trail) {
    if (visiting.has(key)) {
      errors.push(`dependency cycle: ${[...trail, key].join(' -> ')}`);
      return;
    }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const next of graph.get(key)) visit(next, [...trail, key]);
    visiting.delete(key);
    visited.add(key);
  }
  for (const key of graph.keys()) visit(key, []);
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateRepository(process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot);
  if (errors.length) {
    console.error(`Validation failed (${errors.length}):\n${errors.map(item => `- ${item}`).join('\n')}`);
    process.exitCode = 1;
  } else console.log('Registry validation passed.');
}
