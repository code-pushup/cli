import { ESLint } from 'eslint';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import { ESLintPluginConfig, eslintPluginConfigSchema } from './config';
import { listAuditsAndGroups } from './meta';
import { createRunnerConfig } from './runner';

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

  const { audits, groups } = await listAuditsAndGroups(eslint, patterns);

  const runnerScriptPath = join(
    fileURLToPath(dirname(import.meta.url)),
    'bin.js',
  );

  return {
    slug: 'eslint',
    title: 'ESLint',
    icon: 'eslint',
    description: 'Official Code PushUp ESLint plugin',
    // TODO: docsUrl (package README, once published)
    packageName: name,
    version,

    audits,
    groups,

    runner: createRunnerConfig(runnerScriptPath, audits, eslintrc, patterns),
  };
}
