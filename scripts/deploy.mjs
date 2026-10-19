// Builds the site and publishes dist/ to the `gh-pages` branch (GitHub Pages).
// Usage: npm run deploy
// The branch is rebuilt from scratch on every deploy (single commit, force push),
// so it never accumulates history. Source of truth stays on `main`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
const read = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

const root = resolve(import.meta.dirname, '..');
const remote = read('git', ['-C', root, 'remote', 'get-url', 'origin']);
const sha = read('git', ['-C', root, 'rev-parse', '--short', 'HEAD']);

run('npx', ['vite', 'build'], root);
const dist = join(root, 'dist');
writeFileSync(join(dist, '.nojekyll'), '');

const tmp = mkdtempSync(join(tmpdir(), 'doenerbude-pages-'));
try {
  run('git', ['init', '-q', '-b', 'gh-pages'], tmp);
  run('git', ['--work-tree', dist, 'add', '-A'], tmp);
  run('git', ['--work-tree', dist, 'commit', '-q', '-m', `Deploy ${sha}`], tmp);
  run('git', ['push', '-q', '-f', remote, 'gh-pages'], tmp);
  console.log(`Deployed ${sha} to gh-pages`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
