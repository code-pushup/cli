import { createRequire } from 'node:module';
import { type PluginConfig, validate } from '@code-pushup/models';
import { GROUP_CODEPUSHUP } from '@code-pushup/profiler';
import { createPluginSpan } from '@code-pushup/profiler';
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
  return profiler.spanAsync(
    `run-${ESLINT_PLUGIN_SLUG}-plugin-config`,
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

      const r = {
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
      return r as any;
    },
    { detail: profiler.spans.plugins(ESLINT_PLUGIN_SLUG)() },
  );
}
