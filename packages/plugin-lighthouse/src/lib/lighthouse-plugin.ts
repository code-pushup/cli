import type { PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants.js';
import { normalizeFlags } from './normalize-flags.js';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
  createRunnerFunction,
} from './runner/index.js';
import type { LighthouseOptions } from './types.js';
import { filterAuditsAndGroupsByOnlyOptions } from './utils.js';

export function lighthousePlugin(
  url: string,
  flags?: LighthouseOptions,
): PluginConfig {
  const { skipAudits, onlyAudits, onlyCategories, ...unparsedFlags } =
    normalizeFlags(flags ?? {});

  const { audits, groups } = filterAuditsAndGroupsByOnlyOptions(
    LIGHTHOUSE_NAVIGATION_AUDITS,
    LIGHTHOUSE_GROUPS,
    { skipAudits, onlyAudits, onlyCategories },
  );

  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    packageName: name,
    version,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups,
    runner: createRunnerFunction(url, {
      skipAudits,
      onlyAudits,
      onlyCategories,
      ...unparsedFlags,
    }),
  };
}
