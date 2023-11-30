import { ESLint } from 'eslint';
import { ESLintPluginConfig } from './config';

export function setupESLint(eslintrc: ESLintPluginConfig['eslintrc']) {
  return new ESLint({
    ...(typeof eslintrc === 'string'
      ? { overrideConfigFile: eslintrc }
      : { baseConfig: eslintrc }),
    useEslintrc: false,
    errorOnUnmatchedPattern: false,
  });
}
