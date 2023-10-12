import { PluginConfig } from '@code-pushup/models';
import { toArray } from '@code-pushup/utils';
import { ESLint } from 'eslint';
import { name, version } from '../../package.json';
import { ESLintPluginConfig, eslintPluginConfigSchema } from './config';
import { listAudits } from './meta/audits';

/**
 * Instantiates Code PushUp ESLint plugin for use in core config.
 *
 * @example
 * import eslintPlugin from '@code-pushup/eslint-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     await eslintPlugin({
 *       eslintrc: '.eslintrc.json',
 *       patterns: ['src', 'test/*.spec.js']
 *     })
 *   ]
 * }
 *
 * @param config Configuration options.
 * @returns Plugin configuration as a promise.
 */
export async function eslintPlugin(
  config: ESLintPluginConfig,
): Promise<PluginConfig> {
  const { eslintrc, patterns } = eslintPluginConfigSchema.parse(config);

  const eslint = new ESLint({
    useEslintrc: false,
    baseConfig: { extends: eslintrc },
  });

  const audits = await listAudits(eslint, patterns);

  return {
    slug: 'eslint',
    title: 'ESLint',
    icon: 'eslint',
    description: 'Official Code PushUp ESLint plugin',
    // TODO: docsUrl (package README, once published)
    packageName: name,
    version,

    audits,

    // TODO: groups?
    // - could be `problem`/`suggestion`/`layout` if based on `meta.type`
    // - `meta.category` (deprecated, but still used by some) could also be a source of groups

    // TODO: implement actual runner which converts results to audits: https://github.com/flowup/quality-metrics-cli/issues/27
    runner: {
      command: 'npx',
      args: [
        'eslint',
        `--config=${eslintrc}`,
        '--format=json',
        '--output-file=tmp/out.json',
        ...toArray(patterns),
      ],
      outputFile: 'tmp/out.json',
    },
  };
}
