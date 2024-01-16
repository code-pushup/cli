import { CategoryRef } from '@code-pushup/models';
import { pluginSlug } from './constants.generated';

export const LIGHTHOUSE_OUTPUT_FILE_DEFAULT = 'lighthouse-report.json';
export const LIGHTHOUSE_PERFORMANCE_CORE_GROUP_SLUG = 'performance-core';

export const corePerfGroupRefs: CategoryRef[] = [
  /**
   * Lighthouse audits in this group should apply to one of:
   * - be included in the [web vitals]()
   * - not have a significant impact on our runtime performance or bundle size.
   * - be network related [web vitals]()
   * - be measurable (especially for performance audits) or have clear pass/fail states.
   * - not use 3rd party APIs for completing the audit check.
   */
  {
    type: 'group',
    slug: LIGHTHOUSE_PERFORMANCE_CORE_GROUP_SLUG,
    plugin: pluginSlug,
    weight: 1,
  },
];

export const categoryCorePerfGroup = {
  slug: LIGHTHOUSE_PERFORMANCE_CORE_GROUP_SLUG,
  title: 'performance-core',
  refs: [
    // web vitals
    {
      slug: 'first-contentful-paint',
      weight: 10,
    },
    {
      slug: 'largest-contentful-paint',
      // eslint-disable-next-line no-magic-numbers
      weight: 25,
    },
    {
      slug: 'total-blocking-time',
      // eslint-disable-next-line no-magic-numbers
      weight: 30,
    },
    {
      slug: 'cumulative-layout-shift',
      // eslint-disable-next-line no-magic-numbers
      weight: 25,
    },
    {
      slug: 'speed-index',
      weight: 10,
    },
  ],
};
