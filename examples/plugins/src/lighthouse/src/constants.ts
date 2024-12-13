import type { Audit, CategoryRef, Group } from '@code-pushup/models';

export const LIGHTHOUSE_OUTPUT_FILE_DEFAULT = 'lighthouse-report.json';
export const LIGHTHOUSE_PERFORMANCE_CORE_GROUP_SLUG = 'performance-core';

export const LIGHTHOUSE_REPORT_NAME = 'lighthouse-report.json';
export const PLUGIN_SLUG = 'lighthouse';

export const fcpSlug = 'first-contentful-paint';
export const siSlug = 'speed-index';
export const tbtSlug = 'total-blocking-time';
export const clsSlug = 'cumulative-layout-shift';
export const lcpSlug = 'largest-contentful-paint';
export const audits: Audit[] = [
  {
    slug: fcpSlug,
    title: 'First Contentful Paint',
    description:
      'First Contentful Paint marks the time at which the first text or image is painted. [Learn more about the First Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/).',
  },
  {
    slug: lcpSlug,
    title: 'Largest Contentful Paint',
    description:
      'Largest Contentful Paint marks the time at which the largest text or image is painted. [Learn more about the Largest Contentful Paint metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)',
  },
  {
    slug: siSlug,
    title: 'Speed Index',
    description:
      'Speed Index shows how quickly the contents of a page are visibly populated. [Learn more about the Speed Index metric](https://developer.chrome.com/docs/lighthouse/performance/speed-index/).',
  },
  {
    slug: tbtSlug,
    title: 'Total Blocking Time',
    description:
      'Sum of all time periods between FCP and Time to Interactive, when task length exceeded 50ms, expressed in milliseconds. [Learn more about the Total Blocking Time metric](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/).',
  },
  {
    slug: clsSlug,
    title: 'Cumulative Layout Shift',
    description:
      'Cumulative Layout Shift measures the movement of visible elements within the viewport. [Learn more about the Cumulative Layout Shift metric](https://web.dev/articles/cls).',
  },
  {
    slug: 'server-response-time',
    title: 'Initial server response time was short',
    description:
      'Keep the server response time for the main document short because all other requests depend on it. [Learn more about the Time to First Byte metric](https://developer.chrome.com/docs/lighthouse/performance/time-to-first-byte/).',
  },
  {
    slug: 'interactive',
    title: 'Time to Interactive',
    description:
      'Time to Interactive is the amount of time it takes for the page to become fully interactive. [Learn more about the Time to Interactive metric](https://developer.chrome.com/docs/lighthouse/performance/interactive/).',
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
      slug: fcpSlug,
      weight: 10,
    },
    {
      slug: lcpSlug,
      weight: 25,
    },
    {
      slug: tbtSlug,
      weight: 30,
    },
    {
      slug: clsSlug,
      weight: 25,
    },
    {
      slug: siSlug,
      weight: 10,
    },
    // others
    {
      slug: 'server-response-time',
      weight: 0,
    },
    {
      slug: 'interactive',
      weight: 0,
    },
    {
      slug: 'user-timings',
      weight: 0,
    },
  ],
};

export const categoryCorePerfGroup2: Group = {
  slug: LIGHTHOUSE_PERFORMANCE_CORE_GROUP_SLUG + 2,
  title: 'performance-core-2',
  refs: [
    // web vitals
    {
      slug: 'first-contentful-paint',
      weight: 10,
    },
    {
      slug: 'largest-contentful-paint',
      weight: 25,
    },
    {
      slug: 'total-blocking-time',
      weight: 30,
    },
    {
      slug: 'cumulative-layout-shift',
      weight: 25,
    },
    {
      slug: 'speed-index',
      weight: 10,
    },
  ],
};
