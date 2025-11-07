import { createRequire } from 'node:module';
import type { PluginConfig, PluginUrls } from '@code-pushup/models';
import { normalizeUrlInput } from '@code-pushup/utils';
import type { AxePluginOptions } from './config.js';
import { AXE_DEFAULT_PRESET, AXE_PLUGIN_SLUG } from './constants.js';
import { processAuditsAndGroups } from './processing.js';
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
  options?: AxePluginOptions,
): PluginConfig {
  const scoreTargets = options?.scoreTargets;
  const preset = options?.preset ?? AXE_DEFAULT_PRESET;

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
    packageName: packageJson.name,
    version: packageJson.version,
    title: 'Axe Accessibility',
    icon: 'folder-syntax',
    description:
      'Official Code PushUp Axe plugin for automated accessibility testing',
    docsUrl: 'https://www.npmjs.com/package/@code-pushup/axe-plugin',
    audits,
    groups,
    runner: createRunnerFunction(normalizedUrls, ruleIds),
    context,
    ...(scoreTargets && { scoreTargets }),
  };
}
