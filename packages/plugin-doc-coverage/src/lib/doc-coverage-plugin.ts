import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Group, PluginConfig } from '@code-pushup/models';
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
 *
 *       docTypes: ['class', 'function']
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export async function docCoveragePlugin(
  config: DocCoveragePluginConfig,
): Promise<PluginConfig> {
  const docCoverageConfig = docCoveragePluginConfigSchema.parse(config);

  const audits = [
    {
      slug: 'percentage-coverage',
      title: 'Percentage of codebase with documentation',
      description: 'Measures how many % of the codebase have documentation.',
    },
  ];

  const group: Group = {
    slug: 'doc-coverage',
    title: 'Documentation coverage metrics',
    description:
      'Group containing all defined documentation coverage types as audits.',
    refs: audits.map(audit => ({
      ...audit,
      weight: 1,
    })),
  };

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
    audits,
    groups: [group],
    runner: await createRunnerConfig(runnerScriptPath, docCoverageConfig),
  };
}
