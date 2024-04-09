import type { PluginConfig } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
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
  const {
    skipAudits = [],
    onlyAudits = [],
    onlyCategories = [],
    ...unparsedFlags
  } = normalizeFlags(flags ?? {});

  const { audits, groups } = filterAuditsAndGroupsByOnlyOptions(
    LIGHTHOUSE_NAVIGATION_AUDITS,
    LIGHTHOUSE_GROUPS,
    { skipAudits, onlyAudits, onlyCategories },
  );

  log(audits, { skipAudits, onlyAudits, onlyCategories });
  return {
    slug: LIGHTHOUSE_PLUGIN_SLUG,
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

function log(
  audits: { slug: string }[],
  opt: { skipAudits: string[]; onlyAudits: string[]; onlyCategories: string[] },
) {
  const { skipAudits, onlyAudits, onlyCategories } = opt;
  const filteredSlugs = new Set(audits.map(({ slug }) => slug));
  ui().logger.info(
    `filter: ${JSON.stringify({ skipAudits, onlyAudits, onlyCategories })}`,
  );
  ui().logger.info(`audit count: ${JSON.stringify(audits.length)}`);
  skipAudits.forEach((slug, index) => {
    ui().logger.info(
      `Skip audit ${skipAudits.at(
        index,
      )} included in audits: ${filteredSlugs.has(slug)}`,
    );
  });
  onlyAudits.forEach((slug, index) => {
    ui().logger.info(
      `Only audit ${onlyAudits.at(
        index,
      )} included in audits: ${filteredSlugs.has(slug)}`,
    );
  });
  onlyCategories.forEach((slug, index) => {
    ui().logger.info(
      `Only categories ${onlyCategories.at(
        index,
      )} included in audits: ${filteredSlugs.has(slug)}`,
    );
  });
}
