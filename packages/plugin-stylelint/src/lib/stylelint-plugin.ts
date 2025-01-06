import { createRequire } from 'node:module';
import type { PluginConfig } from '@code-pushup/models';
import {
  type StyleLintPluginConfig,
  type StyleLintTarget,
  stylelintPluginConfigSchema,
} from './config.js';
import { createRunnerFunction } from './runner/index.js';
import { getAudits, getGroups } from './utils.js';

/**
 * Instantiates Code PushUp code stylelint plugin for core config.
 *
 * @example
 * import stylelintPlugin from '@code-pushup/stylelint-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     await stylelintPlugin({
 *       reports: [{ resultsPath: 'stylelint/cli/lcov.info', pathToProject: 'packages/cli' }]
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export async function stylelintPlugin(
  options?: StyleLintPluginConfig,
): Promise<PluginConfig> {
  const { stylelintrc: configFile = '.stylelintrc.json', patterns: files } =
    stylelintPluginConfigSchema.parse(options ?? {}).at(0) as StyleLintTarget;

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  const audits = await getAudits({
    stylelintrc: configFile,
  });

  return {
    slug: 'stylelint',
    title: 'Code stylelint',
    icon: 'folder-css',
    description: 'Official Code PushUp code stylelint plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/stylelint-plugin/',
    packageName: packageJson.name,
    version: packageJson.version,
    audits,
    groups: await getGroups({ stylelintrc: configFile }),
    runner: createRunnerFunction({ configFile, files }, audits),
  };
}
