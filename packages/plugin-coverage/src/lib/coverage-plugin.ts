import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Audit, Group, PluginConfig } from '@code-pushup/models';
import { capitalize } from '@code-pushup/utils';
import {
  type CoveragePluginConfig,
  type CoverageType,
  coveragePluginConfigSchema,
} from './config.js';
import { createRunnerConfig } from './runner/index.js';
import { coverageDescription, coverageTypeWeightMapper } from './utils.js';

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
export async function coveragePlugin(
  config: CoveragePluginConfig,
): Promise<PluginConfig> {
  const coverageConfig = coveragePluginConfigSchema.parse(config);

  const audits = coverageConfig.coverageTypes.map(
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
    refs: audits.map(audit => ({
      ...audit,
      weight:
        coverageTypeWeightMapper[
          audit.slug.slice(0, audit.slug.indexOf('-')) as CoverageType
        ],
    })),
  };

  const runnerScriptPath = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    'bin.js',
  );

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  return {
    slug: 'coverage',
    title: 'Code coverage',
    icon: 'folder-coverage-open',
    description: 'Official Code PushUp code coverage plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/coverage-plugin/',
    packageName: packageJson.name,
    version: packageJson.version,
    audits,
    groups: [group],
    runner: await createRunnerConfig(runnerScriptPath, coverageConfig),
  };
}
