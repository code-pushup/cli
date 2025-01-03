import { createRequire } from 'node:module';
import type { LinterOptions } from 'stylelint';
import type { PluginConfig } from '@code-pushup/models';
import { createRunnerFunction } from './runner/index.js';
import { getAudits } from './utils.js';

export type StylelintPluginConfig = Pick<
  LinterOptions,
  'configFile' | 'files'
> & {
  onlyAudits?: string[];
};

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
  options?: StylelintPluginConfig,
): Promise<PluginConfig> {
  // const stylelintConfig = stylelintPluginConfigSchema.parse(config ?? {});

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  const audits = await getAudits(options ?? {});

  return {
    slug: 'stylelint',
    title: 'Code stylelint',
    icon: 'folder-css',
    description: 'Official Code PushUp code stylelint plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/stylelint-plugin/',
    packageName: packageJson.name,
    version: packageJson.version,
    audits,
    runner: createRunnerFunction(options ?? {}, audits),
  };
}

// async function getAudits(options: StylelintPluginConfig): Promise<Audit[]> {
//   const {onlyAudits = [], ...rawCfg} = options;
//   const config = await getNormalizedConfigForFile(rawCfg);
//   return Object.keys(config.rules).filter(rule => onlyAudits.length > 0 && config.rules[rule] !== false).map(rule => ({
//     slug: rule,
//     title: rule,
//     docsUrl: `https://stylelint.io/user-guide/rules/${rule}`,
//   }));
// }
