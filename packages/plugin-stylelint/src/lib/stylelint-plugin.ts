import {createRequire} from 'node:module';
import type {LinterOptions} from 'stylelint';
import type {Audit, PluginConfig} from '@code-pushup/models';
import {createRunnerFunction} from './runner/index.js';
import {getNormalizedConfigForFile} from "./runner/normalize-config.js";


export type StylelintPluginConfig = Pick<LinterOptions, 'configFile' | 'files'> & {
  onlyAudits?: string[]
}

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

   console.log('getNormalizedConfigForFile: ', await getNormalizedConfigForFile(options ?? {}));

  return {
    slug: 'stylelint',
    title: 'Code stylelint',
    icon: 'folder-css',
    description: 'Official Code PushUp code stylelint plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/stylelint-plugin/',
    packageName: packageJson.name,
    version: packageJson.version,
    audits: Object.keys(options?.config?.rules ?? {
      'color-no-invalid-hex': true,
    }).map(slug => ({
      slug,
      title: slug,
      docsUrl: `https://stylelint.io/user-guide/rules/${slug}`,
    })),
    runner: createRunnerFunction(options ?? {}),
  };
}

async function getAudits(options: StylelintPluginConfig): Promise<Audit[]> {
  const {onlyAudits = [], ...rawCfg} = options;
  const config = await getNormalizedConfigForFile(rawCfg);
  return Object.keys(config.rules).filter(rule => onlyAudits.length > 0 && config.rules[rule] !== false).map(rule => ({
    slug: rule,
    title: rule,
    docsUrl: `https://stylelint.io/user-guide/rules/${rule}`,
  }));
}
