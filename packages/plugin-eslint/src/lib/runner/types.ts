import type { ESLint } from 'eslint';

export type LinterOutput = {
  results: LintResult[];
  ruleOptionsPerFile: RuleOptionsPerFile;
};

export type LintResult = ESLint.LintResult & {
  relativeFilePath: string;
};

export type RuleOptionsPerFile = {
  [filePath: string]: {
    [ruleId: string]: unknown[];
  };
};
