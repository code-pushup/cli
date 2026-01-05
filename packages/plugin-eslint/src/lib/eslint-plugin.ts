import { createRequire } from 'node:module';
import { type PluginConfig, validate } from '@code-pushup/models';
import { profiler } from '@code-pushup/utils';
import {
  type ESLintPluginConfig,
  type ESLintPluginOptions,
  eslintPluginConfigSchema,
  eslintPluginOptionsSchema,
} from './config.js';
import { ESLINT_PLUGIN_SLUG, ESLINT_PLUGIN_TITLE } from './constants.js';
import { listAuditsAndGroups } from './meta/list.js';
import { createRunnerFunction } from './runner/runner.js';

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
 * @param options Optional settings for customizing the plugin behavior.
 * @returns Plugin configuration as a promise.
 */
export async function eslintPlugin(
  config: ESLintPluginConfig,
  options?: ESLintPluginOptions,
): Promise<PluginConfig> {
  return profiler.measureAsync(
    'plugin-eslint:setup-config',
    async () => {
      const targets = validate(eslintPluginConfigSchema, config);

      const {
        groups: customGroups,
        artifacts,
        scoreTargets,
      } = options ? validate(eslintPluginOptionsSchema, options) : {};

      const { audits, groups } = await listAuditsAndGroups(
        targets,
        customGroups,
      );

      const packageJson = createRequire(import.meta.url)(
        '../../package.json',
      ) as typeof import('../../package.json');

      return {
        slug: ESLINT_PLUGIN_SLUG,
        title: ESLINT_PLUGIN_TITLE,
        icon: 'eslint',
        description: 'Official Code PushUp ESLint plugin',
        docsUrl: 'https://www.npmjs.com/package/@code-pushup/eslint-plugin',
        packageName: packageJson.name,
        version: packageJson.version,

        audits,
        groups,

        runner: createRunnerFunction({
          audits,
          targets,
          ...(artifacts ? { artifacts } : {}),
        }),
        ...(scoreTargets && { scoreTargets }),
      };
    },
    {
      ...profiler.measureConfig.tracks.pluginEslint,
      success: (result: Awaited<ReturnType<typeof eslintPlugin>>) => ({
        properties: [
          ['Targets', String(config.length)],
          ['Audits', String(result.audits.length)],
          ['Groups', String(result.groups.length)],
          ['Score Targets', result.scoreTargets ? 'configured' : 'none'],
        ],
        tooltipText: `Configured ${result.audits.length} audits and ${result.groups.length} groups for ${config.length} targets`,
      }),
    },
  );
}
