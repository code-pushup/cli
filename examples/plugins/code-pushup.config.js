import { join } from 'path';
import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRefs,
} from './src/file-size.plugin';
import {
  create as lighthousePlugin,
  recommendedRefs as lighthouseRecommendedRefs,
} from './src/lighthouse';

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
        directory: join(process.cwd(), './dist/packages'),
        pattern: /\.js$/,
        budget: 42000,
      }),
      await lighthousePlugin({
        url: 'https://example.com',
        headless: 'new',
        outputFile: join(outputDir, 'lighthouse.report.json'),
        onlyAudits: 'largest-contentful-paint',
      }),
    ],
    categories: [
      {
        slug: 'performance',
        title: 'Performance',
        refs: [...fileSizeRecommendedRefs, ...lighthouseRecommendedRefs],
      },
    ],
  };
})();

export default config;
