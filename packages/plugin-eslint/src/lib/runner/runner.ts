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
  profiler,
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

  return (): Promise<AuditOutputs> =>
    profiler.measureAsync(
      'plugin-eslint:runner',
      async (): Promise<AuditOutputs> => {
        logger.info(
          `ESLint plugin executing ${pluralizeToken('lint target', targets.length)}`,
        );

        const linterOutputs = artifacts
          ? await loadArtifacts(artifacts)
          : await profiler.measureAsync(
              'plugin-eslint:sequential-linting',
              () => asyncSequential(targets, lint),
              {
                ...profiler.measureConfig.tracks.utils,
                color: 'primary-light',
                success: (
                  outputs: Awaited<ReturnType<typeof asyncSequential>>,
                ) => ({
                  properties: [
                    ['Targets', String(targets.length)],
                    ['Outputs', String(outputs.length)],
                  ],
                  tooltipText: `Executed sequential linting on ${targets.length} targets, produced ${outputs.length} outputs`,
                }),
              },
            );

        const lintResults = mergeLinterOutputs(linterOutputs);
        const failedAudits = profiler.measure(
          'plugin-eslint:results-transformation',
          () => lintResultsToAudits(lintResults),
          {
            ...profiler.measureConfig.tracks.pluginEslint,
            color: 'secondary-light',
            success: (audits: ReturnType<typeof lintResultsToAudits>) => ({
              properties: [
                ['Results', String(lintResults.results.length)],
                ['Failed Audits', String(audits.length)],
              ],
              tooltipText: `Transformed ${lintResults.results.length} lint results into ${audits.length} failed audits`,
            }),
          },
        );

        const stats = profiler.measure(
          'plugin-eslint:stats-aggregation',
          () => aggregateLintResultsStats(lintResults.results),
          {
            ...profiler.measureConfig.tracks.pluginEslint,
            color: 'secondary-light',
            success: (stats: ReturnType<typeof aggregateLintResultsStats>) => ({
              properties: [
                ['Files', String(stats.filesCount)],
                ['Problems', String(stats.problemsCount)],
                ['Failed Rules', String(stats.failedRulesCount)],
              ],
              tooltipText: `Aggregated stats from ${stats.filesCount} files with ${stats.problemsCount} problems across ${stats.failedRulesCount} rules`,
            }),
          },
        );
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
      },
      {
        ...profiler.measureConfig.tracks.pluginEslint,
        success: (result: AuditOutputs) => ({
          properties: [
            ['Targets', String(targets.length)],
            ['Audits', String(result.length)],
            [
              'Passed',
              String(result.filter(audit => audit.score === 1).length),
            ],
            ['Failed', String(result.filter(audit => audit.score < 1).length)],
          ],
          tooltipText: `ESLint runner completed ${result.length} audits on ${targets.length} targets`,
        }),
      },
    );
}
