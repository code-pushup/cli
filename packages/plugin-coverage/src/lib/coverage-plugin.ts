import { join } from 'node:path';
import type {
  Audit,
  PluginConfig,
  RunnerConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { pluginWorkDir } from '@code-pushup/utils';
import { name, version } from '../../package.json';
import { CoveragePluginConfig, coveragePluginConfigSchema } from './config';
import { lcovResultsToAuditOutputs } from './runner/lcov/runner';
import { applyMaxScoreAboveThreshold } from './utils';

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
 *       coverageType: ['function', 'line'],
 *       reports: ['coverage/cli/lcov.info']
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration as a promise.
 */
export function coveragePlugin(config: CoveragePluginConfig): PluginConfig {
  const { reports, perfectScoreThreshold, coverageType, coverageToolCommand } =
    coveragePluginConfigSchema.parse(config);

  const audits = coverageType.map(
    type =>
      ({
        slug: `${type}-coverage`,
        title: `${type} coverage`,
        description: `${type} coverage percentage on the project`,
      } satisfies Audit),
  );

  const getAuditOutputs = async () =>
    perfectScoreThreshold
      ? applyMaxScoreAboveThreshold(
          await lcovResultsToAuditOutputs(reports, coverageType),
          perfectScoreThreshold,
        )
      : await lcovResultsToAuditOutputs(reports, coverageType);

  // if coverage results are provided, only convert them to AuditOutputs
  // if not, run coverage command and then run result conversion
  const runner: RunnerConfig | RunnerFunction =
    coverageToolCommand == null
      ? getAuditOutputs
      : ({
          command: coverageToolCommand.command,
          args: coverageToolCommand.args,
          outputFile: RUNNER_OUTPUT_PATH,
          outputTransform: getAuditOutputs,
        } satisfies RunnerConfig);
  return {
    slug: 'coverage',
    title: 'Code coverage',
    icon: 'folder-coverage-open',
    description: 'Official Code PushUp code coverage plugin',
    docsUrl: 'https://www.softwaretestinghelp.com/code-coverage-tutorial/',
    packageName: name,
    version,
    audits,
    runner,
  } satisfies PluginConfig;
}
