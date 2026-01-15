/**
 * Bundle the backend server for Electron production builds.
 * Creates a single JavaScript file with all dependencies bundled.
 */

import * as esbuild from 'esbuild';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function bundleBackend() {
  console.log('Bundling backend server...');

  try {
    const result = await esbuild.build({
      entryPoints: [join(rootDir, 'src/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: join(rootDir, 'dist/server-bundle.mjs'),
      sourcemap: true,
      minify: true,
      // Mark node built-ins and native modules as external
      external: [
        'fsevents',
        'node-pty',
        // Node built-ins that might cause issues if bundled
        'fs/promises',
      ],
      // Handle __dirname and __filename in ESM
      banner: {
        js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`,
      },
      // Log what's being bundled
      metafile: true,
      logLevel: 'info',
    });

    // Report bundle size
    const outputs = Object.entries(result.metafile.outputs);
    for (const [file, info] of outputs) {
      if (file.endsWith('.mjs')) {
        console.log(`Bundle size: ${(info.bytes / 1024 / 1024).toFixed(2)} MB`);
      }
    }

    console.log('Backend bundled successfully!');
  } catch (error) {
    console.error('Bundle failed:', error);
    process.exit(1);
  }
}

bundleBackend();
