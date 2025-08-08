import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PluginConfig } from '@code-pushup/models';
import { parseSchema } from '@code-pushup/utils';
import {
  type ESLintPluginConfig,
  type ESLintPluginOptions,
  eslintPluginConfigSchema,
  eslintPluginOptionsSchema,
} from './config.js';
import { listAuditsAndGroups } from './meta/index.js';
import { createRunnerConfig } from './runner/index.js';

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
  const targets = parseSchema(eslintPluginConfigSchema, config, {
    schemaType: 'ESLint plugin config',
  });

  const parsedOptions = options
    ? parseSchema(eslintPluginOptionsSchema, options, {
        schemaType: 'ESLint plugin options',
      })
    : undefined;

  const customGroups = parsedOptions?.groups;

  const { audits, groups } = await listAuditsAndGroups(targets, customGroups);

  const runnerScriptPath = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    'bin.js',
  );

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  return {
    slug: 'eslint',
    title: 'ESLint',
    icon: 'eslint',
    description: 'Official Code PushUp ESLint plugin',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/eslint-plugin',
    packageName: packageJson.name,
    version: packageJson.version,

    audits,
    groups,

    runner: await createRunnerConfig(
      runnerScriptPath,
      audits,
      targets,
      parsedOptions?.artifacts,
    ),
  };
}
