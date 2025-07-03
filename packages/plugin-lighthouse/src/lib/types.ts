import type { CliFlags } from 'lighthouse';
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
};

export type LighthouseGroupSlugs = (typeof LIGHTHOUSE_GROUP_SLUGS)[number];

export type LighthouseUrls = string | string[];
