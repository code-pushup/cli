import { uploadConfigFromEnv } from '../../testing-utils/src/lib/utils/env';
import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRefs,
} from './src/file-size/file-size.plugin';

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
  upload: uploadConfigFromEnv(),
  plugins: [
    fileSizePlugin({
      directory: './dist',
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
}))();

export default config;
