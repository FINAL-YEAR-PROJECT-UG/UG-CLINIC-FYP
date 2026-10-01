/**
 * Custom ESM loader for the Node.js test runner.
 *
 * Resolves TypeScript path aliases (e.g. @/lib/foo) to their
 * actual filesystem paths so that `node --test` can import route
 * handlers that use @/ aliases without requiring webpack or ts-jest.
 *
 * Used via: node --import ./test/setup/alias-loader.mjs --test …
 */
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// src/ root is two levels up from test/setup/
const srcRoot = path.resolve(__dirname, '../../src');

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2); // strip "@/"
    // Try each extension in order
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '']) {
      const candidate = path.join(srcRoot, relativePath) + ext;
      try {
        return nextResolve(`file://${candidate.replace(/\\/g, '/')}`, context);
      } catch {
        // Try next extension
      }
    }
  }
  return nextResolve(specifier, context);
}
