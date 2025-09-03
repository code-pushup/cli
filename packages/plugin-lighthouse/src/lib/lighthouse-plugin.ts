import { createRequire } from 'node:module';
import type { PluginConfig } from '@code-pushup/models';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import { normalizeFlags } from './normalize-flags.js';
import { normalizeUrlInput, processAuditsAndGroups } from './processing.js';
import { createRunnerFunction } from './runner/runner.js';
import type { LighthouseOptions, LighthouseUrls } from './types.js';

export function lighthousePlugin(
  urls: LighthouseUrls,
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

  const packageJson = createRequire(import.meta.url)(
    '../../package.json',
  ) as typeof import('../../package.json');

  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    packageName: packageJson.name,
    version: packageJson.version,
    title: 'Lighthouse',
    icon: 'lighthouse',
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
}
