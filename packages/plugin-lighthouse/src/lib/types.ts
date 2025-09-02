import type { CliFlags } from 'lighthouse';
import type { PluginScoreTargets } from '@code-pushup/models';
import type { ExcludeNullableProps } from '@code-pushup/utils';
import type { LIGHTHOUSE_GROUP_SLUGS } from './constants.js';

export type LighthouseOptions = ExcludeNullableProps<
  Partial<
    Omit<
      CliFlags,
      // used as separate argument
      | '_'
      // not supported by implementation
      | 'precomputedLanternDataPath'
      | 'enableErrorReporting'
      | 'list-all-audits'
      | 'list-locales'
      | 'list-trace-categories'
      | 'chromeIgnoreDefaultFlags'
      // renamed to onlyGroups
      | 'onlyCategories'
      // weakened for `string` to `string | string[]`
      | 'onlyAudits'
      | 'skipAudits'
    >
  >
> & {
  onlyGroups?: string | string[];
  onlyAudits?: string | string[];
  skipAudits?: string | string[];
  scoreTargets?: PluginScoreTargets;
};

export type LighthouseGroupSlug = (typeof LIGHTHOUSE_GROUP_SLUGS)[number];

export type WeightedUrl = Record<string, number>;

export type LighthouseUrls = string | string[] | WeightedUrl;

export type LighthouseContext = {
  urlCount: number;
  weights: Record<number, number>;
};
