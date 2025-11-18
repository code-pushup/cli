import path from 'node:path';
import {
  LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
  fileSizePlugin,
  fileSizeRecommendedRefs,
  lighthouseCorePerfGroupRefs,
  lighthousePlugin,
  packageJsonDocumentationGroupRef,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
  packageJsonVersionControlGroupRef,
} from '../../dist/examples/plugins/index.js';

/**
 * Run it with:
 * `nx run-collect examples-plugins`
 *
 * - For all formats use `--persist.format=md,json`
 * - For better debugging, use `--verbose`
 *
 */

const config = {
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
    await lighthousePlugin({
      url: 'https://staging.code-pushup.dev/login',
      outputPath: path.join('.code-pushup', LIGHTHOUSE_OUTPUT_FILE_DEFAULT),
      headless: false,
      verbose: true,
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        ...fileSizeRecommendedRefs,
        packageJsonPerformanceGroupRef,
        ...lighthouseCorePerfGroupRefs,
      ],
    },
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [packageJsonVersionControlGroupRef],
    },
    {
      slug: 'documentation',
      title: 'Documentation',
      refs: [packageJsonDocumentationGroupRef],
    },
  ],
};

export default config;
