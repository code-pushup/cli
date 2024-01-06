import {
  packageJsonDocumentationGroupRef,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
  packageJsonVersionControlGroupRef,
} from './src';
import cssTokenUsagePlugin, {
  recommendedRefs as cssTokenUsageRecommendedRefs,
} from './src/css-tokens/src/css-token.plugin';
import fileSizePlugin, {
  recommendedRefs as fileSizeRecommendedRefs,
} from './src/file-size/src/file-size.plugin';

/**
 * Run it with:
 * `nx run-collect examples-plugins`
 *
 * - For all formats use `--persist.format=md,json`
 * - For better debugging use `--verbose --no-progress`
 *
 */

// eslint-disable-next-line unicorn/no-unreadable-iife
const config = (() => ({
  plugins: [
    fileSizePlugin({
      directory: './dist/packages',
      pattern: /\.js$/,
      // eslint-disable-next-line no-magic-numbers
      budget: 42_000,
    }),
    packageJsonPlugin({
      directory: './packages',
      license: 'MIT',
      type: 'module',
      dependencies: {
        zod: '^3.22.4',
      },
    }),
    cssTokenUsagePlugin({
      directory: './examples',
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [...fileSizeRecommendedRefs, packageJsonPerformanceGroupRef],
    },
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        packageJsonVersionControlGroupRef,
        ...cssTokenUsageRecommendedRefs,
      ],
    },
    {
      slug: 'documentation',
      title: 'Documentation',
      refs: [packageJsonDocumentationGroupRef],
    },
  ],
}))();

export default config;
