import type { PluginConfig } from '@code-pushup/models';
import { type JsDocsPluginConfig, jsDocsPluginConfigSchema } from './config.js';
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
  'https://www.npmjs.com/package/@code-pushup/jsdocs-plugin/';

/**
 * Instantiates Code PushUp documentation coverage plugin for core config.
 *
 * @example
 * import jsDocsPlugin from '@code-pushup/jsdocs-plugin'
 *
 * export default {
 *   // ... core config ...
 *   plugins: [
 *     // ... other plugins ...
 *     jsDocsPlugin({
 *       patterns: ['src&#47;**&#47;*.{ts,tsx}']
 *     })
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export function jsDocsPlugin(config: JsDocsPluginConfig): PluginConfig {
  const jsDocsConfig = jsDocsPluginConfigSchema.parse(config);

  return {
    slug: PLUGIN_SLUG,
    title: PLUGIN_TITLE,
    icon: 'folder-docs',
    description: PLUGIN_DESCRIPTION,
    docsUrl: PLUGIN_DOCS_URL,
    groups: filterGroupsByOnlyAudits(groups, jsDocsConfig),
    audits: filterAuditsByPluginConfig(jsDocsConfig),
    runner: createRunnerFunction(jsDocsConfig),
  };
}
