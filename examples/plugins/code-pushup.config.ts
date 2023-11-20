import 'dotenv/config';
import {join} from 'path';
import type {CoreConfig} from '../../packages/models/src';
import {create as fileSizePlugin, recommendedRef as fileSizeRecommendedRef,} from './file-size.plugin';
import {create as lighthousePlugin,} from './lighthouse.plugin';

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
      url: 'http://127.0.0.1:4211',
      outputFile: join(outputDir, 'lighthouse-report.json'),
      onlyAudits: 'largest-contentful-paint',
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [...fileSizeRecommendedRef],
    },
  ],
};

export default config;
