import { createRequire } from 'node:module';
import {
  type PluginConfig,
  type PluginUrls,
  validate,
} from '@code-pushup/models';
import { normalizeUrlInput } from '@code-pushup/utils';
import { type AxePluginOptions, axePluginOptionsSchema } from './config.js';
import { AXE_PLUGIN_SLUG, AXE_PLUGIN_TITLE } from './constants.js';
import { processAuditsAndGroups } from './meta/processing.js';
import { createRunnerFunction } from './runner/runner.js';

/**
 * Code PushUp plugin for accessibility testing using axe-core.
 *
 * @public
 * @param urls - {@link PluginUrls} URL(s) to test
 * @param options - {@link AxePluginOptions} Plugin options
 * @returns Plugin configuration
 */
export function axePlugin(
  urls: PluginUrls,
  options: AxePluginOptions = {},
): PluginConfig {
  const { preset, scoreTargets, timeout } = validate(
    axePluginOptionsSchema,
    options,
  );

  const { urls: normalizedUrls, context } = normalizeUrlInput(urls);

  const { audits, groups, ruleIds } = processAuditsAndGroups(
    normalizedUrls,
    preset,
  );

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  return {
    slug: AXE_PLUGIN_SLUG,
    title: AXE_PLUGIN_TITLE,
    icon: 'folder-syntax',
    description:
      'Official Code PushUp Axe plugin for automated accessibility testing',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/axe-plugin',
    packageName: packageJson.name,
    version: packageJson.version,
    audits,
    groups,
    runner: createRunnerFunction(normalizedUrls, ruleIds, timeout),
    context,
    ...(scoreTargets && { scoreTargets }),
  };
}
