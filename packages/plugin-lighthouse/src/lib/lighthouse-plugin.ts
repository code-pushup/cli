import type { PluginConfig } from '@code-pushup/models';
import { name, version } from '../../package.json';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import { normalizeFlags } from './normalize-flags';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
  createRunnerFunction,
} from './runner';
import type { LighthouseOptions } from './types';
import { filterAuditsAndGroupsByOnlyOptions } from './utils';

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
