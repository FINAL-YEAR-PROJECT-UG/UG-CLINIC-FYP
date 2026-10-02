/**
 * Custom ESM loader for the Node.js test runner.
 *
 * Resolves TypeScript path aliases (e.g. @/lib/foo) to their
 * actual filesystem paths so that `node --test` can import route
 * handlers that use @/ aliases without requiring webpack or ts-jest.
 *
 * Used via: node --import ./test/setup/alias-loader.mjs --test …
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcRoot = path.resolve(__dirname, '../../src');

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2);
    const candidates = [
      path.join(srcRoot, relativePath),
      path.join(srcRoot, relativePath + '.ts'),
      path.join(srcRoot, relativePath + '.tsx'),
      path.join(srcRoot, relativePath + '.js'),
      path.join(srcRoot, relativePath + '.jsx'),
      path.join(srcRoot, relativePath, 'index.ts'),
      path.join(srcRoot, relativePath, 'index.tsx'),
      path.join(srcRoot, relativePath, 'index.js'),
      path.join(srcRoot, relativePath, 'index.jsx'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
