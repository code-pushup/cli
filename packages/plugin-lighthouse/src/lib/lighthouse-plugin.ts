import { PluginConfig } from '@code-pushup/models';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import {
  LIGHTHOUSE_GROUPS,
  LIGHTHOUSE_NAVIGATION_AUDITS,
  LIGHTHOUSE_OUTPUT_PATH,
  LighthouseCliFlags,
  createRunnerFunction,
} from './runner';
import { filterAuditsAndGroupsByOnlyOptions } from './utils';

export function lighthousePlugin(
  url: string,
  flags: LighthouseCliFlags = {},
): PluginConfig {
  const {
    onlyAudits,
    onlyCategories,
    outputPath = LIGHTHOUSE_OUTPUT_PATH,
    ...unparsedFlags
  } = flags;

  const { audits, groups } = filterAuditsAndGroupsByOnlyOptions(
    LIGHTHOUSE_NAVIGATION_AUDITS,
    LIGHTHOUSE_GROUPS,
    { onlyAudits, onlyCategories },
  );

  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
    title: 'Lighthouse',
    icon: 'lighthouse',
    audits,
    groups,
    runner: createRunnerFunction(url, {
      outputPath,
      onlyAudits,
      onlyCategories,
      ...unparsedFlags,
    }),
  };
}
