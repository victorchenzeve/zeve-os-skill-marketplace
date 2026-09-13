import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const relative = path.relative(root, dist);
if (relative !== 'dist') throw new Error('Unexpected release directory');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const npmScript = process.env.npm_execpath;
const command = npmScript ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const args = npmScript
  ? [npmScript, 'pack', '--ignore-scripts', '--pack-destination', dist, '--json']
  : ['pack', '--ignore-scripts', '--pack-destination', dist, '--json'];
const result = spawnSync(command, args, {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
  env: { ...process.env, npm_config_cache: path.join(root, '.tmp', 'npm-cache') },
});
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || `npm pack failed (${result.status})`);
const metadata = JSON.parse(result.stdout)[0];
const tarball = path.join(dist, metadata.filename);
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(tarball)).digest('hex');
fs.writeFileSync(path.join(dist, 'SHA256SUMS'), `${sha256}  ${metadata.filename}\n`);
fs.writeFileSync(path.join(dist, 'release.json'), `${JSON.stringify({
  name: metadata.name,
  version: metadata.version,
  filename: metadata.filename,
  size: metadata.size,
  unpackedSize: metadata.unpackedSize,
  sha256,
}, null, 2)}\n`);
console.log(JSON.stringify({ tarball, sha256, size: metadata.size }, null, 2));
