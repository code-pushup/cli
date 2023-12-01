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
const config = await (async () => {
  return {
    persist: {
      outputDir,
    },
    plugins: [
      await fileSizePlugin({
        directory: './dist',
        pattern: /\.js$/,
        budget: 42000,
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
})();

export default config;
