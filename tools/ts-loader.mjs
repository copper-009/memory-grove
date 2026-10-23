/**
 * Minimal Node loader hook that lets this project's build scripts import .ts files
 * directly, stripping types with esbuild (already a devDependency) and resolving bare
 * relative specifiers (./foo, ./foo/) the way TypeScript's bundler resolution does.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, statSync } from 'node:fs';

function tryResolve(url) {
  const path = fileURLToPath(url);
  const candidates = [path, `${path}.ts`, `${path}/index.ts`];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return pathToFileURL(c).href;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL) {
    const base = new URL(specifier, context.parentURL);
    const hit = tryResolve(base);
    if (hit) return { url: hit, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts')) {
    const { transformSync } = await import('esbuild');
    const source = await readFile(fileURLToPath(url), 'utf8');
    const { code } = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022', sourcefile: url });
    return { format: 'module', source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
