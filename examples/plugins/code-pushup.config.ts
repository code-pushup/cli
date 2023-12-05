import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRefs,
} from './src/file-size/file-size.plugin';
import {
  create as tokenMatchPlugin,
  recommendedRefs as tokenMatchRecommendedRefs,
} from './src/token-match/token-match.plugin';


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
    tokenMatchPlugin({
      directory: './packages/',
      pattern: /TODO/,
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [...tokenMatchRecommendedRefs],
    },
  ],
}))();

export default config;
