import path from 'node:path';
import * as process from 'node:process';
import stylelint, { type LinterOptions, getConfigForFile } from 'stylelint';
import type { NormalizedStyleLintConfig } from './model.js';

export function getNormalizedConfigForFile(
  options: LinterOptions,
): NormalizedStyleLintConfig {
  const _linter = stylelint._createLinter(options);
  const configFile =
    options.configFile ??
    path.join(options?.cwd ?? process.cwd(), '.stylelintrc.json');
  return getConfigForFile(_linter, configFile);
}
