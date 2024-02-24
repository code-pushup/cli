import {
  type Config as LighthouseConfig,
  type CliFlags as LighthouseFlags,
} from 'lighthouse';
import { PluginConfig } from '@code-pushup/models';
import { AUDITS, GROUPS, LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import { filterAuditsAndGroupsByOnlyOptions } from './utils';

export function lighthousePlugin(
  url: string,
  flags?: Partial<LighthouseFlags>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config?: Partial<LighthouseConfig>,
): PluginConfig {
  const { audits, groups } = filterAuditsAndGroupsByOnlyOptions(
    AUDITS,
    GROUPS,
    flags,
  );
  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups,
    runner: () => audits.map(({ slug }) => ({ slug, value: 0, score: 0 })),
  };
}
