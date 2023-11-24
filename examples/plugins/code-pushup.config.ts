import 'dotenv/config';
import { join } from 'path';
// @TODO use NPM package
import type { CoreConfig } from '../../packages/models/src';
import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRefs,
} from './file-size.plugin';

/**
 * @TODO use NPM package
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
