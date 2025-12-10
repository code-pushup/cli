import type { ESLint } from 'eslint';

export type LintResultsStats = {
  problemsCount: number;
  failedFilesCount: number;
  failedRulesCount: number;
};

export function aggregateLintResultsStats(
  results: ESLint.LintResult[],
): LintResultsStats {
  const problemsCount = results.reduce(
    (acc, result) => acc + result.messages.length,
    0,
  );
  const failedFilesCount = results.length;
  const failedRulesCount = new Set(
    results.flatMap(({ messages }) =>
      messages.map(({ ruleId }) => ruleId).filter(Boolean),
    ),
  ).size;
  return { problemsCount, failedFilesCount, failedRulesCount };
}
