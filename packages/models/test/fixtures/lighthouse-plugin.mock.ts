import type { PluginReport } from '../../src';

export function lighthousePluginReport(): PluginReport {
  return {
    slug: 'lighthouse',
    title: 'Lighthouse',
    icon: 'lighthouse',
    packageName: '@code-pushup/lighthouse-plugin',
    version: '0.1.0',
    date: '2023-10-18T07:49:45.899Z',
    duration: 1234,
    groups: [
      {
        slug: 'performance',
        title: 'Performance',
        refs: [
          {
            slug: 'first-contentful-paint',
            weight: 10,
          },
          {
            slug: 'largest-contentful-paint',
            weight: 25,
          },
          {
            slug: 'speed-index',
            weight: 10,
          },
          {
            slug: 'total-blocking-time',
            weight: 30,
          },
          {
            slug: 'cumulative-layout-shift',
            weight: 25,
          },
        ],
      },
    ],
    audits: [
      {
        slug: 'first-contentful-paint',
        title: 'First Contentful Paint',
        docsUrl:
          'https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/',
        score: 0.76,
        value: 1189,
        displayValue: '1.2 s',
      },
      {
        slug: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
        docsUrl:
          'https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/',
        score: 0.81,
        value: 1491,
        displayValue: '1.5 s',
      },
      {
        slug: 'total-blocking-time',
        title: 'Total Blocking Time',
        docsUrl:
          'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/',
        score: 1,
        value: 0,
        displayValue: '0 ms',
      },
      {
        slug: 'cumulative-layout-shift',
        title: 'Cumulative Layout Shift',
        docsUrl: 'https://web.dev/cls/',
        score: 1,
        value: 0,
        displayValue: '0',
      },
      {
        slug: 'speed-index',
        title: 'Speed Index',
        docsUrl:
          'https://developer.chrome.com/docs/lighthouse/performance/speed-index/',
        score: 0.93,
        value: 1189,
        displayValue: '1.2 s',
      },
    ],
  };
}
