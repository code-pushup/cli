import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PluginConfig } from '@code-pushup/models';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';
import { createRunnerConfig } from './runner/index.js';

/**
 * Instantiates Code PushUp documentation coverage plugin for core config.
 *
 * @example
 * import docCoveragePlugin from '@code-pushup/doc-coverage-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     await docCoveragePlugin({
 *       sourceGlob: 'src&#47;**&#47;*.{ts,tsx}'
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */

export const docCoverageAudits = [
  {
    slug: 'percentage-coverage',
    title: 'Percentage of codebase with documentation',
    description: 'Measures how many % of the codebase have documentation.',
  },
];

export async function docCoveragePlugin(
  config: DocCoveragePluginConfig,
): Promise<PluginConfig> {
  const docCoverageConfig = docCoveragePluginConfigSchema.parse(config);

  const runnerScriptPath = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    'bin.js',
  );

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  return {
    slug: 'doc-coverage',
    title: 'Documentation coverage',
    icon: 'folder-src',
    description: 'Official Code PushUp documentation coverage plugin.',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/doc-coverage-plugin/',
    packageName: packageJson.name,
    version: packageJson.version,
    audits: docCoverageAudits,
    // groups: [group],
    runner: await createRunnerConfig(runnerScriptPath, docCoverageConfig),
  };
}
