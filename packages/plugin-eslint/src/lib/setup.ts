import { ESLint } from 'eslint';
import type { ESLintTarget } from './config';

export function setupESLint(eslintrc: ESLintTarget['eslintrc']) {
  return new ESLint({
    ...(typeof eslintrc === 'string' && { overrideConfigFile: eslintrc }),
    ...(typeof eslintrc === 'object' && {
      baseConfig: eslintrc,
      useEslintrc: false,
    }),
    errorOnUnmatchedPattern: false,
  });
}
