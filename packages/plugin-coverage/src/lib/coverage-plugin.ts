import { join } from 'node:path';
import type {
  Audit,
  Group,
  PluginConfig,
  RunnerConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { capitalize, pluginWorkDir } from '@code-pushup/utils';
import { name, version } from '../../package.json';
import { CoveragePluginConfig, coveragePluginConfigSchema } from './config';
import { lcovResultsToAuditOutputs } from './runner/lcov/runner';
import { applyMaxScoreAboveThreshold, coverageDescription } from './utils';

export const RUNNER_OUTPUT_PATH = join(
  pluginWorkDir('coverage'),
  'runner-output.json',
);

/**
 * Instantiates Code PushUp code coverage plugin for core config.
 *
 * @example
 * import coveragePlugin from '@code-pushup/coverage-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     await coveragePlugin({
 *       reports: [{ resultsPath: 'coverage/cli/lcov.info', pathToProject: 'packages/cli' }]
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export function coveragePlugin(config: CoveragePluginConfig): PluginConfig {
  const { reports, perfectScoreThreshold, coverageTypes, coverageToolCommand } =
    coveragePluginConfigSchema.parse(config);

  const audits = coverageTypes.map(
    (type): Audit => ({
      slug: `${type}-coverage`,
      title: `${capitalize(type)} coverage`,
      description: coverageDescription[type],
    }),
  );

  const group: Group = {
    slug: 'coverage',
    title: 'Code coverage metrics',
    description: 'Group containing all defined coverage types as audits.',
    refs: audits.map(audit => ({ ...audit, weight: 1 })),
  };

  const getAuditOutputs = async () =>
    perfectScoreThreshold
      ? applyMaxScoreAboveThreshold(
          await lcovResultsToAuditOutputs(reports, coverageTypes),
          perfectScoreThreshold,
        )
      : await lcovResultsToAuditOutputs(reports, coverageTypes);

  // if coverage results are provided, only convert them to AuditOutputs
  // if not, run coverage command and then run result conversion
  const runner: RunnerConfig | RunnerFunction =
    coverageToolCommand == null
      ? getAuditOutputs
      : {
          command: coverageToolCommand.command,
          args: coverageToolCommand.args,
          outputFile: RUNNER_OUTPUT_PATH,
          outputTransform: getAuditOutputs,
        };

  return {
    slug: 'coverage',
    title: 'Code coverage',
    icon: 'folder-coverage-open',
    description: 'Official Code PushUp code coverage plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/coverage-plugin/',
    packageName: name,
    version,
    audits,
    groups: [group],
    runner,
  };
}
