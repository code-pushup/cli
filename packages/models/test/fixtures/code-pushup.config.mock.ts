import { CoreConfig } from '../../src';
import { categoryConfigs } from './categories.mock';

const outputDir = 'tmp';
export default {
  persist: { outputDir },
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  categories: categoryConfigs(),
  plugins: [
    {
      slug: 'eslint',
      title: 'ESLint',
      icon: 'eslint',
      description: 'Official Code PushUp ESLint plugin',
      packageName: '@code-pushup/eslint-plugin',
      version: '0.1.0',
      audits: [],
    },
    // Lighthouse Plugin
    {
      slug: 'lighthouse',
      title: 'Lighthouse',
      icon: 'lighthouse',
      packageName: '@code-pushup/lighthouse-plugin',
      version: '0.1.0',
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
        },
        {
          slug: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          docsUrl:
            'https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/',
        },
        {
          slug: 'total-blocking-time',
          title: 'Total Blocking Time',
          docsUrl:
            'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/',
        },
        {
          slug: 'cumulative-layout-shift',
          title: 'Cumulative Layout Shift',
          docsUrl: 'https://web.dev/cls/',
        },
        {
          slug: 'speed-index',
          title: 'Speed Index',
          docsUrl:
            'https://developer.chrome.com/docs/lighthouse/performance/speed-index/',
        },
      ],
    },
  ],
} satisfies CoreConfig;
