import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import { ESLintPluginConfig, eslintPluginConfigSchema } from './config';
import { listAuditsAndGroups } from './meta';
import { ESLINTRC_PATH, createRunnerConfig } from './runner';
import { setupESLint } from './setup';

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

  const eslint = setupESLint(eslintrc);

  const { audits, groups } = await listAuditsAndGroups(eslint, patterns);

  // save inline config to file so runner can access it later
  if (typeof eslintrc !== 'string') {
    await mkdir(dirname(ESLINTRC_PATH), { recursive: true });
    await writeFile(ESLINTRC_PATH, JSON.stringify(eslintrc));
  }
  const eslintrcPath = typeof eslintrc === 'string' ? eslintrc : ESLINTRC_PATH;

  const runnerScriptPath = join(
    fileURLToPath(dirname(import.meta.url)),
    'bin.js',
  );

  return {
    slug: 'eslint',
    title: 'ESLint',
    icon: 'eslint',
    description: 'Official Code PushUp ESLint plugin',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/eslint-plugin',
    packageName: name,
    version,

    audits,
    groups,

    runner: await createRunnerConfig(
      runnerScriptPath,
      audits,
      eslintrcPath,
      patterns,
    ),
  };
}
