import { join } from 'path';
import {
  create as fileSizePlugin,
  recommendedRefs as fileSizeRecommendedRefs,
} from './src/file-size.plugin';
import {
  documentationGroupRef,
  create as packageJsonPlugin,
  versionControlGroupRef,
} from './src/package-json.plugin/package-json.plugin';

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
      await packageJsonPlugin({
        directory: join(process.cwd(), './dist/packages'),
        license: 'MIT',
        type: 'module',
        documentation: {
          description: true,
        },
        requiredDependencies: {
          dependencies: {
            zod: '^3.22.1',
          },
        },
      }),
    ],
    categories: [
      {
        slug: 'performance',
        title: 'Performance',
        refs: [...fileSizeRecommendedRefs],
      },
      {
        slug: 'documentation',
        title: 'Documentation',
        refs: [documentationGroupRef],
      },
      {
        slug: 'version-control',
        title: 'Version Control',
        refs: [versionControlGroupRef],
      },
    ],
  };
})();

export default config;
