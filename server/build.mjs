// esbuild build script for the server.
// Bundles local packages (trackmanager-shared) into the output while
// keeping real npm dependencies external (they are installed on the server).
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Mark all npm dependencies as external EXCEPT local file: packages (trackmanager-shared).
// This means trackmanager-shared gets bundled into the output.
const external = [
  ...Object.entries(pkg.dependencies ?? {})
    .filter(([, v]) => !v.startsWith('file:'))
    .map(([k]) => k),
  ...Object.keys(pkg.devDependencies ?? {}),
];

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  outfile: 'dist/src/index.js',
  external,
  sourcemap: true,
});

console.log('Build complete → dist/src/index.js');

// Write a deployment-ready package.json into dist/ that:
//   - strips devDependencies
//   - removes local file: dependencies (they are bundled into the output)
//   - sets the entry point
const deployPkg = {
  name: pkg.name,
  version: pkg.version,
  type: pkg.type,
  engines: pkg.engines,
  scripts: { start: 'node src/index.js' },
  dependencies: Object.fromEntries(
    Object.entries(pkg.dependencies ?? {}).filter(([, v]) => !v.startsWith('file:'))
  ),
};

mkdirSync('dist', { recursive: true });
writeFileSync('dist/package.json', JSON.stringify(deployPkg, null, 2) + '\n');
console.log('Deploy manifest → dist/package.json');
console.log('On the target server run: cd dist && npm install --omit=dev');
