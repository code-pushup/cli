import { PluginConfig } from '@code-pushup/models';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
  LighthouseCliFlags,
  createRunnerFunction,
} from './runner';
import { filterAuditsAndGroupsByOnlyOptions } from './utils';

export function lighthousePlugin(
  url: string,
  flags?: LighthouseCliFlags,
): PluginConfig {
  const { audits, groups } = filterAuditsAndGroupsByOnlyOptions(
    LIGHTHOUSE_NAVIGATION_AUDITS,
    LIGHTHOUSE_GROUPS,
    flags,
  );
  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups,
    runner: createRunnerFunction(url, flags),
  };
}
