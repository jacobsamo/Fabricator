import { chmod, copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const websiteRoot = resolve(scriptDir, '..');
const repoRoot = resolve(websiteRoot, '..', '..');
const publicDir = resolve(websiteRoot, 'public');

const scripts = ['install.sh', 'update.sh', 'uninstall.sh'];

await mkdir(publicDir, { recursive: true });

for (const script of scripts) {
  const source = resolve(repoRoot, 'tools', script);
  const target = resolve(publicDir, script);

  await copyFile(source, target);
  await chmod(target, 0o644);
  console.log(`Synced ${script} to public/${script}`);
}
