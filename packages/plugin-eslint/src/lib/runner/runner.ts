import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  PluginArtifactOptions,
  RunnerFunction,
} from '@code-pushup/models';
import {
  asyncSequential,
  logger,
  pluralizeToken,
  roundDecimals,
} from '@code-pushup/utils';
import type { ESLintPluginRunnerConfig, ESLintTarget } from '../config.js';
import { lint } from './lint.js';
import { aggregateLintResultsStats } from './stats.js';
import { lintResultsToAudits, mergeLinterOutputs } from './transform.js';
import { loadArtifacts } from './utils.js';

export function createRunnerFunction(options: {
  audits: Audit[];
  targets: ESLintTarget[];
  artifacts?: PluginArtifactOptions;
}): RunnerFunction {
  const { audits, targets, artifacts } = options;
  const config: ESLintPluginRunnerConfig = {
    targets,
    slugs: audits.map(audit => audit.slug),
  };

  return async (): Promise<AuditOutputs> => {
    logger.info(
      `ESLint plugin executing ${pluralizeToken('lint target', targets.length)}`,
    );

    const linterOutputs = artifacts
      ? await loadArtifacts(artifacts)
      : await asyncSequential(targets, lint);

    const lintResults = mergeLinterOutputs(linterOutputs);
    const failedAudits = lintResultsToAudits(lintResults);

    const stats = aggregateLintResultsStats(lintResults.results);
    logger.info(
      stats.problemsCount === 0
        ? 'ESLint did not find any problems'
        : `ESLint found ${pluralizeToken('problem', stats.problemsCount)} from ${pluralizeToken('rule', stats.failedRulesCount)} across ${pluralizeToken('file', stats.failedFilesCount)}`,
    );

    const totalCount = config.slugs.length;
    const failedCount = failedAudits.length;
    const passedCount = totalCount - failedCount;
    const percentage = roundDecimals((passedCount / totalCount) * 100, 2);
    logger.info(
      `${pluralizeToken('audit', passedCount)} passed, ${pluralizeToken('audit', failedCount)} failed (${percentage}% success)`,
    );

    return config.slugs.map(
      (slug): AuditOutput =>
        failedAudits.find(audit => audit.slug === slug) ?? {
          slug,
          score: 1,
          value: 0,
          displayValue: 'passed',
          details: { issues: [] },
        },
    );
  };
}
