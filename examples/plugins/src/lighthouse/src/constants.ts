import { Audit, CategoryRef, Group } from '@code-pushup/models';

export const LIGHTHOUSE_OUTPUT_FILE_DEFAULT = 'lighthouse-report.json';
export const LIGHTHOUSE_PERFORMANCE_CORE_GROUP_SLUG = 'performance-core';

export const LIGHTHOUSE_REPORT_NAME = 'lighthouse-report.json';
export const PLUGIN_SLUG = 'lighthouse';

export const audits: Audit[] = [
  {
    slug: 'first-contentful-paint',
    title: 'First Contentful Paint',
    description:
      'First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/).',
  },
  {
    slug: 'largest-contentful-paint',
    title: 'Largest Contentful Paint',
    description:
      'Largest Contentful Paint marks the time at which the largest text or image is painted. [Learn more about the Largest Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)',
  },
  {
    slug: 'speed-index',
    title: 'Speed Index',
    description:
      'Speed Index shows how quickly the contents of a page are visibly populated. [Learn more about the Speed Index metric](https://developer.chrome.com/docs/lighthouse/performance/speed-index/).',
  },
  {
    slug: 'total-blocking-time',
    title: 'Total Blocking Time',
    description:
      'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds. [Learn more about the Total Blocking Time metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/).',
  },
  {
    slug: 'cumulative-layout-shift',
    title: 'Cumulative Layout Shift',
    description:
      'Cumulative Layout Shift measures the movement of visible elements within the viewport. [Learn more about the Cumulative Layout Shift metric](https://web.dev/articles/cls).',
  },
];

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
    plugin: PLUGIN_SLUG,
    weight: 1,
  },
];
export const categoryCorePerfGroup: Group = {
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
