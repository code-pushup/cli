import {
  fileSizePlugin,
  fileSizeRecommendedRefs,
} from '../../dist/examples/plugins';

/**
 * Run it with:
 * `nx run-collect examples-plugins`
 *
 * - For all formats use `--persist.format=md,json`
 * - For better debugging use `--verbose --no-progress`
 *
 */

const config = {
  plugins: [
    fileSizePlugin({
      directory: '../../dist/packages',
      pattern: /\.js$/,
      // eslint-disable-next-line no-magic-numbers
      budget: 42_000,
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [...fileSizeRecommendedRefs],
    },
  ],
};

export default config;
