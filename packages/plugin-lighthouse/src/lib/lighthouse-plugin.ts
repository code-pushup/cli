import { createRequire } from 'node:module';
import type { PluginConfig, PluginUrls } from '@code-pushup/models';
import { normalizeUrlInput, profiler } from '@code-pushup/utils';
import {
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_PLUGIN_TITLE,
} from './constants.js';
import { normalizeFlags } from './normalize-flags.js';
import { processAuditsAndGroups } from './processing.js';
import { createRunnerFunction } from './runner/runner.js';
import type { LighthouseOptions } from './types.js';

export function lighthousePlugin(
  urls: PluginUrls,
  flags?: LighthouseOptions,
): PluginConfig {
  const {
    skipAudits,
    onlyAudits,
    onlyCategories,
    scoreTargets,
    ...unparsedFlags
  } = normalizeFlags(flags ?? {});

  const { urls: normalizedUrls, context } = normalizeUrlInput(urls);

  const { audits, groups } = processAuditsAndGroups(normalizedUrls, {
    skipAudits,
    onlyAudits,
    onlyCategories,
  });

  return profiler.measure(
    'plugin-lighthouse:setup-config',
    () => {
      const packageJson = createRequire(import.meta.url)(
        '../../package.json',
      ) as typeof import('../../package.json');

      return {
        slug: LIGHTHOUSE_PLUGIN_SLUG,
        title: LIGHTHOUSE_PLUGIN_TITLE,
        icon: 'lighthouse',
        packageName: packageJson.name,
        version: packageJson.version,
        audits,
        groups,
        runner: createRunnerFunction(normalizedUrls, {
          skipAudits,
          onlyAudits,
          onlyCategories,
          ...unparsedFlags,
        }),
        context,
        ...(scoreTargets && { scoreTargets }),
      };
    },
    {
      ...profiler.measureConfig.tracks.pluginLighthouse,
      success: (config: PluginConfig) => ({
        properties: [
          ['URLs', String(normalizedUrls.length)],
          ['Audits', String(config.audits.length)],
          ['Groups', String(config.groups.length)],
        ],
        tooltipText: `Configured Lighthouse plugin with ${config.audits.length} audits for ${normalizedUrls.length} URLs`,
      }),
    },
  );
}
