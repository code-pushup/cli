import 'dotenv/config';
import { join } from 'path';
import type { CoreConfig } from '../../packages/models/src';
import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRefs,
} from './file-size.plugin';
import {
  create as lighthousePlugin,
  recommendedRefs as lighthouseRecommendedRefs,
} from './lighthouse.plugin';
import {
  create as packageVersionPlugin,
  recommendedRefs as packageVersionRecommendedRefs,
} from './package-version.plugin';

/**
 *
 * Run it with:
 * `nx run-collect cli --config=./examples/plugins/code-pushup.config.ts --verbose --no-progress --persist.format=stdout,md,json`
 *
 */

const outputDir = '.code-pushup';
const config: CoreConfig = {
  persist: {
    outputDir,
    filename: 'report',
  },
  plugins: [
    await fileSizePlugin({
      directory: join(process.cwd(), './dist/packages'),
      pattern: /\.js$/,
      budget: 42000,
    }),
    await lighthousePlugin({
      url: 'http://google.com',
      verbose: true,
      headless: 'new',
      outputFile: join(outputDir, 'lighthouse-report.json'),
      //  onlyAudits: 'largest-contentful-paint',
    }),
    await packageVersionPlugin({
      directory: join(process.cwd(), './packages/models'),
      packages: {
        "zod": "^3.22.21",
      }
    })
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        ...fileSizeRecommendedRefs,
        ...lighthouseRecommendedRefs,
        ...packageVersionRecommendedRefs
      ],
    },
  ],
};

export default config;
