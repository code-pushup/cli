import path from 'node:path';
import * as process from 'node:process';
// @ts-expect-error missing types for stylelint package after postinstall patch
import stylelint, { getConfigForFile } from 'stylelint';
import type { StyleLintTarget } from '../config.js';
import type { NormalizedStyleLintConfig } from './model.js';

export function getNormalizedConfigForFile({
  stylelintrc,
  cwd,
}: Required<Pick<StyleLintTarget, 'stylelintrc'>> & {
  cwd?: string;
}): NormalizedStyleLintConfig {
  const _linter = stylelint._createLinter({ configFile: stylelintrc });
  const configFile =
    stylelintrc ?? path.join(cwd ?? process.cwd(), '.stylelintrc.json');
  return getConfigForFile(_linter, configFile);
}
