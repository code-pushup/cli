import { ESLint } from 'eslint';
import type { ESLintTarget } from './config';

export function setupESLint(eslintrc: ESLintTarget['eslintrc']) {
  return new ESLint({
    overrideConfigFile: eslintrc,
    useEslintrc: !eslintrc,
    errorOnUnmatchedPattern: false,
  });
}
