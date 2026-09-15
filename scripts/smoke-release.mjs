import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const release = JSON.parse(fs.readFileSync(path.join(root, 'dist/release.json'), 'utf8'));
const skills = JSON.parse(fs.readFileSync(path.join(root, 'registry/skills.yaml'), 'utf8')).skills;
const plugins = JSON.parse(fs.readFileSync(path.join(root, 'registry/plugins.yaml'), 'utf8')).plugins;
const tarball = path.join(root, 'dist', release.filename);
const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'zeve-release-smoke-'));
try {
  const run = (command, args, cwd = root) => {
    const result = spawnSync(command, args, {
      cwd,
      encoding: 'utf8',
      shell: false,
      env: { ...process.env, npm_config_cache: path.join(temp, 'npm-cache') }
    });
    if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  const npmCommand = process.env.npm_execpath ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
  const npmPrefix = process.env.npm_execpath ? [process.env.npm_execpath] : [];
  run(npmCommand, [...npmPrefix, 'init', '-y'], temp);
  run(npmCommand, [...npmPrefix, 'install', tarball], temp);
  const bin = path.join(temp, 'node_modules', 'zeve-os-skill-marketplace', 'scripts', 'marketplace-cli.mjs');
  run(process.execPath, [bin, 'verify'], temp);
  const target = path.join(temp, 'installed-skills');
  for (const plugin of plugins) {
    run(process.execPath, [bin, 'install', plugin.id, '--target', target], temp);
  }
  const skillFiles = fs.readdirSync(target, { withFileTypes: true }).filter(item => item.isDirectory()).length;
  if (skillFiles !== skills.length) throw new Error(`expected ${skills.length} installed skill directories, got ${skillFiles}`);
  console.log(`Release smoke test passed: packaged CLI verified, ${plugins.length} plugins installed, ${skillFiles} unique skills present.`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
