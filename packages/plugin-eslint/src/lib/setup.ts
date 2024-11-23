import { ESLint } from 'eslint';
import type { ESLintTarget } from './config';

export async function setupESLint(eslintrc: ESLintTarget['eslintrc']) {
  const eslintConstructor = await loadESLint();
  return new eslintConstructor({
    overrideConfigFile: eslintrc,
    errorOnUnmatchedPattern: false,
  });
}

async function loadESLint() {
  const eslint = await import('eslint');
  // loadESLint added to public API in v9, selects ESLint or LegacyESLint based on environment
  if ('loadESLint' in eslint && typeof eslint.loadESLint === 'function') {
    return (await eslint.loadESLint()) as typeof ESLint;
  }
  return ESLint;
}
