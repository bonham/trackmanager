// esbuild build script for the server.
// Bundles local packages (trackmanager-shared) into the output while
// keeping real npm dependencies external (they are installed on the server).
import { build } from 'esbuild';
import { readFileSync } from 'fs';

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
  target: 'node22',
  format: 'esm',
  outfile: 'dist/src/index.js',
  external,
  sourcemap: true,
});

console.log('Build complete → dist/src/index.js');
