import { type PluginConfig, validate } from '@code-pushup/models';
import { profiler } from '@code-pushup/utils';
import { type JsDocsPluginConfig, jsDocsPluginConfigSchema } from './config.js';
import {
  GROUPS,
  PLUGIN_DESCRIPTION,
  PLUGIN_DOCS_URL,
  PLUGIN_SLUG,
  PLUGIN_TITLE,
} from './constants.js';
import { createRunnerFunction } from './runner/runner.js';
import {
  filterAuditsByPluginConfig,
  filterGroupsByOnlyAudits,
  logAuditsAndGroups,
} from './utils.js';

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
 *     jsDocsPlugin(['**&#47;*.ts'])
 *   ]
 * }
 *
 * @returns Plugin configuration.
 */
export function jsDocsPlugin(config: JsDocsPluginConfig): PluginConfig {
  return profiler.span(
    `run-${PLUGIN_SLUG}-plugin-config`,
    () => {
      const jsDocsConfig = validate(jsDocsPluginConfigSchema, config);
      const scoreTargets = jsDocsConfig.scoreTargets;

      const groups = filterGroupsByOnlyAudits(GROUPS, jsDocsConfig);
      const audits = filterAuditsByPluginConfig(jsDocsConfig);

      logAuditsAndGroups(audits, groups);

      const result: PluginConfig = {
        slug: PLUGIN_SLUG,
        title: PLUGIN_TITLE,
        icon: 'folder-docs',
        description: PLUGIN_DESCRIPTION,
        docsUrl: PLUGIN_DOCS_URL,
        groups,
        audits,
        runner: createRunnerFunction(jsDocsConfig),
        ...(scoreTargets && { scoreTargets }),
      };

      return result;
    },
    { detail: profiler.tracks.plugin(PLUGIN_SLUG)() },
  );
}
