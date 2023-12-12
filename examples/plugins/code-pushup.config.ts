import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRefs,
} from './src/file-size/file-size.plugin';
import {
  create as lighthousePlugin, //  recommendedRefs as lighthouseRecommendedRefs,
} from './src/lighthouse/src/lighthouse.plugin';

/**
 * Run it with:
 * `nx run-collect examples-plugins`
 *
 * - For all formats use `--persist.format=md,json`
 * - For better debugging use `--verbose --no-progress`
 *
 */

const outputDir = '.code-pushup';
// eslint-disable-next-line unicorn/no-unreadable-iife
const config = (() => ({
  persist: {
    outputDir,
  },
  plugins: [
    fileSizePlugin({
      directory: './dist',
      pattern: /\.js$/,
      // eslint-disable-next-line no-magic-numbers
      budget: 42_000,
    }),
    lighthousePlugin({
      url: 'https://example.com',
      onlyAudits: ['largest-contentful-paint'],
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        ...fileSizeRecommendedRefs,
        {
          plugin: 'lighthouse',
          slug: 'largest-contentful-paint',
          type: 'audit',
          weight: 1,
        },
      ],
    },
  ],
}))();

export default config;
