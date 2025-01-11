import type { PluginConfig } from '@code-pushup/models';
import {
  type DocCoveragePluginConfig,
  docCoveragePluginConfigSchema,
} from './config.js';
import { PLUGIN_SLUG, groups } from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import {
  filterAuditsByPluginConfig,
  filterGroupsByOnlyAudits,
} from './utils.js';

export const PLUGIN_TITLE = 'Documentation coverage';

export const PLUGIN_DESCRIPTION =
  'Official Code PushUp documentation coverage plugin.';

export const PLUGIN_DOCS_URL =
  'https://www.npmjs.com/package/@code-pushup/doc-coverage-plugin/';

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
 *     docCoveragePlugin({
 *       sourceGlob: ['src&#47;**&#47;*.{ts,tsx}']
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export function docCoveragePlugin(
  config: DocCoveragePluginConfig,
): PluginConfig {
  const docCoverageConfig = docCoveragePluginConfigSchema.parse(config);

  return {
    slug: PLUGIN_SLUG,
    title: PLUGIN_TITLE,
    icon: 'folder-docs',
    description: PLUGIN_DESCRIPTION,
    docsUrl: PLUGIN_DOCS_URL,
    groups: filterGroupsByOnlyAudits(groups, docCoverageConfig),
    audits: filterAuditsByPluginConfig(docCoverageConfig),
    runner: createRunnerFunction(docCoverageConfig),
  };
}
