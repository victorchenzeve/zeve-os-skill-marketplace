import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

export const excludedDirectories = ['node_modules', '.git', '.venv', 'venv', '.tools', 'browser'];
export const normalize = value => path.resolve(value).replaceAll('\\', '/').toLowerCase();
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');

export function findSkillsWithoutRipgrep(root) {
  const files = [];
  const errors = [];
  const walk = directory => {
    let entries;
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); }
    catch (error) { errors.push(`${directory}: ${error.code ?? error.message}`); return; }
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!excludedDirectories.includes(entry.name)) walk(target);
      } else if (entry.isFile() && entry.name === 'SKILL.md') files.push(target);
    }
  };
  walk(root);
  return { status: errors.length ? 'partial' : 'scanned', files: files.sort(), errors };
}

export function findSkills(root) {
  if (!fs.existsSync(root)) return { status: 'missing', files: [], errors: [] };
  const args = ['--files', '--hidden', '--no-ignore', root, '-g', 'SKILL.md'];
  for (const directory of excludedDirectories) args.push('-g', `!**/${directory}/**`);
  const result = spawnSync('rg', args, { encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.error?.code === 'ENOENT') return findSkillsWithoutRipgrep(root);
  if (result.error) throw result.error;
  return {
    status: result.status === 0 || result.status === 1 ? 'scanned' : 'partial',
    files: result.stdout.split(/\r?\n/).filter(Boolean).sort(),
    errors: result.stderr.trim() ? result.stderr.trim().split(/\r?\n/) : [],
  };
}

export function listRuntimeSkills(cwds, executable = 'codex') {
  return new Promise(resolve => {
    const child = spawn(executable, ['app-server', '--listen', 'stdio://'], {
      stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
    });
    let done = false;
    const finish = value => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      child.stdin.destroy();
      lines.close();
      child.kill();
      resolve(value);
    };
    const timeout = setTimeout(() => finish({ status: 'unavailable', reason: 'skills/list timed out after 45 seconds' }), 45000);
    const lines = readline.createInterface({ input: child.stdout });
    // Startup logs may contain local configuration; drain without recording them.
    child.stderr.on('data', () => {});
    child.on('error', error => finish({ status: 'unavailable', reason: error.message }));
    child.stdin.on('error', error => finish({ status: 'unavailable', reason: error.message }));
    child.on('exit', code => finish({ status: 'unavailable', reason: `app-server exited (${code})` }));
    lines.on('line', line => {
      let message;
      try { message = JSON.parse(line); } catch { return; }
      if (message.error && (message.id === 1 || message.id === 2)) {
        finish({ status: 'unavailable', reason: JSON.stringify(message.error) });
      } else if (message.id === 1) {
        child.stdin.write(`${JSON.stringify({ method: 'initialized', params: {} })}\n`);
        child.stdin.write(`${JSON.stringify({ id: 2, method: 'skills/list', params: { cwds, forceReload: true } })}\n`);
      } else if (message.id === 2) finish({ status: 'available', result: message.result });
    });
    child.stdin.write(`${JSON.stringify({ id: 1, method: 'initialize', params: {
      clientInfo: { name: 'zewei-inventory-readonly', version: '0.1.0' },
      capabilities: { experimentalApi: true },
    } })}\n`);
  });
}

export async function discover({ repo, extraRoots = [], cwds = [repo], runtime = true }) {
  const home = os.homedir();
  const codexRoot = process.env.CODEX_HOME || path.join(home, '.codex');
  const roots = [
    { id: 'codex-skills', path: path.join(codexRoot, 'skills'), alias: '%CODEX_HOME%/skills', kind: 'installed-location' },
    { id: 'plugin-cache', path: path.join(codexRoot, 'plugins'), alias: '%CODEX_HOME%/plugins', kind: 'plugin-cache' },
    { id: 'vendor-catalog', path: path.join(codexRoot, 'vendor_imports'), alias: '%CODEX_HOME%/vendor_imports', kind: 'external-source' },
    { id: 'user-agents', path: path.join(home, '.agents', 'skills'), alias: '%USERPROFILE%/.agents/skills', kind: 'installed-location' },
    { id: 'documents', path: path.join(home, 'Documents'), alias: '%USERPROFILE%/Documents', kind: 'local-source' },
    { id: 'desktop', path: path.join(home, 'Desktop'), alias: '%USERPROFILE%/Desktop', kind: 'local-source' },
    { id: 'downloads', path: path.join(home, 'Downloads'), alias: '%USERPROFILE%/Downloads', kind: 'external-source' },
    ...extraRoots.map((root, index) => ({ id: `extra-${index + 1}`, path: root, alias: `%EXTRA_ROOT_${index + 1}%`, kind: 'local-source' })),
  ];
  const startedAt = new Date().toISOString();
  const byPath = new Map();
  const scopes = roots.map(root => {
    const found = findSkills(root.path);
    for (const file of found.files) {
      const key = normalize(file);
      if (byPath.has(key)) { byPath.get(key).roots.push(root.id); continue; }
      try {
        const bytes = fs.readFileSync(file);
        byPath.set(key, { path: file, root: root.id, roots: [root.id], kind: root.kind,
          alias: `${root.alias}/${path.relative(root.path, file).replaceAll('\\', '/')}`,
          sha256: hash(bytes), bytes: bytes.length, modifiedAt: fs.statSync(file).mtime.toISOString() });
      } catch (error) { found.errors.push(`${file}: ${error.code}`); found.status = 'partial'; }
    }
    return { ...root, ...found, files: undefined, count: found.files.length };
  });
  const validCwds = [...new Set(cwds.filter(cwd => fs.existsSync(cwd)))];
  // Include discovered project-level .agents/skills roots when querying visibility.
  for (const record of byPath.values()) {
    const portable = record.path.replaceAll('\\', '/');
    const marker = portable.indexOf('/.agents/skills/');
    // Package caches may ship example .agents/skills trees. Query only project-like
    // locations; treating AppData or Codex temp caches as project scopes inflates
    // the "installed" result with examples that the user never activated.
    if (marker >= 0 && !/\/(?:AppData|\.codex)\//i.test(portable)) {
      const cwd = portable.slice(0, marker);
      if (!validCwds.some(existing => normalize(existing) === normalize(cwd))) validCwds.push(cwd);
    }
  }
  const runtimeResult = runtime ? await listRuntimeSkills(validCwds) : { status: 'not-requested' };
  const files = [...byPath.values()];
  const changedDuringScan = [];
  for (const record of files) {
    try { if (hash(fs.readFileSync(record.path)) !== record.sha256) changedDuringScan.push(record.alias); }
    catch { changedDuringScan.push(record.alias); }
  }
  return { startedAt, finishedAt: new Date().toISOString(), roots: scopes, files,
    cwds: validCwds, runtime: runtimeResult, changedDuringScan };
}

if (process.argv[1] && normalize(process.argv[1]) === normalize(fileURLToPath(import.meta.url))) {
  const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const extraRoots = process.argv.slice(2);
  const result = await discover({ repo, extraRoots, cwds: [repo, path.join(os.homedir(), 'Documents', 'SKILL')] });
  const output = path.join(repo, '.tmp', 'skill-discovery.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ files: result.files.length, roots: result.roots.map(({ id, status, count }) => ({ id, status, count })),
    runtime: result.runtime.status, runtimeContexts: result.runtime.result?.data?.map(item => ({ count: item.skills?.length, errors: item.errors?.length })),
    changedDuringScan: result.changedDuringScan.length }, null, 2));
}
