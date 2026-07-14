import { copyFileSync, existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const apiDir = resolve(scriptDir, '..');
const repoRoot = resolve(apiDir, '..', '..');
const sharedDir = resolve(repoRoot, 'packages', 'shared');
const sharedDist = resolve(sharedDir, 'dist');
const apiNodeModules = resolve(apiDir, 'node_modules');
const sharedLink = resolve(apiNodeModules, '@health-tracker', 'shared');

// The shared package must be compiled before the API can resolve its types
// and runtime exports, regardless of whether the build runs from the repo
// root (npm workspaces) or from apps/api (e.g. a misconfigured Root Directory).
if (!existsSync(sharedDist)) {
  console.log('[setup-shared] Building @health-tracker/shared...');
  execSync('npm run build', { cwd: sharedDir, stdio: 'inherit' });
}

// Guarantee the API can resolve the package at runtime even when npm workspaces
// did not create the symlink (build executed inside apps/api).
  if (!existsSync(sharedLink)) {
    mkdirSync(dirname(sharedLink), { recursive: true });
    try {
      symlinkSync(sharedDir, sharedLink, process.platform === 'win32' ? 'junction' : 'dir');
      console.log(`[setup-shared] Linked ${sharedLink} -> ${sharedDir}`);
    } catch (err) {
      console.warn(`[setup-shared] Could not link @health-tracker/shared: ${err}`);
    }
  }

  // tsc does not emit .sql files, so copy the schema into dist for runtime migrations.
  const schemaSrc = resolve(apiDir, 'src', 'db', 'schema.sql');
  const schemaDestDir = resolve(apiDir, 'dist', 'db');
  const schemaDest = resolve(schemaDestDir, 'schema.sql');
  if (existsSync(schemaSrc) && !existsSync(schemaDest)) {
    mkdirSync(schemaDestDir, { recursive: true });
    copyFileSync(schemaSrc, schemaDest);
    console.log(`[setup-shared] Copied schema.sql -> ${schemaDest}`);
  }

