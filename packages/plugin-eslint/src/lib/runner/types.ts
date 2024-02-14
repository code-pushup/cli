import type { ESLint } from 'eslint';

export type LinterOutput = {
  results: ESLint.LintResult[];
  ruleOptionsPerFile: RuleOptionsPerFile;
};

export type RuleOptionsPerFile = {
  [filePath: string]: {
    [ruleId: string]: unknown[];
  };
};
