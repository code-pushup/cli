import { createRequire } from 'node:module';
import type { PluginConfig, PluginUrls } from '@code-pushup/models';
import { GROUP_CODEPUSHUP } from '@code-pushup/profiler';
import { createPluginSpan } from '@code-pushup/profiler';
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
  const startPluginConfig = profiler.mark(
    `start-${LIGHTHOUSE_PLUGIN_SLUG}-plugin-config`,
    createPluginSpan(LIGHTHOUSE_PLUGIN_SLUG)({
      group: GROUP_CODEPUSHUP,
      tooltipText: `Loading ${LIGHTHOUSE_PLUGIN_TITLE} plugin configuration`,
    }),
  );

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

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  const result: PluginConfig = {
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

  profiler.measure(
    `run-${LIGHTHOUSE_PLUGIN_SLUG}-plugin-config`,
    startPluginConfig as PerformanceMeasure,
  );
  return result;
}
